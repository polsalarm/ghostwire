import { Redis } from '@upstash/redis';

const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

if (!url || !token) {
  console.error('[_kv] missing env vars',
    'url=', url ? 'present' : 'MISSING',
    'token=', token ? 'present' : 'MISSING');
}

export const redis = new Redis({ url: url || 'http://invalid', token: token || 'invalid' });

export function playerKey(req, suffix) {
  const fwd = req.headers['x-forwarded-for'] || '';
  const ip = fwd.split(',')[0].trim() || 'unknown';
  return `gw:${suffix}:${ip}`;
}
