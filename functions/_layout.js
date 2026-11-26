import { escapeHtml as e } from './_lib.js';

export const SITE_NAME = 'The Trend Brief';

export function page({ title, description, canonical, body, scripts = '' }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${e(title)}</title>
<meta name="description" content="${e(description)}">
${canonical ? `<link rel="canonical" href="${e(canonical)}">` : ''}
<meta property="og:title" content="${e(title)}">
<meta property="og:description" content="${e(description)}">
<meta property="og:type" content="website">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/app.css">
<script>try{var t=localStorage.getItem('tt-theme');if(t)document.documentElement.dataset.theme=t;}catch(e){}</script>
</head>
<body>
<header class="site-header">
  <a class="brand" href="/">The Trend<span>Brief</span></a>
  <nav>
    <a href="/">Today</a>
    <a href="/indicators">Indicators</a>
    <a href="/compare">Compare</a>
    <a href="/calculators">Calculators</a>
    <a href="/login" id="account-link">Sign in</a>
    <button type="button" class="theme-toggle" id="theme-toggle" aria-label="Switch light or dark theme">◐</button>
  </nav>
</header>
<main class="wrap">
${body}
</main>
<footer class="site-footer">
  <p>Official data from U.S. government agencies via FRED®, Federal Reserve Bank of St. Louis. Market closes and news summaries link to their sources. For information only — not investment advice.</p>
  <p>© ${new Date().getUTCFullYear()} The Trend Brief</p>
</footer>
<script src="/account.js" defer></script>
${scripts}
</body>
</html>`;
}

export function html(markup, { maxAge = 600 } = {}) {
  return new Response(markup, {
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
