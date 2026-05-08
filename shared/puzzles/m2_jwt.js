import { mulberry32, hashSeed, pick } from './rng.js';

const SECRETS = ['hunter2', 'admin123', 'devops2024', 'ghostkey', 'p@ssw0rd', 'changeme', 'iloveyou', 'dragon99'];

export function genM2Jwt(seed) {
  if (!seed || seed === 'DEFAULT') {
    return { seed: 'DEFAULT', secret: 'hunter2', expectedRole: 'admin' };
  }
  const rng = mulberry32(hashSeed(`m2_jwt:${seed}`));
  return { seed, secret: pick(rng, SECRETS), expectedRole: 'admin' };
}

export function jwtHintLines(cfg) {
  return [
    '// L1 (M2) hint — JWT TAMPER',
    'service expects an HS256 JWT with role:"admin"',
    `  HMAC secret leaked in /traffic: "${cfg.secret}"`,
    '  forge a token, send via POST /api/m2/jwt {"token":"..."}',
    '  any HS256 lib works (jwt.io / `jose` npm)',
    '  payload: { "role":"admin", "sub":"ghost" }'
  ];
}
