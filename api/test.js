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
    return res.status(425).json(cryptic('PIPELINE_STALE', 'build_not_initiated_or_expired', {
      hint: 'run GET /build first; chain within 5s'
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
  if (!raw) return { ba: 0, ta: 0 };
  if (typeof raw === 'object') return { ba: raw.ba || 0, ta: raw.ta || 0 };
  try {
    const o = JSON.parse(raw);
    return { ba: o.ba || 0, ta: o.ta || 0 };
  } catch {
    return { ba: 0, ta: 0 };
  }
}
