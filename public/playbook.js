// Simple line chart for playbook pages (data in data-points), with an optional average line.
(function () {
  document.querySelectorAll('.pb-chart').forEach((box) => {
    const area = box.querySelector('.chart');
    let pts = [];
    try { pts = JSON.parse(box.dataset.points || '[]'); } catch (e) { pts = []; }
    const unit = box.dataset.unit || '';
    const avg = area.dataset.avg != null ? +area.dataset.avg : null;
    function draw() {
      area.innerHTML = '';
      if (!pts.length) return;
      const W = Math.max(300, area.clientWidth || 600), H = 280, m = { t: 12, r: 10, b: 26, l: 48 };
      const ys = pts.map((p) => p[1]).concat(avg != null ? [avg] : []);
      let y0 = Math.min(0, ...ys), y1 = Math.max(...ys) * 1.05;
      const X = (i) => m.l + (i / (pts.length - 1 || 1)) * (W - m.l - m.r);
      const Y = (v) => m.t + (1 - (v - y0) / (y1 - y0)) * (H - m.t - m.b);
      const ns = 'http://www.w3.org/2000/svg';
      const el = (n, a, t) => { const x = document.createElementNS(ns, n); for (const k in a) x.setAttribute(k, a[k]); if (t != null) x.textContent = t; return x; };
      const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width: '100%', height: H, role: 'img' });
      for (let i = 0; i <= 4; i++) { const v = y0 + ((y1 - y0) * i) / 4; svg.append(el('line', { x1: m.l, x2: W - m.r, y1: Y(v), y2: Y(v), class: 'grid' })); svg.append(el('text', { x: m.l - 6, y: Y(v) + 4, 'text-anchor': 'end', class: 'axis' }, Math.round(v) + unit)); }
      const step = Math.ceil(pts.length / 8);
      pts.forEach((p, i) => { if (i % step === 0) svg.append(el('text', { x: X(i), y: H - 8, 'text-anchor': 'middle', class: 'axis' }, String(p[0]).slice(0, 4))); });
      if (avg != null) svg.append(el('line', { x1: m.l, x2: W - m.r, y1: Y(avg), y2: Y(avg), style: 'stroke:#999;stroke-dasharray:4 4' }));
      svg.append(el('path', { d: pts.map((p, i) => (i ? 'L' : 'M') + X(i).toFixed(1) + ',' + Y(p[1]).toFixed(1)).join(''), class: 'line' }));
      const tip = document.createElement('div'); tip.className = 'tip'; tip.hidden = true; area.style.position = 'relative';
      svg.addEventListener('mousemove', (ev) => {
        const r = svg.getBoundingClientRect(); const x = ((ev.clientX - r.left) / r.width) * W;
        const i = Math.max(0, Math.min(pts.length - 1, Math.round(((x - m.l) / (W - m.l - m.r)) * (pts.length - 1))));
        tip.hidden = false; tip.textContent = `${pts[i][0]}: ${pts[i][1]}${unit}`; tip.style.left = Math.min(X(i), W - 120) + 'px'; tip.style.top = Math.max(0, Y(pts[i][1]) - 30) + 'px';
      });
      svg.addEventListener('mouseleave', () => { tip.hidden = true; });
      area.append(svg, tip);
    }
    draw();
    let t; window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(draw, 150); });
  });
})();
