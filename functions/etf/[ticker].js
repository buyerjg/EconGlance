import { rpc, escapeHtml as e } from '../_lib.js';
import { page, html, SITE_NAME } from '../_layout.js';
import { TICKER, money, moneyWords, dateText, etfName, etfLink, etfReturns, renderEtfHoldings, companyLink } from '../_fin.js';

// GET /etf/:ticker — ETF top holdings and assets from its latest public Form N-PORT.
export async function onRequestGet(context) {
  const { env, params, request } = context;
  const raw = String(params.ticker || '');
  const ticker = raw.toUpperCase();
  if (!TICKER.test(ticker)) return notFound();
  if (raw !== ticker) return Response.redirect(new URL(etfLink(ticker), request.url).toString(), 301);
  let d;
  try { d = await rpc(env, 'tt_etf', { p_ticker: ticker, p_full: false }); } catch (err) {
    return html(page({ title: SITE_NAME, description: '', body: '<p class="note">This page is temporarily unavailable.</p>' }), { maxAge: 60 });
  }
  if (!d) {
    // gold, silver and crypto trusts file annual reports instead; their page lives under /company
    try {
      const c = await rpc(env, 'tt_company', { p_ticker: ticker, p_full: false });
      if (c && c.kind === 'fund') return Response.redirect(new URL(companyLink(c.ticker), request.url).toString(), 301);
    } catch (err) { /* fall through */ }
    return notFound();
  }
  const origin = new URL(request.url).origin;
  const name = etfName(d.name);
  const asOf = dateText(d.rep_date);
  const rets = etfReturns(d);
  const q = rets.every(([, v]) => v != null) ? (rets.reduce((a, [, v]) => a * (1 + v / 100), 1) - 1) * 100 : null;
  const top = (d.holdings || []).slice(0, 3).map((h) => etfName(h.name || h.title || '')).join(', ');

  const lede = (d.multi_class
      ? `The fund behind ${e(d.ticker)} (${e(name)}) had ${moneyWords(d.net_assets)} in net assets as of ${e(asOf)}, counting all its share classes, including mutual fund shares. It held`
      : `${e(name)} (${e(d.ticker)}) had ${moneyWords(d.net_assets)} in net assets as of ${e(asOf)}, making it No. ${d.rank} among the ETFs we track. It held`) + ` ${Number(d.n_holdings || 0).toLocaleString('en-US')} positions` +
    (d.top10_pct != null ? `; the 10 largest made up ${(+d.top10_pct).toFixed(1)}% of the fund` : '') + '.' +
    (top ? ` Top holdings: ${e(top)}.` : '');
  const stats = [
    [d.multi_class ? 'Fund net assets (all share classes)' : 'Net assets', money(d.net_assets), asOf],
    ['Holdings', Number(d.n_holdings || 0).toLocaleString('en-US'), ''],
    ['Top 10 weight', d.top10_pct != null ? (+d.top10_pct).toFixed(1) + '%' : '—', ''],
    ['3-month return', q != null ? (q > 0 ? '+' : '') + q.toFixed(2) + '%' : '—', rets.length ? `${rets[0][0]} – ${rets[2][0]}` : ''],
  ].map(([l, v, sub]) => `<div class="stat"><div class="stat-label">${e(l)}</div><div class="stat-value">${e(v)}</div>${sub ? `<div class="stat-sub">${e(sub)}</div>` : ''}</div>`).join('');
  const retRows = rets.map(([m, v]) => `<tr><th scope="row">${e(m)}</th><td class="num ${v > 0 ? 'up' : v < 0 ? 'down' : ''}">${v == null ? '—' : (v > 0 ? '+' : '') + v.toFixed(2) + '%'}</td></tr>`).join('');
  const similar = (d.similar || []).map(([t, n, o]) => `<a href="${etfLink(t)}"><strong>${e(t)}</strong><span>${e(etfName(n))} · ${e(String(o))}% overlap</span></a>`).join('');
  const secUrl = `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${d.cik}&type=NPORT-P&dateb=&owner=include&count=40`;

  const body = `
<p class="crumbs"><a href="/etfs">ETFs</a></p>
<h1>${e(name)} (${e(d.ticker)}) holdings</h1>
<p class="lede">${lede}</p>
<div class="stat-row">${stats}</div>
<h2 id="holdings">Top holdings</h2>
<div id="etf-holdings" data-ticker="${e(d.ticker)}">${renderEtfHoldings(d)}</div>
<p class="login-hint" id="etf-more"><button type="button" class="link-btn" id="etf-all">Show top 50 holdings</button> — free with an account. <a href="/login">Sign in</a></p>
${retRows ? `<h2>Monthly returns</h2><div class="table-wrap"><table class="fin narrow-table"><thead><tr><th>Month</th><th class="num">Total return</th></tr></thead><tbody>${retRows}</tbody></table></div>` : ''}
${similar ? `<h2>ETFs with similar holdings</h2><p class="note">Overlap is the share of the fund invested in the same top holdings.</p><div class="cards-link small">${similar}</div>` : ''}
<section>
  <h2>About this data</h2>
  <p class="note">From the fund’s monthly portfolio report (Form N-PORT) filed with the SEC on ${e(dateText(d.filed))}, for holdings as of ${e(asOf)}. Funds publish these reports with a delay of up to about two months, so holdings may have changed since. Weights are shares of net assets. <a href="${e(secUrl)}" rel="nofollow noopener" target="_blank">View ${e(d.ticker)} filings on SEC EDGAR</a>. For information only — not investment advice.</p>
</section>`;
  return html(page({
    title: `${d.ticker} Holdings: Top 10 Holdings of ${name} | ${SITE_NAME}`,
    description: `${name} (${d.ticker}) top holdings${top ? `: ${top}` : ''}. Net assets of ${moneyWords(d.net_assets)} as of ${asOf}, from SEC filings.`,
    canonical: `${origin}${etfLink(d.ticker)}`, body,
    scripts: '<script src="/etf.js" defer></script>',
  }), { maxAge: 3600 });
}

function notFound() {
  return new Response(page({ title: `ETF not found | ${SITE_NAME}`, description: '', body: '<h1>ETF not found</h1><p><a href="/etfs">See all ETFs</a></p>' }), { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=300' } });
}
