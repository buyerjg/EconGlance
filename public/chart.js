// Indicator chart: plain SVG, no libraries.
(function () {
  const box = document.getElementById('chart');
  if (!box) return;
  const id = box.dataset.series;
  const unit = box.dataset.unit || '';
  const area = box.querySelector('.chart');
  const hint = box.querySelector('.login-hint');
  const buttons = Array.from(box.querySelectorAll('[data-range]'));
  const isPct = unit.startsWith('%');
  const fmt = (v) => {
    if (unit === 'claims' || unit.startsWith('thousands')) return Math.round(v).toLocaleString('en-US');
    return v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + (isPct ? '%' : '');
  };
  let current = '1y';
  let lastPoints = null;

  async function load(range) {
    const headers = { 'X-TT-Client': 'web' };
    if (range !== '1y') {
      const token = window.ttToken ? await window.ttToken() : null;
      if (!token) { showHint(); return; }
      headers.Authorization = 'Bearer ' + token;
    }
    setActive(range);
    area.innerHTML = '<p class="note">Loading chart…</p>';
    try {
      const res = await fetch(`/api/series/${encodeURIComponent(id)}?range=${range}`, { headers, credentials: 'same-origin' });
      if (res.status === 401) { showHint(); return; }
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      current = range;
      hint.hidden = true;
      lastPoints = (data.points || []).map(([d, v]) => [new Date(d + 'T00:00:00Z'), +v]);
      draw(lastPoints);
    } catch (e) {
      area.innerHTML = '<p class="note">The chart could not be loaded. Please try again later.</p>';
    }
  }

  function showHint() {
    hint.hidden = false;
    setActive(current);
    if (!lastPoints) load('1y');
  }

  function setActive(range) {
    buttons.forEach((b) => b.classList.toggle('active', b.dataset.range === range));
  }

  function draw(points) {
    area.innerHTML = '';
    if (!points.length) { area.innerHTML = '<p class="note">No data in this range.</p>'; return; }
    const W = Math.max(300, area.clientWidth || 600);
    const H = 280;
    const m = { t: 12, r: 12, b: 28, l: 58 };
    const xs = points.map((p) => p[0].getTime());
    const ys = points.map((p) => p[1]);
    let y0 = Math.min(...ys), y1 = Math.max(...ys);
    if (y0 === y1) { y0 -= 1; y1 += 1; }
    const pad = (y1 - y0) * 0.08; y0 -= pad; y1 += pad;
    const x0 = xs[0], x1 = xs[xs.length - 1] || x0 + 1;
    const X = (t) => m.l + ((t - x0) / (x1 - x0 || 1)) * (W - m.l - m.r);
    const Y = (v) => m.t + (1 - (v - y0) / (y1 - y0)) * (H - m.t - m.b);
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', H);
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', `${box.dataset.name} chart`);

    // grid + y labels
    for (let i = 0; i <= 4; i++) {
      const v = y0 + ((y1 - y0) * i) / 4;
      const y = Y(v);
      const line = document.createElementNS(ns, 'line');
      Object.entries({ x1: m.l, x2: W - m.r, y1: y, y2: y, class: 'grid' }).forEach(([k, val]) => line.setAttribute(k, val));
      svg.append(line);
      const t = document.createElementNS(ns, 'text');
      Object.entries({ x: m.l - 6, y: y + 4, 'text-anchor': 'end', class: 'axis' }).forEach(([k, val]) => t.setAttribute(k, val));
      t.textContent = fmt(v);
      svg.append(t);
    }
    // x labels (years or months)
    const spanYears = (x1 - x0) / (365.25 * 864e5);
    const ticks = 5;
    for (let i = 0; i <= ticks; i++) {
      const tt = x0 + ((x1 - x0) * i) / ticks;
      const d = new Date(tt);
      const t = document.createElementNS(ns, 'text');
      Object.entries({ x: X(tt), y: H - 8, 'text-anchor': i === 0 ? 'start' : i === ticks ? 'end' : 'middle', class: 'axis' }).forEach(([k, val]) => t.setAttribute(k, val));
      t.textContent = spanYears > 2 ? String(d.getUTCFullYear()) : d.toLocaleDateString('en-US', { month: 'short', year: '2-digit', timeZone: 'UTC' });
      svg.append(t);
    }
    // line
    const path = document.createElementNS(ns, 'path');
    path.setAttribute('d', points.map((p, i) => `${i ? 'L' : 'M'}${X(p[0].getTime()).toFixed(1)},${Y(p[1]).toFixed(1)}`).join(''));
    path.setAttribute('class', 'line');
    svg.append(path);
    // hover
    const dot = document.createElementNS(ns, 'circle');
    dot.setAttribute('r', 4); dot.setAttribute('class', 'dot'); dot.style.display = 'none';
    svg.append(dot);
    const tip = document.createElement('div');
    tip.className = 'tip'; tip.hidden = true;
    area.style.position = 'relative';
    area.append(svg, tip);
    svg.addEventListener('pointermove', (ev) => {
      const r = svg.getBoundingClientRect();
      const px = ((ev.clientX - r.left) / r.width) * W;
      const t = x0 + ((px - m.l) / (W - m.l - m.r)) * (x1 - x0);
      let lo = 0, hi = points.length - 1;
      while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (points[mid][0].getTime() < t) lo = mid; else hi = mid; }
      const p = Math.abs(points[lo][0] - t) < Math.abs(points[hi][0] - t) ? points[lo] : points[hi];
      const cx = X(p[0].getTime()), cy = Y(p[1]);
      dot.setAttribute('cx', cx); dot.setAttribute('cy', cy); dot.style.display = '';
      tip.hidden = false;
      tip.textContent = `${p[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}: ${fmt(p[1])}`;
      const left = Math.min(Math.max((cx / W) * r.width - 60, 0), r.width - 140);
      tip.style.left = left + 'px';
      tip.style.top = Math.max((cy / H) * r.height - 40, 0) + 'px';
    });
    svg.addEventListener('pointerleave', () => { dot.style.display = 'none'; tip.hidden = true; });
  }

  buttons.forEach((b) => b.addEventListener('click', () => load(b.dataset.range)));
  window.addEventListener('resize', () => { if (lastPoints) draw(lastPoints); });
  load('1y');
})();
