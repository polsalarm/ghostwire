import { Redis } from '@upstash/redis';

export const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN
});

export function playerKey(req, suffix) {
  const fwd = req.headers['x-forwarded-for'] || '';
  const ip = fwd.split(',')[0].trim() || 'unknown';
  return `gw:${suffix}:${ip}`;
}
