/**
 * Live link audit: crawls the deployed site over HTTP and reports non-200s.
 *
 *   node scripts/verify-links-live.mjs [origin] [maxPages]
 *
 * Starts at the origin, follows same-origin links breadth-first, and records
 * every internal URL that does not return 200. This validates the *hosted*
 * result, including whether .nojekyll protected /_astro/ and whether Pagefind
 * assets were shipped.
 */
const origin = (process.argv[2] ?? 'https://lyimou.github.io').replace(/\/$/, '');
const maxPages = Number(process.argv[3] ?? 40);

const seen = new Set();
const queue = ['/'];
const good = [];
const bad = [];

async function head(url) {
  try {
    const res = await fetch(url, { redirect: 'follow' });
    return { status: res.status, type: res.headers.get('content-type') ?? '' };
  } catch (e) {
    return { status: 0, type: `error: ${e.message}` };
  }
}

while (queue.length > 0 && seen.size < maxPages) {
  const path = queue.shift();
  if (seen.has(path)) continue;
  seen.add(path);

  const { status, type } = await head(origin + path);
  if (status === 200) good.push(path);
  else bad.push({ path, status });

  if (status !== 200) continue;
  if (!type.includes('text/html')) continue;

  const res = await fetch(origin + path);
  const html = await res.text();
  for (const m of html.matchAll(/(?:href|src)="(\/[^"]*)"/g)) {
    const raw = m[1];
    if (raw.startsWith('//')) continue;
    const clean = raw.split(/[?#]/)[0];
    if (!clean || clean === '/') continue;
    // skip binary-ish assets from the crawl queue but still probe them
    if (/\.(woff2?|ico|png|jpe?g|webp|svg|xml|txt|js|css)$/.test(clean)) {
      if (!seen.has(clean)) {
        seen.add(clean);
        const a = await head(origin + clean);
        if (a.status === 200) good.push(clean);
        else bad.push({ path: clean, status: a.status });
      }
      continue;
    }
    if (!seen.has(clean)) queue.push(clean);
  }
}

console.log('\nLive link audit — ' + origin + '\n' + '='.repeat(60));
console.log(`URLs checked : ${good.length + bad.length}`);
console.log(`OK           : ${good.length}`);
console.log(`FAILED       : ${bad.length}`);
if (bad.length > 0) {
  console.log('\nNon-200 responses:');
  for (const b of bad) console.log(`  ${b.status === 0 ? 'ERR' : b.status}  ${b.path}`);
}
process.exit(bad.length === 0 ? 0 : 1);
