import { rpc, json, cached, getUser, SERIES_ID } from '../../_lib.js';

// GET /api/series/:id?range=1y|5y|10y|max
// Visitors who are not signed in get the last year only; full history needs a free account.
const RANGES = { '1y': 1, '5y': 5, '10y': 10, max: 50 };
const PUBLIC_RANGES = new Set(['1y']);

export async function onRequestGet(context) {
  const { request, env, params } = context;
  const id = String(params.id || '').toUpperCase();
  if (!SERIES_ID.test(id)) return json({ error: 'Unknown series.' }, { status: 404 });

  const url = new URL(request.url);
  const range = RANGES[url.searchParams.get('range')] ? url.searchParams.get('range') : '1y';
  const start = new Date();
  start.setUTCFullYear(start.getUTCFullYear() - RANGES[range]);
  const startStr = start.toISOString().slice(0, 10);

  const load = async () => {
    const data = await rpc(env, 'tt_series', { p_id: id, p_start: startStr });
    if (!data) return null;
    data.range = range;
    return data;
  };

  if (PUBLIC_RANGES.has(range)) {
    return cached(request, context, 1800, async () => {
      try {
        const data = await load();
        return data ? json(data, { maxAge: 1800 }) : json({ error: 'Unknown series.' }, { status: 404 });
      } catch (e) {
        return json({ error: 'Data is temporarily unavailable.' }, { status: 503 });
      }
    });
  }

  const user = await getUser(env, request);
  if (!user) return json({ error: 'login_required', message: 'Sign in (free) to see the full history.' }, { status: 401, isPrivate: true });
  try {
    const data = await load();
    return data ? json(data, { isPrivate: true }) : json({ error: 'Unknown series.' }, { status: 404, isPrivate: true });
  } catch (e) {
    return json({ error: 'Data is temporarily unavailable.' }, { status: 503, isPrivate: true });
  }
}
