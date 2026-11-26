import { page, html, SITE_NAME } from '../_layout.js';
import { CALCS } from '../_calcs.js';

export async function onRequestGet({ params, request }) {
  const slug = String(params.name || '');
  const c = CALCS[slug];
  if (!c) return html(page({ title: `Not found | ${SITE_NAME}`, description: '', body: '<h1>Calculator not found</h1><p><a href="/calculators">All calculators</a></p>' }), { maxAge: 300 });
  const body = `<p class="crumbs"><a href="/calculators">Calculators</a></p>
<h1>${c.h1}</h1>
<section class="chart-box" data-calc="${slug}">${c.form}</section>
<section><h2>How it works</h2>${c.about}</section>`;
  return html(page({
    title: `${c.title} | ${SITE_NAME}`,
    description: c.description,
    canonical: `${new URL(request.url).origin}/calculators/${slug}`,
    body,
    scripts: '<script src="/calc.js" defer></script>',
  }), { maxAge: 86400 });
}
