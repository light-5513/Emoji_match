export async function submitScore({ name, email, rollNumber, total, rounds }) {
  const res = await fetch('/api/scores', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, rollNumber, total, rounds })
  });
  if (!res.ok) throw new Error(`submit failed: ${res.status}`);
  return res.json(); // { id, reportId, total, shareUrl }
}

export async function fetchLeaderboard(limit = 25) {
  const res = await fetch(`/api/scores?limit=${limit}`);
  if (!res.ok) throw new Error(`leaderboard fetch failed: ${res.status}`);
  return res.json();
}
