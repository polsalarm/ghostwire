import { redis, playerKey } from './_kv.js';
import { readJsonBody, cryptic, methodNotAllowed } from './_state.js';

const WINDOW_MS = 2000;
const THRESHOLD = 12;

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, 'POST');
  try {
    const body = await readJsonBody(req);
    const { temperature, status } = body || {};
    const now = Date.now();
    const key = playerKey(req, 'router');

    const cond = temperature === 180 && status === 'critical';

    if (!cond) {
      const recent = await redis.zcount(key, now - WINDOW_MS, now).catch(() => 0);
      return res.status(418).json(cryptic('ROUTE_FILTERED', 'switch_default_branch', {
        hint: 'expected: { temperature: 180, status: "critical" }',
        router_state: { recent_critical_hits: recent }
      }));
    }

    const member = `${now}-${Math.random().toString(36).slice(2, 8)}`;
    await redis.zadd(key, { score: now, member });
    await redis.zremrangebyscore(key, 0, now - WINDOW_MS);
    const hits = await redis.zcard(key);
    await redis.expire(key, 30);

    if (hits < THRESHOLD) {
      return res.status(202).json({
        status: 'accepted',
        msg: `packet ${hits}/${THRESHOLD} accepted on critical branch`,
        router_state: {
          recent_critical_hits: hits,
          window_ms: WINDOW_MS
        }
      });
    }

    await redis.del(key);
    return res.status(200).json({
      status: 'router_overflowed',
      next: '/build → /test → /deploy (within 5s)',
      unlock: 'router',
      msg: '>>> NODE_2 BYPASSED. switch overloaded. CI/CD pipeline exposed.'
    });
  } catch (e) {
    console.error('router error:', e);
    return res.status(503).json(cryptic('UPSTREAM_DOWN', 'router_state_unavailable', {
      detail: String(e?.message || e),
      hasUrl: !!(process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL),
      hasToken: !!(process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN)
    }));
  }
}
