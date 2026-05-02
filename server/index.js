import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { connectDb } from './db.js';
import evaluateRouter from './routes/evaluate.js';
import scoresRouter from './routes/scores.js';
import reportRouter from './routes/report.js';
import { isConfigured as gcsReady, getBucketName, uploadBuffer } from './gcs.js';

const PORT = Number(process.env.PORT) || 3001;
const app = express();

app.use(cors());
app.use(express.json({ limit: '20mb' }));

app.get('/api/health', (req, res) => res.json({ ok: true }));

// Diagnostic: confirm GCS connectivity + upload permission.
app.get('/api/health/gcs', async (req, res) => {
  const credPath = path.resolve(
    process.cwd(),
    (process.env.GOOGLE_CREDENTIALS_PATH || 'codecard.json').trim().replace(/^['"]|['"]$/g, '')
  );
  const out = {
    configured: gcsReady(),
    bucket: getBucketName() || null,
    credentialsPath: credPath,
    credentialsExist: fs.existsSync(credPath)
  };
  if (!gcsReady()) return res.status(500).json({ ...out, error: 'GCS not configured' });
  try {
    const url = await uploadBuffer({
      key: `health/ping-${Date.now()}.txt`,
      buffer: Buffer.from('ok'),
      contentType: 'text/plain'
    });
    res.json({ ...out, ok: true, testUrl: url });
  } catch (err) {
    res.status(500).json({ ...out, ok: false, error: err.message });
  }
});
app.use('/api/evaluate', evaluateRouter);
app.use('/api/scores', scoresRouter);

// Public HTML report viewer (so QR codes can point at it directly).
app.use('/report', reportRouter);

app.use((err, req, res, next) => {
  console.error('[server error]', err);
  res.status(500).json({ error: err?.message || 'Server error' });
});

// Boot diagnostics
const credPath = path.resolve(
  process.cwd(),
  (process.env.GOOGLE_CREDENTIALS_PATH || 'codecard.json').trim().replace(/^['"]|['"]$/g, '')
);
console.log(`[gcs] configured: ${gcsReady()}`);
console.log(`[gcs] bucket: ${getBucketName() || '(not set)'}`);
console.log(`[gcs] credentials path: ${credPath}`);
console.log(`[gcs] credentials file exists: ${fs.existsSync(credPath)}`);

connectDb()
  .catch((err) => console.warn('[mongo] connection failed (continuing):', err.message))
  .finally(() => {
    app.listen(PORT, () => console.log(`[api] listening on http://localhost:${PORT}`));
  });
