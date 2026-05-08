import { readJsonBody, cryptic, methodNotAllowed } from './_state.js';
import { genGate } from '../shared/puzzles/gate.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, 'POST');
  const body = await readJsonBody(req);
  const { role, clearance_code, seed } = body || {};

  const gate = genGate(seed || 'DEFAULT');

  if (role !== 'admin') {
    return res.status(403).json(cryptic('AUTH_INSUFFICIENT', 'role_not_privileged', {
      hint: 'webhook expects role:"admin"'
    }));
  }
  if (!clearance_code || typeof clearance_code !== 'string') {
    return res.status(400).json(cryptic('PAYLOAD_MALFORMED', 'clearance_code_required'));
  }
  if (clearance_code !== gate.code) {
    return res.status(403).json(cryptic('AUTH_FAILED', 'clearance_mismatch', {
      hint: `prefix=${gate.prefix}- // suffix=2 digits // sum=${gate.sumTarget}`
    }));
  }
  return res.status(200).json({
    status: 'gate_open',
    next: '/api/router',
    unlock: 'gate',
    msg: '>>> NODE_1 BYPASSED. router exposed.'
  });
}
