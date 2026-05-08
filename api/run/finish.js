import { redis, playerKey } from '../_kv.js';
import { readJsonBody, cryptic, methodNotAllowed } from '../_state.js';

const MIN_TIME_MS = 5_000;        // sub-5s impossible (typewriter alone is longer)
const MAX_TIME_MS = 60 * 60_000;  // 1h cap
const MAX_HANDLE_LEN = 16;
const RATE_LIMIT_S = 10;

function sanitizeHandle(raw) {
  if (typeof raw !== 'string') return null;
  const h = raw.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, MAX_HANDLE_LEN);
  return h.length >= 2 ? h : null;
}

function score(timeMs, hintsUsed) {
  return Math.round(timeMs + hintsUsed * 5_000);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, 'POST');
  try {
    const body = await readJsonBody(req);
    const handle = sanitizeHandle(body?.handle);
    const timeMs = Number(body?.timeMs);
    const hintsUsed = Math.max(0, Math.floor(Number(body?.hintsUsed) || 0));

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
    const s = score(timeMs, hintsUsed);
    const now = Date.now();

    const detail = {
      handle,
      timeMs,
      hintsUsed,
      score: s,
      ts: now
    };

    await redis.hset(`gw:run:${runId}`, detail);
    await redis.expire(`gw:run:${runId}`, 60 * 60 * 24 * 90);  // 90d retention
    await redis.zadd('gw:lb:alltime', { score: s, member: runId });
    // cap leaderboard to top 1000 to keep zset cheap
    await redis.zremrangebyrank('gw:lb:alltime', 1000, -1);

    const rank = await redis.zrank('gw:lb:alltime', runId);
    return res.status(200).json({
      ok: true,
      runId,
      handle,
      score: s,
      rank: typeof rank === 'number' ? rank + 1 : null,
      timeMs,
      hintsUsed
    });
  } catch (e) {
    console.error('run/finish error:', e);
    return res.status(503).json(cryptic('UPSTREAM_DOWN', 'leaderboard_unavailable', {
      detail: String(e?.message || e)
    }));
  }
}
