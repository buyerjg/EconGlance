import { rpc, escapeHtml as e, SERIES_ID } from '../_lib.js';
import { page, html, asOf, officialValue, dir, SITE_NAME } from '../_layout.js';

// GET /indicator/:id — one indicator with its latest value (server-rendered) and a chart.
export async function onRequestGet(context) {
  const { env, params, request } = context;
  const id = String(params.id || '').toUpperCase();
  if (!SERIES_ID.test(id)) return notFound();

  const start = new Date();
  start.setUTCDate(start.getUTCDate() - 7);
  let data;
  try {
    data = await rpc(env, 'tt_series', { p_id: id, p_start: start.toISOString().slice(0, 10) });
  } catch (err) {
    return html(page({ title: SITE_NAME, description: '', body: '<p class="note">This page is temporarily unavailable.</p>' }), { maxAge: 60 });
  }
  if (!data || !data.series) return notFound();

  const s = data.series;
  const l = data.latest || {};
  const origin = new URL(request.url).origin;
  const latestText = officialValue(l.value, s.unit);
  const when = asOf(l.as_of, s.frequency);

  const body = `
<p class="crumbs"><a href="/indicators">Indicators</a> · ${e(s.category)}</p>
<h1>${e(s.name)}</h1>
<div class="stat-row">
  <div class="stat"><div class="stat-label">Latest (${e(when)})</div><div class="stat-value">${e(latestText)}</div></div>
  <div class="stat"><div class="stat-label">Change</div><div class="stat-value ${dir(l.chg)}">${e(officialValue(l.chg, s.unit, true))}</div></div>
  <div class="stat"><div class="stat-label">A year earlier</div><div class="stat-value">${e(officialValue(l.year_ago, s.unit))}</div></div>
</div>

<section class="chart-box" id="chart" data-series="${e(s.series_id)}" data-unit="${e(s.unit)}" data-name="${e(s.name)}">
  <div class="range-buttons" role="group" aria-label="Chart range">
    <button data-range="1y" class="active">1Y</button>
    <button data-range="5y">5Y</button>
    <button data-range="10y">10Y</button>
    <button data-range="max">Max</button>
  </div>
  <div class="chart" aria-live="polite"><p class="note">Loading chart…</p></div>
  <p class="login-hint" hidden>Full history (5Y, 10Y, Max) is free with an account. <a href="/login">Sign in</a></p>
</section>

<section>
  <h2>About this indicator</h2>
  <p>${e(s.name)} is a ${e(s.frequency)} series${s.display === 'yoy' ? ', shown here as the percent change from a year earlier' : s.display === 'diff' ? ', shown here as the change from the previous month' : ''}. Unit: ${e(s.unit)}.</p>
  <p class="note">Source: ${e(s.agency)} (FRED series ${e(s.series_id)}). Updated automatically twice a day.</p>
</section>`;

  return html(page({
    title: `${s.name} today: ${latestText} (${when}) | ${SITE_NAME}`,
    description: `${s.name} was ${latestText} as of ${when}, versus ${officialValue(l.year_ago, s.unit)} a year earlier. Chart and history from official data.`,
    canonical: `${origin}/indicator/${s.series_id}`,
    body,
    scripts: '<script src="/chart.js" defer></script>',
  }), { maxAge: 1800 });
}

function notFound() {
  return html(page({ title: `Not found | ${SITE_NAME}`, description: '', body: '<h1>Indicator not found</h1><p><a href="/indicators">See all indicators</a></p>' }), { maxAge: 300 });
}
