import { rpc, json, getUser } from '../../_lib.js';
import { TICKER, renderFinancials, renderFund } from '../../_fin.js';

// GET /api/company/:ticker — all fiscal years (signed-in users only; the page itself shows the latest 5).
export async function onRequestGet(context) {
  const { request, env, params } = context;
  const ticker = String(params.ticker || '').toUpperCase();
  if (!TICKER.test(ticker)) return json({ error: 'Unknown company.' }, { status: 404, isPrivate: true });
  const user = await getUser(env, request);
  if (!user) return json({ error: 'login_required', message: 'Sign in (free) to see every year.' }, { status: 401, isPrivate: true });
  try {
    const d = await rpc(env, 'tt_company', { p_ticker: ticker, p_full: true });
    if (!d) return json({ error: 'Unknown company.' }, { status: 404, isPrivate: true });
    const fin = d.kind === 'fund' ? renderFund(d) : renderFinancials(d);
    return json({ ticker: d.ticker, html: fin.html, chart: fin.chart }, { isPrivate: true });
  } catch (e) {
    return json({ error: 'Data is temporarily unavailable.' }, { status: 503, isPrivate: true });
  }
}
