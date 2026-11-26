import { rpc, escapeHtml as e } from './_lib.js';
import { page, html, SITE_NAME } from './_layout.js';

// GET /compare?s=DGS10,CPIAUCSL — overlay up to three indicators on one chart.
export async function onRequestGet(context) {
  const { env, request } = context;
  let list = [];
  try { list = await rpc(env, 'tt_catalog'); } catch (err) { list = []; }
  const url = new URL(request.url);
  const ids = (url.searchParams.get('s') || 'DGS10,CPIAUCSL').toUpperCase().split(',').filter((x) => /^[A-Z0-9]{2,20}$/.test(x)).slice(0, 3);

  const options = (selected) => {
    let cat = null;
    let out = '<option value="">— none —</option>';
    list.forEach((o) => {
      if (o.category !== cat) { if (cat) out += '</optgroup>'; cat = o.category; out += `<optgroup label="${e(cat)}">`; }
      out += `<option value="${e(o.series_id)}"${o.series_id === selected ? ' selected' : ''}>${e(o.name)}</option>`;
    });
    return out + (cat ? '</optgroup>' : '');
  };

  const body = `<h1>Compare indicators</h1>
<p class="note">Put up to three official indicators on one chart. "Actual" shows each on its own scale; "Change" shows the % change from the start of the range.</p>
<section class="chart-box" id="compare">
  <div class="controls">
    <label>Indicator 1<select data-slot="0">${options(ids[0])}</select></label>
    <label>Indicator 2<select data-slot="1">${options(ids[1])}</select></label>
    <label>Indicator 3<select data-slot="2">${options(ids[2])}</select></label>
    <label>View<select id="cmp-mode"><option value="actual">Actual</option><option value="change">Change from start</option></select></label>
  </div>
  <div class="range-buttons" role="group" aria-label="Chart range">
    <button data-range="1y" class="active">1Y</button><button data-range="5y">5Y</button><button data-range="10y">10Y</button><button data-range="max">Max</button>
  </div>
  <div class="legend" id="cmp-legend"></div>
  <div class="chart" aria-live="polite"><p class="note">Loading chart…</p></div>
  <p class="login-hint" hidden>Longer ranges (5Y, 10Y, Max) are free with an account. <a href="/login">Sign in</a></p>
</section>
<p class="note">Popular comparisons:
  <a href="/compare?s=DGS10,CPIAUCSL">10-year yield vs CPI</a> ·
  <a href="/compare?s=DFF,UNRATE">Fed funds vs unemployment</a> ·
  <a href="/compare?s=DCOILWTICO,GASREGW">Oil vs gasoline</a> ·
  <a href="/compare?s=M2SL,CPIAUCSL">Money supply vs inflation</a> ·
  <a href="/compare?s=DGS2,DGS10,DGS30">2y vs 10y vs 30y yields</a>
</p>`;

  return html(page({
    title: `Compare economic indicators | ${SITE_NAME}`,
    description: 'Chart Treasury yields, inflation, jobs, oil, money supply and more side by side using official US data.',
    canonical: `${url.origin}/compare`,
    body,
    scripts: '<script src="/compare.js" defer></script>',
  }), { maxAge: 1800 });
}
