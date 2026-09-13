import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { getPosts, slugOf } from '../lib/content';
import { localizePath } from '../i18n/ui';

/**
 * RSS feed for the English posts.
 *
 * Chinese posts are intentionally excluded: mixing two languages in one feed
 * makes it unreadable in a reader, and the site's default language is English.
 * A separate /zh/rss.xml would be the way to add them later.
 *
 * NOTE: drafts are filtered out by getPosts() in a production build, so this
 * feed is empty until at least one post is published. An empty feed is valid
 * RSS but useless — check the <item> count when adding the first post.
 */
export async function GET(context: APIContext) {
  const posts = await getPosts('en');

  return rss({
    title: 'Andy Huang — Blog',
    description:
      'Technical writing by Andy Huang, Computer Science student at HKUST.',
    site: context.site ?? 'https://lyimou.github.io',
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: localizePath('en', `/blog/${slugOf(post.id)}`),
      categories: [...post.data.tags, post.data.category],
    })),
    customData: '<language>en</language>',
  });
}
