import { cryptic, methodNotAllowed } from '../_state.js';
import { genM2Idor } from '../../shared/puzzles/m2_idor.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, 'GET');
  const url = new URL(req.url, 'http://x');
  const idStr = url.searchParams.get('id') || '';
  const seed = url.searchParams.get('seed') || 'DEFAULT';
  const id = parseInt(idStr, 10);
  if (!Number.isFinite(id) || id < 0) {
    return res.status(400).json(cryptic('BAD_ID', 'id must be a non-negative integer'));
  }
  const cfg = genM2Idor(seed);

  if (id === cfg.secretId) {
    return res.status(200).json({
      user: { id, role: 'admin', flag: cfg.flag },
      unlock: 'idor',
      msg: '>>> USER_API_IDOR bypassed. internal flag exposed.'
    });
  }
  // generic-looking decoy record so iteration produces diverse output
  const role = (id % 17 === 0) ? 'support' : 'guest';
  return res.status(200).json({
    user: { id, role, name: `user-${id}`, joined: '2026-0' + ((id % 9) + 1) }
  });
}
