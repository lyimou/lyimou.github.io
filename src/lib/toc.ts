/**
 * Build a table of contents from rendered MDX headings.
 *
 * Astro exposes `headings` from render(), already slugged and depth-tagged.
 * We only keep h2/h3 — deeper levels are noise in a 240px rail.
 */
export interface TocItem {
  depth: number;
  slug: string;
  text: string;
}

export function buildToc(headings: { depth: number; slug: string; text: string }[]): TocItem[] {
  return headings
    .filter((h) => h.depth === 2 || h.depth === 3)
    .map((h) => ({ depth: h.depth, slug: h.slug, text: h.text }));
}
