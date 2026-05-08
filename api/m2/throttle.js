import { redis, playerKey } from '../_kv.js';
import { readJsonBody, cryptic, methodNotAllowed } from '../_state.js';
import { genM2Ratelimit } from '../../shared/puzzles/m2_ratelimit.js';

const ID_RE = /^[a-zA-Z0-9_\-:.]{1,64}$/;

export default async function handler(req, res) {
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
      status: 'rl_bypassed',
      unlock: 'ratelimit',
      msg: '>>> RATE_LIMIT bypassed via client_id rotation. checkout exposed.'
    });
  } catch (e) {
    console.error('m2 throttle error:', e);
    return res.status(503).json(cryptic('UPSTREAM_DOWN', 'throttle_unavailable', {
      detail: String(e?.message || e)
    }));
  }
}
