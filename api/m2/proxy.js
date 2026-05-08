import { cryptic, methodNotAllowed } from '../_state.js';
import { genM2Smug } from '../../shared/puzzles/m2_smug.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, 'POST');
  const url = new URL(req.url, 'http://x');
  const seed = url.searchParams.get('seed') || 'DEFAULT';
  const cfg = genM2Smug(seed);

  // header names are lowercased by Vercel/Node http
  const xfh = (req.headers['x-forwarded-host'] || req.headers['x_forwarded_host'] || '').toString();
  if (xfh !== cfg.magicHost) {
    return res.status(404).json(cryptic('PROXY_NOT_FOUND', 'no upstream for that host', {
      received: xfh || '<none>',
      hint: 'reverse proxy routes by X-Forwarded-Host'
    }));
  }
  return res.status(200).json({
    status: 'proxy_ok',
    upstream: cfg.magicHost,
    unlock: 'smug',
    msg: '>>> HEADER_SMUGGLING bypassed proxy filter. admin upstream reached.'
  });
}
