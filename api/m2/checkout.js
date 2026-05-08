import { readJsonBody, cryptic, methodNotAllowed } from '../_state.js';
import { genM2Proto } from '../../shared/puzzles/m2_proto.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, 'POST');
  const body = await readJsonBody(req);
  const seed = typeof body?.seed === 'string' ? body.seed : 'DEFAULT';
  const cfg = genM2Proto(seed);

  // Detect prototype-pollution attempt without actually mutating Object.prototype
  // (which would persist on warm lambdas). We pattern-match the body shape.
  const proto = body && Object.prototype.hasOwnProperty.call(body, '__proto__')
    ? body['__proto__']
    : null;
  const polluted = !!proto && proto[cfg.flagKey] === true;

  if (!polluted) {
    return res.status(200).json({
      status: 'checkout_ok',
      receipt: { id: Math.floor(Math.random() * 90000) + 10000, item: body?.item || 'unknown' },
      hint: 'naive deep-merge in /api/m2/checkout. body keys land on the config object.'
    });
  }
  return res.status(200).json({
    status: 'gate_open',
    unlock: 'proto',
    msg: `>>> PROTOTYPE polluted via __proto__.${cfg.flagKey}. admin checkout opened.`
  });
}
