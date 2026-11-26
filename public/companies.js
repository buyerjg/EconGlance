// Company search box with suggestions.
(function () {
  const input = document.getElementById('co-q');
  const list = document.getElementById('co-results');
  if (!input) return;
  let timer, last = '', items = [], active = -1;
  const href = (it) => (it.k === 'etf' ? '/etf/' : '/company/') + encodeURIComponent(it.t);
  const go = (it) => { location.href = href(it); };
  function render() {
    list.innerHTML = '';
    items.forEach((it, i) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = href(it);
      const b = document.createElement('strong'); b.textContent = it.t;
      const s = document.createElement('span'); s.textContent = ' ' + it.n + (it.k === 'etf' ? ' · ETF' : '');
      a.append(b, s); li.append(a);
      if (i === active) li.className = 'active';
      list.append(li);
    });
    list.hidden = !items.length;
  }
  input.addEventListener('input', () => {
    clearTimeout(timer);
    const q = input.value.trim();
    if (!q) { items = []; render(); return; }
    timer = setTimeout(async () => {
      if (q === last) return; last = q;
      try {
        const res = await fetch('/api/companies?q=' + encodeURIComponent(q), { headers: { 'X-TT-Client': 'web' } });
        const d = await res.json();
        if (input.value.trim() !== q) return;
        items = Array.isArray(d) ? d : []; active = -1; render();
      } catch (e) { items = []; render(); }
    }, 180);
  });
  input.addEventListener('keydown', (ev) => {
    if (ev.key === 'ArrowDown' && items.length) { active = (active + 1) % items.length; render(); ev.preventDefault(); }
    else if (ev.key === 'ArrowUp' && items.length) { active = (active - 1 + items.length) % items.length; render(); ev.preventDefault(); }
    else if (ev.key === 'Enter') {
      ev.preventDefault();
      if (active >= 0 && items[active]) go(items[active]);
      else if (items[0]) go(items[0]);
      else if (/^[A-Za-z.\-]{1,8}$/.test(input.value.trim())) go({ t: input.value.trim().toUpperCase(), k: 'co' });
    }
  });
})();
