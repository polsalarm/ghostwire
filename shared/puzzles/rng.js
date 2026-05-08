// Deterministic PRNG + date-seed helpers. Same seed → same puzzle config
// on both client (engine.js, hints) and server (api/gate.js validation).

export function mulberry32(seed) {
  let s = seed | 0;
  return function () {
    s = (s + 0x6D2B79F5) | 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// FNV-1a hash → integer seed from string seed (e.g. "d:2026-05-09")
export function hashSeed(input) {
  const s = String(input);
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

export function todayUTC() {
  return new Date().toISOString().slice(0, 10);
}

export function dailySeed(dateStr = todayUTC()) {
  return `d:${dateStr}`;
}

export function isDailySeed(seed) {
  return typeof seed === 'string' && seed.startsWith('d:');
}

// Seconds until next UTC midnight. For Hero countdown.
export function secondsUntilNextUtcDay() {
  const now = new Date();
  const next = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1
  ));
  return Math.max(0, Math.floor((next - now) / 1000));
}

// Monday (UTC) of the week containing `date`, as YYYY-MM-DD.
// Used as the weekly leaderboard window key.
export function weekStartUTC(date = new Date()) {
  const d = new Date(date);
  const day = (d.getUTCDay() + 6) % 7; // Mon=0..Sun=6
  d.setUTCDate(d.getUTCDate() - day);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}
