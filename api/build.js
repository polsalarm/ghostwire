import { redis, playerKey } from './_kv.js';
import { methodNotAllowed } from './_state.js';

const WINDOW_MS = 5000;

export default async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, 'GET');
  const key = playerKey(req, 'pipe');
  await redis.set(key, JSON.stringify({ ba: Date.now(), ta: 0 }), { ex: 30 });
  return res.status(200).json({
    stage: 'build',
    msg: 'container image queued',
    deadline_ms: WINDOW_MS,
    next: 'GET /test then GET /deploy'
  });
}
