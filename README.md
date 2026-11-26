# TrendTracker Today

Daily US market brief: market closes, what moved markets, official economic data (FRED),
what America searched (Google Trends), and "this day in markets" 1–10 years ago.

## How it works

- **Data** lives in Supabase (project `trendtracker`, us-east-1):
  - `briefing.us_daily` — one row per day, written each morning by a scheduled Claude task.
  - `briefing.series` / `briefing.observations` — 23 official US series pulled from FRED by `pg_cron` twice a day.
  - Site-facing functions `public.tt_today()`, `public.tt_series()`, `public.tt_catalog()` are callable **only** with the secret key.
- **Site** is Cloudflare Pages with Pages Functions (no build step):
  - `/` today's brief, `/indicators`, `/indicator/:id` — rendered on the server for SEO.
  - `/api/*` — data for charts. Blocked for scripts/bots; anonymous visitors get 1 year, signed-in users get full history.
  - `/login` — free account via Supabase email link.

## Deploy (Cloudflare Pages)

1. Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git → `buyerjg/trendtracker`.
2. Build settings: framework **None**, build command **empty**, output directory **`public`**.
3. Settings → Variables and Secrets → add **`SUPABASE_SECRET_KEY`** as type **Secret**
   (Supabase → Project Settings → API Keys → Secret keys). Never commit it.
4. Supabase → Authentication → URL Configuration: set Site URL to the Pages URL (or your domain) and add it to Redirect URLs.

## Bot protection (dashboard settings)

- Security → Bots → **Bot Fight Mode: On**.
- Security → WAF → Rate limiting rule: path starts with `/api/` → e.g. 60 requests / 1 minute per IP → Block.
- Optional: Cloudflare Turnstile on `/login` (Supabase Auth → Attack Protection → CAPTCHA).
