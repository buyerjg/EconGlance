// Header search with suggestions across companies, ETFs, indicators, investors and tools.
(function () {
  document.querySelectorAll('form[data-search]').forEach((form) => {
    const input = form.querySelector('input');
    const list = form.querySelector('.search-results');
    if (!input || !list) return;
    let timer, last = '', items = [], active = -1;

    function render() {
      list.innerHTML = '';
      items.forEach((it, i) => {
        const li = document.createElement('li');
        li.setAttribute('role', 'option');
        const a = document.createElement('a');
        a.href = it.u;
        const b = document.createElement('strong'); b.textContent = it.t;
        const s = document.createElement('span'); s.textContent = it.s || '';
        const k = document.createElement('em'); k.textContent = it.k;
        a.append(b, s, k); li.append(a);
        if (i === active) li.className = 'active';
        list.append(li);
      });
      list.hidden = !items.length;
      input.setAttribute('aria-expanded', items.length ? 'true' : 'false');
    }

    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-expanded', 'false');
    list.setAttribute('role', 'listbox');

    input.addEventListener('input', () => {
      clearTimeout(timer);
      const q = input.value.trim();
      if (!q) { items = []; render(); return; }
      timer = setTimeout(async () => {
        if (q === last) return; last = q;
        try {
          const res = await fetch('/api/search?q=' + encodeURIComponent(q), { headers: { 'X-TT-Client': 'web' } });
          const d = await res.json();
          if (input.value.trim() !== q) return;
          items = Array.isArray(d) ? d : []; active = -1; render();
        } catch (e) { items = []; render(); }
      }, 160);
    });
    input.addEventListener('keydown', (ev) => {
      if (ev.key === 'ArrowDown' && items.length) { active = (active + 1) % items.length; render(); ev.preventDefault(); }
      else if (ev.key === 'ArrowUp' && items.length) { active = (active - 1 + items.length) % items.length; render(); ev.preventDefault(); }
      else if (ev.key === 'Escape') { items = []; render(); }
      else if (ev.key === 'Enter' && active >= 0 && items[active]) { ev.preventDefault(); location.href = items[active].u; }
    });
    document.addEventListener('click', (ev) => { if (!form.contains(ev.target)) { items = []; render(); } });
    // "/" focuses the search box, as on many data sites
    document.addEventListener('keydown', (ev) => {
      if (ev.key === '/' && !/input|textarea|select/i.test(document.activeElement.tagName)) { ev.preventDefault(); input.focus(); }
    });
  });
})();
