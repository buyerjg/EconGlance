import { json, cached } from '../_lib.js';
import { siteSearch } from '../_search.js';

// GET /api/search?q= — header search suggestions.
export async function onRequestGet(context) {
  const { request, env } = context;
  const q = (new URL(request.url).searchParams.get('q') || '').trim().slice(0, 40);
  if (!q || /[%_\\]/.test(q)) return json([], { maxAge: 300 });
  return cached(request, context, 3600, async () => {
    try {
      return json(await siteSearch(env, q, 8), { maxAge: 3600 });
    } catch (e) {
      return json({ error: 'Search is unavailable right now.' }, { status: 503 });
    }
  });
}
