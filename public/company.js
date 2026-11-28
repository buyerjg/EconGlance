// Company page: revenue / net income bar chart, and "show all years" for signed-in users.
(function () {
  const box = document.getElementById('fin-chart');
  const tables = document.getElementById('fin-tables');
  if (!box) return;
  const area = box.querySelector('.chart');
  let data = [];
  try { data = JSON.parse(box.dataset.chart || '[]'); } catch (e) { data = []; }

  const fmt = (v) => {
    const a = Math.abs(v), s = v < 0 ? '-' : '';
    if (a >= 1e12) return s + '$' + (a / 1e12).toFixed(2) + 'T';
    if (a >= 1e9) return s + '$' + (a / 1e9).toFixed(a >= 1e11 ? 0 : 1) + 'B';
    if (a >= 1e6) return s + '$' + (a / 1e6).toFixed(0) + 'M';
    return s + '$' + a.toFixed(0);
  };

  function draw() {
    area.innerHTML = '';
    const rows = data.filter((r) => r[1] != null || r[2] != null);
    if (!rows.length) { area.innerHTML = '<p class="note">No annual figures to chart.</p>'; return; }
    const W = Math.max(300, area.clientWidth || 600), H = 260;
    const m = { t: 12, r: 8, b: 26, l: 56 };
    const vals = rows.flatMap((r) => [r[1], r[2]]).filter((v) => v != null);
    let y0 = Math.min(0, ...vals), y1 = Math.max(0, ...vals);
    if (y0 === y1) y1 = y0 + 1;
    const ns = 'http://www.w3.org/2000/svg';
    const el = (n, attrs, txt) => { const x = document.createElementNS(ns, n); for (const k in attrs) x.setAttribute(k, attrs[k]); if (txt != null) x.textContent = txt; return x; };
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width: '100%', height: H, role: 'img', 'aria-label': 'Revenue and net income by fiscal year' });
    const Y = (v) => m.t + (1 - (v - y0) / (y1 - y0)) * (H - m.t - m.b);
    for (let i = 0; i <= 4; i++) {
      const v = y0 + ((y1 - y0) * i) / 4;
      svg.append(el('line', { x1: m.l, x2: W - m.r, y1: Y(v), y2: Y(v), class: 'grid' }));
      svg.append(el('text', { x: m.l - 6, y: Y(v) + 4, 'text-anchor': 'end', class: 'axis' }, fmt(v)));
    }
    const slot = (W - m.l - m.r) / rows.length;
    const bw = Math.max(4, Math.min(28, slot * 0.34));
    const tip = document.createElement('div'); tip.className = 'tip'; tip.hidden = true;
    area.style.position = 'relative';
    rows.forEach((r, i) => {
      const cx = m.l + slot * i + slot / 2;
      [[r[1], 'var(--accent)', -1, 'Revenue'], [r[2], 'var(--c2)', 1, 'Net income']].forEach(([v, color, side, label]) => {
        if (v == null) return;
        const y = Math.min(Y(v), Y(0)), h = Math.max(1, Math.abs(Y(v) - Y(0)));
        const x = side < 0 ? cx - bw - 1 : cx + 1;
        const rect = el('rect', { x, y, width: bw, height: h, rx: 2, style: `fill:${v < 0 ? 'var(--down)' : color}` });
        rect.addEventListener('mouseenter', () => { tip.hidden = false; tip.textContent = `${r[0]} ${label}: ${fmt(v)}`; tip.style.left = Math.min(x, W - 160) + 'px'; tip.style.top = Math.max(0, y - 28) + 'px'; });
        rect.addEventListener('mouseleave', () => { tip.hidden = true; });
        svg.append(rect);
      });
      if (rows.length <= 12 || i % 2 === rows.length % 2) svg.append(el('text', { x: cx, y: H - 8, 'text-anchor': 'middle', class: 'axis' }, r[0]));
    });
    svg.append(el('line', { x1: m.l, x2: W - m.r, y1: Y(0), y2: Y(0), style: 'stroke:var(--muted)' }));
    area.append(svg, tip);
  }
  draw();
  let t; window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(draw, 150); });

  const btn = document.getElementById('fin-all');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    const token = window.ttToken ? await window.ttToken() : null;
    if (!token) { location.href = '/login?next=' + encodeURIComponent(location.pathname); return; }
    btn.disabled = true; btn.textContent = 'Loading…';
    try {
      const res = await fetch('/api/company/' + encodeURIComponent(tables.dataset.ticker), { headers: { 'X-TT-Client': 'web', Authorization: 'Bearer ' + token }, credentials: 'same-origin' });
      if (res.status === 401) { location.href = '/login?next=' + encodeURIComponent(location.pathname); return; }
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const d = await res.json();
      tables.innerHTML = d.html; // rendered and escaped on the server
      data = d.chart || data; draw();
      document.getElementById('fin-more').hidden = true;
    } catch (e) {
      btn.disabled = false; btn.textContent = 'Try again';
    }
  });
})();
