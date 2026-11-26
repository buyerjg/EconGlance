// Company search box with suggestions.
(function () {
  const input = document.getElementById('co-q');
  const list = document.getElementById('co-results');
  if (!input) return;
  let timer, last = '', items = [], active = -1;
  const go = (t) => { location.href = '/company/' + encodeURIComponent(t); };
  function render() {
    list.innerHTML = '';
    items.forEach((it, i) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = '/company/' + encodeURIComponent(it.t);
      const b = document.createElement('strong'); b.textContent = it.t;
      const s = document.createElement('span'); s.textContent = ' ' + it.n;
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
      if (active >= 0 && items[active]) go(items[active].t);
      else if (items[0]) go(items[0].t);
      else if (/^[A-Za-z.\-]{1,8}$/.test(input.value.trim())) go(input.value.trim().toUpperCase());
    }
  });
})();
