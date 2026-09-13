/**
 * JavaScript budget audit.
 *
 * Astro inlines small island scripts into the HTML rather than emitting
 * separate bundles, so counting `dist/**\/*.js` reports zero and misses
 * everything. This measures the bytes that actually ship:
 *
 *   - inline <script> content per HTML page (the real initial JS)
 *   - emitted external .js assets
 *   - gzip size, because that is what crosses the network
 *
 * Budget (website-requirements.md §7): initial JS <= 2 KB gzipped per page.
 *
 * Usage: node scripts/js-budget.mjs [distDir]
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { gzipSync } from 'node:zlib';

const dist = process.argv[2] ?? 'dist';
const BUDGET_GZIP = 2048;

/** Walk a directory and return every file path. */
function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

const files = walk(dist);
const htmlFiles = files.filter((f) => f.endsWith('.html'));
const jsFiles = files.filter((f) => f.endsWith('.js') && !f.includes('pagefind'));

const gz = (text) => gzipSync(Buffer.from(text, 'utf8')).length;

/** Sum inline <script> bodies, split into `is:inline` (ours) and module scripts. */
function inlineStats(html) {
  const matches = [...html.matchAll(/<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/g)];
  let ours = 0;
  let other = 0;
  for (const m of matches) {
    const isOurs = /is:inline/.test(m[0]);
    // Astro inlines its own bundled island script without the is:inline marker.
    if (isOurs) ours += m[1].length;
    else other += m[1].length;
  }
  return { ours, other, total: ours + other, count: matches.length };
}

/** External script references, so lazily-loaded bundles are not invisible. */
function externalScripts(html) {
  const refs = [];
  // Attribute values may be single- or double-quoted.
  for (const m of html.matchAll(/<script[^>]*\ssrc=["']([^"']+)["']/g)) refs.push(m[1]);
  return refs;
}

console.log('\nJavaScript budget\n' + '='.repeat(74));
console.log('page'.padEnd(38) + 'inline raw'.padStart(11) + 'inline gzip'.padStart(12) + '  vs budget');

let worst = { page: null, gzip: 0, raw: 0 };
let failures = 0;
const externalSeen = new Map();

for (const file of htmlFiles.sort()) {
  const html = readFileSync(file, 'utf8');
  const s = inlineStats(html);
  // Measure the whole inline payload, since all of it is ours today.
  const inlineText = [...html.matchAll(/<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/g)]
    .map((m) => m[1])
    .join('\n');
  const gzipLen = gz(inlineText);

  const externals = externalScripts(html);
  for (const ref of externals) {
    if (!externalSeen.has(ref)) externalSeen.set(ref, new Set());
    externalSeen.get(ref).add(relative(dist, file));
  }

  if (gzipLen > worst.gzip) worst = { page: relative(dist, file), gzip: gzipLen, raw: s.total };
  const over = gzipLen > BUDGET_GZIP;
  if (over) failures++;

  console.log(
    relative(dist, file).padEnd(38) +
      `${s.total}`.padStart(11) +
      `${gzipLen}`.padStart(12) +
      (over ? '  OVER' : '  ok') +
      (externals.length ? `  +${externals.length} external` : ''),
  );
}

console.log('='.repeat(74));
console.log(`pages audited:      ${htmlFiles.length}`);
console.log(`largest inline JS:  ${worst.page} — ${worst.gzip} B gzip (${worst.raw} B raw)`);
console.log(`budget per page:    ${BUDGET_GZIP} B gzip (inline)`);
console.log(`external JS files:  ${jsFiles.length}${jsFiles.length ? ' -> ' + jsFiles.map((f) => relative(dist, f)).join(', ') : ' (none emitted)'}`);

if (externalSeen.size > 0) {
  console.log('\nExternally referenced scripts (loaded only on the pages listed):');
  for (const [ref, pages] of externalSeen) {
    const local = join(dist, ref.replace(/^\//, ''));
    let size = 'n/a';
    try {
      const buf = readFileSync(local);
      size = `${buf.length} B raw / ${gz(buf.toString('utf8'))} B gzip`;
    } catch {
      /* referenced but not present in dist */
    }
    console.log(`  ${ref}\n      ${size}\n      on: ${[...pages].sort().join(', ')}`);
  }
}

console.log(
  failures === 0
    ? `\nRESULT: inline JS within budget on all ${htmlFiles.length} pages`
    : `\nRESULT: ${failures} page(s) exceed the inline budget`,
);
process.exit(failures === 0 ? 0 : 1);
