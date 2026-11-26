// Sign-in state shared by every page. Uses Supabase Auth (free accounts, email link).
(function () {
  const SUPABASE_URL = 'https://fddflhppvruykllrkblj.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_XonY1fZcN7ro8HI9F8mk6g_HKfKgtqV';
  const STORAGE_KEY = 'sb-fddflhppvruykllrkblj-auth-token';

  let clientPromise = null;
  window.ttSupabase = function () {
    if (!clientPromise) {
      clientPromise = import('https://esm.sh/@supabase/supabase-js@2').then(({ createClient }) =>
        createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } })
      );
    }
    return clientPromise;
  };

  function hasStoredSession() {
    try { return !!localStorage.getItem(STORAGE_KEY); } catch (e) { return false; }
  }

  // Resolves to an access token, or null for visitors who are not signed in.
  window.ttToken = async function () {
    const urlHasAuth = /access_token=|code=/.test(location.hash + location.search);
    if (!hasStoredSession() && !urlHasAuth) return null;
    try {
      const sb = await window.ttSupabase();
      const { data } = await sb.auth.getSession();
      return data && data.session ? data.session.access_token : null;
    } catch (e) {
      return null;
    }
  };

  document.addEventListener('DOMContentLoaded', async () => {
    const link = document.getElementById('account-link');
    if (!link) return;
    const token = await window.ttToken();
    if (token) {
      link.textContent = 'Sign out';
      link.href = '#';
      link.addEventListener('click', async (ev) => {
        ev.preventDefault();
        const sb = await window.ttSupabase();
        await sb.auth.signOut();
        location.reload();
      });
    }
  });
})();
