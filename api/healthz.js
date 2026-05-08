import { methodNotAllowed } from './_state.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, 'GET');
  return res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    runtime: 'vercel-serverless'
  });
}
