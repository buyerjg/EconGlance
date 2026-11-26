import { rpc, json, cached } from '../_lib.js';

// GET /api/cpi — monthly CPI-U index since 1947 for the inflation calculator. Small and public; cached a day.
export async function onRequestGet(context) {
  const { request, env } = context;
  return cached(request, context, 86400, async () => {
    try {
      return json(await rpc(env, 'tt_cpi'), { maxAge: 86400 });
    } catch (e) {
      return json({ error: 'Data is temporarily unavailable.' }, { status: 503 });
    }
  });
}
