import { escapeHtml as e } from '../_lib.js';
import { page, html, SITE_NAME } from '../_layout.js';
import { PLAYBOOKS } from '../_playbooks.js';

// GET /playbooks — investor playbooks index.
export async function onRequestGet(context) {
  const cards = [
    ['buffett-indicator', 'Warren Buffett', 'The Buffett Indicator', 'Total stock market value against the size of the economy — the valuation gauge Buffett once called probably the best single measure.'],
    ...Object.entries(PLAYBOOKS).map(([k, p]) => [k, p.investor, p.title, p.blurb]),
  ].map(([k, who, t, b]) => `<a href="/playbooks/${k}"><strong>${e(t)}</strong><span>${e(who)} · ${e(b)}</span></a>`).join('');
  const body = `<h1>Investor playbooks</h1>
<p class="lede">The indicators famous investors have said they watch, rebuilt from free official data and updated automatically — so you can see what those signals say today.</p>
<div class="cards-link">${cards}</div>
<p class="note">These pages describe publicly stated views and frameworks. The investors named are not affiliated with and do not endorse The Trend Brief. Not investment advice.</p>`;
  return html(page({
    title: `Investor playbooks: Buffett, Druckenmiller and Dalio indicators today | ${SITE_NAME}`,
    description: 'The Buffett Indicator, Stanley Druckenmiller’s macro checklist and Ray Dalio’s debt-cycle measures, computed daily from official US data.',
    canonical: `${new URL(context.request.url).origin}/playbooks`,
    body,
  }), { maxAge: 3600 });
}
