import { redis } from './_kv.js';
import { todayUTC } from '../shared/puzzles/rng.js';
import { cryptic, methodNotAllowed } from './_state.js';

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 200;

function keyForWindow(win, dateParam) {
  if (win === 'daily') {
    const d = dateParam || todayUTC();
    return { key: `gw:lb:daily:${d}`, label: `daily:${d}` };
  }
  return { key: 'gw:lb:alltime', label: 'alltime' };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, 'GET');
  try {
    const url = new URL(req.url, 'http://x');
    const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(url.searchParams.get('limit'), 10) || DEFAULT_LIMIT));
    const win = url.searchParams.get('window') || 'alltime';
    const date = url.searchParams.get('date') || undefined;
    const { key, label } = keyForWindow(win, date);

    const ids = await redis.zrange(key, 0, limit - 1);
    if (!ids?.length) {
      res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate=30');
      return res.status(200).json({ window: label, count: 0, entries: [] });
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
        ts: Number(r.ts) || 0,
        seed: r.seed || 'DEFAULT',
        tier: r.tier || 'story'
      };
    }).filter(e => e.handle && e.score > 0);

    res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate=30');
    return res.status(200).json({ window: label, count: entries.length, entries });
  } catch (e) {
    console.error('leaderboard error:', e);
    return res.status(503).json(cryptic('UPSTREAM_DOWN', 'leaderboard_unavailable', {
      detail: String(e?.message || e)
    }));
  }
}
