import crypto from 'node:crypto';
import { readJsonBody, cryptic, methodNotAllowed } from '../_state.js';
import { genM2Jwt } from '../../shared/puzzles/m2_jwt.js';

function b64urlDecode(s) {
  s = String(s).replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  return Buffer.from(s, 'base64');
}

function verifyJwtHS256(token, secret) {
  if (typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [h, p, sig] = parts;
  let header;
  try { header = JSON.parse(b64urlDecode(h).toString('utf8')); } catch { return null; }
  if (header?.alg !== 'HS256') return null;
  const expected = crypto.createHmac('sha256', secret).update(`${h}.${p}`).digest('base64url');
  if (expected !== sig) return null;
  try { return JSON.parse(b64urlDecode(p).toString('utf8')); } catch { return null; }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, 'POST');
  const body = await readJsonBody(req);
  const { token, seed } = body || {};
  const cfg = genM2Jwt(seed || 'DEFAULT');

  if (!token || typeof token !== 'string') {
    return res.status(400).json(cryptic('PAYLOAD_MALFORMED', 'token required', {
      hint: 'POST /api/m2/jwt {"token":"<HS256 jwt with role=admin>"}'
    }));
  }
  const claims = verifyJwtHS256(token, cfg.secret);
  if (!claims) {
    return res.status(401).json(cryptic('AUTH_FAILED', 'sig_invalid', {
      hint: 'wrong secret or alg≠HS256 — JWT_SECRET leaked in /traffic'
    }));
  }
  if (claims.role !== cfg.expectedRole) {
    return res.status(403).json(cryptic('AUTH_INSUFFICIENT', 'role_not_privileged', {
      hint: `claims.role must equal "${cfg.expectedRole}"`,
      received: claims.role
    }));
  }
  return res.status(200).json({
    status: 'jwt_ok',
    claims,
    unlock: 'jwt',
    msg: '>>> JWT_AUTH bypassed. user_api exposed at /api/m2/user'
  });
}
