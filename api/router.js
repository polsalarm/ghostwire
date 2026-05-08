import { readJsonBody, cryptic, methodNotAllowed } from './_state.js';

// In-memory shared window. Survives only within a warm lambda instance, but
// `flood /api/router 15` is a burst — Vercel reuses the same instance for
// concurrent invocations after warm-up, so the 12-of-2s threshold is hit
// reliably by the second flood (and usually by the first). Cookie-per-player
// would lose this property because each parallel request would carry the
// pre-flood cookie.
const WINDOW_MS = 2000;
const THRESHOLD = 12;

if (!globalThis.__gw_router_hits) {
  globalThis.__gw_router_hits = [];
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, 'POST');
  const body = await readJsonBody(req);
  const { temperature, status } = body || {};
  const now = Date.now();

  globalThis.__gw_router_hits = globalThis.__gw_router_hits.filter(t => now - t < WINDOW_MS);
  const hits = globalThis.__gw_router_hits;

  const cond = temperature === 180 && status === 'critical';

  if (!cond) {
    return res.status(418).json(cryptic('ROUTE_FILTERED', 'switch_default_branch', {
      hint: 'expected: { temperature: 180, status: "critical" }',
      router_state: { recent_critical_hits: hits.length }
    }));
  }

  hits.push(now);

  if (hits.length < THRESHOLD) {
    return res.status(202).json({
      status: 'accepted',
      msg: `packet ${hits.length}/${THRESHOLD} accepted on critical branch`,
      router_state: {
        recent_critical_hits: hits.length,
        window_ms: WINDOW_MS
      }
    });
  }

  globalThis.__gw_router_hits = [];
  return res.status(200).json({
    status: 'router_overflowed',
    next: '/build → /test → /deploy (within 5s)',
    unlock: 'router',
    msg: '>>> NODE_2 BYPASSED. switch overloaded. CI/CD pipeline exposed.'
  });
}
