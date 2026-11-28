import { rpc, escapeHtml as e } from '../_lib.js';
import { page, html, SITE_NAME } from '../_layout.js';
import { PLAYBOOKS, makeData, buffettSeries, addMonths, isoDate, monthLabel, quarterLabel } from '../_playbooks.js';

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TONE = { on: 'up', off: 'down', neutral: 'flat' };

// GET /playbooks/:name — one investor playbook computed from official data (?vs=YYYY-MM-DD to compare).
export async function onRequestGet(context) {
  const { env, params, request } = context;
  const name = String(params.name || '');
  const url = new URL(request.url);
  if (name === 'buffett-indicator') return buffett(env, url);
  const pb = PLAYBOOKS[name];
  if (!pb) return html(page({ title: `Not found | ${SITE_NAME}`, description: '', body: '<h1>Playbook not found</h1><p><a href="/playbooks">All playbooks</a></p>' }), { maxAge: 300 });

  const today = isoDate(Date.now());
  const vsParam = url.searchParams.get('vs');
  const vs = vsParam && DATE.test(vsParam) && vsParam < today && vsParam >= '1991-01-01' ? vsParam : (pb.defaultVs || addMonths(today, -12));
  let obs = {};
  try { obs = await rpc(env, 'tt_obs', { p_ids: pb.series, p_start: addMonths(vs, -15), p_monthly: true }); } catch (err) { obs = {}; }
  const D = makeData(obs);

  let on = 0, off = 0, n = 0;
  const rows = pb.items.map((it) => {
    let now = null, then = null;
    try { now = it.calc(D, today); then = it.calc(D, vs); } catch (err) { /* missing data */ }
    if (now) { n++; if (now.tone === 'on') on++; if (now.tone === 'off') off++; }
    const cell = (r) => r ? `<td><span class="pill ${TONE[r.tone] || 'flat'}">${e(r.label)}</span><div class="num-big">${e(r.value)}</div><div class="muted small">${e(r.text || '')}</div></td>` : '<td class="muted">—</td>';
    const changed = now && then && now.label !== then.label ? ' class="changed"' : '';
    return `<tr${changed}><th scope="row">${e(it.label)}<div class="muted small">${e(it.why)}</div></th>${cell(then)}${cell(now)}</tr>`;
  }).join('');
  const flips = pb.items.filter((it) => { try { const a = it.calc(D, today), b = it.calc(D, vs); return a && b && a.label !== b.label; } catch (err) { return false; } }).length;

  const vsLabel = vs === pb.defaultVs ? `${monthLabel(vs)}` : monthLabel(vs);
  const quick = [[pb.defaultVs, monthLabel(pb.defaultVs || '')], [addMonths(today, -3), '3 months ago'], [addMonths(today, -12), '1 year ago'], [addMonths(today, -60), '5 years ago']]
    .filter(([d]) => d).map(([d, l]) => `<a href="?vs=${d}"${d === vs ? ' class="active"' : ''}>${e(l)}</a>`).join('');

  const summary = name === 'druckenmiller-checklist'
    ? `Today ${on} of ${n} signals point to easy conditions for growth and risk-taking and ${off} point the other way. ${flips} of ${pb.items.length} have changed since ${vsLabel}.`
    : `${off} of ${n} measures are flashing warning signs today. ${flips} of ${pb.items.length} have changed category since ${vsLabel}.`;

  const body = `<p class="crumbs"><a href="/playbooks">Investor playbooks</a> · ${e(pb.investor)}</p>
<h1>${e(pb.title)}</h1>
${pb.intro.map((p) => `<p class="lede">${e(p)}</p>`).join('')}
${pb.portfolio ? `<p class="note">What the fund owns now: <a href="/investor/${pb.portfolio}">latest 13F portfolio</a>.</p>` : ''}
${pb.source ? `<p class="note">Source: <a href="${e(pb.source.url)}" rel="noopener" target="_blank">${e(pb.source.label)}</a></p>` : ''}
<div class="panel"><strong>${e(summary)}</strong></div>
<form class="controls" method="get"><label>Compare with <input type="date" name="vs" value="${e(vs)}" min="1991-01-01" max="${e(today)}"></label><button type="submit" class="btn">Compare</button></form>
<p class="quick-links">Quick compare: ${quick}</p>
<div class="table-wrap"><table class="playbook"><thead><tr><th>Signal</th><th>${e(vsLabel)}</th><th>Today</th></tr></thead><tbody>${rows}</tbody></table></div>
<p class="note">Rows highlighted have changed since ${e(vsLabel)}. Each reading uses the latest data for that period available in our database; past readings use revised data, so they can differ slightly from what was known at the time.</p>
${pb.notTracked && pb.notTracked.length ? `<h2>Not tracked here</h2><ul class="list">${pb.notTracked.map((x) => `<li>${e(x)}</li>`).join('')}</ul>` : ''}
<section><h2>About this page</h2><p class="note">This page summarizes publicly stated views of ${e(pb.investor)} and measures them with official data from the Federal Reserve, BEA, BLS and the Treasury. The labels (such as “Loose” or “Tightening”) are our own simple rules, not ${e(pb.investor)}’s. ${e(pb.investor)} is not affiliated with and does not endorse EconGlance. Not investment advice.</p></section>`;

  return html(page({
    title: `${pb.seoTitle} | ${SITE_NAME}`,
    description: pb.blurb,
    canonical: `${url.origin}/playbooks/${name}`,
    body,
  }), { maxAge: 3600 });
}

async function buffett(env, url) {
  let obs = {};
  try { obs = await rpc(env, 'tt_obs', { p_ids: ['NCBEILQ027S', 'GDP'], p_start: '1950-01-01', p_monthly: false }); } catch (err) { obs = {}; }
  const s = buffettSeries(obs);
  const last = s[s.length - 1];
  const body0 = '<h1>The Buffett Indicator</h1><p class="note">Data is temporarily unavailable.</p>';
  if (!last) return html(page({ title: `Buffett Indicator | ${SITE_NAME}`, description: '', body: body0 }), { maxAge: 60 });
  const vals = s.map(([, v]) => v);
  const pctile = Math.round((vals.filter((v) => v < last[1]).length / vals.length) * 100);
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  const ago = s.find(([d]) => d === addMonths(last[0], -12));
  const peak = s.reduce((a, b) => (b[1] > a[1] ? b : a));
  const at = (d) => { const x = s.find(([dd]) => dd === d); return x ? x[1] : null; };
  const zone = pctile >= 90 ? 'far above its historical range' : pctile >= 70 ? 'above its historical average' : pctile >= 30 ? 'near its historical average' : 'below its historical average';
  const marks = [['2000-01-01', 'Dot-com peak (Q1 2000)'], ['2009-01-01', 'Financial-crisis low (Q1 2009)'], ['2021-10-01', 'Q4 2021']].map(([d, l]) => [l, at(d)]).filter(([, v]) => v != null);
  const chart = s.filter(([d]) => d >= '1970-01-01').map(([d, v]) => [d.slice(0, 7), +v.toFixed(1)]);

  const body = `<p class="crumbs"><a href="/playbooks">Investor playbooks</a> · Warren Buffett</p>
<h1>The Buffett Indicator today: ${last[1].toFixed(0)}%</h1>
<p class="lede">The total market value of US companies’ stock was ${last[1].toFixed(0)}% of US GDP in ${e(quarterLabel(last[0]))}, the latest quarter reported by the Federal Reserve. That is ${zone} — higher than in ${pctile}% of quarters since 1950 — and compares with a long-run average of ${avg.toFixed(0)}%.</p>
<div class="stat-row">
  <div class="stat"><div class="stat-label">Market value / GDP</div><div class="stat-value">${last[1].toFixed(0)}%</div><div class="stat-sub">${e(quarterLabel(last[0]))}</div></div>
  <div class="stat"><div class="stat-label">A year earlier</div><div class="stat-value">${ago ? ago[1].toFixed(0) + '%' : '—'}</div></div>
  <div class="stat"><div class="stat-label">Historical rank</div><div class="stat-value">${pctile}th</div><div class="stat-sub">percentile since 1950</div></div>
  <div class="stat"><div class="stat-label">Record high</div><div class="stat-value">${peak[1].toFixed(0)}%</div><div class="stat-sub">${e(quarterLabel(peak[0]))}</div></div>
</div>
<section class="chart-box pb-chart" data-points='${e(JSON.stringify(chart))}' data-unit="%" aria-label="Buffett Indicator since 1970"><div class="legend"><span><i style="background:var(--accent)"></i>Stock market value as % of GDP</span><span><i style="background:var(--muted)"></i>Long-run average</span></div><div class="chart" data-avg="${avg.toFixed(1)}"></div></section>
${marks.length ? `<h2>Past turning points</h2><ul class="mini">${marks.map(([l, v]) => `<li><span>${e(l)}</span><span>${v.toFixed(0)}%</span></li>`).join('')}</ul>` : ''}
<h2>What it measures</h2>
<p>In a 2001 interview with Fortune, Warren Buffett said the ratio of the stock market’s total value to the size of the economy was probably the best single measure of where valuations stand. The idea is simple: over long periods, company values cannot grow much faster than the economy that produces their profits. A high reading means investors are paying a lot for each dollar of economic output.</p>
<p>It has limits. US companies now earn much of their profit abroad, interest rates change what investors will pay, and the ratio can stay high for years. It works better as a gauge of long-term expected returns than as a timing signal.</p>
<h2>How we calculate it</h2>
<p class="note">Market value of US nonfinancial corporate equities (Federal Reserve Financial Accounts, Z.1, series NCBEILQ027S) divided by nominal GDP (BEA), both quarterly. Other sites use a total stock market index instead, which gives somewhat different levels; the trend is similar. Updated when the Fed publishes new quarterly data, about 10 weeks after each quarter. Warren Buffett is not affiliated with and does not endorse EconGlance. Not investment advice.</p>`;
  return html(page({
    title: `Buffett Indicator today: ${last[1].toFixed(0)}% (${quarterLabel(last[0])}) | ${SITE_NAME}`,
    description: `The Buffett Indicator (stock market value to GDP) is ${last[1].toFixed(0)}% as of ${quarterLabel(last[0])}, higher than ${pctile}% of quarters since 1950. Chart and history from Federal Reserve data.`,
    canonical: `${url.origin}/playbooks/buffett-indicator`,
    body,
    scripts: '<script src="/playbook.js" defer></script>',
  }), { maxAge: 3600 });
}
