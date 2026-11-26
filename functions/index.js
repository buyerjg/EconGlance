import { rpc, escapeHtml as e } from './_lib.js';
import { page, html, num, signed, dir, asOf, officialValue, slug, sourceLink, SITE_NAME } from './_layout.js';

// GET / — today's brief, rendered on the server so search engines can read it.
export async function onRequestGet(context) {
  const { env, request } = context;
  let data;
  try {
    data = await rpc(env, 'tt_today');
  } catch (err) {
    return html(page({ title: SITE_NAME, description: 'Daily market brief', body: '<p class="note">Today\'s brief is temporarily unavailable. Please try again shortly.</p>' }), { maxAge: 60 });
  }
  const b = (data && data.brief) || {};
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

  const body = `
<section class="hero">
  <p class="eyebrow">Market session ${e(b.market_date || '')}</p>
  <h1>What happened in markets today</h1>
  <p class="lede">${e(b.summary || '')}</p>
</section>

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
    title: `${SITE_NAME} — Daily market brief`,
    description: (b.summary || 'Daily market brief: stocks, rates, oil, official economic data and what America searched.').slice(0, 300),
    canonical: `${origin}/`,
    body,
  }), { maxAge: 600 });
}
