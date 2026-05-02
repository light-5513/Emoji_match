// Builds a downloadable result card PNG with all 3 round photos, scores,
// player info, and player's name. The QR + share link live on the result
// screen UI — they intentionally do NOT appear on the downloaded card.

import QRCode from 'qrcode';

const W = 720;
const H = 1080;

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export async function buildResultCard({ player, total, max, rounds }) {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // Background
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#fff4f0');
  bg.addColorStop(1, '#ffffff');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Outer card
  ctx.fillStyle = '#ffffff';
  roundedRect(ctx, 24, 24, W - 48, H - 48, 28);
  ctx.fill();
  ctx.strokeStyle = 'rgba(15,23,42,0.06)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // ── Header ────────────────────────────────────────────────────────────
  const headerY = 80;
  ctx.fillStyle = '#0f172a';
  ctx.font = '900 28px Inter, system-ui, sans-serif';
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  const titleText = 'EMOJI MIMIC GAME';
  ctx.fillText(titleText, 56, headerY);
  const titleWidth = ctx.measureText(titleText).width;

  // REPORT badge — positioned cleanly to the right of the title
  ctx.font = '800 11px Inter, system-ui, sans-serif';
  const badgeText = 'REPORT';
  const badgeW = ctx.measureText(badgeText).width + 18;
  const badgeH = 22;
  const badgeX = 56 + titleWidth + 12;
  const badgeY = headerY - 18;
  ctx.fillStyle = '#ff6b3d';
  roundedRect(ctx, badgeX, badgeY, badgeW, badgeH, 11);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(badgeText, badgeX + badgeW / 2, badgeY + badgeH / 2 + 1);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  // Player info line
  ctx.fillStyle = '#64748b';
  ctx.font = '500 14px Inter, system-ui, sans-serif';
  const playerLine = `${player?.name || ''} · Roll ${player?.rollNumber || ''}`;
  ctx.fillText(playerLine, 56, headerY + 24);

  // ── Big total ────────────────────────────────────────────────────────
  ctx.textAlign = 'center';
  ctx.fillStyle = '#0f172a';
  ctx.font = '900 96px Inter, system-ui, sans-serif';
  ctx.fillText(String(total), W / 2, 220);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '700 11px Inter, system-ui, sans-serif';
  ctx.fillText(`OUT OF ${max} POSSIBLE`, W / 2, 248);
  ctx.textAlign = 'left';

  // ── Round rows ───────────────────────────────────────────────────────
  // Layout: [ emoji 96 ][ photo 200 ][ meta flexible ][ score ~80 ]
  const rowsTop = 290;
  const rowH = 220;
  const rowGap = 16;
  const rowInner = rowH - rowGap;

  const COL = {
    emojiX: 56,
    emojiW: 88,
    photoX: 160,
    photoW: 200,
    metaX: 380,
    metaW: 180,
    scoreX: W - 56 // right-aligned anchor
  };

  for (let i = 0; i < rounds.length; i++) {
    const r = rounds[i];
    const yTop = rowsTop + i * rowH;
    const yMid = yTop + rowInner / 2;

    // Row background
    ctx.fillStyle = '#fafafa';
    roundedRect(ctx, 40, yTop, W - 80, rowInner, 18);
    ctx.fill();
    ctx.strokeStyle = 'rgba(15,23,42,0.05)';
    ctx.stroke();

    // Emoji
    ctx.font = '70px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#000';
    ctx.fillText(r.emoji || '', COL.emojiX + COL.emojiW / 2, yMid);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';

    // Photo
    if (r.imageDataUrl) {
      try {
        const img = await loadImage(r.imageDataUrl);
        const px = COL.photoX;
        const pw = COL.photoW;
        const ph = rowInner - 32;
        const py = yTop + (rowInner - ph) / 2;
        ctx.save();
        roundedRect(ctx, px, py, pw, ph, 14);
        ctx.clip();
        const ar = img.width / img.height;
        let dw = pw;
        let dh = pw / ar;
        if (dh < ph) {
          dh = ph;
          dw = ph * ar;
        }
        const dx = px + (pw - dw) / 2;
        const dy = py + (ph - dh) / 2;
        ctx.drawImage(img, dx, dy, dw, dh);
        ctx.restore();
      } catch (err) {
        // ignore broken image
      }
    }

    // Meta (round + emotion only — no features text, prevents overlap)
    ctx.fillStyle = '#0f172a';
    ctx.font = '800 16px Inter, system-ui, sans-serif';
    ctx.fillText(`ROUND ${i + 1}`, COL.metaX, yMid - 8);
    ctx.fillStyle = '#ff6b3d';
    ctx.font = '900 22px Inter, system-ui, sans-serif';
    ctx.fillText((r.emotion || '').toUpperCase(), COL.metaX, yMid + 22);

    // Score (right-aligned, larger)
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ff6b3d';
    ctx.font = '900 56px Inter, system-ui, sans-serif';
    ctx.fillText(String(r.score), COL.scoreX, yMid + 4);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '800 10px Inter, system-ui, sans-serif';
    ctx.fillText('MATCH', COL.scoreX, yMid + 24);
    ctx.textAlign = 'left';
  }

  // ── Footer ───────────────────────────────────────────────────────────
  ctx.fillStyle = '#94a3b8';
  ctx.font = '600 12px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('powered by Technical Hub', W / 2, H - 50);
  ctx.textAlign = 'left';

  return canvas.toDataURL('image/png');
}

export async function buildQrDataUrl(text, size = 240) {
  return QRCode.toDataURL(text, {
    width: size,
    margin: 1,
    color: { dark: '#0f172a', light: '#ffffff' }
  });
}
