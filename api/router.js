import { redis, playerKey } from './_kv.js';
import { readJsonBody, cryptic, methodNotAllowed } from './_state.js';
import { genRouter } from '../shared/puzzles/router.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, 'POST');
  try {
    const body = await readJsonBody(req);
    const { temperature, status, seed: seedRaw } = body || {};
    const seed = typeof seedRaw === 'string' ? seedRaw : 'DEFAULT';
    const cfg = genRouter(seed);
    const now = Date.now();
    // state isolated per seed so daily and free-play don't cross-contaminate
    const baseKey = playerKey(req, 'router');
    const key = `${baseKey}:${cfg.seed}`;

    const cond = temperature === cfg.temperature && status === cfg.status;

    if (!cond) {
      const recent = await redis.zcount(key, now - cfg.windowMs, now).catch(() => 0);
      return res.status(418).json(cryptic('ROUTE_FILTERED', 'switch_default_branch', {
        hint: `expected: { temperature: ${cfg.temperature}, status: "${cfg.status}" }`,
        router_state: { recent_critical_hits: recent }
      }));
    }

    const member = `${now}-${Math.random().toString(36).slice(2, 8)}`;
    await redis.zadd(key, { score: now, member });
    await redis.zremrangebyscore(key, 0, now - cfg.windowMs);
    const hits = await redis.zcard(key);
    await redis.expire(key, 30);

    if (hits < cfg.threshold) {
      return res.status(202).json({
        status: 'accepted',
        msg: `packet ${hits}/${cfg.threshold} accepted on critical branch`,
        router_state: {
          recent_critical_hits: hits,
          window_ms: cfg.windowMs
        }
      });
    }

    await redis.del(key);
    return res.status(200).json({
      status: 'router_overflowed',
      next: '/build → /test → /deploy',
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
