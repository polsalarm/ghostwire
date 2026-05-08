import { genGate } from '../shared/puzzles/gate.js';
import { genRouter } from '../shared/puzzles/router.js';
import { genPipeline } from '../shared/puzzles/pipeline.js';
import { dailySeed, todayUTC, secondsUntilNextUtcDay } from '../shared/puzzles/rng.js';
import { cryptic, methodNotAllowed } from './_state.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, 'GET');
  try {
    const date = todayUTC();
    const seed = dailySeed(date);
    const gate = genGate(seed);
    const router = genRouter(seed);
    const pipeline = genPipeline(seed);
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return res.status(200).json({
      date,
      seed,
      resetIn: secondsUntilNextUtcDay(),
      gate: { prefix: gate.prefix, sumTarget: gate.sumTarget },
      router: { threshold: router.threshold, windowMs: router.windowMs },
      pipeline: { windowMs: pipeline.windowMs }
      // server keeps exact gate.code, router.temperature/status private —
      // client recomputes via the same seed for hints, but the wire
      // payload stays gameplay-respectful.
    });
  } catch (e) {
    console.error('daily error:', e);
    return res.status(503).json(cryptic('UPSTREAM_DOWN', 'daily_unavailable', {
      detail: String(e?.message || e)
    }));
  }
}
