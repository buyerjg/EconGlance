// Cloudflare Worker entry point. Static files in /public are served by Workers Static Assets
// before this code runs; everything else (pages and the data API) is routed here.
import { onRequest as middleware } from '../functions/_middleware.js';
import { rpc } from '../functions/_lib.js';
import { page, html, SITE_NAME } from '../functions/_layout.js';

import * as home from '../functions/index.js';
import * as about from '../functions/about.js';
import * as privacy from '../functions/privacy.js';
import * as terms from '../functions/terms.js';
import * as contact from '../functions/contact.js';
import * as search from '../functions/search.js';
import * as sitemap from '../functions/sitemap.xml.js';
import * as indicators from '../functions/indicators.js';
import * as indicator from '../functions/indicator/[id].js';
import * as compare from '../functions/compare.js';
import * as calculators from '../functions/calculators/index.js';
import * as calculator from '../functions/calculators/[name].js';
import * as companies from '../functions/companies.js';
import * as company from '../functions/company/[ticker].js';
import * as rankings from '../functions/rankings/[metric].js';
import * as etfs from '../functions/etfs.js';
import * as etf from '../functions/etf/[ticker].js';
import * as investors from '../functions/investors.js';
import * as investor from '../functions/investor/[slug].js';
import * as playbooks from '../functions/playbooks/index.js';
import * as playbook from '../functions/playbooks/[name].js';
import * as apiToday from '../functions/api/today.js';
import * as apiCpi from '../functions/api/cpi.js';
import * as apiSearch from '../functions/api/search.js';
import * as apiCompanies from '../functions/api/companies.js';
import * as apiCompany from '../functions/api/company/[ticker].js';
import * as apiEtf from '../functions/api/etf/[ticker].js';
import * as apiInvestor from '../functions/api/investor/[slug].js';
import * as apiSeries from '../functions/api/series/[id].js';

// [path pattern, module, parameter name]. ":p" matches one path segment.
const ROUTES = [
  ['/', home], ['/about', about], ['/privacy', privacy], ['/terms', terms], ['/contact', contact],
  ['/search', search], ['/sitemap.xml', sitemap],
  ['/indicators', indicators], ['/indicator/:p', indicator, 'id'], ['/compare', compare],
  ['/calculators', calculators], ['/calculators/:p', calculator, 'name'],
  ['/companies', companies], ['/company/:p', company, 'ticker'], ['/rankings/:p', rankings, 'metric'],
  ['/etfs', etfs], ['/etf/:p', etf, 'ticker'],
  ['/investors', investors], ['/investor/:p', investor, 'slug'],
  ['/playbooks', playbooks], ['/playbooks/:p', playbook, 'name'],
  ['/api/today', apiToday], ['/api/cpi', apiCpi], ['/api/search', apiSearch], ['/api/companies', apiCompanies],
  ['/api/company/:p', apiCompany, 'ticker'], ['/api/etf/:p', apiEtf, 'ticker'],
  ['/api/investor/:p', apiInvestor, 'slug'], ['/api/series/:p', apiSeries, 'id'],
].map(([pattern, mod, param]) => {
  const parts = pattern.split('/');
  return { parts, mod, param };
});

function match(pathname) {
  const segs = pathname.split('/');
  for (const r of ROUTES) {
    if (r.parts.length !== segs.length) continue;
    let value = null;
    let ok = true;
    for (let i = 0; i < segs.length; i++) {
      if (r.parts[i] === ':p') {
        if (!segs[i]) { ok = false; break; }
        try { value = decodeURIComponent(segs[i]); } catch (err) { ok = false; break; }
      } else if (r.parts[i] !== segs[i]) { ok = false; break; }
    }
    if (ok) return { mod: r.mod, params: r.param ? { [r.param]: value } : {} };
  }
  return null;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // One address per page: drop trailing slashes (/etfs/ -> /etfs).
    if (url.pathname.length > 1 && url.pathname.endsWith('/') && !url.pathname.startsWith('/login')) {
      url.pathname = url.pathname.replace(/\/+$/, '');
      return Response.redirect(url.toString(), 301);
    }

    const route = match(url.pathname);
    const context = {
      request,
      env,
      params: route ? route.params : {},
      waitUntil: (p) => ctx.waitUntil(p),
      next: async () => {
        if (!route) return new Response('Not found', { status: 404 });
        if (request.method !== 'GET' && request.method !== 'HEAD') {
          return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
        }
        const res = await route.mod.onRequestGet(context);
        return request.method === 'HEAD' ? new Response(null, res) : res;
      },
    };
    try {
      return await middleware(context);
    } catch (err) {
      console.error(err && err.stack ? err.stack : err);
      if (url.pathname.startsWith('/api/')) {
        return new Response(JSON.stringify({ error: 'Something went wrong. Try again shortly.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
      }
      return html(page({ title: `Temporarily unavailable | ${SITE_NAME}`, description: '', noindex: true, path: '/500', body: '<h1>This page is temporarily unavailable</h1><p>Try again in a minute. Meanwhile, <a href="/">today’s markets</a> and <a href="/search">search</a> may still work.</p>' }), { status: 500, maxAge: 0 });
    }
  },

  // Daily ping so the free Supabase project never counts as inactive and pauses.
  async scheduled(event, env, ctx) {
    ctx.waitUntil(rpc(env, 'tt_etf_index').then(
      (r) => console.log('keep-alive ok', Array.isArray(r) ? r.length : r),
      (err) => console.error('keep-alive failed', err.message),
    ));
  },
};
