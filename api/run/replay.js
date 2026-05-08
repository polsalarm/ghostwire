import { redis } from '../_kv.js';
import { cryptic, methodNotAllowed } from '../_state.js';

const RUN_ID_RE = /^[a-z0-9]{1,12}-[a-z0-9]{1,12}$/i;

export default async function handler(req, res) {
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
      runId: id,
      handle: row.handle,
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
