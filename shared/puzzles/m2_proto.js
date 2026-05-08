import { mulberry32, hashSeed, pick } from './rng.js';

const FLAG_KEYS = ['isAdmin', 'override', 'ghostMode', 'isSuperuser', 'bypass'];

export function genM2Proto(seed) {
  if (!seed || seed === 'DEFAULT') {
    return { seed: 'DEFAULT', flagKey: 'isAdmin' };
  }
  const rng = mulberry32(hashSeed(`m2_proto:${seed}`));
  return { seed, flagKey: pick(rng, FLAG_KEYS) };
}

export function protoHintLines(cfg) {
  return [
    '// L4 (M2) hint — PROTOTYPE_POLLUTION',
    '/api/m2/checkout merges your body into a config object.',
    '  the merge is naive — it walks __proto__.',
    `  set { "__proto__": { "${cfg.flagKey}": true } } in the body to flip the gate.`,
    '  full payload: POST /api/m2/checkout {"item":"x","__proto__":{"' + cfg.flagKey + '":true}}'
  ];
}
