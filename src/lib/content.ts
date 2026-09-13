/**
 * Content access helpers.
 *
 * Both collections store one file per language under `<collection>/<lang>/`,
 * so a glob-loader id looks like `en/arduino-mnist-inference`. These helpers
 * normalise that into a slug plus the entry's own `lang` field, and keep
 * sorting/filtering rules in one place.
 */
import { getCollection, type CollectionEntry } from 'astro:content';
import type { Lang } from '../i18n/ui';

export type ProjectEntry = CollectionEntry<'projects'>;
export type BlogEntry = CollectionEntry<'blog'>;

/** `en/arduino-mnist-inference` -> `arduino-mnist-inference` */
export function slugOf(id: string): string {
  const parts = id.split('/');
  return parts[parts.length - 1] ?? id;
}

/** Drafts are omitted from production builds, but shown in `astro dev`. */
function isVisible(entry: BlogEntry): boolean {
  if (import.meta.env.PROD && entry.data.draft) return false;
  return true;
}

/* ------------------------------- projects -------------------------------- */

export async function getProjects(lang: Lang): Promise<ProjectEntry[]> {
  const all = await getCollection('projects');
  return all
    .filter((e) => e.data.lang === lang)
    .sort((a, b) => a.data.order - b.data.order || a.data.title.localeCompare(b.data.title));
}

export async function getFeaturedProjects(lang: Lang, limit?: number): Promise<ProjectEntry[]> {
  const projects = (await getProjects(lang)).filter((e) => e.data.featured);
  return typeof limit === 'number' ? projects.slice(0, limit) : projects;
}

export async function getProjectSlugs(): Promise<{ lang: Lang; slug: string }[]> {
  const all = await getCollection('projects');
  return all.map((e) => ({ lang: e.data.lang, slug: slugOf(e.id) }));
}

/* --------------------------------- blog ---------------------------------- */

export async function getPosts(lang: Lang): Promise<BlogEntry[]> {
  const all = await getCollection('blog');
  return all
    .filter((e) => e.data.lang === lang && isVisible(e))
    .sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());
}

export async function getPostSlugs(): Promise<{ lang: Lang; slug: string }[]> {
  const all = await getCollection('blog');
  return all.filter(isVisible).map((e) => ({ lang: e.data.lang, slug: slugOf(e.id) }));
}

/** Tags with post counts, most used first. */
export async function getTags(lang: Lang): Promise<{ tag: string; count: number }[]> {
  const posts = await getPosts(lang);
  const counts = new Map<string, number>();
  for (const post of posts) {
    for (const tag of post.data.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

/** Categories with post counts. */
export async function getCategories(lang: Lang): Promise<{ category: string; count: number }[]> {
  const posts = await getPosts(lang);
  const counts = new Map<string, number>();
  for (const post of posts) {
    const c = post.data.category;
    counts.set(c, (counts.get(c) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count || a.category.localeCompare(b.category));
}

/** All distinct tag slugs, for static path generation (both languages). */
export async function getAllTagParams(): Promise<{ lang: Lang; tag: string }[]> {
  const langs: Lang[] = ['en', 'zh'];
  const out: { lang: Lang; tag: string }[] = [];
  for (const lang of langs) {
    for (const { tag } of await getTags(lang)) out.push({ lang, tag: slugifyTag(tag) });
  }
  return out;
}

export async function getAllCategoryParams(): Promise<{ lang: Lang; category: string }[]> {
  const langs: Lang[] = ['en', 'zh'];
  const out: { lang: Lang; category: string }[] = [];
  for (const lang of langs) {
    for (const { category } of await getCategories(lang)) {
      out.push({ lang, category: slugifyTag(category) });
    }
  }
  return out;
}

/** URL-safe form of a tag/category label, used for both links and params. */
export function slugifyTag(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fff]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Posts sharing a tag, excluding the post itself. */
export async function getRelatedPosts(
  lang: Lang,
  currentSlug: string,
  tags: string[],
  limit = 3,
): Promise<BlogEntry[]> {
  const posts = await getPosts(lang);
  return posts
    .filter((p) => slugOf(p.id) !== currentSlug)
    .map((p) => ({ post: p, shared: p.data.tags.filter((t) => tags.includes(t)).length }))
    .filter((x) => x.shared > 0)
    .sort((a, b) => b.shared - a.shared)
    .slice(0, limit)
    .map((x) => x.post);
}

/* ------------------------------ formatting ------------------------------- */

export function formatDate(date: Date, lang: Lang): string {
  return new Intl.DateTimeFormat(lang === 'zh' ? 'zh-Hant-HK' : 'en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

/** Rough reading time from rendered prose. Used for blog list metadata. */
export function readingTime(body: string | undefined, lang: Lang): string {
  const words = (body ?? '').trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 200));
  return lang === 'zh' ? `約 ${minutes} 分鐘` : `${minutes} min read`;
}
