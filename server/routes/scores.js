import express from 'express';
import crypto from 'crypto';
import { Score } from '../models/Score.js';
import { uploadBuffer, dataUrlToBuffer, isConfigured as gcsReady } from '../gcs.js';

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
      console.error('[gcs] not configured — skipping photo uploads. Check GCS_BUCKET and GOOGLE_CREDENTIALS_PATH in .env');
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
            console.error(err);
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

    const doc = await Score.create({
      reportId,
      name,
      email,
      rollNumber,
      total: sumTotal,
      rounds: enrichedRounds
    });

    // Prefer PUBLIC_URL when set (so QR codes encode the user-facing host, not
    // localhost:3001 behind the Vite/nginx proxy). Fall back to forwarded
    // headers, then to the raw request host.
    const publicBase = (process.env.PUBLIC_URL || '').trim().replace(/\/$/, '');
    const fwdProto = req.get('x-forwarded-proto');
    const fwdHost = req.get('x-forwarded-host');
    const host = publicBase
      || (fwdHost ? `${fwdProto || 'https'}://${fwdHost}` : `${req.protocol}://${req.get('host')}`);
    const shareUrl = `${host}/report/${reportId}`;

    res.json({ id: doc._id, reportId, total: sumTotal, shareUrl });
  } catch (err) {
    next(err);
  }
});

export default router;
