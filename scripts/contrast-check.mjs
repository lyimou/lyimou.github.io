/**
 * WCAG 2.1 contrast audit for the design tokens.
 *
 * Run with:  node scripts/contrast-check.mjs
 * Exits non-zero if any audited pair falls below its required ratio.
 *
 * This is deliberately a script and not a judgement call: "looks clear enough"
 * is not a measurement. See website-requirements.md §3.5.
 */

const hex = (h) => {
  const s = h.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16));
};
const lin = (c) => {
  c /= 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
};
const lum = (h) => {
  const [r, g, b] = hex(h);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
};
const ratio = (a, b) => {
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};

/** Tokens — keep in sync with src/styles/global.css */
const T = {
  light: {
    bg: '#FAFAF9',
    surface: '#FFFFFF',
    divider: '#E7E5E4',
    border: '#8F8880',
    text: '#292524',
    muted: '#6B6560',
    primary: '#2563EB',
    primaryHover: '#1D4ED8',
  },
  dark: {
    bg: '#0F172A',
    surface: '#1E293B',
    divider: '#334155',
    border: '#64748B',
    text: '#F1F5F9',
    muted: '#94A3B8',
    /** Link / focus colour — a light blue reads well as text on dark. */
    primary: '#60A5FA',
    /** Filled button background — darker, so white label text stays legible. */
    primaryFill: '#2563EB',
    primaryHover: '#93C5FD',
  },
};

/** [label, fg, bg, minimum ratio] */
const cases = [
  // ---- Light ----
  ['light: body text on bg', T.light.text, T.light.bg, 4.5],
  ['light: body text on surface', T.light.text, T.light.surface, 4.5],
  ['light: muted text on bg', T.light.muted, T.light.bg, 4.5],
  ['light: muted text on surface', T.light.muted, T.light.surface, 4.5],
  ['light: link on bg', T.light.primary, T.light.bg, 4.5],
  ['light: link on surface', T.light.primary, T.light.surface, 4.5],
  ['light: white on primary button', '#FFFFFF', T.light.primary, 4.5],
  ['light: white on primary hover', '#FFFFFF', T.light.primaryHover, 4.5],
  ['light: focus ring on bg', T.light.primary, T.light.bg, 3.0],
  ['light: input border on surface', T.light.border, T.light.surface, 3.0],

  // ---- Dark ----
  ['dark: body text on bg', T.dark.text, T.dark.bg, 4.5],
  ['dark: body text on surface', T.dark.text, T.dark.surface, 4.5],
  ['dark: muted text on bg', T.dark.muted, T.dark.bg, 4.5],
  ['dark: muted text on surface', T.dark.muted, T.dark.surface, 4.5],
  ['dark: link on bg', T.dark.primary, T.dark.bg, 4.5],
  ['dark: link on surface', T.dark.primary, T.dark.surface, 4.5],
  ['dark: white on primary button', '#FFFFFF', T.dark.primaryFill, 4.5],
  ['dark: focus ring on bg', T.dark.primary, T.dark.bg, 3.0],
  ['dark: input border on surface', T.dark.border, T.dark.surface, 3.0],
];

/**
 * Decorative one-pixel dividers are intentionally exempt from the 3:1 rule.
 * WCAG 1.4.11 requires contrast for components needed to *identify* a control;
 * a section rule carries no information, so a subtle line is legitimate.
 * These are reported for information only and never fail the check.
 */
const informational = [
  ['light: section divider on bg (decorative)', T.light.divider, T.light.bg],
  ['dark: section divider on bg (decorative)', T.dark.divider, T.dark.bg],
];

let failures = 0;

console.log('\nAudited pairs (WCAG AA)\n' + '-'.repeat(62));
console.log('pair'.padEnd(38) + 'ratio'.padStart(7) + '  min'.padStart(6) + '  result');
for (const [label, fg, bg, min] of cases) {
  const r = ratio(fg, bg);
  const ok = r >= min;
  if (!ok) failures++;
  console.log(
    label.padEnd(38) +
      r.toFixed(2).padStart(7) +
      min.toFixed(1).padStart(6) +
      (ok ? '  PASS' : '  FAIL'),
  );
}

console.log('\nInformational (decorative, not subject to 1.4.11)\n' + '-'.repeat(62));
for (const [label, fg, bg] of informational) {
  console.log(label.padEnd(38) + ratio(fg, bg).toFixed(2).padStart(7));
}

console.log(
  `\n${cases.length - failures}/${cases.length} audited pairs pass; ${failures} failure(s).`,
);
process.exit(failures === 0 ? 0 : 1);
