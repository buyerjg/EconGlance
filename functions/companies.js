import { rpc, escapeHtml as e } from './_lib.js';
import { page, html, SITE_NAME } from './_layout.js';
import { RANKINGS, companyName, companyLink, money, pct, fyName } from './_fin.js';

// GET /companies — company search, the 50 largest by revenue, and links to all rankings.
export async function onRequestGet(context) {
  const { env, request } = context;
  let list = [];
  let funds = [];
  try {
    [list, funds] = await Promise.all([rpc(env, 'tt_companies', { p_sort: 'revenue', p_limit: 50 }), rpc(env, 'tt_companies', { p_sort: 'fund_assets', p_limit: 10 })]);
  } catch (err) { list = []; funds = []; }
  const fundRows = funds.map((c, i) => `<tr><td class="num muted">${i + 1}</td><td><a href="${companyLink(c.ticker)}">${e(companyName(c.name))}</a> <span class="muted">${e(c.ticker)}</span></td><td class="num">${e(money(c.latest_assets))}</td><td class="num muted">${e(c.latest_assets_date || '')}</td></tr>`).join('');
  const rows = list.map((c, i) => `<tr><td class="num muted">${i + 1}</td><td><a href="${companyLink(c.ticker)}">${e(companyName(c.name))}</a> <span class="muted">${e(c.ticker)}</span></td><td class="num">${e(money(c.revenue))}</td><td class="num ${+c.revenue_growth >= 0 ? 'up' : 'down'}">${e(pct(c.revenue_growth, { sign: true }))}</td><td class="num">${e(money(c.net_income))}</td><td class="num">${e(pct(c.net_margin))}</td><td class="num muted">${e(fyName(c.fy_end))}</td></tr>`).join('');
  const cards = Object.entries(RANKINGS).map(([k, r]) => `<a href="/rankings/${k.replace(/_/g, '-')}"><strong>${e(r.short)}</strong><span>${e(r.title)}</span></a>`).join('');

  const body = `<h1>Company financials</h1>
<p class="lede">Revenue, profit, cash flow and balance sheets for about 1,800 US-listed companies, plus gold, silver and crypto ETFs, straight from their SEC filings.</p>
<form class="search" role="search" action="/companies" onsubmit="return false">
  <label for="co-q" class="sr-only">Search by company name or ticker</label>
  <input id="co-q" type="search" placeholder="Search by name or ticker, e.g. Apple or NVDA" autocomplete="off" spellcheck="false">
  <ul id="co-results" class="search-results" hidden></ul>
</form>
<h2>Rankings</h2>
<div class="cards-link">${cards}</div>
<h2>Largest companies by revenue</h2>
<div class="table-wrap"><table><thead><tr><th>#</th><th>Company</th><th class="num">Revenue</th><th class="num">Growth</th><th class="num">Net income</th><th class="num">Margin</th><th class="num">Fiscal year</th></tr></thead><tbody>${rows}</tbody></table></div>
<p class="note"><a href="/rankings/revenue">See the top 100 by revenue</a>.</p>
${fundRows ? `<h2>Largest gold, silver &amp; crypto ETFs</h2><div class="table-wrap"><table><thead><tr><th>#</th><th>ETF</th><th class="num">Holdings</th><th class="num">As of</th></tr></thead><tbody>${fundRows}</tbody></table></div><p class="note"><a href="/rankings/fund-assets">See all gold &amp; crypto ETFs</a>.</p>` : ''}
<p class="note"> Figures as reported (GAAP) in each company’s latest annual report. Not investment advice.</p>`;

  return html(page({
    title: `Company financials: revenue, profit & rankings | ${SITE_NAME}`,
    description: 'Revenue, net income, cash flow and balance sheets for 1,800 US public companies from SEC filings, plus rankings of the largest and most profitable companies.',
    canonical: `${new URL(request.url).origin}/companies`,
    body,
    scripts: '<script src="/companies.js" defer></script>',
  }), { maxAge: 3600 });
}
