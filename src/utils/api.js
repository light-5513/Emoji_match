export async function submitScore({ name, email, rollNumber, total, rounds }) {
  const res = await fetch('/api/scores', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, rollNumber, total, rounds })
  });
  if (!res.ok) {
    let detail = '';
    try {
      const body = await res.json();
      detail = body?.error || JSON.stringify(body);
    } catch {
      try {
        detail = await res.text();
      } catch {}
    }
    throw new Error(`submit failed (${res.status}): ${detail}`);
  }
  return res.json(); // { id, reportId, total, cardUrl, cardKey }
}

export async function uploadCard(reportId, cardImageDataUrl) {
  const res = await fetch(`/api/scores/${reportId}/card`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cardImage: cardImageDataUrl })
  });
  if (!res.ok) throw new Error(`card upload failed: ${res.status}`);
  return res.json(); // { ok, cardUrl }
}

export async function fetchLeaderboard(limit = 25) {
  const res = await fetch(`/api/scores?limit=${limit}`);
  if (!res.ok) throw new Error(`leaderboard fetch failed: ${res.status}`);
  return res.json();
}
