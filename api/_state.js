import crypto from 'node:crypto';

const SECRET = process.env.GHOSTWIRE_SECRET || 'dev-only-secret';
const COOKIE_NAME = 'gw_state';

function sign(payload) {
  return crypto.createHmac('sha256', SECRET).update(payload).digest('base64url');
}

function encode(state) {
  const payload = Buffer.from(JSON.stringify(state)).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

function decode(token) {
  if (!token || typeof token !== 'string') return null;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;
  if (sign(payload) !== sig) return null;
  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

function parseCookie(header) {
  if (!header) return {};
  const out = {};
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    const k = part.slice(0, i).trim();
    const v = part.slice(i + 1).trim();
    out[k] = decodeURIComponent(v);
  }
  return out;
}

export function readState(req) {
  const cookies = parseCookie(req.headers.cookie);
  const state = decode(cookies[COOKIE_NAME]) || {};
  return {
    rh: Array.isArray(state.rh) ? state.rh : [],
    ba: typeof state.ba === 'number' ? state.ba : 0,
    ta: typeof state.ta === 'number' ? state.ta : 0
  };
}

export function writeState(res, state) {
  const token = encode(state);
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=${token}; Path=/; Max-Age=600; SameSite=Lax`);
}

export function clearState(res) {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`);
}

export async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  return await new Promise((resolve) => {
    let buf = '';
    req.on('data', (chunk) => { buf += chunk; });
    req.on('end', () => {
      if (!buf) return resolve({});
      try { resolve(JSON.parse(buf)); } catch { resolve({}); }
    });
    req.on('error', () => resolve({}));
  });
}

export function cryptic(code, msg, extra = {}) {
  return {
    error: msg,
    code,
    trace: `0x${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0')}`,
    ...extra
  };
}

export function methodNotAllowed(res, allowed) {
  res.setHeader('Allow', allowed);
  res.status(405).json(cryptic('METHOD_NOT_ALLOWED', `use ${allowed}`));
}
