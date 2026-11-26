import { rpc, escapeHtml as e } from '../_lib.js';
import { page, html, SITE_NAME } from '../_layout.js';
import { money, moneyWords, dateText, companyName, investorLink, quarterName, renderInvestorHoldings } from '../_fin.js';

const SLUG = /^[a-z0-9-]{2,60}$/;
// GET /investor/:slug — a famous investor's latest 13F portfolio and what changed.
export async function onRequestGet(context) {
  const { env, params, request } = context;
  const slug = String(params.slug || '').toLowerCase();
  if (!SLUG.test(slug)) return notFound();
  let d;
  try { d = await rpc(env, 'tt_investor', { p_slug: slug, p_full: false }); } catch (err) {
    return html(page({ title: SITE_NAME, description: '', body: '<p class="note">This page is temporarily unavailable.</p>' }), { maxAge: 60 });
  }
  if (!d) return notFound();
  const origin = new URL(request.url).origin;
  const q = quarterName(d.period), pq = quarterName(d.prev_period);
  const c = d.counts || {};
  const stocks = (d.holdings || []).filter((h) => !h.put_call);
  const top = stocks.slice(0, 3).map((h) => companyName(h.issuer)).join(', ');
  const top10 = stocks.slice(0, 10).reduce((a, h) => a + (+h.pct || 0), 0);
  const chg = d.prev_total ? ((d.total_value / d.prev_total - 1) * 100) : null;
  const who = d.person ? `${d.person}’s ` : '';
  const lede = `${e(d.name)} reported ${moneyWords(d.total_value)} in US-listed stock holdings at the end of ${e(q)}, across ${d.n_positions} positions, in a 13F filing on ${e(dateText(d.filed))}.` +
    (top ? ` The largest were ${e(top)}; the top 10 made up ${top10.toFixed(0)}% of the portfolio.` : '') +
    (d.prev_period ? ` Since ${e(pq)} it opened ${c.new || 0} new positions, added to ${c.added || 0}, cut ${c.reduced || 0} and sold out of ${c.sold || 0}.` : '');
  const stats = [
    ['Portfolio value', money(d.total_value), q],
    ['Positions', String(d.n_positions), ''],
    ['Change in value', chg != null ? `${chg > 0 ? '+' : ''}${chg.toFixed(1)}%` : '—', d.prev_period ? `vs. ${pq}` : ''],
    ['New / sold out', `${c.new || 0} / ${c.sold || 0}`, d.prev_period ? `since ${pq}` : ''],
  ].map(([l, v, s]) => `<div class="stat"><div class="stat-label">${e(l)}</div><div class="stat-value">${e(v)}</div>${s ? `<div class="stat-sub">${e(s)}</div>` : ''}</div>`).join('');
  const secUrl = `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${d.cik}&type=13F-HR&dateb=&owner=include&count=40`;
  const playbook = slug === 'duquesne-family-office' ? '<p class="note">See also: <a href="/playbooks/druckenmiller-checklist">the Druckenmiller macro checklist</a>.</p>'
    : slug === 'berkshire-hathaway' ? '<p class="note">See also: <a href="/playbooks/buffett-indicator">the Buffett Indicator today</a>.</p>'
    : slug === 'bridgewater-associates' ? '<p class="note">See also: <a href="/playbooks/dalio-debt-cycle">Ray Dalio’s debt-cycle dashboard</a>.</p>' : '';

  const body = `<p class="crumbs"><a href="/investors">Famous investors</a>${d.person ? ` · ${e(d.person)}` : ''}</p>
<h1>${e(who)}${e(d.name)} portfolio: ${e(q)} 13F holdings</h1>
<p class="lede">${lede}</p>
${playbook}
<div class="stat-row">${stats}</div>
<h2 id="holdings">Holdings</h2>
<div id="inv-holdings" data-slug="${e(slug)}">${renderInvestorHoldings(d)}</div>
<p class="login-hint" id="inv-more"><button type="button" class="link-btn" id="inv-all">Show all ${d.n_positions} positions</button> — free with an account. <a href="/login">Sign in</a></p>
<section><h2>About this data</h2><p class="note">From ${e(d.filer || d.name)}’s Form 13F filings with the SEC. 13F reports show US-listed stocks, ETFs and options held at the end of each quarter, filed up to 45 days later; they leave out short positions, cash, bonds and non-US holdings, so they are only part of the picture. Option rows show the value of the shares underlying the options and are not counted in the portfolio total. ${d.person ? `${e(d.person)} is not affiliated with and does not endorse EconGlance. ` : ''}<a href="${e(secUrl)}" rel="nofollow noopener" target="_blank">View the filings on SEC EDGAR</a>. Not investment advice.</p></section>`;
  return html(page({
    title: `${who}${d.name} Portfolio (${q}): Latest 13F Holdings | ${SITE_NAME}`,
    description: `${d.name}${d.person ? ` (${d.person})` : ''} held ${moneyWords(d.total_value)} in ${d.n_positions} US stocks at the end of ${q}${top ? `, led by ${top}` : ''}. New buys, sales and full holdings from SEC filings.`,
    canonical: `${origin}${investorLink(slug)}`, body,
    scripts: '<script src="/investor.js" defer></script>',
  }), { maxAge: 3600 });
}
function notFound() {
  return new Response(page({ title: `Investor not found | ${SITE_NAME}`, description: '', body: '<h1>Investor not found</h1><p><a href="/investors">See all investors</a></p>' }), { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=300' } });
}
