import { rpc } from './_lib.js';
import { companyName } from './_fin.js';
import { PLAYBOOKS } from './_playbooks.js';
import { CALCS } from './_calcs.js';

// Plain-word aliases so "inflation" finds CPI and "jobs" finds payrolls.
const ALIASES = {
  CPIAUCSL: 'inflation cpi consumer prices', PCEPILFE: 'inflation core pce', UNRATE: 'jobs unemployment',
  PAYEMS: 'jobs payrolls employment', DGS10: 'treasury 10 year yield rates bonds', DFF: 'fed funds interest rates',
  MORTGAGE30US: 'mortgage rates housing', A191RL1Q225SBEA: 'gdp growth economy', DCOILWTICO: 'oil crude',
  GDP: 'gdp economy', ICSA: 'jobless claims unemployment', STLFSI4: 'stress fear',
};

const norm = (s) => String(s || '').toLowerCase();

function staticItems() {
  const out = [{ u: '/playbooks/buffett-indicator', t: 'Buffett Indicator', s: 'Stock market value vs GDP', k: 'Playbook', w: 'buffett warren valuation market cap gdp' }];
  for (const [slug, p] of Object.entries(PLAYBOOKS)) out.push({ u: `/playbooks/${slug}`, t: p.title, s: p.investor, k: 'Playbook', w: norm(p.investor) });
  for (const [slug, c] of Object.entries(CALCS)) out.push({ u: `/calculators/${slug}`, t: c.h1, s: 'Calculator', k: 'Calculator', w: slug.replace(/-/g, ' ') });
  return out;
}

// Returns up to `limit` results across companies, ETFs, indicators, investors and pages.
export async function siteSearch(env, q, limit = 10) {
  const ql = norm(q);
  const up = q.toUpperCase();
  const words = ql.split(/\s+/).filter(Boolean);
  const hit = (text) => words.every((w) => text.includes(w));

  const [cos, etfs, cat, invs] = await Promise.all([
    rpc(env, 'tt_companies', { p_sort: 'revenue', p_limit: 6, p_q: q }).catch(() => []),
    rpc(env, 'tt_etfs', { p_limit: 4, p_q: q }).catch(() => []),
    rpc(env, 'tt_catalog').catch(() => []),
    rpc(env, 'tt_investors').catch(() => []),
  ]);

  const exact = [], secs = [], people = [], inds = [], pages = [];
  for (const r of etfs || []) (r.ticker === up ? exact : secs).push({ u: `/etf/${encodeURIComponent(r.ticker)}`, t: r.ticker, s: companyName(r.name), k: 'ETF' });
  for (const r of cos || []) (r.ticker === up ? exact : secs).push({ u: `/company/${encodeURIComponent(r.ticker)}`, t: r.ticker, s: companyName(r.name), k: r.kind === 'fund' ? 'Fund' : 'Stock' });
  for (const m of invs || []) {
    if (hit(norm(`${m.person} ${m.display_name}`))) people.push({ u: `/investor/${encodeURIComponent(m.slug)}`, t: m.person || m.display_name, s: m.display_name, k: 'Investor' });
  }
  for (const o of cat || []) {
    const text = norm(`${o.name} ${o.series_id} ${o.category} ${ALIASES[o.series_id] || ''}`);
    if (hit(text)) (o.series_id === up ? exact : inds).push({ u: `/indicator/${encodeURIComponent(o.series_id)}`, t: o.name, s: o.category, k: 'Indicator' });
  }
  for (const it of staticItems()) if (hit(norm(`${it.t} ${it.s} ${it.w}`))) pages.push({ u: it.u, t: it.t, s: it.s, k: it.k });

  // A short all-letters query is probably a ticker; anything else is probably a name or topic.
  const tickerLike = /^[A-Za-z.\-]{1,5}$/.test(q);
  const ordered = tickerLike ? [...exact, ...secs, ...people, ...pages, ...inds] : [...exact, ...people, ...inds, ...pages, ...secs];
  const seen = new Set();
  return ordered.filter((r) => (seen.has(r.u) ? false : seen.add(r.u))).slice(0, limit);
}
