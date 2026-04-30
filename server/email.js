import nodemailer from 'nodemailer';

function clean(v) {
  if (!v) return v;
  return String(v).trim().replace(/^['"]|['"]$/g, '');
}

const EMAIL_USER = clean(process.env.EMAIL_ADDRESS);
const EMAIL_PASS = clean(process.env.EMAIL_APP_PASSWORD);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: EMAIL_USER, pass: EMAIL_PASS }
});

function dataUrlToAttachment(dataUrl, cid, filename) {
  const m = /^data:(image\/[a-z]+);base64,(.+)$/i.exec(dataUrl || '');
  if (!m) return null;
  return {
    filename,
    content: Buffer.from(m[2], 'base64'),
    contentType: m[1],
    cid
  };
}

function buildHtml({ name, total, max, rounds }) {
  const roundRows = rounds
    .map(
      (r, i) => `
      <tr>
        <td style="padding:14px;border-bottom:1px solid #eee;text-align:center;font-size:32px;">${r.emoji || ''}</td>
        <td style="padding:14px;border-bottom:1px solid #eee;">
          <div style="font-weight:700;letter-spacing:0.05em;color:#0f172a;">ROUND ${i + 1} · ${String(r.emotion || '').toUpperCase()}</div>
          <div style="margin-top:4px;color:#64748b;font-size:13px;">${(r.features || []).join(' · ')}</div>
        </td>
        <td style="padding:14px;border-bottom:1px solid #eee;text-align:right;">
          <div style="font-size:28px;font-weight:800;color:#ff6b3d;">${r.score}</div>
          <div style="font-size:11px;color:#94a3b8;letter-spacing:0.1em;">MATCH</div>
        </td>
        <td style="padding:14px;border-bottom:1px solid #eee;text-align:right;">
          ${r.cid ? `<img src="cid:${r.cid}" alt="capture" style="width:120px;height:90px;object-fit:cover;border-radius:8px;"/>` : ''}
        </td>
      </tr>`
    )
    .join('');

  return `
  <div style="font-family:Inter,Arial,sans-serif;background:#fafafa;padding:32px;color:#0f172a;">
    <div style="max-width:640px;margin:0 auto;background:#fff;border-radius:24px;box-shadow:0 10px 30px -10px rgba(15,23,42,0.18);overflow:hidden;">
      <div style="padding:28px 32px 8px 32px;">
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="font-size:22px;font-weight:800;letter-spacing:-0.01em;">EMOJI MIMIC GAME</span>
          <span style="background:#ff6b3d;color:#fff;font-size:11px;font-weight:800;padding:4px 10px;border-radius:999px;">RESULTS</span>
        </div>
        <p style="margin:6px 0 0 0;color:#64748b;">Hey ${name || 'there'} — here's your scorecard.</p>
      </div>

      <div style="padding:8px 32px 24px 32px;text-align:center;">
        <div style="font-size:64px;font-weight:900;color:#0f172a;line-height:1;margin-top:16px;">${total}</div>
        <div style="font-size:12px;letter-spacing:0.18em;color:#94a3b8;margin-top:6px;">OUT OF ${max} POSSIBLE</div>
      </div>

      <table style="width:100%;border-collapse:collapse;">
        ${roundRows}
      </table>

      <div style="padding:20px 32px;color:#94a3b8;font-size:12px;text-align:center;">
        powered by <strong style="color:#475569;">Technical Hub</strong>
      </div>
    </div>
  </div>`;
}

export async function sendResultEmail({ name, email, total, max, rounds }) {
  if (!EMAIL_USER || !EMAIL_PASS) throw new Error('Email credentials not configured');

  const attachments = [];
  const enriched = rounds.map((r, i) => {
    const cid = `round-${i + 1}@emoji-mimic`;
    const att = dataUrlToAttachment(r.imageDataUrl, cid, `round-${i + 1}.jpg`);
    if (att) {
      attachments.push(att);
      return { ...r, cid };
    }
    return r;
  });

  const html = buildHtml({ name, total, max, rounds: enriched });

  await transporter.sendMail({
    from: `"Emoji Mimic Game" <${EMAIL_USER}>`,
    to: email,
    subject: `Your Emoji Mimic score: ${total}/${max}`,
    html,
    attachments
  });
}
