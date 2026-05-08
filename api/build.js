import { redis, playerKey } from './_kv.js';
import { methodNotAllowed } from './_state.js';
import { genPipeline } from '../shared/puzzles/pipeline.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, 'GET');
  const url = new URL(req.url, 'http://x');
  const seed = url.searchParams.get('seed') || 'DEFAULT';
  const cfg = genPipeline(seed);
  const baseKey = playerKey(req, 'pipe');
  const key = `${baseKey}:${cfg.seed}`;
  const now = Date.now();
  await redis.set(key, JSON.stringify({ ba: now, ta: 0, windowMs: cfg.windowMs, seed: cfg.seed }), { ex: 30 });
  return res.status(200).json({
    stage: 'build',
    msg: 'container image queued',
    deadline_ms: cfg.windowMs,
    next: 'GET /test then GET /deploy'
  });
}
