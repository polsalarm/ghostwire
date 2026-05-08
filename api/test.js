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
    return res.status(425).json(cryptic('PIPELINE_STALE', 'build_not_initiated_or_expired', {
      hint: `run GET /build first; chain within ${windowMs / 1000}s`
    }));
  }

  state.ta = now;
  await redis.set(key, JSON.stringify(state), { ex: 30 });
  return res.status(200).json({
    stage: 'test',
    msg: 'unit_tests=ok integration=ok',
    elapsed_ms: state.ta - state.ba
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
