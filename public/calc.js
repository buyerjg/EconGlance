// Calculator logic for /calculators/*.
(function () {
  const box = document.querySelector('[data-calc]');
  if (!box) return;
  const $ = (id) => document.getElementById(id);
  const usd = (v, d = 2) => '$' + (+v).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  const kind = box.dataset.calc;

  if (kind === 'inflation') {
    let cpi = null;
    const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const label = (ym) => { const [y, m] = ym.split('-'); return `${MON[+m - 1]} ${y}`; };
    const find = (ym) => {
      if (!cpi) return null;
      let best = null;
      for (const [k, v] of cpi) { if (k <= ym) best = [k, v]; else break; }
      return best;
    };
    const run = () => {
      if (!cpi) return;
      const amt = parseFloat($('inf-amount').value) || 0;
      const a = find($('inf-from').value || cpi[0][0]);
      const b = find($('inf-to').value || cpi[cpi.length - 1][0]);
      if (!a || !b) { $('inf-result').textContent = '—'; $('inf-detail').textContent = 'Pick months from January 1947 onward.'; return; }
      const out = amt * (b[1] / a[1]);
      const pct = (b[1] / a[1] - 1) * 100;
      $('inf-result').textContent = `${usd(amt)} in ${label(a[0])} ≈ ${usd(out)} in ${label(b[0])}`;
      $('inf-detail').textContent = `Prices ${pct >= 0 ? 'rose' : 'fell'} ${Math.abs(pct).toFixed(1)}% between these months (CPI ${a[1].toFixed(1)} → ${b[1].toFixed(1)}).`;
    };
    fetch('/api/cpi', { headers: { 'X-TT-Client': 'web' }, credentials: 'same-origin' })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((rows) => {
        cpi = rows.map(([k, v]) => [k, +v]);
        const last = cpi[cpi.length - 1][0];
        $('inf-to').value = last; $('inf-to').max = last; $('inf-from').max = last;
        run();
      })
      .catch(() => { $('inf-result').textContent = 'CPI data could not be loaded. Please try again later.'; });
    ['inf-amount', 'inf-from', 'inf-to'].forEach((id) => $(id).addEventListener('input', run));
  }

  if (kind === 'mortgage') {
    const run = () => {
      const price = +$('mtg-price').value || 0, down = +$('mtg-down').value || 0;
      const P = Math.max(price - down, 0), years = +$('mtg-term').value, n = years * 12;
      const r = (+$('mtg-rate').value || 0) / 100 / 12;
      const pay = r ? (P * r) / (1 - Math.pow(1 + r, -n)) : P / n;
      const total = pay * n;
      $('mtg-result').textContent = `${usd(pay)} per month`;
      $('mtg-detail').textContent = `Loan ${usd(P, 0)} over ${years} years · total paid ${usd(total, 0)} · total interest ${usd(total - P, 0)}`;
    };
    ['mtg-price', 'mtg-down', 'mtg-rate', 'mtg-term'].forEach((id) => $(id).addEventListener('input', run));
    run();
  }

  if (kind === 'compound-interest') {
    const run = () => {
      const start = +$('ci-start').value || 0, monthly = +$('ci-monthly').value || 0;
      const r = (+$('ci-rate').value || 0) / 100 / 12, years = Math.min(Math.max(+$('ci-years').value || 0, 0), 80), n = years * 12;
      let bal = start;
      for (let i = 0; i < n; i++) bal = bal * (1 + r) + monthly;
      const contributed = start + monthly * n;
      $('ci-result').textContent = `${usd(bal, 0)} after ${years} years`;
      $('ci-detail').textContent = `You put in ${usd(contributed, 0)}; growth adds ${usd(bal - contributed, 0)}.`;
    };
    ['ci-start', 'ci-monthly', 'ci-rate', 'ci-years'].forEach((id) => $(id).addEventListener('input', run));
    run();
  }
})();
