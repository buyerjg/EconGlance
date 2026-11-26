import { rpc, escapeHtml as e } from '../_lib.js';
import { page, html, SITE_NAME } from '../_layout.js';
import { RANKINGS, companyName, companyLink, money, pct, fyName } from '../_fin.js';

// GET /rankings/:metric — top 100 US-listed companies by a financial measure (latest fiscal year).
export async function onRequestGet(context) {
  const { env, params, request } = context;
  const key = String(params.metric || '').toLowerCase().replace(/-/g, '_');
  const r = RANKINGS[key];
  if (!r) return html(page({ title: `Not found | ${SITE_NAME}`, description: '', body: '<h1>Ranking not found</h1><p><a href="/companies">All rankings</a></p>' }), { maxAge: 300 });

  let list = [];
  try { list = await rpc(env, 'tt_companies', { p_sort: key, p_limit: 100 }); } catch (err) { list = []; }
  const showRev = key !== 'revenue';
  const rows = list.map((c, i) => `<tr><td class="num muted">${i + 1}</td><td><a href="${companyLink(c.ticker)}">${e(companyName(c.name))}</a> <span class="muted">${e(c.ticker)}</span></td><td class="num"><strong>${e(r.fmt(c))}</strong></td>${showRev ? `<td class="num">${e(money(c.revenue))}</td>` : `<td class="num ${+c.revenue_growth >= 0 ? 'up' : 'down'}">${e(pct(c.revenue_growth, { sign: true }))}</td>`}<td class="num muted">${e(fyName(c.fy_end))}</td></tr>`).join('');
  const others = Object.entries(RANKINGS).filter(([k]) => k !== key).map(([k, o]) => `<a href="/rankings/${k.replace(/_/g, '-')}">${e(o.short)}</a>`).join(' · ');
  const year = new Date().getUTCFullYear();
  const top3 = list.slice(0, 3).map((c) => companyName(c.name)).join(', ');

  const body = `<p class="crumbs"><a href="/companies">Companies</a> · Rankings</p>
<h1>${e(r.title)} (${year})</h1>
<p class="lede">${e(r.blurb)} Data from SEC filings, updated daily.${top3 ? ` The top three: ${e(top3)}.` : ''}</p>
<p class="note">Other rankings: ${others}</p>
<div class="table-wrap"><table><thead><tr><th>#</th><th>Company</th><th class="num">${e(r.col)}</th><th class="num">${showRev ? 'Revenue' : 'Growth'}</th><th class="num">Fiscal year</th></tr></thead><tbody>${rows || '<tr><td colspan="5" class="note">Data is temporarily unavailable.</td></tr>'}</tbody></table></div>
<p class="note">Covers about 1,800 US-listed companies with at least $1 billion in annual revenue or $200 million in net income. Figures are as reported (GAAP), not adjusted. Not investment advice.</p>`;

  return html(page({
    title: `${r.title} (${year}) | ${SITE_NAME}`,
    description: `${r.title}: top 100 ranked by ${r.short.toLowerCase()} in the latest fiscal year, from SEC filings.${top3 ? ` Led by ${top3}.` : ''}`,
    canonical: `${new URL(request.url).origin}/rankings/${key.replace(/_/g, '-')}`,
    body,
  }), { maxAge: 3600 });
}
