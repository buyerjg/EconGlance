import { rpc, json, cached } from '../_lib.js';

// GET /api/today — latest brief + official data snapshot. Same for everyone, cached 10 min.
export async function onRequestGet(context) {
  const { request, env } = context;
  return cached(request, context, 600, async () => {
    try {
      const data = await rpc(env, 'tt_today');
      return json(data, { maxAge: 600 });
    } catch (e) {
      return json({ error: 'Data is temporarily unavailable.' }, { status: 503 });
    }
  });
}
