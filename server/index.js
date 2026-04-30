import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDb } from './db.js';
import evaluateRouter from './routes/evaluate.js';
import scoresRouter from './routes/scores.js';

const PORT = Number(process.env.PORT) || 3001;
const app = express();

app.use(cors());
app.use(express.json({ limit: '20mb' }));

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/evaluate', evaluateRouter);
app.use('/api/scores', scoresRouter);

app.use((err, req, res, next) => {
  console.error('[server error]', err);
  res.status(500).json({ error: err?.message || 'Server error' });
});

connectDb()
  .catch((err) => console.warn('[mongo] connection failed (continuing):', err.message))
  .finally(() => {
    app.listen(PORT, () => console.log(`[api] listening on http://localhost:${PORT}`));
  });
