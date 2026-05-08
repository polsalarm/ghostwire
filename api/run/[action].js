// Single Vercel function for /api/run/* — finish + replay merged so we
// don't blow the Hobby 12-function cap.

import { redis, playerKey } from '../_kv.js';
import { readJsonBody, cryptic, methodNotAllowed } from '../_state.js';
import { isDailySeed, weekStartUTC } from '../../shared/puzzles/rng.js';
import { tierOrDefault } from '../../shared/puzzles/tier.js';

const MIN_TIME_MS = 5_000;
const MAX_TIME_MS = 60 * 60_000;
const MAX_HANDLE_LEN = 16;
const RATE_LIMIT_S = 10;

const RUN_ID_RE = /^[a-z0-9]{1,12}-[a-z0-9]{1,12}$/i;

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
  const action = String(req.query?.action || '').toLowerCase();
  if (action === 'finish') return finish(req, res);
  if (action === 'replay') return replay(req, res);
  return res.status(404).json(cryptic('NOT_FOUND', `unknown run action: ${action}`));
}

async function finish(req, res) {
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

    const rlKey = playerKey(req, 'rl:run-finish');
    const taken = await redis.set(rlKey, '1', { nx: true, ex: RATE_LIMIT_S });
    if (taken !== 'OK') {
      return res.status(429).json(cryptic('RATE_LIMITED', `wait ${RATE_LIMIT_S}s between submissions`));
    }

    const runId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    const s = score(timeMs, hintsUsed, tier);
    const now = Date.now();

    const detail = {
      handle, timeMs, hintsUsed, score: s, ts: now,
      seed, tier, module: mod,
      hasTrace: trace.length > 0 ? 1 : 0
    };
    if (trace.length > 0) detail.trace = JSON.stringify(trace);

    await redis.hset(`gw:run:${runId}`, detail);
    await redis.expire(`gw:run:${runId}`, 60 * 60 * 24 * 90);
    await redis.zadd('gw:lb:alltime', { score: s, member: runId });
    await redis.zremrangebyrank('gw:lb:alltime', 1000, -1);

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
      ok: true, runId, handle, score: s,
      rank: typeof rank === 'number' ? rank + 1 : null,
      dailyRank, timeMs, hintsUsed, seed, tier
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

async function replay(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, 'GET');
  try {
    const url = new URL(req.url, 'http://x');
    const id = url.searchParams.get('id') || '';
    if (!RUN_ID_RE.test(id)) {
      return res.status(400).json(cryptic('BAD_ID', 'invalid run id'));
    }
    const row = await redis.hgetall(`gw:run:${id}`);
    if (!row || !row.handle) {
      return res.status(404).json(cryptic('NOT_FOUND', 'run not found or expired'));
    }
    let trace = [];
    if (row.trace) {
      try {
        const parsed = typeof row.trace === 'string' ? JSON.parse(row.trace) : row.trace;
        if (Array.isArray(parsed)) trace = parsed;
      } catch { trace = []; }
    }
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return res.status(200).json({
      runId: id, handle: row.handle,
      timeMs: Number(row.timeMs) || 0,
      tier: row.tier || 'story',
      seed: row.seed || 'DEFAULT',
      trace
    });
  } catch (e) {
    console.error('replay error:', e);
    return res.status(503).json(cryptic('UPSTREAM_DOWN', 'replay_unavailable', {
      detail: String(e?.message || e)
    }));
  }
}
