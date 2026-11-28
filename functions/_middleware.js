import { notFoundPage } from './_pages.js';

// Bot filter for the data API. HTML pages stay open so search engines can index them;
// the raw data behind them (/api/*) is only served to our own pages.
//
// This is one layer. Also turn on in the Cloudflare dashboard:
//   Security > Bots > Bot Fight Mode, and a rate-limiting rule for /api/*.

const BLOCKED_UA = /(python-requests|python-urllib|aiohttp|httpx|scrapy|curl\/|wget\/|go-http-client|java\/|okhttp|libwww|node-fetch|axios\/|undici|headlesschrome|phantomjs|puppeteer|playwright|selenium|httpclient|postmanruntime|insomnia)/i;

export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);

  if (url.pathname.startsWith('/api/')) {
    const ua = request.headers.get('User-Agent') || '';
    if (!ua || BLOCKED_UA.test(ua)) return deny('Automated access is not allowed.');

    // Our pages send this header with every data request.
    if (request.headers.get('X-TT-Client') !== 'web') return deny('Use the website to view this data.');

    // Browsers say where a request came from; reject cross-site requests.
    const site = request.headers.get('Sec-Fetch-Site');
    if (site && site !== 'same-origin') return deny('Cross-site requests are not allowed.');
  }

  const res = await next();
  // Friendly 404 page for anything a person can land on.
  if (res.status === 404 && !url.pathname.startsWith('/api/') && request.method === 'GET' && (request.headers.get('Accept') || '').includes('text/html')) {
    return notFoundPage(request);
  }
  if (url.pathname.startsWith('/api/')) {
    const r = new Response(res.body, res);
    r.headers.set('X-Robots-Tag', 'noindex');
    return r;
  }
  return res;
}

function deny(message) {
  return new Response(JSON.stringify({ error: message }), {
    status: 403,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}
