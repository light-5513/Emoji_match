import express from 'express';
import { Score } from '../models/Score.js';

const router = express.Router();

function escape(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

router.get('/:reportId', async (req, res, next) => {
  try {
    const doc = await Score.findOne({ reportId: req.params.reportId }).lean();
    if (!doc) {
      return res
        .status(404)
        .send('<!doctype html><meta charset="utf-8"><title>Not Found</title><body style="font-family:Inter,sans-serif;padding:40px;text-align:center;color:#64748b;">Report not found.</body>');
    }

    const max = (doc.rounds?.length || 3) * 100;
    const rows = (doc.rounds || [])
      .map(
        (r, i) => `
        <div class="round">
          <div class="round-emoji">${escape(r.emoji || '')}</div>
          <div class="round-meta">
            <div class="round-title">ROUND ${i + 1} · ${escape((r.emotion || '').toUpperCase())}</div>
            <div class="round-features">${escape((r.features || []).join(' · '))}</div>
          </div>
          <div class="round-score">${escape(r.score)}<span>MATCH</span></div>
          ${r.photoUrl ? `<img class="round-photo" src="${escape(r.photoUrl)}" alt="round ${i + 1}"/>` : ''}
        </div>`
      )
      .join('');

    const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Emoji Mimic — ${escape(doc.name)}'s Report</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet"/>
<style>
  * { box-sizing: border-box; }
  body { font-family: Inter, system-ui, sans-serif; background: #fafafa; margin:0; padding:32px; color:#0f172a;
    background-image:
      linear-gradient(45deg,#eef0f3 25%,transparent 25%),
      linear-gradient(-45deg,#eef0f3 25%,transparent 25%),
      linear-gradient(45deg,transparent 75%,#eef0f3 75%),
      linear-gradient(-45deg,transparent 75%,#eef0f3 75%);
    background-size: 24px 24px;
    background-position: 0 0,0 12px,12px -12px,-12px 0;
  }
  .wrap { max-width: 720px; margin: 0 auto; }
  .card { background:#fff; border-radius:24px; box-shadow: 0 10px 30px -10px rgba(15,23,42,0.18); padding:32px; }
  .header { display:flex; align-items:center; gap:12px; margin-bottom: 8px; }
  .title { font-size:22px; font-weight:800; letter-spacing:-0.01em; }
  .badge { background:#ff6b3d; color:#fff; font-size:11px; font-weight:800; padding:4px 10px; border-radius:999px; }
  .name { color:#64748b; }
  .total { text-align:center; padding: 24px 0 8px; }
  .total .num { font-size: 80px; font-weight: 900; line-height: 1; color:#0f172a; }
  .total .out { font-size: 12px; letter-spacing: 0.2em; color:#94a3b8; margin-top: 6px; }
  .round { display:grid; grid-template-columns: 64px 1fr auto 140px; gap:16px; align-items:center; padding:16px 0; border-top:1px solid #eee; }
  .round-emoji { font-size: 40px; text-align:center; }
  .round-title { font-weight: 800; letter-spacing: 0.05em; font-size: 14px; }
  .round-features { color:#64748b; font-size:12px; margin-top:4px; }
  .round-score { font-size: 36px; font-weight: 900; color:#ff6b3d; text-align:right; }
  .round-score span { display:block; font-size:10px; color:#94a3b8; letter-spacing: 0.18em; font-weight: 700; }
  .round-photo { width: 140px; height: 100px; object-fit: cover; border-radius: 12px; }
  .footer { text-align:center; color:#94a3b8; font-size:12px; margin-top: 24px; }
  .footer strong { color:#475569; }
  @media (max-width: 540px) {
    .round { grid-template-columns: 48px 1fr; grid-template-areas: "e m" "p p" "s s"; }
    .round-emoji { grid-area: e; }
    .round-meta { grid-area: m; }
    .round-photo { grid-area: p; width:100%; height:auto; }
    .round-score { grid-area: s; text-align:left; }
  }
</style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <div class="header">
        <div class="title">EMOJI MIMIC GAME</div>
        <div class="badge">REPORT</div>
      </div>
      <div class="name">${escape(doc.name)} · Roll ${escape(doc.rollNumber)}</div>

      <div class="total">
        <div class="num">${escape(doc.total)}</div>
        <div class="out">OUT OF ${max} POSSIBLE</div>
      </div>

      ${rows}

      <div class="footer">powered by <strong>Technical Hub</strong></div>
    </div>
  </div>
</body>
</html>`;

    res.set('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (err) {
    next(err);
  }
});

export default router;
