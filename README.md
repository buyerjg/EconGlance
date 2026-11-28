# EconGlance

Runs on Cloudflare Workers (see Deploy below).

Daily US market brief: market closes, what moved markets, official economic data (FRED),
what America searched (Google Trends), and "this day in markets" 1–10 years ago.

## How it works

- **Data** lives in Supabase (project `trendtracker`, us-east-1; GitHub repo `buyerjg/EconGlance`):
  - `briefing.us_daily` — one row per day, written each morning by a scheduled Claude task.
  - `briefing.series` / `briefing.observations` — 23 official US series pulled from FRED by `pg_cron` twice a day.
  - Site-facing functions `public.tt_today()`, `public.tt_series()`, `public.tt_catalog()` are callable **only** with the secret key.
- **Site** is a Cloudflare Worker with static assets (no build step). `src/worker.js` routes requests to the page and API modules in `functions/`; files in `public/` are served directly. A daily cron in the Worker pings Supabase so the free project never pauses:
  - `/` today's brief, `/indicators`, `/indicator/:id` — rendered on the server for SEO.
  - `/api/*` — data for charts. Blocked for scripts/bots; anonymous visitors get 1 year, signed-in users get full history.
  - `/login` — free account via Supabase email link.

## Deploy (Cloudflare Workers)

1. Cloudflare dashboard → Workers & Pages → Create → Workers → Import a repository → `buyerjg/EconGlance`.
2. Build settings: build command **empty**, deploy command **`npx wrangler deploy`** (the default). Config is in `wrangler.jsonc`.
3. Worker → Settings → Variables and Secrets → add **`SUPABASE_SECRET_KEY`** as type **Secret**
   (Supabase → Project Settings → API Keys → Secret keys). Never commit it. Optional: `CONTACT_EMAIL` (plain text).
4. Supabase → Authentication → URL Configuration: set Site URL to the Worker URL (or your domain) and add `https://<your-domain>/**` to Redirect URLs (the wildcard lets sign-in return people to the page they were on).

## Bot protection (dashboard settings)

- Security → Bots → **Bot Fight Mode: On**.
- Security → WAF → Rate limiting rule: path starts with `/api/` → e.g. 60 requests / 1 minute per IP → Block.
- Optional: Cloudflare Turnstile on `/login` (Supabase Auth → Attack Protection → CAPTCHA).

## Company financials (SEC EDGAR)

- Source: SEC XBRL "frames" API (`data.sec.gov/api/xbrl/frames`) — US government data, free to republish.
- Tables in the `briefing` schema: `companies` (tickers), `fin_tags` (which XBRL tags map to which metric), `fin_raw` (values), `fin_bad` (values rejected as filer errors), `company_latest` (rankings summary).
- Daily job `sec-financials` (22:40 UTC) runs `briefing.refresh_financials()`: refreshes the latest years and quarters, checks suspicious annual values against each company's own 10-K (`repair_suspects`), and rebuilds rankings. Ticker list refreshes weekly (`sec-companies`).
- Pages: `/companies`, `/company/:ticker` (companies and gold/silver/crypto ETFs, `kind = fund`), `/rankings/:metric` (incl. `/rankings/fund-assets`).

## ETFs (SEC Form N-PORT)

- `briefing.etfs` lists ~300 large ETFs (`fund_key` = SEC series ID, or the trust's CIK for unit investment trusts such as SPY, DIA, MDY). `briefing.etf_holdings` keeps each fund's top 50 holdings, linked to `companies` by issuer name where unambiguous.
- Job `etf-nport` (every 5 minutes) runs `briefing.refresh_etfs(15)`: checks the 15 least recently checked ETFs for a newer public N-PORT and loads it. Every ETF is checked about once a day.
- Pages: `/etfs`, `/etf/:ticker` (top 10 public, top 50 signed in), and an "ETFs that hold …" table on each company page.

## Investor playbooks

- `/playbooks`, `/playbooks/buffett-indicator`, `/playbooks/druckenmiller-checklist`, `/playbooks/dalio-debt-cycle`.
- Definitions and rules live in `functions/_playbooks.js`; data comes from FRED series in `briefing.series` (building-block series are `hidden` from the indicator list). `?vs=YYYY-MM-DD` compares any past date with today.

## Famous investors (SEC Form 13F)

- `briefing.managers` lists ~24 well-known managers (CIK, slug, person). Job `sec-13f` (every 10 minutes) runs `briefing.refresh_managers(6)`: loads each manager's two latest original 13F-HR filings into `briefing.mgr_holdings` (values normalised to dollars), keeps two quarters, and links holdings to `companies` by CUSIP (via ETF holdings) or issuer name.
- `briefing.mgr_positions` compares the two quarters (new / added / reduced / sold).
- Pages: `/investors`, `/investor/:slug` (top 25 public, all signed in), and "Famous investors who own …" on company pages.
