import { escapeHtml as e } from './_lib.js';
import { page, html, SITE_NAME } from './_layout.js';
import { siteSearch } from './_search.js';

// GET /search?q= — full results page (works without JavaScript).
export async function onRequestGet(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const q = (url.searchParams.get('q') || '').trim().slice(0, 40);
  let results = [];
  if (q && !/[%_\\]/.test(q)) {
    try { results = await siteSearch(env, q, 30); } catch (err) { results = []; }
    if (results.length === 1) return Response.redirect(`${url.origin}${results[0].u}`, 302);
  }
  const list = results.length
    ? `<ul class="result-list">${results.map((r) => `<li><a href="${e(r.u)}"><strong>${e(r.t)}</strong> <span>${e(r.s || '')}</span></a><em>${e(r.k)}</em></li>`).join('')}</ul>`
    : q
      ? `<p>No matches for “${e(q)}”. Try a ticker such as AAPL, a company name, an investor such as Buffett, or a topic such as inflation.</p>`
      : '<p>Search by ticker, company, ETF, investor or economic topic.</p>';
  const body = `<h1>${q ? `Results for “${e(q)}”` : 'Search'}</h1>
<form class="search big" action="/search" method="get" role="search"><label for="sq" class="sr-only">Search</label><input id="sq" name="q" type="search" value="${e(q)}" placeholder="Ticker, company, investor or topic"></form>
${list}`;
  return html(page({
    title: q ? `${q} — search | ${SITE_NAME}` : `Search | ${SITE_NAME}`,
    description: 'Search companies, ETFs, economic indicators and investor portfolios.',
    canonical: `${url.origin}/search`,
    path: '/search',
    noindex: true,
    body,
  }), { maxAge: 600 });
}
