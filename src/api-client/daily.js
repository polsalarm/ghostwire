export async function fetchDaily() {
  const r = await fetch('/api/daily');
  if (!r.ok) throw new Error(`daily_failed_${r.status}`);
  return r.json();
}
