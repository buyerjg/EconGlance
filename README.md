# The Trend Brief

Live at https://thetrendbrief.pages.dev

Daily US market brief: market closes, what moved markets, official economic data (FRED),
what America searched (Google Trends), and "this day in markets" 1–10 years ago.

## How it works

- **Data** lives in Supabase (project `trendtracker`, us-east-1; GitHub repo `buyerjg/trendtracker`):
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
4. Supabase → Authentication → URL Configuration: set Site URL to the Pages URL (or your domain) and add `https://<your-domain>/**` to Redirect URLs (the wildcard lets sign-in return people to the page they were on).

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
