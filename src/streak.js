// Client-side daily streak. Trust-the-client v1; can move to server later.
const KEY = 'gw_streak_v1';

function todayUTC() {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayUTC() {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

export function loadStreak() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { count: 0, lastDate: null };
    const o = JSON.parse(raw);
    return { count: Number(o.count) || 0, lastDate: o.lastDate || null };
  } catch { return { count: 0, lastDate: null }; }
}

// Call after a successful daily-mode run finishes. Returns updated streak.
export function bumpStreak() {
  const today = todayUTC();
  const cur = loadStreak();
  let next;
  if (cur.lastDate === today) {
    next = cur;            // already counted today
  } else if (cur.lastDate === yesterdayUTC()) {
    next = { count: cur.count + 1, lastDate: today };
  } else {
    next = { count: 1, lastDate: today };
  }
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export function currentStreakDisplay() {
  const cur = loadStreak();
  if (!cur.lastDate) return 0;
  // streak only valid if lastDate is today or yesterday
  if (cur.lastDate === todayUTC() || cur.lastDate === yesterdayUTC()) return cur.count;
  return 0;
}
