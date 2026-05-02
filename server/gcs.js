import path from 'path';
import { Storage } from '@google-cloud/storage';

function clean(v) {
  if (!v) return v;
  return String(v).trim().replace(/^['"]|['"]$/g, '');
}

const credPath = clean(process.env.GOOGLE_CREDENTIALS_PATH) || 'codecard.json';
const bucketName = clean(process.env.GCS_BUCKET);

let storage;
try {
  storage = new Storage({
    keyFilename: path.resolve(process.cwd(), credPath)
  });
} catch (err) {
  console.warn('[gcs] init failed:', err.message);
}

export function isConfigured() {
  return Boolean(storage && bucketName);
}

export function getBucketName() {
  return bucketName;
}

export function publicUrl(key) {
  if (!bucketName) return null;
  return `https://storage.googleapis.com/${bucketName}/${encodeURI(key)}`;
}

export async function uploadBuffer({ key, buffer, contentType, makePublic = true }) {
  if (!isConfigured()) throw new Error('GCS not configured (set GCS_BUCKET and GOOGLE_CREDENTIALS_PATH in .env)');
  const bucket = storage.bucket(bucketName);
  const file = bucket.file(key);
  await file.save(buffer, {
    contentType,
    resumable: false,
    metadata: { cacheControl: 'public, max-age=86400' }
  });
  if (makePublic) {
    try {
      await file.makePublic();
    } catch (err) {
      // Bucket may have uniform access — public URL will still work if the
      // bucket itself is configured with allUsers read access.
      console.warn('[gcs] makePublic failed (continuing):', err.message);
    }
  }
  return `https://storage.googleapis.com/${bucketName}/${encodeURI(key)}`;
}

export function dataUrlToBuffer(dataUrl) {
  const m = /^data:(image\/[a-z]+);base64,(.+)$/i.exec(dataUrl || '');
  if (!m) return null;
  return { contentType: m[1], buffer: Buffer.from(m[2], 'base64') };
}
