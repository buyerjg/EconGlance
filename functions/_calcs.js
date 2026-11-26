export const CALCS = {
  inflation: {
    h1: 'Inflation calculator',
    title: 'Inflation calculator: what is a dollar from any year worth today?',
    blurb: 'What a dollar from any year since 1947 is worth today, using official CPI.',
    description: 'See what an amount of money from any month since 1947 is worth today, using the official US Consumer Price Index (CPI-U).',
    form: `
  <div class="controls">
    <label>Amount ($)<input id="inf-amount" type="number" min="0" step="0.01" value="100"></label>
    <label>From (year-month)<input id="inf-from" type="month" min="1947-01" value="2015-01"></label>
    <label>To (year-month)<input id="inf-to" type="month" min="1947-01"></label>
  </div>
  <div class="calc-result" id="inf-result">—</div>
  <p class="note" id="inf-detail"></p>`,
    about: '<p>The calculator compares the Consumer Price Index for All Urban Consumers (CPI-U, seasonally adjusted) for the two months you pick. If prices rose 40% between them, $100 then buys about what $140 buys now. Source: U.S. Bureau of Labor Statistics via FRED.</p>',
  },
  mortgage: {
    h1: 'Mortgage calculator',
    title: 'Mortgage calculator: monthly payment and total interest',
    blurb: 'Monthly payment, total interest and payoff for a fixed-rate mortgage.',
    description: 'Calculate the monthly payment, total interest and total cost of a fixed-rate mortgage.',
    form: `
  <div class="controls">
    <label>Home price ($)<input id="mtg-price" type="number" min="0" step="1000" value="400000"></label>
    <label>Down payment ($)<input id="mtg-down" type="number" min="0" step="1000" value="80000"></label>
    <label>Interest rate (%)<input id="mtg-rate" type="number" min="0" step="0.01" value="6.5"></label>
    <label>Term (years)<select id="mtg-term"><option>30</option><option>20</option><option>15</option><option>10</option></select></label>
  </div>
  <div class="calc-result" id="mtg-result">—</div>
  <p class="note" id="mtg-detail"></p>`,
    about: '<p>Uses the standard amortization formula for a fixed-rate loan: payment = P·r / (1 − (1 + r)<sup>−n</sup>), where r is the monthly rate and n the number of payments. Taxes, insurance and PMI are not included.</p>',
  },
  'compound-interest': {
    h1: 'Compound interest calculator',
    title: 'Compound interest calculator with monthly contributions',
    blurb: 'How savings grow with a starting amount, monthly additions and a yearly return.',
    description: 'See how an investment grows with compound interest, a starting balance and monthly contributions.',
    form: `
  <div class="controls">
    <label>Starting amount ($)<input id="ci-start" type="number" min="0" step="100" value="10000"></label>
    <label>Monthly contribution ($)<input id="ci-monthly" type="number" min="0" step="50" value="500"></label>
    <label>Annual return (%)<input id="ci-rate" type="number" step="0.1" value="7"></label>
    <label>Years<input id="ci-years" type="number" min="1" max="80" step="1" value="20"></label>
  </div>
  <div class="calc-result" id="ci-result">—</div>
  <p class="note" id="ci-detail"></p>`,
    about: '<p>Interest compounds monthly and contributions are added at the end of each month. Returns are not guaranteed; this is an illustration, not investment advice.</p>',
  },
};
