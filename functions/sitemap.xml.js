import { rpc } from './_lib.js';
import { CALCS } from './_calcs.js';

export async function onRequestGet(context) {
  const { env, request } = context;
  const origin = new URL(request.url).origin;
  let list = [];
  try { list = await rpc(env, 'tt_catalog'); } catch (err) { list = []; }
  const today = new Date().toISOString().slice(0, 10);
  const urls = [`${origin}/`, `${origin}/indicators`, `${origin}/compare`, `${origin}/calculators`, ...Object.keys(CALCS).map((c) => `${origin}/calculators/${c}`), ...list.map((o) => `${origin}/indicator/${o.series_id}`)];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${u}</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq></url>`).join('\n')}\n</urlset>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'public, max-age=3600' } });
}
