import { rpc, json, cached } from '../_lib.js';
import { companyName } from '../_fin.js';

// GET /api/companies?q=app — company search (ticker prefix or name), 10 results.
export async function onRequestGet(context) {
  const { request, env } = context;
  const q = (new URL(request.url).searchParams.get('q') || '').trim().slice(0, 40);
  if (q.length < 1 || /[%_\\]/.test(q)) return json([], { maxAge: 300 });
  return cached(request, context, 3600, async () => {
    try {
      const list = await rpc(env, 'tt_companies', { p_sort: 'revenue', p_limit: 10, p_q: q });
      return json(list.map((r) => ({ t: r.ticker, n: companyName(r.name) })), { maxAge: 3600 });
    } catch (e) {
      return json({ error: 'Search is temporarily unavailable.' }, { status: 503 });
    }
  });
}
