import { rpc, escapeHtml as e } from './_lib.js';
import { page, html, num, signed, dir, asOf, officialValue, slug, sourceLink, SITE_NAME } from './_layout.js';
import { money, companyName, quarterName } from './_fin.js';
import { buffettSeries, quarterLabel } from './_playbooks.js';

// GET / — today's brief, rendered on the server so search engines can read it.
export async function onRequestGet(context) {
  const { env, request } = context;
  let data;
  const since = new Date(Date.now() - 3 * 365 * 864e5).toISOString().slice(0, 10);
  const [obs, cos, etfs, invs] = await Promise.all([
    rpc(env, 'tt_obs', { p_ids: ['NCBEILQ027S', 'GDP'], p_start: since, p_monthly: false }).catch(() => ({})),
    rpc(env, 'tt_companies', { p_sort: 'revenue', p_limit: 1 }).catch(() => []),
    rpc(env, 'tt_etfs', { p_limit: 1 }).catch(() => []),
    rpc(env, 'tt_investors').catch(() => []),
  ]);
  try {
    data = await rpc(env, 'tt_today');
  } catch (err) {
    return html(page({ title: SITE_NAME, description: 'Daily market brief', canonical: `${new URL(request.url).origin}/`, body: '<h1>Today’s brief is updating</h1><p class="note">Try again in a few minutes, or explore <a href="/indicators">economic indicators</a>, <a href="/companies">companies</a> and <a href="/investors">investor portfolios</a>.</p>' }), { maxAge: 60 });
  }
  const b = (data && data.brief) || {};
  const mood = data && data.mood && data.mood.score !== undefined ? data.mood : null;
  const releases = (data && data.releases) || [];
  const origin = new URL(request.url).origin;

  const marketGroups = [];
  (b.markets || []).sort((x, y) => (x.ord || 0) - (y.ord || 0)).forEach((m) => {
    let g = marketGroups.find((x) => x.name === m.grp);
    if (!g) marketGroups.push((g = { name: m.grp, rows: [] }));
    g.rows.push(m);
  });

  const card = (m) => {
    const d = dir(m.chg_pct ?? m.chg);
    const value = `${m.unit === '$' ? '$' : ''}${num(m.value, m.name === 'Bitcoin' ? 0 : 2)}${m.unit === '%' ? '%' : ''}`;
    const parts = [];
    if (m.chg !== null && m.chg !== undefined) parts.push(`${signed(m.chg, 2)}${m.unit === '%' ? ' pts' : ''}`);
    if (m.chg_pct !== null && m.chg_pct !== undefined) parts.push(parts.length ? `(${signed(m.chg_pct, 2)}%)` : `${signed(m.chg_pct, 2)}%`);
    return `<div class="card"><div class="card-name">${e(m.name)}</div><div class="card-value">${e(value)}</div><div class="card-chg ${d}">${d === 'up' ? '▲' : d === 'down' ? '▼' : ''} ${e(parts.join(' '))}</div><div class="card-src">${sourceLink(m.url, m.source)}</div></div>`;
  };

  const official = data.official || [];
  let lastCat = null;
  const officialRows = official.map((o) => {
    const head = o.category !== lastCat ? `<tr class="cat"><td colspan="5">${e((lastCat = o.category))}</td></tr>` : '';
    return `${head}<tr><td><a href="${slug(o.series_id)}">${e(o.name)}</a>${o.unit.startsWith('thousands') ? ` <span class="muted">(${e(o.unit)})</span>` : ''}</td><td class="num">${e(officialValue(o.value, o.unit))}</td><td class="num ${dir(o.chg)}">${e(officialValue(o.chg, o.unit, true))}</td><td class="num">${e(officialValue(o.year_ago, o.unit))}</td><td class="num muted">${e(asOf(o.as_of, o.frequency))}</td></tr>`;
  }).join('');

  // Four doors into the rest of the site, each showing a live figure.
  const tiles = [];
  const bi = buffettSeries(obs || {}).pop();
  if (bi) tiles.push(['/playbooks/buffett-indicator', 'Buffett Indicator', `${bi[1].toFixed(0)}%`, `Stock market value vs GDP, ${quarterLabel(bi[0])}`]);
  const top = (cos || [])[0];
  if (top) tiles.push(['/companies', 'Largest US company by revenue', top.ticker, `${companyName(top.name)}, ${money(top.revenue)}`]);
  const etf = (etfs || [])[0];
  if (etf) tiles.push(['/etfs', 'Largest ETF', etf.ticker, `${money(etf.net_assets)} in ${etf.n_holdings ?? '—'} holdings`]);
  const brk = (invs || []).find((m) => m.slug === 'berkshire-hathaway') || (invs || [])[0];
  if (brk && brk.top) tiles.push(['/investor/' + encodeURIComponent(brk.slug), `${brk.person || brk.display_name}’s largest holding`, brk.top.ticker || companyName(brk.top.issuer), `${brk.top.pct != null ? (+brk.top.pct).toFixed(0) + '% of the portfolio' : ''}, ${quarterName(brk.period)}`]);
  const explore = tiles.length ? `<nav class="explore" aria-label="Explore">${tiles.map(([u, k, v, t]) => `<a href="${u}"><div class="x-k">${e(k)}</div><div class="x-v">${e(v)}</div><div class="x-t">${e(t)}</div></a>`).join('')}</nav>` : '';

  const body = `
<section class="hero">
  ${b.market_date ? `<p class="eyebrow">Market close, ${e(new Date(b.market_date + 'T12:00:00Z').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }))}</p>` : ''}
  <h1>What happened in markets today</h1>
  <p class="lede">${e(b.summary || '')}</p>
</section>
${explore}

<div class="top-row">
  ${mood ? `<section class="panel" id="mood">
    <h2>Market stress gauge</h2>
    <div><span class="mood-score">${e(mood.score)}</span><span class="mood-label">${e(mood.label)}</span></div>
    <div class="gauge" role="img" aria-label="Gauge at ${e(mood.score)} of 100"><div class="gauge-marker" style="left:${Math.min(Math.max(+mood.score || 0, 0), 100)}%"></div></div>
    <div class="gauge-scale"><span>High stress</span><span>Neutral</span><span>Very calm</span></div>
    <p class="note">Week ago ${e(mood.week_ago ?? '—')} · Month ago ${e(mood.month_ago ?? '—')} · Year ago ${e(mood.year_ago ?? '—')}. Based on the St. Louis Fed Financial Stress Index (week of ${e(asOf(mood.as_of, 'daily'))}), ranked against readings since 2016.</p>
  </section>` : ''}
  <section class="panel" id="releases">
    <h2>Latest releases</h2>
    ${releases.length ? `<ul class="mini">${releases.slice(0, 8).map((r) => `<li><span><a href="${slug(r.series_id)}">${e(r.name)}</a> <span class="muted">${e(asOf(r.period, r.frequency))}</span></span><span class="${dir(r.chg)}">${e(officialValue(r.value, r.unit))}</span></li>`).join('')}</ul>` : '<p class="note">No new official releases in the last two weeks.</p>'}
    <p class="note"><a href="/indicators">All indicators</a> · <a href="/compare">Compare</a> · <a href="/calculators">Calculators</a></p>
  </section>
</div>

<section id="markets">
  <h2>Markets at the close</h2>
  ${marketGroups.map((g) => `<h3>${e(g.name)}</h3><div class="grid">${g.rows.map(card).join('')}</div>`).join('')}
</section>

<section id="headlines">
  <h2>What moved markets</h2>
  <ul class="list">${(b.headlines || []).map((h) => `<li>${e(h.text)} <span class="src">${sourceLink(h.url, h.source)}</span></li>`).join('')}</ul>
</section>

${(b.econ || []).length ? `<section id="econ">
  <h2>Economic data released</h2>
  <div class="table-wrap"><table><thead><tr><th>Indicator</th><th>Actual</th><th>Forecast</th><th>Prior</th><th>Source</th></tr></thead>
  <tbody>${b.econ.map((r) => `<tr><td>${e(r.name)}</td><td class="num">${e(r.actual)}</td><td class="num">${e(r.forecast)}</td><td class="num">${e(r.prior)}</td><td>${sourceLink(r.url, r.source)}</td></tr>`).join('')}</tbody></table></div>
</section>` : ''}

<section id="official">
  <h2>Official economic data</h2>
  <p class="note">Latest readings from U.S. government sources via FRED. Click any indicator for its chart.</p>
  <div class="table-wrap"><table><thead><tr><th>Indicator</th><th>Latest</th><th>Change</th><th>Year ago</th><th>As of</th></tr></thead><tbody>${officialRows}</tbody></table></div>
</section>

<section id="trends">
  <h2>What America searched</h2>
  <p class="note">Top Google Trends searches in the US${b.trend_time ? `, captured ${e(b.trend_time)}` : ''}.</p>
  <ol class="trends">${(b.trends || []).map((t) => `<li><span class="rk">${e(t.rank)}</span><span class="kw">${e(t.keyword)}${t.context ? `<small>${e(t.context)}</small>` : ''}</span>${t.traffic ? `<span class="tr">${e(t.traffic)} searches</span>` : ''}</li>`).join('')}</ol>
</section>

<section id="history">
  <h2>This day in markets</h2>
  <p class="note">The same date 1–10 years ago, or the prior trading day.</p>
  <div class="table-wrap"><table><thead><tr><th>Years ago</th><th>Date</th><th>S&amp;P 500</th><th>Nasdaq</th><th>Dow</th><th>What happened</th></tr></thead>
  <tbody>${(b.history || []).map((h) => `<tr><td>${e(h.years_ago)}</td><td class="num">${e(h.date)}</td><td class="num">${num(h.sp500)}</td><td class="num">${num(h.nasdaq)}</td><td class="num">${num(h.dow)}</td><td>${e(h.event)} <span class="src">${sourceLink(h.url, h.source)}</span></td></tr>`).join('')}</tbody></table></div>
</section>`;

  return html(page({
    title: `${SITE_NAME}: today’s markets, economic data and company financials`,
    description: (b.summary || 'Daily market brief: stocks, rates, oil, official economic data and what America searched.').slice(0, 300),
    canonical: `${origin}/`,
    body,
  }), { maxAge: 600 });
}
