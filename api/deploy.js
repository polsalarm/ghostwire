import { redis, playerKey } from './_kv.js';
import { cryptic, methodNotAllowed } from './_state.js';

const WINDOW_MS = 5000;

export default async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, 'GET');
  const key = playerKey(req, 'pipe');
  const raw = await redis.get(key);
  const state = parseState(raw);
  const now = Date.now();

  if (!state.ba || now - state.ba > WINDOW_MS) {
    await redis.del(key);
    return res.status(425).json(cryptic('PIPELINE_STALE', 'window_expired', {
      hint: 'must complete /build → /test → /deploy in 5s'
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
  if (!raw) return { ba: 0, ta: 0 };
  if (typeof raw === 'object') return { ba: raw.ba || 0, ta: raw.ta || 0 };
  try {
    const o = JSON.parse(raw);
    return { ba: o.ba || 0, ta: o.ta || 0 };
  } catch {
    return { ba: 0, ta: 0 };
  }
}
