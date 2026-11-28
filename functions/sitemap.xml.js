import { rpc } from './_lib.js';
import { CALCS } from './_calcs.js';
import { RANKINGS } from './_fin.js';

export async function onRequestGet(context) {
  const { env, request } = context;
  const origin = new URL(request.url).origin;
  let list = [];
  try { list = await rpc(env, 'tt_catalog'); } catch (err) { list = []; }
  let cos = [], etfs = [];
  try { cos = await rpc(env, 'tt_company_index'); } catch (err) { cos = []; }
  try { etfs = await rpc(env, 'tt_etf_index'); } catch (err) { etfs = []; }
  let invs = [];
  try { invs = await rpc(env, 'tt_investors'); } catch (err) { invs = []; }
  const today = new Date().toISOString().slice(0, 10);
  const urls = [`${origin}/`, `${origin}/indicators`, `${origin}/compare`, `${origin}/calculators`, `${origin}/playbooks`, `${origin}/playbooks/buffett-indicator`, `${origin}/playbooks/druckenmiller-checklist`, `${origin}/playbooks/dalio-debt-cycle`, ...Object.keys(CALCS).map((c) => `${origin}/calculators/${c}`), ...list.map((o) => `${origin}/indicator/${o.series_id}`), `${origin}/companies`, ...Object.keys(RANKINGS).map((k) => `${origin}/rankings/${k.replace(/_/g, '-')}`), ...cos.map(([t]) => `${origin}/company/${encodeURIComponent(t)}`), `${origin}/etfs`, ...etfs.map((t) => `${origin}/etf/${encodeURIComponent(t)}`), `${origin}/investors`, ...invs.map((m) => `${origin}/investor/${m.slug}`), `${origin}/about`, `${origin}/privacy`, `${origin}/terms`, `${origin}/contact`];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${u}</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq></url>`).join('\n')}\n</urlset>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'public, max-age=3600' } });
}
