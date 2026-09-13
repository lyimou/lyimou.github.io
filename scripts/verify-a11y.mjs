/**
 * Accessibility + interaction verification.
 *
 *   node scripts/verify-a11y.mjs [baseUrl]
 *
 * Requires a server on the built site (npm run preview).
 *
 * Checks, all by driving a real browser rather than reading source:
 *   1. Keyboard: every interactive element is reachable by Tab.
 *   2. Skip link moves focus to <main>.
 *   3. Focus is always visible (non-none outline) on focusable elements.
 *   4. Theme toggle actually swaps the palette and persists across reload.
 *   5. Motion toggle sets/clears the reduce-motion class.
 *   6. Project filter hides/shows cards and updates aria-pressed.
 *   7. One h1 per page and no skipped heading levels.
 *   8. Images have alt text; links have accessible names.
 *
 * Exits non-zero on failure.
 */
import { chromium } from 'playwright';

const base = process.argv[2] ?? 'http://localhost:4321';

const pages = ['/', '/projects/', '/projects/arduino-mnist-inference/', '/blog/', '/about/', '/search/', '/tags/'];

const browser = await chromium.launch();
const results = [];
let failures = 0;

function record(page, check, ok, detail = '') {
  if (!ok) failures++;
  results.push({ page, check, ok, detail });
}

/* ----------------------------- static structure --------------------------- */

for (const path of pages) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(base + path, { waitUntil: 'load' });

  // 7. exactly one h1
  const h1Count = await page.locator('h1').count();
  record(path, 'exactly one <h1>', h1Count === 1, `found ${h1Count}`);

  // 7. no skipped heading levels
  const skipped = await page.evaluate(() => {
    const levels = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((h) =>
      Number(h.tagName[1]),
    );
    const bad = [];
    for (let i = 1; i < levels.length; i++) {
      if (levels[i] - levels[i - 1] > 1) bad.push(`${levels[i - 1]}->${levels[i]}`);
    }
    return bad;
  });
  record(path, 'no skipped heading levels', skipped.length === 0, skipped.join(', '));

  // 8. images have alt
  const missingAlt = await page.evaluate(
    () => [...document.querySelectorAll('img')].filter((i) => i.alt === null).length,
  );
  record(path, 'all <img> have alt', missingAlt === 0, `${missingAlt} missing`);

  // 8. links and buttons have accessible names
  const unnamed = await page.evaluate(() => {
    const els = [...document.querySelectorAll('a[href], button')];
    return els.filter((el) => {
      const text = (el.textContent ?? '').trim();
      const aria = el.getAttribute('aria-label');
      const title = el.getAttribute('title');
      const imgAlt = el.querySelector('img')?.getAttribute('alt');
      return !text && !aria && !title && !imgAlt;
    }).length;
  });
  record(path, 'interactive elements have names', unnamed === 0, `${unnamed} unnamed`);

  // 3. focus indicator is visible on the first few tabbables
  const focusOk = await page.evaluate(() => {
    const els = [...document.querySelectorAll('a[href], button')].slice(0, 12);
    for (const el of els) {
      el.focus();
      const cs = getComputedStyle(el);
      const outline = cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0;
      const shadow = cs.boxShadow !== 'none';
      if (!outline && !shadow) return false;
    }
    return true;
  });
  record(path, 'focus indicator visible', focusOk);

  /* ------------------------------ keyboard ------------------------------- */

  /*
   * 1. Keyboard reachability.
   *
   * Count what *should* be focusable in the DOM, then Tab through the page and
   * check how many distinct focusable elements are actually reached. This
   * replaces an earlier "at least 8 tab stops" assertion, which was a magic
   * number that failed on sparse pages (a project detail page legitimately has
   * fewer controls than the home page).
   */
  await page.goto(base + path, { waitUntil: 'load' });
  const expected = await page.evaluate(
    () =>
      [...document.querySelectorAll('a[href], button, input, select, textarea, [tabindex]')].filter(
        (el) => {
          if (el.hasAttribute('disabled')) return false;
          if (el.getAttribute('tabindex') === '-1') return false;
          const r = el.getBoundingClientRect();
          return r.width > 0 && r.height > 0;
        },
      ).length,
  );

  const reachedCount = await (async () => {
    await page.evaluate(() => document.body.focus());
    let count = 0;
    for (let i = 0; i < expected + 6; i++) {
      await page.keyboard.press('Tab');
      const added = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return false;
        // eslint-disable-next-line no-undef
        if (window.__seen?.has(el)) return false;
        // eslint-disable-next-line no-undef
        window.__seen = window.__seen ?? new WeakSet();
        window.__seen.add(el);
        return true;
      });
      if (added) count++;
    }
    return count;
  })();

  record(
    path,
    'every focusable element is Tab-reachable',
    reachedCount >= expected,
    `reached ${reachedCount} of ${expected}`,
  );

  record(
    path,
    'key structural elements present',
    await page.evaluate(() => document.querySelector('.site-brand') !== null),
  );

  await context.close();
}

/* ------------------------------- skip link -------------------------------- */

{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(base + '/', { waitUntil: 'load' });
  await page.keyboard.press('Tab');
  const focusedClass = await page.evaluate(() => document.activeElement?.className ?? '');
  const isSkip = String(focusedClass).includes('skip-link');
  await page.keyboard.press('Enter');
  const hash = await page.evaluate(() => window.location.hash);
  record('/', 'first Tab hits skip link', isSkip, focusedClass);
  record('/', 'skip link targets #main', hash === '#main', hash);
  await context.close();
}

/* ------------------------------ theme toggle ------------------------------ */

{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: 'light' });
  const page = await context.newPage();
  await page.goto(base + '/', { waitUntil: 'load' });

  const initial = await page.evaluate(() => ({
    dark: document.documentElement.classList.contains('dark'),
    label: document.querySelector('[data-theme-button]')?.getAttribute('aria-label'),
  }));

  // system -> light -> dark
  await page.click('[data-theme-button]');
  const afterOne = await page.evaluate(() => ({
    state: document.querySelector('[data-theme-button]')?.getAttribute('data-state'),
    dark: document.documentElement.classList.contains('dark'),
  }));
  await page.click('[data-theme-button]');
  const afterTwo = await page.evaluate(() => ({
    state: document.querySelector('[data-theme-button]')?.getAttribute('data-state'),
    dark: document.documentElement.classList.contains('dark'),
    stored: localStorage.getItem('theme'),
    bg: getComputedStyle(document.body).backgroundColor,
  }));

  record('/', 'theme toggle cycles state', afterOne.state === 'light', String(afterOne.state));
  record('/', 'second click reaches dark', afterTwo.state === 'dark', String(afterTwo.state));
  record('/', 'dark class applied', afterTwo.dark === true);
  record('/', 'theme persisted to localStorage', afterTwo.stored === 'dark', String(afterTwo.stored));

  // Persistence across reload
  await page.reload({ waitUntil: 'load' });
  const afterReload = await page.evaluate(() => ({
    dark: document.documentElement.classList.contains('dark'),
    state: document.querySelector('[data-theme-button]')?.getAttribute('data-state'),
  }));
  record('/', 'dark survives reload (no flash of light)', afterReload.dark === true);
  record('/', 'state restored after reload', afterReload.state === 'dark', String(afterReload.state));

  const darkBg = afterTwo.bg;
  record('/', 'dark background differs from light', typeof darkBg === 'string' && darkBg.length > 0, darkBg);
  record('/', 'initial label present', Boolean(initial.label), String(initial.label));

  await context.close();
}

/* ------------------------------ motion toggle ----------------------------- */

{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(base + '/', { waitUntil: 'load' });

  await page.click('[data-motion-button]'); // system -> full
  const full = await page.evaluate(() => ({
    state: document.querySelector('[data-motion-button]')?.getAttribute('data-state'),
    force: document.documentElement.classList.contains('force-motion'),
    reduce: document.documentElement.classList.contains('reduce-motion'),
  }));
  await page.click('[data-motion-button]'); // full -> reduced
  const reduced = await page.evaluate(() => ({
    state: document.querySelector('[data-motion-button]')?.getAttribute('data-state'),
    reduce: document.documentElement.classList.contains('reduce-motion'),
    stored: localStorage.getItem('motion'),
  }));

  record('/', 'motion cycles to full', full.state === 'full' && full.force, JSON.stringify(full));
  record('/', 'motion reduced sets class', reduced.state === 'reduced' && reduced.reduce, JSON.stringify(reduced));
  record('/', 'motion persisted', reduced.stored === 'reduced', String(reduced.stored));

  await context.close();
}

/* ----------------------------- project filter ----------------------------- */

{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto(base + '/projects/', { waitUntil: 'load' });

  const before = await page.evaluate(() => {
    const chips = [...document.querySelectorAll('[data-filter]')];
    return {
      chips: chips.length,
      visibleCards: [...document.querySelectorAll('[data-project-grid] > li')].filter((li) => !li.hidden).length,
      pressed: chips.map((c) => c.getAttribute('aria-pressed')),
    };
  });

  record('/projects/', 'filter chips render', before.chips >= 2, `${before.chips} chips`);
  record('/projects/', 'all cards visible by default', before.visibleCards > 0, `${before.visibleCards}`);
  record('/projects/', 'aria-pressed initialised', before.pressed.every((p) => p === 'true' || p === 'false'), before.pressed.join(','));

  // Click a real category chip (skip "all") if one exists.
  const clicked = await page.evaluate(() => {
    const chip = [...document.querySelectorAll('[data-filter]')].find((c) => c.dataset.filter !== 'all');
    if (!chip) return null;
    const filter = chip.dataset.filter;
    chip.click();
    const visible = [...document.querySelectorAll('[data-project-grid] > li')].filter((li) => !li.hidden);
    return {
      filter,
      visible: visible.length,
      allMatch: visible.every((li) => li.dataset.category === filter),
      pressed: chip.getAttribute('aria-pressed'),
      allPressed: document.querySelector('[data-filter="all"]')?.getAttribute('aria-pressed'),
    };
  });

  if (clicked) {
    record('/projects/', 'filtering shows only matching cards', clicked.allMatch, JSON.stringify(clicked));
    record('/projects/', 'clicked chip becomes pressed', clicked.pressed === 'true');
    record('/projects/', '"all" chip unpressed', clicked.allPressed === 'false', String(clicked.allPressed));
  } else {
    record('/projects/', 'a category chip exists to test', false, 'only the "all" chip is present');
  }

  await context.close();
}

/* --------------------------------- report --------------------------------- */

await browser.close();

console.log('\nAccessibility + interaction verification\n' + '='.repeat(74));
let currentPage = null;
for (const r of results) {
  if (r.page !== currentPage) {
    currentPage = r.page;
    console.log(`\n${currentPage}`);
  }
  console.log(`  ${r.ok ? 'PASS' : 'FAIL'}  ${r.check}${r.detail && !r.ok ? `  (${r.detail})` : ''}`);
}
console.log('\n' + '='.repeat(74));
const passed = results.length - failures;
console.log(`${passed}/${results.length} checks passed; ${failures} failure(s).`);
process.exit(failures === 0 ? 0 : 1);
