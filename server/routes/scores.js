import express from 'express';
import { Score } from '../models/Score.js';
import { sendResultEmail } from '../email.js';

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const docs = await Score.find({}, { name: 1, email: 1, rollNumber: 1, total: 1, createdAt: 1 })
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

    const cleanedRounds = Array.isArray(rounds)
      ? rounds.map((r) => ({
          emotion: r.emotion,
          emoji: r.emoji,
          score: Number(r.score) || 0,
          features: Array.isArray(r.features) ? r.features.slice(0, 5) : []
        }))
      : [];

    const sumTotal = Number.isFinite(total)
      ? total
      : cleanedRounds.reduce((s, r) => s + (r.score || 0), 0);

    const doc = await Score.create({
      name,
      email,
      rollNumber,
      total: sumTotal,
      rounds: cleanedRounds
    });

    // Fire-and-forget email with the original (image-bearing) rounds.
    const max = (rounds?.length || 3) * 100;
    sendResultEmail({ name, email, total: sumTotal, max, rounds: rounds || [] }).catch((err) =>
      console.warn('[email] send failed:', err.message)
    );

    res.json({ id: doc._id, total: sumTotal });
  } catch (err) {
    next(err);
  }
});

export default router;
