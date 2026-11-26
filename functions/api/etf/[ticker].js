import { rpc, json, getUser } from '../../_lib.js';
import { TICKER, renderEtfHoldings } from '../../_fin.js';

// GET /api/etf/:ticker — top 50 holdings (signed-in users; the page shows the top 10).
export async function onRequestGet(context) {
  const { request, env, params } = context;
  const ticker = String(params.ticker || '').toUpperCase();
  if (!TICKER.test(ticker)) return json({ error: 'Unknown ETF.' }, { status: 404, isPrivate: true });
  const user = await getUser(env, request);
  if (!user) return json({ error: 'login_required', message: 'Sign in (free) to see the top 50 holdings.' }, { status: 401, isPrivate: true });
  try {
    const d = await rpc(env, 'tt_etf', { p_ticker: ticker, p_full: true });
    if (!d) return json({ error: 'Unknown ETF.' }, { status: 404, isPrivate: true });
    return json({ ticker: d.ticker, html: renderEtfHoldings(d) }, { isPrivate: true });
  } catch (e) {
    return json({ error: 'Data is temporarily unavailable.' }, { status: 503, isPrivate: true });
  }
}
