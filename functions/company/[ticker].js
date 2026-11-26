import { rpc, escapeHtml as e } from '../_lib.js';
import { page, html, SITE_NAME } from '../_layout.js';
import { TICKER, companyName, money, moneyWords, pct, eps, dateText, fyName, renderFinancials, renderFund, companyLink } from '../_fin.js';

// GET /company/:ticker — annual financials from SEC filings (latest 5 years; all years with a free account).
export async function onRequestGet(context) {
  const { env, params, request } = context;
  const raw = String(params.ticker || '');
  const ticker = raw.toUpperCase();
  if (!TICKER.test(ticker)) return notFound();
  if (raw !== ticker) return Response.redirect(new URL(companyLink(ticker), request.url).toString(), 301);

  let d;
  try {
    d = await rpc(env, 'tt_company', { p_ticker: ticker, p_full: false });
  } catch (err) {
    return html(page({ title: SITE_NAME, description: '', body: '<p class="note">This page is temporarily unavailable.</p>' }), { maxAge: 60 });
  }
  if (!d) return notFound();
  if (d.ticker !== ticker) return Response.redirect(new URL(companyLink(d.ticker), request.url).toString(), 301);

  const origin = new URL(request.url).origin;
  if (d.kind === 'fund') return fundPage(d, origin);
  const name = companyName(d.name);
  const s = d.summary || {};
  const fy = fyName(s.fy_end);
  const fin = renderFinancials(d);

  const lede = s.fy_end
    ? `${e(name)} reported revenue of ${moneyWords(s.revenue)} for fiscal year ${e(fy.slice(2))} (ended ${e(dateText(s.fy_end))})` +
      (s.revenue_growth != null ? `, ${+s.revenue_growth >= 0 ? 'up' : 'down'} ${Math.abs(+s.revenue_growth).toFixed(1)}% from a year earlier` : '') +
      `. Net income was ${moneyWords(s.net_income)}` + (s.net_margin != null ? `, a net margin of ${(+s.net_margin).toFixed(1)}%` : '') +
      (s.eps_diluted != null ? `, or ${eps(s.eps_diluted)} per diluted share` : '') + '.' +
      (s.revenue_rank ? ` That makes it No. ${s.revenue_rank} by revenue among the US-listed companies we track.` : '')
    : `${e(name)} financial statements from SEC filings.`;

  const stats = [
    ['Revenue', money(s.revenue), s.revenue_growth != null ? `${pct(s.revenue_growth, { sign: true })} vs. prior year` : '', s.revenue_growth != null ? (+s.revenue_growth >= 0 ? 'up' : 'down') : ''],
    ['Net income', money(s.net_income), s.net_margin != null ? `${pct(s.net_margin)} margin` : '', ''],
    ['Diluted EPS', eps(s.eps_diluted), '', ''],
    ['Free cash flow', money(s.fcf), '', ''],
  ].map(([l, val, sub, cls]) => `<div class="stat"><div class="stat-label">${e(l)} (${e(fy)})</div><div class="stat-value">${e(val)}</div>${sub ? `<div class="stat-sub ${cls}">${e(sub)}</div>` : ''}</div>`).join('');

  const tickers = (d.tickers || []).length > 1 ? ` · Also trades as ${(d.tickers || []).filter((t) => t !== d.ticker).map(e).join(', ')}` : '';
  const peers = (d.peers || []).map(([t, n]) => `<a href="${companyLink(t)}"><strong>${e(t)}</strong><span>${e(companyName(n))}</span></a>`).join('');
  const more = (d.years_available || 0) > (d.annual || []).length;
  const secUrl = `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${d.cik}&type=10-K&dateb=&owner=include&count=40`;

  const body = `
<p class="crumbs"><a href="/companies">Companies</a> · ${e(d.exchange || '')} ${tickers}</p>
<h1>${e(name)} (${e(d.ticker)}) financials</h1>
<p class="lede">${lede}</p>
<div class="stat-row">${stats}</div>

<section class="chart-box" id="fin-chart" data-chart='${e(JSON.stringify(fin.chart))}' aria-label="Revenue and net income by fiscal year">
  <div class="legend"><span><i style="background:#2f6fdc"></i>Revenue</span><span><i style="background:#2aa876"></i>Net income</span></div>
  <div class="chart"></div>
</section>
${more ? `<p class="login-hint" id="fin-more"><button type="button" class="link-btn" id="fin-all">Show all ${d.years_available} years</button> — free with an account. <a href="/login">Sign in</a></p>` : ''}

<div id="fin-tables" data-ticker="${e(d.ticker)}">${fin.html}</div>

${peers ? `<h2>Companies of similar size</h2><div class="cards-link small">${peers}</div>` : ''}

<section>
  <h2>About this data</h2>
  <p class="note">Figures are as reported by ${e(name)} in its filings with the U.S. Securities and Exchange Commission (XBRL financial data), not adjusted or “non-GAAP” numbers. Fiscal years are named by the calendar year in which they end. Banks’ revenue is net interest income plus noninterest income when the company does not report a total. <a href="${e(secUrl)}" rel="nofollow noopener" target="_blank">View ${e(d.ticker)} filings on SEC EDGAR</a>. For information only — not investment advice.</p>
</section>`;

  const title = `${name} (${d.ticker}) Revenue, Net Income & Financials ${fy ? fy.slice(2) : ''} | ${SITE_NAME}`.replace('  ', ' ');
  const description = s.fy_end
    ? `${name} revenue was ${moneyWords(s.revenue)} and net income ${moneyWords(s.net_income)} in fiscal ${fy.slice(2)}. Income statement, cash flow and balance sheet from SEC filings.`
    : `${name} (${d.ticker}) income statement, cash flow and balance sheet from SEC filings.`;

  return html(page({
    title, description, canonical: `${origin}${companyLink(d.ticker)}`, body,
    scripts: '<script src="/company.js" defer></script>',
  }), { maxAge: 3600 });
}

function fundPage(d, origin) {
  const name = companyName(d.name);
  const s = d.summary || {};
  const fin = renderFund(d);
  const h0 = ((d.holdings || [])[0] || {}).vals || {};
  const asOf = dateText(s.latest_assets_date);
  const lede = `${e(name)} is an exchange-traded trust. It held ${moneyWords(s.latest_assets)} of assets as of ${e(asOf)}` +
    (h0.crypto_units != null ? `, or ${Math.round(h0.crypto_units).toLocaleString('en-US')} coins` : '') +
    (h0.nav_per_share != null ? `, with a net asset value of $${(+h0.nav_per_share).toFixed(2)} per share` : '') + '.' +
    (s.net_income != null ? ` In ${e(String(s.fy_end || '').slice(0, 4))} it reported a net ${+s.net_income >= 0 ? 'gain' : 'loss'} of ${moneyWords(Math.abs(+s.net_income))}.` : '');
  const stats = [
    ['Value of holdings', money(s.latest_assets), asOf],
    ['NAV per share', h0.nav_per_share != null ? '$' + (+h0.nav_per_share).toFixed(2) : '—', asOf],
    ...(h0.crypto_units != null ? [['Coins held', Math.round(h0.crypto_units).toLocaleString('en-US'), asOf]] : []),
    ['Net gain (loss)', money(s.net_income), s.fy_end ? String(s.fy_end).slice(0, 4) : ''],
  ].map(([l, v, sub]) => `<div class="stat"><div class="stat-label">${e(l)}</div><div class="stat-value">${e(v)}</div>${sub ? `<div class="stat-sub">${e(sub)}</div>` : ''}</div>`).join('');
  const peers = (d.peers || []).map(([t, n]) => `<a href="${companyLink(t)}"><strong>${e(t)}</strong><span>${e(companyName(n))}</span></a>`).join('');
  const secUrl = `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${d.cik}&type=10-&dateb=&owner=include&count=40`;
  const body = `
<p class="crumbs"><a href="/companies">Companies</a> · <a href="/rankings/fund-assets">Gold &amp; crypto ETFs</a> · ${e(d.exchange || '')}</p>
<h1>${e(name)} (${e(d.ticker)}): holdings &amp; NAV</h1>
<p class="lede">${lede}</p>
<div class="stat-row">${stats}</div>
<section class="chart-box" id="fin-chart" data-chart='${e(JSON.stringify(fin.chart))}' aria-label="Value of holdings over time">
  <div class="legend"><span><i style="background:#2f6fdc"></i>Value of holdings</span></div>
  <div class="chart"></div>
</section>
<p class="login-hint" id="fin-more"><button type="button" class="link-btn" id="fin-all">Show full history</button> — free with an account. <a href="/login">Sign in</a></p>
<div id="fin-tables" data-ticker="${e(d.ticker)}">${fin.html}</div>
${peers ? `<h2>Similar-size ETFs</h2><div class="cards-link small">${peers}</div>` : ''}
<section>
  <h2>About this data</h2>
  <p class="note">From the trust’s quarterly and annual reports filed with the SEC. Values are at each quarter-end, not live prices. <a href="${e(secUrl)}" rel="nofollow noopener" target="_blank">View ${e(d.ticker)} filings on SEC EDGAR</a>. For information only — not investment advice.</p>
</section>`;
  return html(page({
    title: `${name} (${d.ticker}) Holdings, NAV & Assets | ${SITE_NAME}`,
    description: `${name} held ${moneyWords(s.latest_assets)} as of ${asOf}. Holdings, NAV per share and yearly gains from SEC filings.`,
    canonical: `${origin}${companyLink(d.ticker)}`, body,
    scripts: '<script src="/company.js" defer></script>',
  }), { maxAge: 3600 });
}

function notFound() {
  return new Response(page({ title: `Company not found | ${SITE_NAME}`, description: '', body: '<h1>Company not found</h1><p>We cover about 1,800 US-listed companies with at least $1 billion in revenue. <a href="/companies">Search companies</a></p>' }), { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=300' } });
}
