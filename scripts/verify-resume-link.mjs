// Verify the résumé link markup and label encoding in the built homepage,
// and confirm the PDF itself is the file we think it is.
import { readFileSync, statSync } from 'node:fs';

let pass = 0;
let fail = 0;
const ok = (n, c, d = '') => {
  if (c) { pass++; console.log(`  PASS  ${n}`); }
  else { fail++; console.log(`  FAIL  ${n}${d ? `  (${d})` : ''}`); }
};

const html = readFileSync('dist/index.html', 'utf8');

console.log('\nresume download link\n' + '='.repeat(54));

// 1. the href exists and carries the download attribute
const links = [...html.matchAll(/<a\b[^>]*href="\/Andy_Huang_Resume\.pdf"[^>]*>([^<]*)<\/a>/g)];
ok('homepage links to /Andy_Huang_Resume.pdf', links.length > 0, `found ${links.length}`);
ok('the link carries the download attribute',
  links.every((m) => m[0].includes('download')));

// 2. the label decodes correctly. Reading as UTF-8 and comparing to the exact
//    string catches a mojibake regression that a console print would hide.
const labels = links.map((m) => m[1]);
ok('label is correct UTF-8 "Download résumé (PDF)"',
  labels.includes('Download résumé (PDF)'), JSON.stringify(labels));

// 3. it also appears in the contact block, not only the hero
ok('link appears more than once (hero + contact)', links.length >= 2, String(links.length));

// 4. the served file is a real PDF of the expected size
const st = statSync('dist/Andy_Huang_Resume.pdf');
const head = readFileSync('dist/Andy_Huang_Resume.pdf').subarray(0, 5).toString('latin1');
ok('dist PDF exists and is non-trivial in size', st.size > 50_000, `${st.size} bytes`);
ok('dist PDF starts with the %PDF- signature', head === '%PDF-', JSON.stringify(head));

// 5. page count, so the file on the site is the one-page build
const raw = readFileSync('dist/Andy_Huang_Resume.pdf').toString('latin1');
const pages = (raw.match(/\/Type\s*\/Page(?![s])/g) ?? []).length;
ok('site copy is still one page', pages === 1, String(pages));

console.log('='.repeat(54));
console.log(`${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
