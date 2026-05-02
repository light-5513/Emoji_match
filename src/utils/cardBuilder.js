// Builds a downloadable result card PNG with all 3 round photos, scores,
// player info, and an embedded QR pointing to the public share URL.

import QRCode from 'qrcode';

const W = 900;
const H = 1320;

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

function fillTextWrapped(ctx, text, x, y, maxWidth, lineHeight, maxLines = 2) {
  const words = String(text || '').split(' ');
  let line = '';
  let lines = 0;
  for (let i = 0; i < words.length; i++) {
    const test = line + words[i] + ' ';
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line.trim(), x, y);
      line = words[i] + ' ';
      y += lineHeight;
      lines += 1;
      if (lines >= maxLines - 1) {
        // last line — clamp
        let rest = words.slice(i).join(' ');
        while (ctx.measureText(rest + '…').width > maxWidth && rest.length) {
          rest = rest.slice(0, -1);
        }
        ctx.fillText(rest + (words.slice(i).join(' ').length > rest.length ? '…' : ''), x, y);
        return;
      }
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line.trim(), x, y);
}

export async function buildResultCard({ player, total, max, rounds, shareUrl }) {
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
  roundedRect(ctx, 32, 32, W - 64, H - 64, 32);
  ctx.fill();
  ctx.strokeStyle = 'rgba(15,23,42,0.06)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Title
  ctx.fillStyle = '#0f172a';
  ctx.font = '900 34px Inter, system-ui, sans-serif';
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.fillText('EMOJI MIMIC GAME', 64, 96);

  // GAME badge
  const badgeText = 'REPORT';
  ctx.font = '800 12px Inter, system-ui, sans-serif';
  const badgeW = ctx.measureText(badgeText).width + 22;
  ctx.fillStyle = '#ff6b3d';
  roundedRect(ctx, 64 + ctx.measureText('EMOJI MIMIC GAME').width + 14, 76, badgeW, 24, 12);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(
    badgeText,
    64 + ctx.measureText('EMOJI MIMIC GAME').width + 14 + badgeW / 2,
    76 + 12
  );
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  // Player line
  ctx.fillStyle = '#64748b';
  ctx.font = '500 18px Inter, system-ui, sans-serif';
  const playerLine = `${player?.name || ''} · Roll ${player?.rollNumber || ''}`;
  ctx.fillText(playerLine, 64, 134);

  // Big total
  ctx.textAlign = 'center';
  ctx.fillStyle = '#0f172a';
  ctx.font = '900 130px Inter, system-ui, sans-serif';
  ctx.fillText(String(total), W / 2, 280);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '700 13px Inter, system-ui, sans-serif';
  ctx.fillText(`OUT OF ${max} POSSIBLE`, W / 2, 312);
  ctx.textAlign = 'left';

  // Rounds
  const roundY0 = 360;
  const rowH = 220;

  for (let i = 0; i < rounds.length; i++) {
    const r = rounds[i];
    const y = roundY0 + i * rowH;

    // Row background
    ctx.fillStyle = '#fafafa';
    roundedRect(ctx, 64, y, W - 128, rowH - 20, 20);
    ctx.fill();
    ctx.strokeStyle = 'rgba(15,23,42,0.05)';
    ctx.stroke();

    // Emoji column
    ctx.font = '92px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(r.emoji || '', 132, y + (rowH - 20) / 2);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';

    // Photo
    if (r.imageDataUrl) {
      try {
        const img = await loadImage(r.imageDataUrl);
        const px = 220;
        const py = y + 20;
        const pw = 220;
        const ph = rowH - 60;
        ctx.save();
        roundedRect(ctx, px, py, pw, ph, 16);
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

    // Title + features
    ctx.fillStyle = '#0f172a';
    ctx.font = '800 18px Inter, system-ui, sans-serif';
    ctx.fillText(`ROUND ${i + 1} · ${(r.emotion || '').toUpperCase()}`, 470, y + 50);
    ctx.fillStyle = '#64748b';
    ctx.font = '500 13px Inter, system-ui, sans-serif';
    fillTextWrapped(ctx, (r.features || []).join(' · '), 470, y + 78, 220, 18, 3);

    // Score
    ctx.fillStyle = '#ff6b3d';
    ctx.font = '900 64px Inter, system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(String(r.score), W - 90, y + (rowH - 20) / 2 + 12);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '800 11px Inter, system-ui, sans-serif';
    ctx.fillText('MATCH', W - 90, y + (rowH - 20) / 2 + 30);
    ctx.textAlign = 'left';
  }

  // QR + share text
  const qrSize = 180;
  const qrX = 64;
  const qrY = H - qrSize - 80;
  if (shareUrl) {
    const qrCanvas = document.createElement('canvas');
    await QRCode.toCanvas(qrCanvas, shareUrl, {
      width: qrSize,
      margin: 1,
      color: { dark: '#0f172a', light: '#ffffff' }
    });
    ctx.drawImage(qrCanvas, qrX, qrY);
  }

  ctx.fillStyle = '#0f172a';
  ctx.font = '800 18px Inter, system-ui, sans-serif';
  ctx.fillText('Scan to view your report online', qrX + qrSize + 24, qrY + 60);
  ctx.fillStyle = '#64748b';
  ctx.font = '500 12px Inter, system-ui, sans-serif';
  fillTextWrapped(ctx, shareUrl || '', qrX + qrSize + 24, qrY + 86, W - (qrX + qrSize + 24) - 80, 16, 2);

  // Footer
  ctx.fillStyle = '#94a3b8';
  ctx.font = '600 12px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('powered by Technical Hub', W / 2, H - 56);
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
