import { rpc, escapeHtml as e } from './_lib.js';
import { page, html, SITE_NAME } from './_layout.js';
import { money, etfName, etfLink } from './_fin.js';

// GET /etfs — the largest US ETFs by net assets, with links to holdings pages.
export async function onRequestGet(context) {
  const { env, request } = context;
  let list = [];
  try { list = await rpc(env, 'tt_etfs', { p_limit: 300 }); } catch (err) { list = []; }
  const rows = list.map((x, i) => `<tr><td class="num muted">${i + 1}</td><td><a href="${etfLink(x.ticker)}"><strong>${e(x.ticker)}</strong></a> <span class="muted">${e(etfName(x.name))}</span></td><td class="num">${e(money(x.net_assets))}</td><td class="num">${x.n_holdings != null ? Number(x.n_holdings).toLocaleString('en-US') : '—'}</td><td class="num">${x.top10_pct != null ? (+x.top10_pct).toFixed(1) + '%' : '—'}</td><td class="num muted">${e(x.rep_date || '')}</td></tr>`).join('');
  const year = new Date().getUTCFullYear();
  const body = `<h1>Largest ETFs by assets (${year})</h1>
<p class="lede">The biggest US exchange-traded funds, with their top holdings, from the portfolio reports they file with the SEC.</p>
<form class="search" role="search" onsubmit="return false"><label for="co-q" class="sr-only">Search ETFs and companies</label><input id="co-q" type="search" placeholder="Search an ETF or company, e.g. SPY or Nvidia" autocomplete="off" spellcheck="false"><ul id="co-results" class="search-results" hidden></ul></form>
<p class="note">Looking for gold, silver or bitcoin funds? See <a href="/rankings/fund-assets">gold &amp; crypto ETFs</a>.</p>
<div class="table-wrap"><table><thead><tr><th>#</th><th>ETF</th><th class="num">Net assets</th><th class="num">Holdings</th><th class="num">Top 10 weight</th><th class="num">As of</th></tr></thead><tbody>${rows || '<tr><td colspan="6" class="note">Data is loading. Please check back shortly.</td></tr>'}</tbody></table></div>
<p class="note">Net assets and holdings as of each fund’s latest public Form N-PORT, which can lag by up to about two months. Not investment advice.</p>`;
  return html(page({
    title: `Largest ETFs by assets (${year}) and their top holdings | ${SITE_NAME}`,
    description: 'The largest US ETFs ranked by net assets, including SPY, VOO, IVV and QQQ, with top holdings from SEC filings.',
    canonical: `${new URL(request.url).origin}/etfs`,
    body,
    scripts: '<script src="/companies.js" defer></script>',
  }), { maxAge: 3600 });
}
