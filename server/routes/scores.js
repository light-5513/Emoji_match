import express from 'express';
import crypto from 'crypto';
import { Score } from '../models/Score.js';
import {
  uploadBuffer,
  dataUrlToBuffer,
  isConfigured as gcsReady,
  publicUrl
} from '../gcs.js';

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const docs = await Score.find(
      {},
      { name: 1, email: 1, rollNumber: 1, total: 1, createdAt: 1, reportId: 1 }
    )
      .sort({ total: -1, createdAt: -1 })
      .limit(limit)
      .lean();
    res.json(docs);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, email, rollNumber, total, rounds } = req.body || {};
    if (!name || !email || !rollNumber) {
      return res.status(400).json({ error: 'name, email, and rollNumber are required' });
    }

    const reportId = crypto.randomBytes(8).toString('hex');

    if (!gcsReady()) {
      console.error('[gcs] not configured — uploads will be skipped');
    }

    // Upload each captured photo to GCS in parallel.
    const enrichedRounds = await Promise.all(
      (rounds || []).map(async (r, i) => {
        let photoUrl = null;
        if (gcsReady() && r.imageDataUrl) {
          try {
            const decoded = dataUrlToBuffer(r.imageDataUrl);
            if (decoded) {
              photoUrl = await uploadBuffer({
                key: `reports/${reportId}/round-${i + 1}.jpg`,
                buffer: decoded.buffer,
                contentType: decoded.contentType
              });
              console.log(`[gcs] uploaded round ${i + 1} -> ${photoUrl}`);
            }
          } catch (err) {
            console.error(`[gcs] photo upload FAILED (round ${i + 1}):`, err.message);
          }
        }
        return {
          emotion: r.emotion,
          emoji: r.emoji,
          score: Number(r.score) || 0,
          features: Array.isArray(r.features) ? r.features.slice(0, 5) : [],
          photoUrl
        };
      })
    );

    const sumTotal = Number.isFinite(total)
      ? total
      : enrichedRounds.reduce((s, r) => s + (r.score || 0), 0);

    let doc;
    try {
      doc = await Score.create({
        reportId,
        name,
        email,
        rollNumber,
        total: sumTotal,
        rounds: enrichedRounds
      });
      console.log(`[mongo] saved score ${doc._id} (reportId=${reportId})`);
    } catch (err) {
      console.error('[mongo] save FAILED:', err.message);
      // Don't fail the whole request just because Mongo is down — the photos
      // are already on GCS and the user can still get their card.
      doc = { _id: null };
    }

    // Predicted URL of the card PNG on GCS (frontend will upload it next).
    const cardKey = `reports/${reportId}/card.png`;
    const cardUrl = gcsReady() ? publicUrl(cardKey) : null;

    res.json({
      id: doc._id,
      reportId,
      total: sumTotal,
      cardUrl,
      cardKey
    });
  } catch (err) {
    next(err);
  }
});

// Receive the final card PNG (with QR baked in) from the client and upload it
// to GCS at the predicted URL. The client built the card *with* the QR
// pointing at this very URL, so the upload completes the loop.
router.post('/:reportId/card', async (req, res, next) => {
  try {
    const { reportId } = req.params;
    const { cardImage } = req.body || {};
    if (!cardImage) return res.status(400).json({ error: 'cardImage is required' });
    if (!gcsReady()) return res.status(500).json({ error: 'GCS not configured' });

    const decoded = dataUrlToBuffer(cardImage);
    if (!decoded) return res.status(400).json({ error: 'Invalid cardImage data URL' });

    const cardKey = `reports/${reportId}/card.png`;
    const url = await uploadBuffer({
      key: cardKey,
      buffer: decoded.buffer,
      contentType: 'image/png'
    });
    console.log(`[gcs] uploaded card -> ${url}`);

    res.json({ ok: true, cardUrl: url });
  } catch (err) {
    next(err);
  }
});

export default router;
