import { mulberry32, hashSeed } from './rng.js';

export function genM2Ratelimit(seed) {
  if (!seed || seed === 'DEFAULT') {
    return { seed: 'DEFAULT', threshold: 5, windowMs: 30_000 };
  }
  const rng = mulberry32(hashSeed(`m2_ratelimit:${seed}`));
  return {
    seed,
    threshold: 4 + Math.floor(rng() * 5), // 4..8
    windowMs: 30_000
  };
}

export function ratelimitHintLines(cfg) {
  return [
    '// L3 (M2) hint — RATE_LIMIT bypass',
    '/api/m2/throttle is rate-limited by client_id.',
    `  send ${cfg.threshold} unique client_id values within ${cfg.windowMs / 1000}s → unlock.`,
    '  reuse a client_id and you only count once.',
    '  POST /api/m2/throttle {"client_id":"<unique>"}',
    '  rotate ids: bot-001, bot-002, ... or random uuids.'
  ];
}
