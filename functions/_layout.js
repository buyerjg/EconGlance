import { escapeHtml as e } from './_lib.js';

export const SITE_NAME = 'EconGlance';
const TAGLINE = 'Markets, the economy and public companies, from official data';

// path segment -> [section name, section page]
const SECTION = {
  indicators: ['Economy', '/indicators'], indicator: ['Economy', '/indicators'], compare: ['Economy', '/indicators'], calculators: ['Economy', '/indicators'],
  companies: ['Companies', '/companies'], company: ['Companies', '/companies'], rankings: ['Companies', '/companies'],
  etfs: ['ETFs', '/etfs'], etf: ['ETFs', '/etfs'],
  investors: ['Investors', '/investors'], investor: ['Investors', '/investors'],
  playbooks: ['Playbooks', '/playbooks'],
};

const NAV = [
  ['/', 'Today'],
  ['/indicators', 'Economy'],
  ['/companies', 'Companies'],
  ['/etfs', 'ETFs'],
  ['/investors', 'Investors'],
  ['/playbooks', 'Playbooks'],
];

// page({ title, description, canonical, body, scripts, crumbs: [[name, path], ...], jsonld: {...} })
export function page({ title, description, canonical, body, scripts = '', crumbs = null, jsonld = null, path = '', noindex = false }) {
  let origin = '';
  try { origin = canonical ? new URL(canonical).origin : ''; } catch (err) { origin = ''; }
  const here = path || (canonical ? new URL(canonical).pathname : '');
  const seg = here.split('/')[1] || '';
  const section = SECTION[seg];
  const nav = NAV.map(([href, label]) => {
    const on = href === '/' ? here === '/' : section && section[1] === href;
    return `<a href="${href}"${on ? ' aria-current="page"' : ''}>${label}</a>`;
  }).join('');
  // Breadcrumbs for search results: section, then this page.
  if (!crumbs && section && here !== section[1] && here.split('/').length > 2) {
    crumbs = [['Home', '/'], section, [String(title).split(' | ')[0].split(':')[0].trim(), here]];
  }

  const ld = [];
  if (here === '/' && origin) {
    ld.push({
      '@context': 'https://schema.org', '@type': 'WebSite', name: SITE_NAME, url: `${origin}/`,
      potentialAction: { '@type': 'SearchAction', target: `${origin}/search?q={search_term_string}`, 'query-input': 'required name=search_term_string' },
    });
  }
  if (crumbs && crumbs.length && origin) {
    ld.push({
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: crumbs.map(([name, p], i) => ({ '@type': 'ListItem', position: i + 1, name, item: `${origin}${p}` })),
    });
  }
  if (jsonld) ld.push(jsonld);
  // JSON inside <script> must not be able to close the tag
  const ldTags = ld.map((o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`).join('\n');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${e(title)}</title>
<meta name="description" content="${e(description)}">
${noindex ? '<meta name="robots" content="noindex">' : ''}
${canonical ? `<link rel="canonical" href="${e(canonical)}">` : ''}
<meta property="og:site_name" content="${SITE_NAME}">
<meta property="og:title" content="${e(title)}">
<meta property="og:description" content="${e(description)}">
<meta property="og:type" content="website">
${canonical ? `<meta property="og:url" content="${e(canonical)}">` : ''}
${origin ? `<meta property="og:image" content="${origin}/og.png">` : ''}
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#0b6e69">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="preload" href="/fonts/fira-Regular.woff" as="font" type="font/woff" crossorigin>
<link rel="preload" href="/fonts/bitter.woff" as="font" type="font/woff" crossorigin>
<link rel="stylesheet" href="/app.css">
<script>try{var t=localStorage.getItem('tt-theme');if(t)document.documentElement.dataset.theme=t;}catch(e){}</script>
${ldTags}
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="site-header">
  <div class="bar">
    <a class="brand" href="/" aria-label="${SITE_NAME} home"><svg class="brand-mark" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 12 L18.5 6.5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><circle cx="12" cy="12" r="2.2" fill="currentColor"/></svg>EconGlance</a>
    <form class="site-search" role="search" action="/search" method="get" data-search>
      <label for="site-q" class="sr-only">Search companies, ETFs, indicators and investors</label>
      <input id="site-q" name="q" type="search" placeholder="Search Apple, SPY, inflation, Buffett…" autocomplete="off" spellcheck="false">
      <ul class="search-results" hidden></ul>
    </form>
    <div class="bar-end">
      <a href="/login" id="account-link" class="account">Sign in</a>
      <button type="button" class="theme-toggle" id="theme-toggle" aria-label="Switch between light and dark theme"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 2a8 8 0 1 0 0 16z" fill="currentColor"/><circle cx="10" cy="10" r="7.25" fill="none" stroke="currentColor" stroke-width="1.5"/></svg></button>
    </div>
  </div>
  <nav class="site-nav" aria-label="Main">${nav}</nav>
</header>
<main class="wrap" id="main">
${body}
</main>
<footer class="site-footer">
  <div class="foot-cols">
    <div>
      <p class="foot-brand">EconGlance</p>
      <p>${TAGLINE}. Economic data from U.S. government agencies; company and fund data from SEC filings. For information only, not investment advice.</p>
    </div>
    <nav aria-label="Explore">
      <a href="/indicators">Economic indicators</a>
      <a href="/compare">Compare indicators</a>
      <a href="/calculators">Calculators</a>
      <a href="/rankings/revenue">Company rankings</a>
      <a href="/playbooks/buffett-indicator">Buffett Indicator</a>
    </nav>
    <nav aria-label="About">
      <a href="/about">About and data sources</a>
      <a href="/privacy">Privacy policy</a>
      <a href="/terms">Terms of use</a>
      <a href="/contact">Contact</a>
    </nav>
  </div>
  <p class="foot-legal">© ${new Date().getUTCFullYear()} EconGlance</p>
</footer>
<script src="/account.js" defer></script>
<script src="/search.js" defer></script>
${scripts}
</body>
</html>`;
}

export function html(markup, { maxAge = 600, status = 200 } = {}) {
  return new Response(markup, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': `public, max-age=${maxAge}` },
  });
}

// ---- formatting ----
export function num(v, d = 2) {
  if (v === null || v === undefined || v === '' || !isFinite(+v)) return '—';
  return (+v).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
}
export function signed(v, d = 2) {
  if (v === null || v === undefined || v === '' || !isFinite(+v)) return '';
  return (+v > 0 ? '+' : '') + num(v, d);
}
export function dir(v) {
  if (v === null || v === undefined || v === '' || !isFinite(+v) || +v === 0) return 'flat';
  return +v > 0 ? 'up' : 'down';
}
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export function asOf(s, freq) {
  if (!s) return '';
  const [y, m, d] = String(s).slice(0, 10).split('-').map(Number);
  if (freq === 'monthly') return `${MON[m - 1]} ${y}`;
  if (freq === 'quarterly') return `Q${Math.floor((m - 1) / 3) + 1} ${y}`;
  if (freq === 'annual') return String(y);
  if (freq === 'weekly') return `Week of ${MON[m - 1]} ${d}, ${y}`;
  return `${MON[m - 1]} ${d}, ${y}`;
}
export function officialValue(v, unit, withSign = false) {
  if (v === null || v === undefined || !isFinite(+v)) return '—';
  const f = withSign ? signed : num;
  if (unit === 'claims' || unit.startsWith('thousands')) return f(v, 0);
  if (unit.startsWith('%')) return withSign ? `${f(v, 2)} pts` : `${num(v, 2)}%`;
  return f(v, 2);
}
export function slug(id) {
  return `/indicator/${encodeURIComponent(id)}`;
}
export function safeUrl(u) {
  return typeof u === 'string' && /^https?:\/\//.test(u) ? u : null;
}
export function sourceLink(url, label) {
  const u = safeUrl(url);
  return u ? `<a href="${e(u)}" rel="nofollow noopener" target="_blank">${e(label || 'source')}</a>` : e(label || '');
}
