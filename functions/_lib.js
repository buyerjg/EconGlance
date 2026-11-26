// Shared helpers for Cloudflare Pages Functions.

// Call a Supabase RPC with the server-side secret key (never sent to browsers).
export async function rpc(env, fn, args = {}) {
  if (!env.SUPABASE_SECRET_KEY) throw new Error('SUPABASE_SECRET_KEY is not set');
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: {
      apikey: env.SUPABASE_SECRET_KEY,
      Authorization: `Bearer ${env.SUPABASE_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(args),
  });
  if (!res.ok) throw new Error(`Supabase ${fn} failed: ${res.status}`);
  return res.json();
}

// Returns the signed-in Supabase user for a Bearer token, or null.
export async function getUser(env, request) {
  const auth = request.headers.get('Authorization') || '';
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m) return null;
  const res = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: env.SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${m[1]}` },
  });
  if (!res.ok) return null;
  const user = await res.json();
  return user && user.id ? user : null;
}

export function json(data, { status = 200, maxAge = 0, isPrivate = false } = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': isPrivate ? 'private, no-store' : `public, max-age=${maxAge}`,
      'X-Robots-Tag': 'noindex',
    },
  });
}

// Edge cache wrapper for public (anonymous) responses.
export async function cached(request, ctx, ttlSeconds, produce) {
  const cache = caches.default;
  const key = new Request(new URL(request.url).toString(), { method: 'GET' });
  const hit = await cache.match(key);
  if (hit) return hit;
  const res = await produce();
  if (res.ok) {
    const copy = new Response(res.body, res);
    copy.headers.set('Cache-Control', `public, max-age=${ttlSeconds}`);
    ctx.waitUntil(cache.put(key, copy.clone()));
    return copy;
  }
  return res;
}

export function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export const SERIES_ID = /^[A-Z0-9]{2,20}$/;
