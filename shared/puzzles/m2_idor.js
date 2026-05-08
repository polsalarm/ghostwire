import { mulberry32, hashSeed } from './rng.js';

export function genM2Idor(seed) {
  if (!seed || seed === 'DEFAULT') {
    return { seed: 'DEFAULT', secretId: 1337, flag: 'GW{idor_default}' };
  }
  const rng = mulberry32(hashSeed(`m2_idor:${seed}`));
  // sparse picks (1000..9999) so iteration takes a real run
  const secretId = 1000 + Math.floor(rng() * 9000);
  return { seed, secretId, flag: `GW{idor_${secretId}}` };
}

export function idorHintLines(cfg) {
  return [
    '// L2 (M2) hint — IDOR',
    'GET /api/m2/user?id=N exposes any user record.',
    '  most ids return { role:"guest" } — boring.',
    '  one id has role:"admin" + a flag.',
    '  iterate id in [1000..9999]. /traffic leaks ranges.',
    '  fast path: chain GET /api/m2/user?id=NNNN ... or scan in batches.'
  ];
}
