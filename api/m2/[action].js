// Single Vercel function dispatching all M2 lab routes by URL action.
// Hobby plan caps deployments at 12 serverless functions, so each m2/*
// endpoint piggybacks here instead of being its own file.

import crypto from 'node:crypto';
import { redis, playerKey } from '../_kv.js';
import { readJsonBody, cryptic, methodNotAllowed } from '../_state.js';
import { genM2Jwt } from '../../shared/puzzles/m2_jwt.js';
import { genM2Idor } from '../../shared/puzzles/m2_idor.js';
import { genM2Ratelimit } from '../../shared/puzzles/m2_ratelimit.js';
import { genM2Proto } from '../../shared/puzzles/m2_proto.js';
import { genM2Smug } from '../../shared/puzzles/m2_smug.js';

export default async function handler(req, res) {
  const action = String(req.query?.action || '').toLowerCase();
  switch (action) {
    case 'jwt':      return jwt(req, res);
    case 'user':     return user(req, res);
    case 'throttle': return throttle(req, res);
    case 'checkout': return checkout(req, res);
    case 'proxy':    return proxy(req, res);
    default:
      return res.status(404).json(cryptic('NOT_FOUND', `unknown m2 action: ${action}`));
  }
}

// ── L1 JWT ────────────────────────────────────────────────────────────
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

async function jwt(req, res) {
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
    status: 'jwt_ok', claims, unlock: 'jwt',
    msg: '>>> JWT_AUTH bypassed. user_api exposed at /api/m2/user'
  });
}

// ── L2 IDOR ───────────────────────────────────────────────────────────
async function user(req, res) {
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
  const role = (id % 17 === 0) ? 'support' : 'guest';
  return res.status(200).json({
    user: { id, role, name: `user-${id}`, joined: '2026-0' + ((id % 9) + 1) }
  });
}

// ── L3 RATE_LIMIT ─────────────────────────────────────────────────────
const ID_RE = /^[a-zA-Z0-9_\-:.]{1,64}$/;
async function throttle(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, 'POST');
  try {
    const body = await readJsonBody(req);
    const { client_id, seed: seedRaw } = body || {};
    const seed = typeof seedRaw === 'string' ? seedRaw : 'DEFAULT';
    const cfg = genM2Ratelimit(seed);
    if (typeof client_id !== 'string' || !ID_RE.test(client_id)) {
      return res.status(400).json(cryptic('PAYLOAD_MALFORMED', 'client_id required (1-64 chars [a-z0-9_-:.])'));
    }
    const baseKey = playerKey(req, 'm2:rl');
    const key = `${baseKey}:${cfg.seed}`;
    await redis.sadd(key, client_id);
    await redis.expire(key, Math.ceil(cfg.windowMs / 1000));
    const count = await redis.scard(key);
    if (count < cfg.threshold) {
      return res.status(202).json({
        status: 'accepted',
        msg: `client_id "${client_id}" recorded · ${count}/${cfg.threshold} unique ids in ${cfg.windowMs / 1000}s window`,
        rl_state: { unique_ids: count, threshold: cfg.threshold }
      });
    }
    await redis.del(key);
    return res.status(200).json({
      status: 'rl_bypassed', unlock: 'ratelimit',
      msg: '>>> RATE_LIMIT bypassed via client_id rotation. checkout exposed.'
    });
  } catch (e) {
    console.error('m2 throttle error:', e);
    return res.status(503).json(cryptic('UPSTREAM_DOWN', 'throttle_unavailable', { detail: String(e?.message || e) }));
  }
}

// ── L4 PROTOTYPE_POLLUTION ────────────────────────────────────────────
async function checkout(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, 'POST');
  const body = await readJsonBody(req);
  const seed = typeof body?.seed === 'string' ? body.seed : 'DEFAULT';
  const cfg = genM2Proto(seed);
  const proto = body && Object.prototype.hasOwnProperty.call(body, '__proto__') ? body['__proto__'] : null;
  const polluted = !!proto && proto[cfg.flagKey] === true;
  if (!polluted) {
    return res.status(200).json({
      status: 'checkout_ok',
      receipt: { id: Math.floor(Math.random() * 90000) + 10000, item: body?.item || 'unknown' },
      hint: 'naive deep-merge in /api/m2/checkout. body keys land on the config object.'
    });
  }
  return res.status(200).json({
    status: 'gate_open', unlock: 'proto',
    msg: `>>> PROTOTYPE polluted via __proto__.${cfg.flagKey}. admin checkout opened.`
  });
}

// ── L5 HEADER_SMUGGLING ───────────────────────────────────────────────
async function proxy(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, 'POST');
  const url = new URL(req.url, 'http://x');
  const seed = url.searchParams.get('seed') || 'DEFAULT';
  const cfg = genM2Smug(seed);
  const xfh = (req.headers['x-forwarded-host'] || '').toString();
  if (xfh !== cfg.magicHost) {
    return res.status(404).json(cryptic('PROXY_NOT_FOUND', 'no upstream for that host', {
      received: xfh || '<none>',
      hint: 'reverse proxy routes by X-Forwarded-Host'
    }));
  }
  return res.status(200).json({
    status: 'proxy_ok', upstream: cfg.magicHost, unlock: 'smug',
    msg: '>>> HEADER_SMUGGLING bypassed proxy filter. admin upstream reached.'
  });
}
