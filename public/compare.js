// Compare up to three indicators on one SVG chart.
(function () {
  const box = document.getElementById('compare');
  if (!box) return;
  const selects = Array.from(box.querySelectorAll('select[data-slot]'));
  const modeSel = document.getElementById('cmp-mode');
  const legend = document.getElementById('cmp-legend');
  const area = box.querySelector('.chart');
  const hint = box.querySelector('.login-hint');
  const buttons = Array.from(box.querySelectorAll('[data-range]'));
  const COLORS = ['#2f6fdc', '#e07b39', '#2aa876'];
  let range = '1y';
  let loaded = [];

  const isPctUnit = (u) => /^%/.test(u || '') || u === 'index' || u === 'pts';
  const fmtVal = (v, unit) => {
    if (unit === 'claims' || /^thousands/.test(unit)) return Math.round(v).toLocaleString('en-US');
    return v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + (/^%/.test(unit) ? '%' : '');
  };

  async function fetchSeries(id) {
    const headers = { 'X-TT-Client': 'web' };
    if (range !== '1y') {
      const token = window.ttToken ? await window.ttToken() : null;
      if (!token) return { loginRequired: true };
      headers.Authorization = 'Bearer ' + token;
    }
    const res = await fetch(`/api/series/${encodeURIComponent(id)}?range=${range}`, { headers, credentials: 'same-origin' });
    if (res.status === 401) return { loginRequired: true };
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  }

  async function load() {
    const ids = selects.map((s) => s.value).filter(Boolean);
    const qs = new URLSearchParams(location.search);
    qs.set('s', ids.join(','));
    history.replaceState(null, '', '?' + qs.toString());
    buttons.forEach((b) => b.classList.toggle('active', b.dataset.range === range));
    if (!ids.length) { area.innerHTML = '<p class="note">Pick at least one indicator.</p>'; legend.innerHTML = ''; return; }
    area.innerHTML = '<p class="note">Loading chart…</p>';
    try {
      const results = await Promise.all(ids.map(fetchSeries));
      if (results.some((r) => r.loginRequired)) {
        hint.hidden = false;
        range = '1y';
        return load();
      }
      hint.hidden = true;
      loaded = results.map((r, i) => ({
        id: ids[i],
        name: r.series.name,
        unit: r.series.unit,
        color: COLORS[i],
        points: (r.points || []).map(([d, v]) => [new Date(d + 'T00:00:00Z').getTime(), +v]),
      }));
      draw();
    } catch (e) {
      area.innerHTML = '<p class="note">The chart could not be loaded. Please try again later.</p>';
    }
  }

  function transformed() {
    const mode = modeSel.value;
    return loaded.map((s) => {
      if (mode !== 'change' || !s.points.length) return { ...s, pts: s.points, label: s.unit };
      const base = s.points[0][1];
      const pp = isPctUnit(s.unit);
      return {
        ...s,
        pts: s.points.map(([t, v]) => [t, pp ? v - base : (base ? (v / base - 1) * 100 : 0)]),
        label: pp ? 'change, pts' : 'change, %',
      };
    });
  }

  function draw() {
    const series = transformed().filter((s) => s.pts.length);
    legend.replaceChildren(...series.map((s) => {
      const span = document.createElement('span');
      const i = document.createElement('i'); i.style.background = s.color;
      span.append(i, `${s.name} (${s.label})`);
      return span;
    }));
    area.innerHTML = '';
    if (!series.length) { area.innerHTML = '<p class="note">No data in this range.</p>'; return; }
    const shared = modeSel.value === 'change';
    const W = Math.max(300, area.clientWidth || 600), H = 320;
    const m = { t: 12, r: series.length > 1 && !shared ? 58 : 14, b: 28, l: 58 };
    const allT = series.flatMap((s) => s.pts.map((p) => p[0]));
    const x0 = Math.min(...allT), x1 = Math.max(...allT);
    const X = (t) => m.l + ((t - x0) / (x1 - x0 || 1)) * (W - m.l - m.r);
    const scales = series.map((s) => {
      const vals = shared ? series.flatMap((q) => q.pts.map((p) => p[1])) : s.pts.map((p) => p[1]);
      let lo = Math.min(...vals), hi = Math.max(...vals);
      if (lo === hi) { lo -= 1; hi += 1; }
      const pad = (hi - lo) * 0.08;
      lo -= pad; hi += pad;
      return { lo, hi, Y: (v) => m.t + (1 - (v - lo) / (hi - lo)) * (H - m.t - m.b) };
    });
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('width', '100%'); svg.setAttribute('height', H);
    svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', 'Comparison chart: ' + series.map((s) => s.name).join(', '));
    const el = (tag, attrs, text) => { const n = document.createElementNS(ns, tag); Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v)); if (text !== undefined) n.textContent = text; svg.append(n); return n; };
    for (let i = 0; i <= 4; i++) {
      const y = m.t + ((H - m.t - m.b) * i) / 4;
      el('line', { x1: m.l, x2: W - m.r, y1: y, y2: y, class: 'grid' });
      const s0 = scales[0];
      const v0 = s0.hi - ((s0.hi - s0.lo) * i) / 4;
      el('text', { x: m.l - 6, y: y + 4, 'text-anchor': 'end', class: 'axis', style: shared ? '' : 'fill:' + series[0].color }, shared ? v0.toFixed(1) : fmtVal(v0, series[0].unit));
      if (!shared && series[1]) {
        const s1 = scales[1];
        const v1 = s1.hi - ((s1.hi - s1.lo) * i) / 4;
        el('text', { x: W - m.r + 6, y: y + 4, 'text-anchor': 'start', class: 'axis', style: 'fill:' + series[1].color }, fmtVal(v1, series[1].unit));
      }
    }
    const years = (x1 - x0) / (365.25 * 864e5);
    for (let i = 0; i <= 5; i++) {
      const t = x0 + ((x1 - x0) * i) / 5; const d = new Date(t);
      el('text', { x: X(t), y: H - 8, 'text-anchor': i === 0 ? 'start' : i === 5 ? 'end' : 'middle', class: 'axis' },
        years > 2 ? String(d.getUTCFullYear()) : d.toLocaleDateString('en-US', { month: 'short', year: '2-digit', timeZone: 'UTC' }));
    }
    series.forEach((s, i) => {
      el('path', { d: s.pts.map((p, j) => `${j ? 'L' : 'M'}${X(p[0]).toFixed(1)},${scales[i].Y(p[1]).toFixed(1)}`).join(''), class: `line s${i}` });
    });
    const guide = el('line', { y1: m.t, y2: H - m.b, class: 'grid', style: 'display:none' });
    const tip = document.createElement('div'); tip.className = 'tip'; tip.hidden = true;
    area.style.position = 'relative';
    area.append(svg, tip);
    const nearest = (pts, t) => { let lo = 0, hi = pts.length - 1; while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (pts[mid][0] < t) lo = mid; else hi = mid; } return Math.abs(pts[lo][0] - t) < Math.abs(pts[hi][0] - t) ? pts[lo] : pts[hi]; };
    svg.addEventListener('pointermove', (ev) => {
      const r = svg.getBoundingClientRect();
      const px = ((ev.clientX - r.left) / r.width) * W;
      const t = x0 + ((px - m.l) / (W - m.l - m.r)) * (x1 - x0);
      const gx = Math.min(Math.max(px, m.l), W - m.r);
      guide.setAttribute('x1', gx); guide.setAttribute('x2', gx); guide.style.display = '';
      const lines = series.map((s) => { const p = nearest(s.pts, t); return `${s.name}: ${shared ? (p[1] > 0 ? '+' : '') + p[1].toFixed(2) + (s.label === 'change, %' ? '%' : ' pts') : fmtVal(p[1], s.unit)}`; });
      tip.textContent = new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }) + ' — ' + lines.join(' · ');
      tip.hidden = false;
      tip.style.whiteSpace = 'normal'; tip.style.maxWidth = '320px';
      tip.style.left = Math.min(Math.max((gx / W) * r.width + 8, 0), r.width - 330) + 'px';
      tip.style.top = '8px';
    });
    svg.addEventListener('pointerleave', () => { guide.style.display = 'none'; tip.hidden = true; });
  }

  selects.forEach((s) => s.addEventListener('change', load));
  modeSel.addEventListener('change', () => loaded.length && draw());
  buttons.forEach((b) => b.addEventListener('click', () => { range = b.dataset.range; load(); }));
  window.addEventListener('resize', () => loaded.length && draw());
  load();
})();
