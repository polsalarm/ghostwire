import { mulberry32, hashSeed, pick } from './rng.js';

const TEMPS  = [120, 145, 170, 180, 200, 215, 240];
const STATES = ['critical', 'urgent', 'severe', 'p0', 'breach'];

export function genRouter(seed) {
  if (!seed || seed === 'DEFAULT') {
    return {
      seed: 'DEFAULT', threshold: 12, windowMs: 2000,
      temperature: 180, status: 'critical'
    };
  }
  const rng = mulberry32(hashSeed(`router:${seed}`));
  return {
    seed,
    threshold: 8 + Math.floor(rng() * 8),     // 8..15
    windowMs: 2000,
    temperature: pick(rng, TEMPS),
    status: pick(rng, STATES)
  };
}

export function routerHintLines(cfg) {
  return [
    '// L2 hint',
    'router only forwards alerts of the right shape — { temperature, status }',
    '  single packet → buffered, not routed',
    `  burst within ${cfg.windowMs}ms overflows default branch`,
    '  the threshold leaks somewhere in `traffic`',
    "(no exact payload spoonfed — read the wall, then craft it)"
  ];
}
