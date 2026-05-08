import { readState, writeState, methodNotAllowed } from './_state.js';

const WINDOW_MS = 5000;

export default async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, 'GET');
  const state = readState(req);
  state.ba = Date.now();
  state.ta = 0;
  writeState(res, state);
  return res.status(200).json({
    stage: 'build',
    msg: 'container image queued',
    deadline_ms: WINDOW_MS,
    next: 'GET /test then GET /deploy'
  });
}
