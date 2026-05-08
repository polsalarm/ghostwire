import { redis } from './_kv.js';
import { cryptic, methodNotAllowed } from './_state.js';

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 200;

export default async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, 'GET');
  try {
    const url = new URL(req.url, 'http://x');
    const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(url.searchParams.get('limit'), 10) || DEFAULT_LIMIT));

    const ids = await redis.zrange('gw:lb:alltime', 0, limit - 1);
    if (!ids?.length) {
      return res.status(200).json({ window: 'alltime', count: 0, entries: [] });
    }

    const pipe = redis.pipeline();
    for (const id of ids) pipe.hgetall(`gw:run:${id}`);
    const rows = await pipe.exec();

    const entries = ids.map((id, i) => {
      const r = rows[i] || {};
      return {
        rank: i + 1,
        runId: id,
        handle: r.handle || 'anon',
        timeMs: Number(r.timeMs) || 0,
        hintsUsed: Number(r.hintsUsed) || 0,
        score: Number(r.score) || 0,
        ts: Number(r.ts) || 0
      };
    }).filter(e => e.handle && e.score > 0);

    res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate=30');
    return res.status(200).json({ window: 'alltime', count: entries.length, entries });
  } catch (e) {
    console.error('leaderboard error:', e);
    return res.status(503).json(cryptic('UPSTREAM_DOWN', 'leaderboard_unavailable', {
      detail: String(e?.message || e)
    }));
  }
}
