import { genGate } from '../shared/puzzles/gate.js';
import { dailySeed, todayUTC, secondsUntilNextUtcDay } from '../shared/puzzles/rng.js';
import { cryptic, methodNotAllowed } from './_state.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, 'GET');
  try {
    const date = todayUTC();
    const seed = dailySeed(date);
    const gate = genGate(seed);
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return res.status(200).json({
      date,
      seed,
      resetIn: secondsUntilNextUtcDay(),
      gate: { prefix: gate.prefix, sumTarget: gate.sumTarget }
      // NOTE: full code is omitted from the response. Client computes it
      // from the same seed via genGate() — no extra trust gained either way,
      // but keeps the wire payload looking gameplay-respectful.
    });
  } catch (e) {
    console.error('daily error:', e);
    return res.status(503).json(cryptic('UPSTREAM_DOWN', 'daily_unavailable', {
      detail: String(e?.message || e)
    }));
  }
}
