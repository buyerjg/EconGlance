import { rpc, escapeHtml as e } from './_lib.js';
import { page, html, SITE_NAME } from './_layout.js';
import { money, companyName, companyLink, investorLink, quarterName } from './_fin.js';

// GET /investors — famous investors' latest 13F portfolios.
export async function onRequestGet(context) {
  const { env, request } = context;
  let list = [];
  try { list = await rpc(env, 'tt_investors'); } catch (err) { list = []; }
  const rows = list.map((m) => {
    const t = m.top || {};
    const top = t.issuer ? `${t.ticker ? `<a href="${companyLink(t.ticker)}">${e(companyName(t.issuer))}</a>` : e(companyName(t.issuer))} <span class="muted">${t.pct != null ? (+t.pct).toFixed(0) + '%' : ''}</span>` : '—';
    return `<tr><td><a href="${investorLink(m.slug)}"><strong>${e(m.person || m.display_name)}</strong></a><div class="muted small">${e(m.display_name)}</div></td><td class="num">${e(money(m.total_value))}</td><td class="num">${m.n_positions ?? '—'}</td><td>${top}</td><td class="num muted">${e(quarterName(m.period))}</td></tr>`;
  }).join('');
  const body = `<h1>What famous investors own</h1>
<p class="lede">The latest stock portfolios of Warren Buffett, Stanley Druckenmiller, Bill Ackman, Michael Burry and other well-known investors, from the 13F reports their firms file with the SEC every quarter.</p>
<div class="table-wrap"><table><thead><tr><th>Investor</th><th class="num">Portfolio</th><th class="num">Positions</th><th>Largest holding</th><th class="num">Quarter</th></tr></thead><tbody>${rows || '<tr><td colspan="5" class="note">Data is loading. Please check back shortly.</td></tr>'}</tbody></table></div>
<p class="note">13F reports cover US-listed stocks, ETFs and options at quarter-end and are filed up to 45 days later. They leave out short positions, cash, bonds and non-US holdings. The people named are not affiliated with and do not endorse The Trend Brief. Not investment advice.</p>`;
  return html(page({
    title: `Famous investors’ portfolios: Buffett, Druckenmiller, Ackman, Burry 13F holdings | ${SITE_NAME}`,
    description: 'Latest 13F stock holdings of Warren Buffett, Stanley Druckenmiller, Bill Ackman, Michael Burry and more, with new buys and sales each quarter.',
    canonical: `${new URL(request.url).origin}/investors`, body,
  }), { maxAge: 3600 });
}
