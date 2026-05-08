import { redis, playerKey } from '../_kv.js';
import { readJsonBody, cryptic, methodNotAllowed } from '../_state.js';
import { isDailySeed, weekStartUTC } from '../../shared/puzzles/rng.js';
import { tierOrDefault } from '../../shared/puzzles/tier.js';

const MIN_TIME_MS = 5_000;        // sub-5s impossible (typewriter alone is longer)
const MAX_TIME_MS = 60 * 60_000;  // 1h cap
const MAX_HANDLE_LEN = 16;
const RATE_LIMIT_S = 10;

function sanitizeHandle(raw) {
  if (typeof raw !== 'string') return null;
  const h = raw.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, MAX_HANDLE_LEN);
  return h.length >= 2 ? h : null;
}

function score(timeMs, hintsUsed, tier) {
  const t = tierOrDefault(tier);
  return Math.round((timeMs + hintsUsed * 5_000) * t.mul);
}

function sanitizeTrace(input) {
  if (!Array.isArray(input)) return [];
  const out = [];
  for (const ev of input.slice(0, 200)) {
    if (!ev || typeof ev !== 'object') continue;
    const t = Math.max(0, Math.floor(Number(ev.t) || 0));
    const c = typeof ev.c === 'string' ? ev.c.slice(0, 240) : null;
    if (c) out.push({ t, c });
  }
  return out;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, 'POST');
  try {
    const body = await readJsonBody(req);
    const handle = sanitizeHandle(body?.handle);
    const timeMs = Number(body?.timeMs);
    const hintsUsed = Math.max(0, Math.floor(Number(body?.hintsUsed) || 0));
    const seed = typeof body?.seed === 'string' ? body.seed : 'DEFAULT';
    const tier = tierOrDefault(body?.tier).id;
    const trace = sanitizeTrace(body?.trace);
    const mod = typeof body?.module === 'string' && /^m[1-5]$/.test(body.module) ? body.module : 'm1';

    if (!handle) {
      return res.status(400).json(cryptic('BAD_HANDLE', 'handle must be 2-16 chars [a-z0-9_-]'));
    }
    if (!Number.isFinite(timeMs) || timeMs < MIN_TIME_MS || timeMs > MAX_TIME_MS) {
      return res.status(400).json(cryptic('BAD_TIME', `timeMs out of range (${MIN_TIME_MS}-${MAX_TIME_MS})`));
    }

    // per-IP rate limit
    const rlKey = playerKey(req, 'rl:run-finish');
    const taken = await redis.set(rlKey, '1', { nx: true, ex: RATE_LIMIT_S });
    if (taken !== 'OK') {
      return res.status(429).json(cryptic('RATE_LIMITED', `wait ${RATE_LIMIT_S}s between submissions`));
    }

    const runId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    const s = score(timeMs, hintsUsed, tier);
    const now = Date.now();

    const detail = {
      handle,
      timeMs,
      hintsUsed,
      score: s,
      ts: now,
      seed,
      tier,
      module: mod,
      hasTrace: trace.length > 0 ? 1 : 0
    };
    if (trace.length > 0) {
      detail.trace = JSON.stringify(trace);
    }

    await redis.hset(`gw:run:${runId}`, detail);
    await redis.expire(`gw:run:${runId}`, 60 * 60 * 24 * 90);  // 90d retention
    await redis.zadd('gw:lb:alltime', { score: s, member: runId });
    await redis.zremrangebyrank('gw:lb:alltime', 1000, -1);

    // weekly board (Monday-anchored, 21d retention)
    const weekKey = `gw:lb:weekly:${weekStartUTC()}`;
    await redis.zadd(weekKey, { score: s, member: runId });
    await redis.zremrangebyrank(weekKey, 1000, -1);
    await redis.expire(weekKey, 60 * 60 * 24 * 21);

    let dailyRank = null;
    if (isDailySeed(seed)) {
      const date = seed.slice(2);
      const dailyKey = `gw:lb:daily:${date}`;
      await redis.zadd(dailyKey, { score: s, member: runId });
      await redis.zremrangebyrank(dailyKey, 1000, -1);
      await redis.expire(dailyKey, 60 * 60 * 24 * 14);
      const dr = await redis.zrank(dailyKey, runId);
      dailyRank = typeof dr === 'number' ? dr + 1 : null;
    }

    const rank = await redis.zrank('gw:lb:alltime', runId);
    return res.status(200).json({
      ok: true,
      runId,
      handle,
      score: s,
      rank: typeof rank === 'number' ? rank + 1 : null,
      dailyRank,
      timeMs,
      hintsUsed,
      seed,
      tier
    });
  } catch (e) {
    console.error('run/finish error:', e, e?.stack);
    return res.status(503).json(cryptic('UPSTREAM_DOWN', 'leaderboard_unavailable', {
      detail: String(e?.message || e),
      hasUrl: !!(process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL),
      hasToken: !!(process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN)
    }));
  }
}
