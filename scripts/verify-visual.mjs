/**
 * Visual + layout verification harness.
 *
 *   node scripts/verify-visual.mjs [baseUrl]
 *
 * Requires a server already serving the built site (npm run preview).
 *
 * What it does — all checks are measurements, not impressions:
 *   1. Screenshots each page at 1440px in light and dark mode.
 *   2. Screenshots the home page at 768px and 375px.
 *   3. Detects horizontal overflow (scrollWidth > clientWidth) per element.
 *   4. Detects interactive elements below the 44x44 touch-target minimum.
 *   5. Reports any console errors the page produced.
 *
 * Output: screenshots/ and a printed report. Exits non-zero on layout failures.
 */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const base = process.argv[2] ?? 'http://localhost:4321';
const outDir = 'screenshots';

const pages = [
  ['home', '/'],
  ['projects', '/projects/'],
  ['project-detail', '/projects/arduino-mnist-inference/'],
  ['blog', '/blog/'],
  ['tags', '/tags/'],
  ['creative', '/creative/'],
  ['about', '/about/'],
  ['search', '/search/'],
  ['components', '/dev/components/'],
  ['zh-home', '/zh/'],
  ['zh-projects', '/zh/projects/'],
  ['zh-project-detail', '/zh/projects/arduino-mnist-inference/'],
  ['zh-tags', '/zh/tags/'],
  ['zh-creative', '/zh/creative/'],
  ['zh-about', '/zh/about/'],
  ['404', '/404.html'],
];

const desktop = { width: 1440, height: 900 };
const tablet = { width: 768, height: 1024 };
const mobile = { width: 375, height: 812 };

const MIN_TARGET = 44;

async function audit(page) {
  return page.evaluate((minTarget) => {
    const problems = { overflow: [], smallTargets: [], structure: [] };

    /*
     * 0. Structural assertions.
     *
     * These exist because a class passed to a child component used to receive a
     * scoped-style rule that never matched, leaving the header stacked. Purely
     * numeric checks (overflow/targets) did not catch it — the header simply
     * got taller. So assert the shell actually laid out as designed.
     */
    const shell = [
      ['.site-header__inner', 'flex'],
      ['.site-nav-list', 'flex'],
      ['.site-header__controls', 'flex'],
    ];
    for (const [sel, expected] of shell) {
      const el = document.querySelector(sel);
      if (!el) {
        problems.structure.push({ selector: sel, issue: 'missing' });
        continue;
      }
      const display = getComputedStyle(el).display;
      if (display !== expected) {
        problems.structure.push({ selector: sel, issue: `display is "${display}", expected "${expected}"` });
      }
    }

    // The header must be a single row at desktop width.
    if (window.innerWidth >= 1024) {
      const inner = document.querySelector('.site-header__inner');
      const header = document.querySelector('.site-header');
      if (inner && header) {
        const headerH = header.getBoundingClientRect().height;
        if (headerH > 90) {
          problems.structure.push({
            selector: '.site-header',
            issue: `height ${Math.round(headerH)}px suggests the header wrapped (expected ~72px)`,
          });
        }
      }
    }

    // 1. Horizontal overflow — only flag elements that actually push the page wider.
    const docOverflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;
    if (docOverflow > 1) {
      problems.overflow.push({
        selector: 'documentElement',
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        overBy: docOverflow,
      });
    }
    for (const el of document.body.querySelectorAll('*')) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      const style = getComputedStyle(el);
      if (style.position === 'fixed' || style.position === 'absolute') continue;
      if (r.right > window.innerWidth + 1 || r.left < -1) {
        problems.overflow.push({
          selector:
            el.tagName.toLowerCase() +
            (el.id ? `#${el.id}` : '') +
            (el.className && typeof el.className === 'string'
              ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.')
              : ''),
          left: Math.round(r.left),
          right: Math.round(r.right),
          viewport: window.innerWidth,
        });
      }
    }

    // 2. Touch targets.
    const interactive = document.querySelectorAll('a[href], button, input, select, textarea');
    for (const el of interactive) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue; // hidden
      // Exclusive/inline exemptions per WCAG 2.5.8:
      //  - links inline within a block of text
      //  - controls explicitly marked compact (data-compact)
      const isInlineInText = el.tagName === 'A' && el.closest('p, li, td, blockquote');
      if (isInlineInText || el.hasAttribute('data-compact')) continue;
      if (r.height < minTarget - 0.5 || r.width < 24) {
        problems.smallTargets.push({
          text: (el.textContent ?? '').trim().slice(0, 40),
          tag: el.tagName.toLowerCase(),
          w: Math.round(r.width),
          h: Math.round(r.height),
        });
      }
    }

    return problems;
  }, MIN_TARGET);
}

const browser = await chromium.launch();
await mkdir(outDir, { recursive: true });

let failures = 0;
const report = [];

for (const [name, path] of pages) {
  for (const theme of ['light', 'dark']) {
    const context = await browser.newContext({
      viewport: desktop,
      colorScheme: theme === 'dark' ? 'dark' : 'light',
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    const consoleErrors = [];
    page.on('console', (m) => {
      if (m.type() === 'error') consoleErrors.push(m.text());
    });
    page.on('pageerror', (e) => consoleErrors.push(String(e)));

    await page.goto(base + path, { waitUntil: 'load' });
    if (theme === 'dark') {
      // Force the class rather than relying on media emulation, so we exercise
      // the same path the toggle uses.
      await page.evaluate(() => document.documentElement.classList.add('dark'));
      await page.waitForTimeout(60);
    }

    const problems = await audit(page);
    await page.screenshot({
      path: join(outDir, `${name}-1440-${theme}.png`),
      fullPage: true,
    });

    const bad =
      problems.overflow.length > 0 ||
      problems.smallTargets.length > 0 ||
      problems.structure.length > 0 ||
      consoleErrors.length > 0;
    if (bad) failures++;
    report.push({ name, theme, viewport: '1440', ...problems, consoleErrors });
    await context.close();
  }
}

// Responsive spot checks on the densest page.
for (const [label, viewport] of [
  ['768', tablet],
  ['375', mobile],
]) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  await page.goto(base + '/', { waitUntil: 'load' });
  const problems = await audit(page);
  await page.screenshot({ path: join(outDir, `home-${label}-light.png`), fullPage: true });
  if (problems.overflow.length > 0) failures++;
  report.push({ name: 'home', theme: 'light', viewport: label, consoleErrors: [], ...problems });
  await context.close();
}

await browser.close();

console.log('\nVisual verification report\n' + '='.repeat(64));
for (const r of report) {
  const overflow = r.overflow.length;
  const small = r.smallTargets.length;
  const struct = r.structure.length;
  const errs = r.consoleErrors.length;
  const status = overflow || small || struct || errs ? 'ISSUES' : 'clean';
  console.log(
    `${(r.name + ' @' + r.viewport + ' ' + r.theme).padEnd(34)} overflow:${String(overflow).padStart(2)}  smallTargets:${String(small).padStart(2)}  structure:${String(struct).padStart(2)}  consoleErrors:${String(errs).padStart(2)}  ${status}`,
  );
  for (const o of r.overflow.slice(0, 6)) {
    console.log(`      overflow  ${JSON.stringify(o)}`);
  }
  for (const s of r.smallTargets.slice(0, 6)) {
    console.log(`      small     ${s.tag} "${s.text}" ${s.w}x${s.h}`);
  }
  for (const t of r.structure.slice(0, 6)) {
    console.log(`      structure ${t.selector}: ${t.issue}`);
  }
  for (const e of r.consoleErrors.slice(0, 4)) {
    console.log(`      console   ${e}`);
  }
}
console.log('='.repeat(64));
console.log(`screenshots written to ${outDir}/`);
console.log(failures === 0 ? 'RESULT: no layout issues detected' : `RESULT: ${failures} view(s) with issues`);
process.exit(failures === 0 ? 0 : 1);
