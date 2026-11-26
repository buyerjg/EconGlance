import { rpc, escapeHtml as e } from './_lib.js';
import { page, html, asOf, officialValue, dir, slug, SITE_NAME } from './_layout.js';

// GET /indicators — list of all tracked official indicators.
export async function onRequestGet(context) {
  const { env, request } = context;
  let list = [];
  try { list = await rpc(env, 'tt_catalog'); } catch (err) { list = []; }
  let cat = null;
  const rows = list.map((o) => {
    const head = o.category !== cat ? `<tr class="cat"><td colspan="4">${e((cat = o.category))}</td></tr>` : '';
    return `${head}<tr><td><a href="${slug(o.series_id)}">${e(o.name)}</a></td><td class="num">${e(officialValue(o.value, o.unit))}</td><td class="num ${dir(o.chg)}">${e(officialValue(o.chg, o.unit, true))}</td><td class="num muted">${e(asOf(o.as_of, o.frequency))}</td></tr>`;
  }).join('');
  const body = `<h1>Economic indicators</h1>
<p class="note">Official U.S. data from the Treasury, Federal Reserve, BLS, BEA, Census Bureau and EIA, via FRED.</p>
<div class="table-wrap"><table><thead><tr><th>Indicator</th><th>Latest</th><th>Change</th><th>As of</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  return html(page({
    title: `Economic indicators today | ${SITE_NAME}`,
    description: 'Latest US Treasury yields, inflation, jobs, growth, currencies and oil from official sources, with charts.',
    canonical: `${new URL(request.url).origin}/indicators`,
    body,
  }), { maxAge: 1800 });
}
