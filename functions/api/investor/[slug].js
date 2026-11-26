import { rpc, json, getUser } from '../../_lib.js';
import { renderInvestorHoldings } from '../../_fin.js';

// GET /api/investor/:slug — every position (signed-in users; the page shows the top 25).
export async function onRequestGet(context) {
  const { request, env, params } = context;
  const slug = String(params.slug || '').toLowerCase();
  if (!/^[a-z0-9-]{2,60}$/.test(slug)) return json({ error: 'Unknown investor.' }, { status: 404, isPrivate: true });
  const user = await getUser(env, request);
  if (!user) return json({ error: 'login_required', message: 'Sign in (free) to see every position.' }, { status: 401, isPrivate: true });
  try {
    const d = await rpc(env, 'tt_investor', { p_slug: slug, p_full: true });
    if (!d) return json({ error: 'Unknown investor.' }, { status: 404, isPrivate: true });
    return json({ html: renderInvestorHoldings(d) }, { isPrivate: true });
  } catch (e) {
    return json({ error: 'Data is temporarily unavailable.' }, { status: 503, isPrivate: true });
  }
}
