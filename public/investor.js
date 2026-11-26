// Investor page: load every position for signed-in users.
(function () {
  const btn = document.getElementById('inv-all');
  const box = document.getElementById('inv-holdings');
  if (!btn || !box) return;
  btn.addEventListener('click', async () => {
    const token = window.ttToken ? await window.ttToken() : null;
    if (!token) { location.href = '/login?next=' + encodeURIComponent(location.pathname); return; }
    btn.disabled = true; btn.textContent = 'Loading…';
    try {
      const res = await fetch('/api/investor/' + encodeURIComponent(box.dataset.slug), { headers: { 'X-TT-Client': 'web', Authorization: 'Bearer ' + token }, credentials: 'same-origin' });
      if (res.status === 401) { location.href = '/login?next=' + encodeURIComponent(location.pathname); return; }
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const d = await res.json();
      box.innerHTML = d.html; // rendered and escaped on the server
      document.getElementById('inv-more').hidden = true;
    } catch (e) { btn.disabled = false; btn.textContent = 'Try again'; }
  });
})();
