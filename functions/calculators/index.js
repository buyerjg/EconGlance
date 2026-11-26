import { page, html, SITE_NAME } from '../_layout.js';
import { CALCS } from '../_calcs.js';

export async function onRequestGet({ request }) {
  const body = `<h1>Calculators</h1>
<p class="note">Free money calculators. The inflation calculator uses the official Consumer Price Index (BLS) back to 1947.</p>
<div class="cards-link">${Object.entries(CALCS).map(([slug, c]) => `<a href="/calculators/${slug}"><strong>${c.h1}</strong><span>${c.blurb}</span></a>`).join('')}</div>`;
  return html(page({
    title: `Money calculators | ${SITE_NAME}`,
    description: 'Inflation, mortgage and compound interest calculators using official US data.',
    canonical: `${new URL(request.url).origin}/calculators`,
    body,
  }), { maxAge: 86400 });
}
