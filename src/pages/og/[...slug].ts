import { OGImageRoute } from 'astro-og-canvas';
import { getPosts, slugOf } from '../../lib/content';

/**
 * Open Graph social cards, one PNG per published blog post.
 *
 * Generated at build time by astro-og-canvas (canvaskit under the hood).
 *
 * Fonts are fetched from fontsource during the build and cached under
 * node_modules/.astro-og-canvas, so they add zero bytes to the deployed site.
 * Two families are needed because one cannot cover both scripts:
 *
 *   Noto Sans SC — CJK, used by the Chinese cards
 *   Noto Sans    — Latin fallback, used by the English cards
 *
 * An earlier version stripped non-Latin characters instead; that rendered the
 * Chinese card as the single word "Agent", which is worse than no image at all.
 */
interface CardData {
  title: string;
  description: string;
}

const FONTS = [
  'https://api.fontsource.org/v1/fonts/noto-sans-sc/chinese-simplified-400-normal.ttf',
  'https://api.fontsource.org/v1/fonts/noto-sans-sc/chinese-simplified-700-normal.ttf',
  'https://api.fontsource.org/v1/fonts/noto-sans/latin-400-normal.ttf',
  'https://api.fontsource.org/v1/fonts/noto-sans/latin-700-normal.ttf',
];

/**
 * Family names as CanvasKit parses them from the font binaries — NOT the names
 * you would expect from the fontsource URLs. `DEBUG=astro-og-canvas` prints them
 * during a build:
 *
 *   Loaded 2 font families: Noto Sans SC Thin, Noto Sans
 *
 * Using 'Noto Sans SC' here silently falls back to a CJK-less face and renders
 * every Chinese glyph as a tofu box.
 */
const FAMILIES = ['Noto Sans SC Thin', 'Noto Sans'];

const enPosts = await getPosts('en');
const zhPosts = await getPosts('zh');

const pages: Record<string, CardData> = Object.fromEntries([
  ...enPosts.map((post): [string, CardData] => [
    `en/${slugOf(post.id)}`,
    { title: post.data.title, description: post.data.description },
  ]),
  ...zhPosts.map((post): [string, CardData] => [
    `zh/${slugOf(post.id)}`,
    { title: post.data.title, description: post.data.description },
  ]),
  /*
   * Standing pages get a card too, otherwise `ogImage` on them points at a
   * route that was never generated and the social preview 404s.
   * One locale-agnostic card at /og/creative.png serves both /creative/ and
   * /zh/creative/.
   */
  ['creative', { title: 'Creative', description: 'Video editing and photography.' }],
]);

export const { getStaticPaths, GET } = await OGImageRoute({
  pages,
  getImageOptions: (_path: string, page: CardData) => ({
    title: page.title,
    description: page.description,
    bgGradient: [
      [250, 250, 249],
      [239, 246, 255],
    ],
    border: { color: [37, 99, 235], width: 12, side: 'inline-start' },
    padding: 70,
    fonts: FONTS,
    font: {
      title: {
        color: [41, 37, 36],
        size: 64,
        weight: 'Bold' as const,
        families: FAMILIES,
      },
      description: {
        color: [107, 101, 96],
        size: 30,
        weight: 'Normal' as const,
        families: FAMILIES,
      },
    },
  }),
});
