import { mulberry32, hashSeed, pick } from './rng.js';

// Pool of plausible-looking webhook prefixes. Pick one per seed.
const PREFIXES = ['ZX9', 'NX4', 'KQ7', 'AB2', 'PR8', 'TD5', 'MJ3', 'HF6', 'QC1', 'WL7'];

// Static "DEFAULT" config matches the original ZX9-99 puzzle that ships with
// free-play. Anything other than 'DEFAULT' (incl. 'd:YYYY-MM-DD') derives
// the puzzle deterministically from the seed.
export function genGate(seed) {
  if (!seed || seed === 'DEFAULT') {
    return { seed: 'DEFAULT', prefix: 'ZX9', sumTarget: 18, code: 'ZX9-99' };
  }
  const rng = mulberry32(hashSeed(seed));
  const prefix = pick(rng, PREFIXES);
  // sumTarget in [9..17]: ensures multiple valid (a,b) pairs but small space.
  // Exclude 0,1 (trivial), 18 (only 99 — too telegraphed), 19+ impossible.
  const sumTarget = 9 + Math.floor(rng() * 9); // 9..17
  const pairs = [];
  for (let a = 0; a <= 9; a++) {
    const b = sumTarget - a;
    if (b >= 0 && b <= 9) pairs.push([a, b]);
  }
  const [a, b] = pick(rng, pairs);
  const code = `${prefix}-${a}${b}`;
  return { seed, prefix, sumTarget, code };
}

// Hints derived from generator output. Used by client engine.js for the
// `hint` command body in 2D mode, and by WallHints in 3D mode.
export function gateHintLines(cfg) {
  return [
    '// L1 hint',
    'door checks { role, clearance_code }',
    '  role must be "admin"',
    `  clearance starts with "${cfg.prefix}-" then 2 digits`,
    `  digit sum = ${cfg.sumTarget}`,
    `try: POST /api/gate {"role":"admin","clearance_code":"${cfg.code}"}`
  ];
}
