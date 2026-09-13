/**
 * Dead-link audit over the built site.
 *
 *   node scripts/verify-links.mjs [distDir]
 *
 * Parses every generated HTML file, collects internal href/src targets, and
 * resolves each one against the filesystem the way the static host would
 * (directory -> index.html). External links are listed but not fetched, so this
 * runs offline.
 *
 * Written after a localised RSS link shipped as `/zh/rss.xml` — a page that did
 * not exist. Spot-checking by hand missed it; this does not.
 *
 * Exits non-zero if any internal target is missing.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, dirname, resolve } from 'node:path';

const dist = resolve(process.argv[2] ?? 'dist');

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

/** Would the host serve this absolute path? */
function resolves(urlPath) {
  const clean = decodeURIComponent(urlPath.split(/[?#]/)[0]);
  const target = join(dist, clean.replace(/^\//, ''));
  if (existsSync(target) && statSync(target).isFile()) return true;
  // directory index
  if (existsSync(join(target, 'index.html'))) return true;
  // extensionless pretty URL -> /path/index.html
  if (existsSync(join(target + '.html'))) return true;
  return false;
}

const problems = [];
const externals = new Set();
let internalCount = 0;

for (const file of htmlFiles) {
  const html = readFileSync(file, 'utf8');
  const page = '/' + relative(dist, file).replace(/\\/g, '/');

  for (const m of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const raw = m[1].trim();
    if (!raw) continue;
    if (/^(https?:)?\/\//.test(raw) || raw.startsWith('mailto:') || raw.startsWith('tel:')) {
      externals.add(raw);
      continue;
    }
    if (raw.startsWith('#')) continue;

    internalCount++;
    const abs = raw.startsWith('/') ? raw : '/' + join(dirname(relative(dist, file)), raw).replace(/\\/g, '/');
    if (!resolves(abs)) {
      problems.push({ page, target: raw });
    }
  }
}

console.log('\nLink audit\n' + '='.repeat(66));
console.log(`pages scanned : ${htmlFiles.length}`);
console.log(`internal refs : ${internalCount}`);
console.log(`external refs : ${externals.size} (not fetched)`);

if (problems.length === 0) {
  console.log('\nRESULT: no dead internal links');
  process.exit(0);
}

console.log(`\nDEAD LINKS (${problems.length}):`);
const seen = new Set();
for (const p of problems) {
  const key = `${p.page} -> ${p.target}`;
  if (seen.has(key)) continue;
  seen.add(key);
  console.log(`  ${p.page}\n      -> ${p.target}`);
}
process.exit(1);
