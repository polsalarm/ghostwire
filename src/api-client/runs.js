export async function submitRun({ handle, timeMs, hintsUsed, seed }) {
  const r = await fetch('/api/run/finish', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ handle, timeMs, hintsUsed, seed })
  });
  const data = await r.json().catch(() => null);
  if (!r.ok) throw new Error(data?.error || `submit_failed_${r.status}`);
  return data;
}

export async function fetchLeaderboard({ limit = 100, window: win = 'alltime', date } = {}) {
  const params = new URLSearchParams({ limit: String(limit), window: win });
  if (date) params.set('date', date);
  const r = await fetch(`/api/leaderboard?${params.toString()}`);
  if (!r.ok) throw new Error(`leaderboard_failed_${r.status}`);
  return r.json();
}
