// "Investor playbooks": indicators well-known investors have said they watch, computed from official data.
// Values are for the period they describe (not as first published), so past readings can differ slightly
// from what was known on that day.

const DAY = 86400000;
const toT = (d) => new Date(String(d).slice(0, 10) + 'T00:00:00Z').getTime();
export const isoDate = (t) => new Date(t).toISOString().slice(0, 10);
export const addMonths = (d, m) => { const x = new Date(toT(d)); x.setUTCMonth(x.getUTCMonth() + m); return isoDate(x.getTime()); };

// obs: { SERIES: [[date, value], ...] } sorted by date
export function makeData(obs) {
  const S = {};
  // Monthly/quarterly/annual series are dated at the start of their period; treat a value as known
  // from the end of its period so past comparisons don't use data from later in that period.
  for (const [k, pts] of Object.entries(obs || {})) {
    let shift = 0;
    if (pts.length > 1 && pts.every(([d]) => String(d).endsWith('-01'))) {
      const gaps = pts.slice(1).map(([d], i) => (toT(d) - toT(pts[i][0])) / DAY).sort((a, b) => a - b);
      const g = gaps[gaps.length >> 1];
      shift = g > 300 ? 12 : g > 80 ? 3 : 1;
    }
    S[k] = pts.map(([d, v]) => [toT(shift ? addMonths(d, shift) : d) - (shift ? DAY : 0), +v, d]);
  }
  const at = (id, date) => {
    const pts = S[id]; if (!pts || !pts.length) return null;
    const t = toT(date);
    let lo = 0, hi = pts.length - 1, ans = -1;
    while (lo <= hi) { const mid = (lo + hi) >> 1; if (pts[mid][0] <= t) { ans = mid; lo = mid + 1; } else hi = mid - 1; }
    return ans < 0 ? null : { t: pts[ans][0], v: pts[ans][1], d: pts[ans][2] };
  };
  const prior = (id, date, months) => { const p = at(id, date); return p ? at(id, addMonths(isoDate(p.t), -months)) : null; };
  const yoy = (id, date) => { const p = at(id, date), q = prior(id, date, 12); return p && q && q.v ? { v: (p.v / q.v - 1) * 100, d: p.d } : null; };
  const chg = (id, date, months) => { const p = at(id, date), q = prior(id, date, months); return p && q ? { v: p.v - q.v, d: p.d } : null; };
  const pctChg = (id, date, months) => { const p = at(id, date), q = prior(id, date, months); return p && q && q.v ? { v: (p.v / q.v - 1) * 100, d: p.d } : null; };
  const high = (id, date, months) => {
    const p = at(id, date); if (!p) return null;
    const from = toT(addMonths(isoDate(p.t), -months));
    return Math.max(...S[id].filter(([t]) => t >= from && t <= p.t).map(([, v]) => v));
  };
  const latest = (id) => { const pts = S[id]; return pts && pts.length ? pts[pts.length - 1][2] : null; };
  return { S, at, yoy, chg, pctChg, high, latest };
}

const f2 = (v) => (v == null ? '—' : (+v).toFixed(2));
const f1 = (v) => (v == null ? '—' : (+v).toFixed(1));
const sg = (v, d = 2) => (v == null ? '—' : (v > 0 ? '+' : '') + (+v).toFixed(d));
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const monthLabel = (d) => { if (!d) return ''; const [y, m] = d.split('-').map(Number); return `${MON[m - 1]} ${y}`; };
export const quarterLabel = (d) => { if (!d) return ''; const [y, m] = d.split('-').map(Number); return `Q${Math.floor((m - 1) / 3) + 1} ${y}`; };

// trend of a price index: near its 12-month high and rising, falling, or in between
function trend(D, id, date) {
  const p = D.at(id, date), h = D.high(id, date, 12), c = D.pctChg(id, date, 3);
  if (!p || h == null || !c) return null;
  const off = (p.v / h - 1) * 100;
  if (off > -2 && c.v > 0) return { label: 'Near 12-month high', tone: 'on', text: `${sg(c.v, 1)}% in 3 months`, d: p.d };
  if (c.v < -2) return { label: 'Falling', tone: 'off', text: `${sg(c.v, 1)}% in 3 months`, d: p.d };
  return { label: 'Mixed', tone: 'neutral', text: `${sg(c.v, 1)}% in 3 months, ${f1(Math.abs(off))}% below 12-month high`, d: p.d };
}

export const PLAYBOOKS = {
  'druckenmiller-checklist': {
    investor: 'Stanley Druckenmiller',
    title: 'The Druckenmiller checklist',
    seoTitle: 'Druckenmiller indicators: the macro checklist he watches, today vs. January 2026',
    blurb: 'The macro signals Stanley Druckenmiller has described watching — Fed policy against growth, commodities and copper, credit, the economy — with today’s readings from official data.',
    defaultVs: '2026-01-15',
    series: ['GDP', 'DFF', 'DFEDTARU', 'PPIACO', 'WPU102502', 'NFCICREDIT', 'STLFSI4', 'A191RL1Q225SBEA', 'UNRATE', 'PCEPILFE', 'DTWEXBGS'],
    intro: [
      'In a public conversation in November 2026, Druckenmiller compared the conditions he saw in January 2026 with those at the time. In January, he said, policy looked very loose: the federal funds rate was about 3.5% while nominal growth was around 6%, with more rate cuts expected. Commodities, copper included, were breaking out, market breadth was making new highs and credit spreads were tight, so a recession within a year looked very unlikely to him.',
      'By November he described almost all of that as reversed: the Fed tightening rather than cutting, commodities and copper rolling over, breadth peaking months before the indexes, credit spreads widening and defensive stocks leading cyclicals. With less clarity than at almost any time in his career, he said he had stepped back from big positions.',
      'This page tracks the signals from that list that can be measured with free official data, so you can compare any two dates yourself.',
    ],
    notTracked: ['Stock market breadth (the advance-decline line)', 'Cyclical vs. defensive stock performance', 'Corporate bond spreads (licensed data; the Chicago Fed credit index is shown instead)'],
    items: [
      { key: 'policy', label: 'Monetary policy: nominal growth minus the Fed funds rate', series: ['GDP', 'DFF'], why: 'When the economy grows much faster in dollar terms than the policy rate, money is loose.',
        calc: (D, date) => { const g = D.yoy('GDP', date), r = D.at('DFF', date); if (!g || !r) return null; const gap = g.v - r.v;
          return { value: `${sg(gap)} pts`, text: `Nominal GDP ${f1(g.v)}% y/y vs. Fed funds ${f2(r.v)}%`, label: gap >= 1 ? 'Loose' : gap <= -0.5 ? 'Tight' : 'Neutral', tone: gap >= 1 ? 'on' : gap <= -0.5 ? 'off' : 'neutral', d: g.d }; } },
      { key: 'fed', label: 'Fed direction (target rate, last 6 months)', series: ['DFEDTARU'], why: 'Cutting supports markets; hiking drains liquidity.',
        calc: (D, date) => { const p = D.at('DFEDTARU', date), c = D.chg('DFEDTARU', date, 6); if (!p || !c) return null;
          return { value: `${f2(p.v)}%`, text: `${sg(c.v)} pts in 6 months`, label: c.v < 0 ? 'Cutting' : c.v > 0 ? 'Hiking' : 'On hold', tone: c.v < 0 ? 'on' : c.v > 0 ? 'off' : 'neutral', d: p.d }; } },
      { key: 'commod', label: 'Commodity prices (producer price index)', series: ['PPIACO'], why: 'Breakouts in raw materials signal strong demand. Monthly producer prices can lag market prices.',
        calc: (D, date) => { const t = trend(D, 'PPIACO', date); return t && { ...t, value: t.label }; } },
      { key: 'copper', label: 'Copper prices (copper & brass mill shapes PPI)', series: ['WPU102502'], why: 'Copper is a classic read on global industrial demand. Monthly producer prices can lag futures prices.',
        calc: (D, date) => { const t = trend(D, 'WPU102502', date); return t && { ...t, value: t.label }; } },
      { key: 'credit', label: 'Credit conditions (Chicago Fed credit subindex)', series: ['NFCICREDIT'], why: 'Tightening credit tends to come before slower growth; below zero means looser than average.',
        calc: (D, date) => { const p = D.at('NFCICREDIT', date), c = D.chg('NFCICREDIT', date, 3); if (!p || !c) return null;
          return { value: f2(p.v), text: `${sg(c.v)} in 3 months`, label: c.v > 0.02 ? 'Tightening' : c.v < -0.02 ? 'Easing' : 'Stable', tone: c.v > 0.02 ? 'off' : c.v < -0.02 ? 'on' : 'neutral', d: p.d }; } },
      { key: 'stress', label: 'Financial stress (St. Louis Fed index)', series: ['STLFSI4'], why: 'Zero is normal; above zero means more stress than usual.',
        calc: (D, date) => { const p = D.at('STLFSI4', date); if (!p) return null;
          return { value: f2(p.v), text: p.v < 0 ? 'Below-average stress' : 'Above-average stress', label: p.v < -0.5 ? 'Calm' : p.v > 0.5 ? 'Elevated' : 'Normal', tone: p.v < -0.5 ? 'on' : p.v > 0.5 ? 'off' : 'neutral', d: p.d }; } },
      { key: 'gdp', label: 'Economy: real GDP growth (annualized)', series: ['A191RL1Q225SBEA'], why: 'He called the economy strong in both January and November.',
        calc: (D, date) => { const p = D.at('A191RL1Q225SBEA', date); if (!p) return null;
          return { value: `${f1(p.v)}%`, text: quarterLabel(p.d), label: p.v >= 2 ? 'Strong' : p.v < 1 ? 'Weak' : 'Moderate', tone: p.v >= 2 ? 'on' : p.v < 1 ? 'off' : 'neutral', d: p.d }; } },
      { key: 'jobs', label: 'Unemployment rate (3-month change)', series: ['UNRATE'], why: 'A rising jobless rate is an early recession warning.',
        calc: (D, date) => { const p = D.at('UNRATE', date), c = D.chg('UNRATE', date, 3); if (!p || !c) return null;
          return { value: `${f1(p.v)}%`, text: `${sg(c.v, 1)} pts in 3 months`, label: c.v >= 0.3 ? 'Rising' : c.v <= -0.2 ? 'Falling' : 'Stable', tone: c.v >= 0.3 ? 'off' : 'on', d: p.d }; } },
      { key: 'infl', label: 'Core inflation vs. the Fed’s 2% target (core PCE)', series: ['PCEPILFE'], why: 'Inflation above target keeps the Fed from easing.',
        calc: (D, date) => { const p = D.yoy('PCEPILFE', date); if (!p) return null;
          return { value: `${f2(p.v)}%`, text: monthLabel(p.d), label: p.v > 2.5 ? 'Above target' : p.v < 1.5 ? 'Below target' : 'Near target', tone: p.v > 2.5 ? 'off' : 'neutral', d: p.d }; } },
      { key: 'usd', label: 'US dollar (broad index, 3-month change)', series: ['DTWEXBGS'], why: 'He said his few remaining positions were in the dollar.',
        calc: (D, date) => { const p = D.at('DTWEXBGS', date), c = D.pctChg('DTWEXBGS', date, 3); if (!p || !c) return null;
          return { value: f2(p.v), text: `${sg(c.v, 1)}% in 3 months`, label: c.v > 1 ? 'Rising' : c.v < -1 ? 'Falling' : 'Flat', tone: 'neutral', d: p.d }; } },
    ],
  },
  'dalio-debt-cycle': {
    investor: 'Ray Dalio',
    title: 'The Dalio debt-cycle dashboard',
    seoTitle: 'Ray Dalio debt cycle indicators: where the US stands today',
    blurb: 'Ray Dalio’s big-debt-cycle framework in numbers: government debt and deficits, the cost of servicing that debt, interest rates against growth, and household debt burdens.',
    defaultVs: null,
    series: ['GFDEGDQ188S', 'A091RC1Q027SBEA', 'GDP', 'FYFSGDA188S', 'DGS10', 'DFII10', 'TDSP', 'WALCL', 'PCEPILFE'],
    intro: [
      'In his books on debt crises — including Principles for Navigating Big Debt Crises (2018) and How Countries Go Broke (2025) — Dalio argues that long-term debt cycles end badly when debt and its interest cost grow faster than the income needed to pay them, forcing a choice between painful cuts, higher taxes, default or printing money.',
      'The measures below follow the warning signs he has described: how big the debt is relative to the economy, how much of the economy goes to interest, whether borrowing keeps rising, and whether interest rates are above or below the economy’s growth rate.',
    ],
    notTracked: ['Foreign demand for US Treasuries', 'Debt maturing in the next few years'],
    items: [
      { key: 'debt', label: 'Federal debt as % of GDP', series: ['GFDEGDQ188S'], why: 'The size of the debt relative to the economy that has to carry it.',
        calc: (D, date) => { const p = D.at('GFDEGDQ188S', date), c = D.chg('GFDEGDQ188S', date, 12); if (!p) return null;
          return { value: `${f1(p.v)}%`, text: c ? `${sg(c.v, 1)} pts in a year · ${quarterLabel(p.d)}` : quarterLabel(p.d), label: p.v >= 100 ? 'Very high' : p.v >= 60 ? 'High' : 'Moderate', tone: p.v >= 100 ? 'off' : 'neutral', d: p.d }; } },
      { key: 'interest', label: 'Federal interest payments as % of GDP', series: ['A091RC1Q027SBEA', 'GDP'], why: 'The cost of carrying the debt, which crowds out other spending as it rises.',
        calc: (D, date) => { const i = D.at('A091RC1Q027SBEA', date), g = D.at('GDP', date); if (!i || !g) return null; const v = (i.v / g.v) * 100;
          const i0 = D.at('A091RC1Q027SBEA', addMonths(isoDate(i.t), -12)), g0 = D.at('GDP', addMonths(isoDate(i.t), -12)); const v0 = i0 && g0 ? (i0.v / g0.v) * 100 : null;
          return { value: `${f2(v)}%`, text: v0 != null ? `${sg(v - v0)} pts in a year · ${quarterLabel(i.d)}` : quarterLabel(i.d), label: v >= 3 ? 'Heavy' : v >= 2 ? 'Rising burden' : 'Manageable', tone: v >= 3 ? 'off' : 'neutral', d: i.d }; } },
      { key: 'deficit', label: 'Federal budget balance as % of GDP (fiscal year)', series: ['FYFSGDA188S'], why: 'Persistent large deficits mean the debt keeps growing faster than the economy.',
        calc: (D, date) => { const p = D.at('FYFSGDA188S', date); if (!p) return null;
          return { value: `${f1(p.v)}%`, text: `Fiscal ${p.d.slice(0, 4)}`, label: p.v <= -5 ? 'Large deficit' : p.v < -3 ? 'Deficit' : p.v < 0 ? 'Small deficit' : 'Surplus', tone: p.v <= -5 ? 'off' : 'neutral', d: p.d }; } },
      { key: 'rg', label: 'Interest rate vs. growth (10-year yield minus nominal GDP growth)', series: ['DGS10', 'GDP'], why: 'When rates exceed growth, the debt burden rises on its own, even with balanced budgets.',
        calc: (D, date) => { const r = D.at('DGS10', date), g = D.yoy('GDP', date); if (!r || !g) return null; const x = r.v - g.v;
          return { value: `${sg(x)} pts`, text: `10-year ${f2(r.v)}% vs. nominal growth ${f1(g.v)}%`, label: x > 0 ? 'Rates above growth' : 'Growth above rates', tone: x > 0 ? 'off' : 'on', d: r.d }; } },
      { key: 'real', label: 'Real 10-year interest rate (TIPS)', series: ['DFII10'], why: 'High real rates make debt expensive; deeply negative real rates are a sign of money printing.',
        calc: (D, date) => { const p = D.at('DFII10', date); if (!p) return null;
          return { value: `${f2(p.v)}%`, text: monthLabel(p.d), label: p.v >= 2 ? 'Restrictive' : p.v < 0 ? 'Negative' : 'Moderate', tone: 'neutral', d: p.d }; } },
      { key: 'hh', label: 'Household debt payments as % of income', series: ['TDSP'], why: 'Private-sector debt strain; it was very high before 2008.',
        calc: (D, date) => { const p = D.at('TDSP', date); if (!p) return null;
          return { value: `${f2(p.v)}%`, text: quarterLabel(p.d), label: p.v >= 12 ? 'Stretched' : p.v >= 10 ? 'Moderate' : 'Low', tone: p.v >= 12 ? 'off' : 'on', d: p.d }; } },
      { key: 'fedbs', label: 'Fed balance sheet (1-year change)', series: ['WALCL'], why: 'Big balance-sheet growth is how central banks print money late in a debt cycle.',
        calc: (D, date) => { const p = D.at('WALCL', date), c = D.pctChg('WALCL', date, 12); if (!p || !c) return null;
          return { value: `$${f2(p.v)}T`, text: `${sg(c.v, 1)}% in a year`, label: c.v > 5 ? 'Expanding' : c.v < -5 ? 'Shrinking' : 'Steady', tone: 'neutral', d: p.d }; } },
      { key: 'infl', label: 'Core inflation (core PCE, y/y)', series: ['PCEPILFE'], why: 'Inflation is how heavy debts are often eroded.',
        calc: (D, date) => { const p = D.yoy('PCEPILFE', date); if (!p) return null;
          return { value: `${f2(p.v)}%`, text: monthLabel(p.d), label: p.v > 2.5 ? 'Above target' : 'Near target', tone: p.v > 2.5 ? 'off' : 'neutral', d: p.d }; } },
    ],
  },
};

// Buffett indicator: market value of US nonfinancial corporate equities / nominal GDP (both quarterly)
export function buffettSeries(obs) {
  const gdp = new Map((obs.GDP || []).map(([d, v]) => [d.slice(0, 7), +v]));
  return (obs.NCBEILQ027S || []).map(([d, v]) => { const g = gdp.get(d.slice(0, 7)); return g ? [d, (+v / 1000 / g) * 100] : null; }).filter(Boolean);
}
