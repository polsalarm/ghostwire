import { readState, clearState, cryptic, methodNotAllowed } from './_state.js';

const WINDOW_MS = 5000;

export default async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, 'GET');
  const state = readState(req);
  const now = Date.now();

  if (!state.ba || now - state.ba > WINDOW_MS) {
    clearState(res);
    return res.status(425).json(cryptic('PIPELINE_STALE', 'window_expired', {
      hint: 'must complete /build → /test → /deploy in 5s'
    }));
  }
  if (!state.ta) {
    return res.status(409).json(cryptic('PIPELINE_OUT_OF_ORDER', 'test_stage_skipped', {
      hint: 'order: build → test → deploy'
    }));
  }

  const total = now - state.ba;
  clearState(res);
  return res.status(200).json({
    stage: 'deploy',
    status: 'pipeline_complete',
    elapsed_ms: total,
    unlock: 'pipeline',
    msg: '>>> NODE_3 BYPASSED. container shipped. PUBLIC_INTERNET reached.'
  });
}
