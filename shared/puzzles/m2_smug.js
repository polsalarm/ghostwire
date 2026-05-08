import { mulberry32, hashSeed, pick } from './rng.js';

const HOSTS = ['admin.internal', 'root.local', 'ops.intra', 'priv.svc', 'shadow.api'];

export function genM2Smug(seed) {
  if (!seed || seed === 'DEFAULT') {
    return { seed: 'DEFAULT', magicHost: 'admin.internal' };
  }
  const rng = mulberry32(hashSeed(`m2_smug:${seed}`));
  return { seed, magicHost: pick(rng, HOSTS) };
}

export function smugHintLines(cfg) {
  return [
    '// L5 (M2) hint — HEADER_SMUGGLING',
    '/api/m2/proxy reverse-proxies based on X-Forwarded-Host.',
    `  send X-Forwarded-Host: "${cfg.magicHost}" to reach the admin route.`,
    '  POST /api/m2/proxy with that header (no body needed).',
    '  command form: smug X-Forwarded-Host=<value>'
  ];
}
