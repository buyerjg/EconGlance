// Shared helpers for company financial pages (data: SEC EDGAR XBRL, public domain).
import { escapeHtml as e } from './_lib.js';

export const TICKER = /^[A-Z0-9.\-]{1,12}$/;

const KEEP_UPPER = new Set(['LP', 'L.P.', 'LLC', 'PLC', 'NV', 'N.V.', 'AG', 'SA', 'S.A.', 'SE', 'REIT', 'USA', 'US', 'U.S.', 'AT&T', 'II', 'III', 'IV', 'NYSE', 'ADR', 'BDC', 'HP', 'IBM', 'AMC', 'CSX', 'CVS', 'CMS', 'DTE', 'AES', 'NRG', 'PPG', 'PPL', 'TJX', 'UPS', 'WEC', 'MSCI', 'KLA', 'NVIDIA', 'AMD', 'AMETEK', 'TE', 'RTX', 'GE', 'PG&E', 'ON', 'ADT', 'AT', 'BJ', 'CBRE', 'CDW', 'DXC', 'EOG', 'EQT', 'FMC', 'IDEX', 'IQVIA', 'LKQ', 'NCR', 'NVR', 'ONEOK', 'PTC', 'RPM', 'SBA', 'SLM', 'TKO', 'UGI', 'WPP', 'XPO']);
const SPECIAL = { JPMORGAN: 'JPMorgan', MCKESSON: 'McKesson', MCDONALDS: "McDonald's", "MCDONALD'S": "McDonald's", MCCORMICK: 'McCormick', PAYPAL: 'PayPal', EBAY: 'eBay', FEDEX: 'FedEx', BLACKROCK: 'BlackRock', MORGAN: 'Morgan', ABBVIE: 'AbbVie', MASTERCARD: 'Mastercard', NETAPP: 'NetApp', DOORDASH: 'DoorDash', SALESFORCE: 'Salesforce', GODADDY: 'GoDaddy', CARMAX: 'CarMax', AUTOZONE: 'AutoZone', HUBSPOT: 'HubSpot', FIRSTENERGY: 'FirstEnergy', CENTERPOINT: 'CenterPoint', NEXTERA: 'NextEra', PEPSICO: 'PepsiCo', BIOGEN: 'Biogen', DUPONT: 'DuPont', MCMORAN: 'McMoRan', LABCORP: 'Labcorp', JETBLUE: 'JetBlue', QUALCOMM: 'Qualcomm', PULTEGROUP: 'PulteGroup', 'O\'REILLY': "O'Reilly", CONOCOPHILLIPS: 'ConocoPhillips', EXXONMOBIL: 'ExxonMobil', 'T-MOBILE': 'T-Mobile', ICAHN: 'Icahn', UNITEDHEALTH: 'UnitedHealth', CROWDSTRIKE: 'CrowdStrike', MICROSTRATEGY: 'MicroStrategy', WORKDAY: 'Workday', ONEMAIN: 'OneMain', SOFI: 'SoFi', ROBINHOOD: 'Robinhood', PALANTIR: 'Palantir', APPLOVIN: 'AppLovin', COREWEAVE: 'CoreWeave', IHEARTMEDIA: 'iHeartMedia' };
const SHORT = { INC: 'Inc.', CORP: 'Corp.', CO: 'Co.', LTD: 'Ltd.', HOLDINGS: 'Holdings', GROUP: 'Group', COMPANY: 'Company', CORPORATION: 'Corporation', INCORPORATED: 'Incorporated', 'INC.': 'Inc.', 'CORP.': 'Corp.', 'CO.': 'Co.', 'LTD.': 'Ltd.' };

// "AMAZON COM INC" -> "Amazon.com Inc."; "FNB CORP/PA/" -> "FNB Corp."
export function companyName(raw) {
  let n = String(raw || '').replace(/\s*\/[A-Z]{2,3}\/?\s*$/, '').replace(/\s+/g, ' ').trim();
  const letters = n.replace(/[^A-Za-z]/g, '');
  if (!letters || (n.replace(/[^A-Z]/g, '').length / letters.length) < 0.7) return n;
  n = n.replace(/ COM\b/, '.com');
  return n.split(' ').map((w, i) => {
    const bare = w.replace(/,$/, '');
    const comma = w.endsWith(',') ? ',' : '';
    if (SHORT[bare] && i > 0) return SHORT[bare] + comma;
    if (SPECIAL[bare]) return SPECIAL[bare] + comma;
    if (KEEP_UPPER.has(bare) || (bare.length <= 3 && !/^(OF|AND|THE|FOR)$/.test(bare) && i === 0)) return bare + comma;
    if (/^(OF|AND|THE|FOR|&)$/.test(bare) && i > 0) return bare.toLowerCase() + comma;
    return bare.toLowerCase().replace(/(^|[-.'&])([a-z])/g, (m, p, c) => p + c.toUpperCase()) + comma;
  }).join(' ').replace(/\.Com\b/g, '.com');
}

// $416.16B style
export function money(v, { sign = false } = {}) {
  if (v === null || v === undefined || !isFinite(+v)) return '—';
  const x = +v;
  const a = Math.abs(x);
  const s = x < 0 ? '-' : sign && x > 0 ? '+' : '';
  if (a >= 1e12) return `${s}$${(a / 1e12).toFixed(2)}T`;
  if (a >= 1e9) return `${s}$${(a / 1e9).toFixed(2)}B`;
  if (a >= 1e6) return `${s}$${(a / 1e6).toFixed(1)}M`;
  if (a >= 1e3) return `${s}$${(a / 1e3).toFixed(0)}K`;
  return `${s}$${a.toFixed(0)}`;
}
// words for prose: "$416.2 billion"
export function moneyWords(v) {
  if (v === null || v === undefined || !isFinite(+v)) return 'not reported';
  const x = +v, a = Math.abs(x), s = x < 0 ? '-' : '';
  if (a >= 1e12) return `${s}$${(a / 1e12).toFixed(2)} trillion`;
  if (a >= 1e9) return `${s}$${(a / 1e9).toFixed(1)} billion`;
  if (a >= 1e6) return `${s}$${(a / 1e6).toFixed(1)} million`;
  return `${s}$${Math.round(a).toLocaleString('en-US')}`;
}
export function pct(v, { sign = false } = {}) {
  if (v === null || v === undefined || !isFinite(+v)) return '—';
  return `${sign && +v > 0 ? '+' : ''}${(+v).toFixed(1)}%`;
}
export function eps(v) {
  if (v === null || v === undefined || !isFinite(+v)) return '—';
  return `${+v < 0 ? '-' : ''}$${Math.abs(+v).toFixed(2)}`;
}
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export function dateText(s) {
  if (!s) return '';
  const [y, m, d] = String(s).slice(0, 10).split('-').map(Number);
  return `${MON[m - 1]} ${d}, ${y}`;
}
export function monthText(s) {
  if (!s) return '';
  const [y, m] = String(s).slice(0, 10).split('-').map(Number);
  return `${MON[m - 1]} ${y}`;
}
// Fiscal years are named by the calendar year they end in (Apple FY2025 ended Sep 2025).
export function fyName(endDate) {
  return endDate ? `FY${String(endDate).slice(0, 4)}` : '';
}
function growth(cur, prev) {
  if (cur == null || prev == null || !(+prev > 0)) return null;
  return (+cur / +prev - 1) * 100;
}
const ratio = (a, b) => (a == null || b == null || !(+b > 0) || Math.abs(+a) > +b ? null : (+a / +b) * 100);

export const RANKINGS = {
  revenue: { title: 'Largest US public companies by revenue', short: 'Revenue', col: 'Revenue', fmt: (r) => money(r.revenue), blurb: 'Annual revenue from each company’s latest fiscal year, as reported to the SEC.' },
  net_income: { title: 'Most profitable US public companies', short: 'Net income', col: 'Net income', fmt: (r) => money(r.net_income), blurb: 'Net income from each company’s latest fiscal year.' },
  growth: { title: 'Fastest-growing large US companies', short: 'Revenue growth', col: 'Revenue growth', fmt: (r) => pct(r.revenue_growth, { sign: true }), blurb: 'Year-over-year revenue growth in the latest fiscal year. Companies with at least $1 billion in revenue (and $500 million the year before). Large jumps are often due to acquisitions.' },
  net_margin: { title: 'US companies with the highest profit margins', short: 'Net margin', col: 'Net margin', fmt: (r) => pct(r.net_margin), blurb: 'Net income as a share of revenue in the latest fiscal year. Companies with at least $1 billion in revenue.' },
  rnd: { title: 'Biggest R&D spenders among US public companies', short: 'R&D spending', col: 'R&D', fmt: (r) => money(r.rnd), blurb: 'Research and development expense in the latest fiscal year.' },
  fcf: { title: 'US companies generating the most free cash flow', short: 'Free cash flow', col: 'Free cash flow', fmt: (r) => money(r.fcf), blurb: 'Operating cash flow minus capital expenditures in the latest fiscal year.' },
  buybacks: { title: 'Largest stock buybacks', short: 'Buybacks', col: 'Buybacks', fmt: (r) => money(r.buybacks), blurb: 'Cash spent repurchasing the company’s own common stock in the latest fiscal year.' },
  dividends: { title: 'Largest dividend payers', short: 'Dividends paid', col: 'Dividends paid', fmt: (r) => money(r.dividends), blurb: 'Total cash dividends paid in the latest fiscal year.' },
  losses: { title: 'US public companies with the biggest losses', short: 'Biggest losses', col: 'Net loss', fmt: (r) => money(r.net_income), blurb: 'Largest net losses in the latest fiscal year.' },
};

export function companyLink(ticker) {
  return `/company/${encodeURIComponent(ticker)}`;
}

// The financial tables + chart data for one company. Used by the page (5 years) and by the API (all years).
export function renderFinancials(d) {
  const annual = d.annual || [];
  const bal = d.balance || [];
  const qs = d.quarterly || [];
  const years = annual.slice().reverse(); // oldest -> newest
  const byP = Object.fromEntries(annual.map((a) => [a.period, a]));
  const prevOf = (a) => byP['CY' + (Number(a.period.slice(2)) - 1)];
  const head = years.map((a) => `<th class="num" title="Fiscal year ended ${e(dateText(a.end_date))}">${e(fyName(a.end_date) || a.period.slice(2))}</th>`).join('');
  const v = (a, k) => (a.vals || {})[k];
  const row = (label, f, cls = '') => {
    const cells = years.map((a) => `<td class="num">${f(a)}</td>`);
    if (cells.every((c) => c === '<td class="num">—</td>')) return '';
    return `<tr class="${cls}"><th scope="row">${e(label)}</th>${cells.join('')}</tr>`;
  };
  const fcf = (a) => (v(a, 'op_cash_flow') != null && v(a, 'capex') != null ? v(a, 'op_cash_flow') - v(a, 'capex') : null);

  const income = [
    row('Revenue', (a) => money(v(a, 'revenue')), 'key'),
    row('Revenue growth', (a) => { const p = prevOf(a); return pct(p ? growth(v(a, 'revenue'), v(p, 'revenue')) : null, { sign: true }); }, 'sub'),
    row('Gross profit', (a) => money(v(a, 'gross_profit'))),
    row('Operating income', (a) => money(v(a, 'operating_income'))),
    row('Operating margin', (a) => pct(ratio(v(a, 'operating_income'), v(a, 'revenue'))), 'sub'),
    row('Net income', (a) => money(v(a, 'net_income')), 'key'),
    row('Net margin', (a) => pct(ratio(v(a, 'net_income'), v(a, 'revenue'))), 'sub'),
    row('Diluted EPS', (a) => eps(v(a, 'eps_diluted'))),
    row('R&D expense', (a) => money(v(a, 'rnd'))),
    row('Diluted shares', (a) => (v(a, 'diluted_shares') != null ? `${(v(a, 'diluted_shares') / 1e9).toFixed(2)}B` : '—')),
  ].join('');
  const cash = [
    row('Operating cash flow', (a) => money(v(a, 'op_cash_flow'))),
    row('Capital expenditures', (a) => money(v(a, 'capex') != null ? -v(a, 'capex') : null)),
    row('Free cash flow', (a) => money(fcf(a)), 'key'),
    row('Dividends paid', (a) => money(v(a, 'dividends'))),
    row('Stock buybacks', (a) => money(v(a, 'buybacks'))),
  ].join('');

  const bYears = bal.slice().reverse();
  const bHead = bYears.map((b) => `<th class="num">${e(monthText(b.end_date))}</th>`).join('');
  const brow = (label, k, cls = '') => {
    const cells = bYears.map((b) => `<td class="num">${money((b.vals || {})[k])}</td>`);
    if (cells.every((c) => c === '<td class="num">—</td>')) return '';
    return `<tr class="${cls}"><th scope="row">${e(label)}</th>${cells.join('')}</tr>`;
  };
  const balance = [
    brow('Total assets', 'assets', 'key'), brow('Total liabilities', 'liabilities'), brow('Shareholders’ equity', 'equity', 'key'),
    brow('Cash & equivalents', 'cash'), brow('Long-term debt', 'long_term_debt'),
  ].join('');

  const qRows = qs.map((q) => `<tr><th scope="row">${e(dateText(q.end_date))}</th><td class="num">${money((q.vals || {}).revenue)}</td><td class="num">${money((q.vals || {}).net_income)}</td><td class="num">${eps((q.vals || {}).eps_diluted)}</td></tr>`).join('');

  const table = (title, id, h, rows, note = '') => (rows ? `<h2 id="${id}">${title}</h2>${note}<div class="table-wrap"><table class="fin"><thead><tr><th></th>${h}</tr></thead><tbody>${rows}</tbody></table></div>` : '');

  const htmlOut = [
    table('Income statement', 'income', head, income),
    table('Cash flow', 'cash-flow', head, cash),
    table('Balance sheet', 'balance-sheet', bHead, balance, '<p class="note">At the reporting date closest to each calendar year-end.</p>'),
    qRows ? `<h2 id="quarterly">Recent quarters</h2><div class="table-wrap"><table class="fin"><thead><tr><th>Quarter ended</th><th class="num">Revenue</th><th class="num">Net income</th><th class="num">Diluted EPS</th></tr></thead><tbody>${qRows}</tbody></table></div>` : '',
  ].join('');

  const chart = years.map((a) => [fyName(a.end_date) || a.period.slice(2), v(a, 'revenue') ?? null, v(a, 'net_income') ?? null]);
  return { html: htmlOut, chart };
}
