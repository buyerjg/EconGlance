import { escapeHtml as e } from './_lib.js';
import { page, html, SITE_NAME } from './_layout.js';

const UPDATED = 'November 28, 2026';

function contactLine(env) {
  const m = env && env.CONTACT_EMAIL;
  return m && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(m)
    ? `<a href="mailto:${e(m)}">${e(m)}</a>`
    : 'the address on our <a href="/contact">contact page</a>';
}

const PAGES = {
  about: {
    title: 'About EconGlance and our data sources',
    description: 'What EconGlance is, where every number comes from, and how often it updates.',
    body: (env) => `<h1>About EconGlance</h1>
<div class="prose">
<p class="lede">EconGlance puts the numbers behind the market news in one place: today’s markets, the economy, the finances of US public companies, what ETFs hold and what well-known investors own.</p>
<p>Almost everything here comes straight from official public records. We do not buy data from vendors, and we show where each figure comes from so you can check it.</p>
<h2>Where the data comes from</h2>
<ul>
<li><strong>Economic indicators</strong> — the Treasury, Federal Reserve, Bureau of Labor Statistics, Bureau of Economic Analysis, Census Bureau and Energy Information Administration, collected through FRED® from the Federal Reserve Bank of St. Louis. Updated twice a day.</li>
<li><strong>Company financials</strong> — annual and quarterly reports (10-K and 10-Q) filed with the SEC, read from EDGAR’s XBRL data. Updated daily as companies file.</li>
<li><strong>ETF holdings</strong> — the monthly portfolio reports (Form N-PORT) funds file with the SEC. Funds publish these with a delay of up to 60 days.</li>
<li><strong>Investor portfolios</strong> — quarterly 13F reports that money managers with over $100 million in US stocks file with the SEC, up to 45 days after each quarter.</li>
<li><strong>Corporate bond spreads</strong> — the Gilchrist–Zakrajšek spread published by the Federal Reserve Board.</li>
<li><strong>Daily market brief</strong> — closing prices and news summaries, each linked to its source.</li>
</ul>
<h2>What to keep in mind</h2>
<p>Official data gets revised, filings sometimes contain errors, and we may make mistakes reading them. We check figures against the original filings and fix problems when we find them, but always confirm anything important at the source before you act on it.</p>
<p>EconGlance is for information only. It is not investment, tax or legal advice, and nothing here is a recommendation to buy or sell any security. Investors and firms named on this site are not affiliated with EconGlance and do not endorse it.</p>
<h2>Who runs it</h2>
<p>EconGlance is an independent site published from Seoul, South Korea. It is not affiliated with any government agency, exchange, fund company or investment firm. Questions and corrections are welcome at ${contactLine(env)}.</p>
</div>`,
  },
  privacy: {
    title: 'Privacy policy',
    description: 'What information EconGlance collects, how it is used, and your choices.',
    body: (env) => `<h1>Privacy policy</h1>
<div class="prose">
<p class="note">Last updated ${UPDATED}</p>
<p>This policy explains what information EconGlance (“we”) collects when you use econglance.pages.dev and any domain we move to, and what we do with it.</p>
<h2>If you just read the site</h2>
<p>You can use most of EconGlance without an account. We do not ask for your name. Our hosting provider, Cloudflare, processes standard request data such as your IP address, browser type and the pages you request in order to deliver the site, keep it secure and block abusive traffic. We use this only in aggregate and do not use it to identify you.</p>
<p>Your browser stores your light or dark theme choice on your device. It is never sent to us.</p>
<h2>If you create an account</h2>
<p>To sign in, you give us your email address and we send you a sign-in link. Accounts are managed by our authentication provider, Supabase. We store your email address, when your account was created and when you last signed in. A sign-in token is kept in your browser so you stay signed in. We use your email only to sign you in and, rarely, to tell you about important changes to the service. We do not sell it or share it for marketing.</p>
<p>You can ask us to delete your account at any time by writing to ${contactLine(env)}.</p>
<h2>Advertising</h2>
<p>We may show ads to keep the site free. When we do, third-party vendors, including Google, use cookies to serve ads based on your prior visits to this and other websites. Google’s advertising cookies let it and its partners serve ads based on your visits here and elsewhere. You can opt out of personalized advertising in <a href="https://adssettings.google.com" rel="noopener">Google Ads Settings</a>, or opt out of some other vendors at <a href="https://www.aboutads.info/choices/" rel="noopener">aboutads.info</a>. Visitors in the European Economic Area, the UK and Switzerland will be asked for consent before personalized ads are shown.</p>
<h2>Who processes data for us</h2>
<ul>
<li>Cloudflare, Inc. — hosting, content delivery and security</li>
<li>Supabase, Inc. — database and sign-in accounts</li>
<li>Google LLC — advertising, when ads are shown</li>
</ul>
<p>These companies may process data in the United States and other countries.</p>
<h2>How long we keep it</h2>
<p>We keep account data until you delete your account. Hosting logs are kept by Cloudflare for a limited period under its own policy.</p>
<h2>Your rights</h2>
<p>Depending on where you live, including under California law and the GDPR, you may have the right to see, correct, delete or move your personal information, and to object to certain uses. We do not sell personal information. To make a request, write to ${contactLine(env)}; we will respond within 30 days.</p>
<h2>Children</h2>
<p>EconGlance is not directed at children under 13, and we do not knowingly collect their information.</p>
<h2>Changes</h2>
<p>If we change this policy we will update the date above, and for significant changes we will post a notice on the site.</p>
</div>`,
  },
  terms: {
    title: 'Terms of use',
    description: 'The terms for using EconGlance and its data.',
    body: (env) => `<h1>Terms of use</h1>
<div class="prose">
<p class="note">Last updated ${UPDATED}</p>
<p>By using EconGlance you agree to these terms. If you do not agree, please do not use the site.</p>
<h2>Information only, not advice</h2>
<p>Everything on EconGlance is provided for general information. It is not investment, financial, tax or legal advice, and it is not an offer or recommendation to buy or sell any security. You are responsible for your own decisions. Consider talking to a licensed professional before making investment decisions.</p>
<h2>Accuracy</h2>
<p>We take data from official public sources and work to present it correctly, but data can be delayed, revised or wrong, and we may make errors. The site is provided “as is”, without warranties of any kind, including accuracy, completeness or fitness for a particular purpose.</p>
<h2>Using the site</h2>
<p>You may read the site and share links to it, and quote reasonable amounts with a link back to the page. You may not scrape, copy in bulk, or resell the site’s content or data, use automated tools to download it, interfere with the site’s operation, or try to get around access limits. Underlying government data remains in the public domain and can be obtained from its original source.</p>
<h2>Accounts</h2>
<p>You are responsible for activity under your account. We may suspend accounts that break these terms or harm the service.</p>
<h2>Third parties</h2>
<p>People and firms named on the site, such as investors and fund managers, are not affiliated with EconGlance and do not endorse it. Links to other sites are provided for convenience; we are not responsible for their content.</p>
<h2>Limitation of liability</h2>
<p>To the fullest extent the law allows, EconGlance and its operator are not liable for any loss or damage arising from your use of the site or reliance on its information, including investment losses.</p>
<h2>Changes and law</h2>
<p>We may update these terms; continuing to use the site means you accept the updated terms. These terms are governed by the laws of the Republic of Korea, except where the law of your country of residence requires otherwise.</p>
<p>Questions: ${contactLine(env)}.</p>
</div>`,
  },
  contact: {
    title: 'Contact EconGlance',
    description: 'How to reach EconGlance with questions, corrections or data requests.',
    body: (env) => {
      const m = env && env.CONTACT_EMAIL && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(env.CONTACT_EMAIL) ? env.CONTACT_EMAIL : null;
      return `<h1>Contact</h1>
<div class="prose">
<p class="lede">Found a number that looks wrong, or want to suggest an indicator, company or investor to add? We read every message.</p>
${m ? `<p>Email <a href="mailto:${e(m)}">${e(m)}</a></p>` : '<p>Our contact address is being set up. Please check back soon.</p>'}
<p>For corrections, the page address and the figure you are questioning help us check it quickly against the original filing.</p>
<p class="note">We can’t give personal investment advice.</p>
</div>`;
    },
  },
};

export function staticPage(name) {
  return async ({ request, env }) => {
    const p = PAGES[name];
    const origin = new URL(request.url).origin;
    return html(page({
      title: `${p.title} | ${SITE_NAME}`,
      description: p.description,
      canonical: `${origin}/${name}`,
      crumbs: [['Home', '/'], [p.title, `/${name}`]],
      body: p.body(env),
    }), { maxAge: 86400 });
  };
}

export function notFoundPage(request) {
  const origin = new URL(request.url).origin;
  return html(page({
    title: `Page not found | ${SITE_NAME}`,
    description: 'This page does not exist.',
    canonical: `${origin}/`,
    noindex: true,
    path: '/404',
    body: `<div class="notfound"><h1>We couldn’t find that page</h1>
<p>The address may be mistyped, or the page may have moved. Try searching for a ticker, company, investor or topic.</p>
<form class="search big" action="/search" method="get" role="search"><label for="nf-q" class="sr-only">Search</label><input id="nf-q" name="q" type="search" placeholder="Ticker, company, investor or topic"></form>
<div class="cards-link small"><a href="/"><strong>Today’s markets</strong></a><a href="/indicators"><strong>Economic indicators</strong></a><a href="/companies"><strong>Companies</strong></a><a href="/investors"><strong>Investor portfolios</strong></a></div></div>`,
  }), { maxAge: 300, status: 404 });
}
