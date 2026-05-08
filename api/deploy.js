import { redis, playerKey } from './_kv.js';
import { cryptic, methodNotAllowed } from './_state.js';
import { genPipeline } from '../shared/puzzles/pipeline.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, 'GET');
  const url = new URL(req.url, 'http://x');
  const seed = url.searchParams.get('seed') || 'DEFAULT';
  const cfg = genPipeline(seed);
  const baseKey = playerKey(req, 'pipe');
  const key = `${baseKey}:${cfg.seed}`;
  const raw = await redis.get(key);
  const state = parseState(raw);
  const now = Date.now();
  const windowMs = state.windowMs || cfg.windowMs;

  if (!state.ba || now - state.ba > windowMs) {
    await redis.del(key);
    return res.status(425).json(cryptic('PIPELINE_STALE', 'window_expired', {
      hint: `must complete /build → /test → /deploy in ${windowMs / 1000}s`
    }));
  }
  if (!state.ta) {
    return res.status(409).json(cryptic('PIPELINE_OUT_OF_ORDER', 'test_stage_skipped', {
      hint: 'order: build → test → deploy'
    }));
  }

  const total = now - state.ba;
  await redis.del(key);
  return res.status(200).json({
    stage: 'deploy',
    status: 'pipeline_complete',
    elapsed_ms: total,
    unlock: 'pipeline',
    msg: '>>> NODE_3 BYPASSED. container shipped. PUBLIC_INTERNET reached.'
  });
}

function parseState(raw) {
  if (!raw) return { ba: 0, ta: 0, windowMs: 0 };
  if (typeof raw === 'object') return {
    ba: raw.ba || 0, ta: raw.ta || 0, windowMs: raw.windowMs || 0, seed: raw.seed
  };
  try {
    const o = JSON.parse(raw);
    return { ba: o.ba || 0, ta: o.ta || 0, windowMs: o.windowMs || 0, seed: o.seed };
  } catch {
    return { ba: 0, ta: 0, windowMs: 0 };
  }
}
