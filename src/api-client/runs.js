export async function submitRun({ handle, timeMs, hintsUsed }) {
  const r = await fetch('/api/run/finish', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ handle, timeMs, hintsUsed })
  });
  const data = await r.json().catch(() => null);
  if (!r.ok) throw new Error(data?.error || `submit_failed_${r.status}`);
  return data;
}

export async function fetchLeaderboard(limit = 100) {
  const r = await fetch(`/api/leaderboard?limit=${limit}`);
  if (!r.ok) throw new Error(`leaderboard_failed_${r.status}`);
  return r.json();
}
