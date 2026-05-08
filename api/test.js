import { readState, writeState, clearState, cryptic, methodNotAllowed } from './_state.js';

const WINDOW_MS = 5000;

export default async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, 'GET');
  const state = readState(req);
  const now = Date.now();

  if (!state.ba || now - state.ba > WINDOW_MS) {
    clearState(res);
    return res.status(425).json(cryptic('PIPELINE_STALE', 'build_not_initiated_or_expired', {
      hint: 'run GET /build first; chain within 5s'
    }));
  }

  state.ta = now;
  writeState(res, state);
  return res.status(200).json({
    stage: 'test',
    msg: 'unit_tests=ok integration=ok',
    elapsed_ms: state.ta - state.ba
  });
}
