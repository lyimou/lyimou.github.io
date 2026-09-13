/**
 * UI strings and locale routing helpers.
 * All user-facing chrome text lives here — do not hard-code strings in components.
 */

export const languages = {
  en: 'English',
  zh: '中文',
} as const;

export type Lang = keyof typeof languages;

export const defaultLang: Lang = 'en';

export const ui = {
  en: {
    'site.title': 'Andy Huang',
    'site.tagline': 'Computer Science student at HKUST',
    'site.description':
      'Personal site and technical blog of Andy Huang — Computer Science student at HKUST, working mostly in C++ and Python.',

    'nav.home': 'Home',
    'nav.projects': 'Projects',
    'nav.blog': 'Blog',
    'nav.about': 'About',
    'nav.search': 'Search',

    'section.featured': 'Featured projects',
    'section.about': 'About',
    'section.contact': 'Get in touch',

    'projects.title': 'Projects',
    'projects.all': 'All',
    'projects.filter.course': 'Coursework',
    'projects.filter.personal': 'Personal',
    'projects.filter.tool': 'Tools',
    'projects.empty': 'No projects in this category yet.',
    'projects.repo': 'Repository',
    'projects.demo': 'Live demo',

    'blog.title': 'Blog',
    'blog.empty': 'No posts yet.',
    'blog.readMore': 'Read more',
    'blog.tags': 'Tags',
    'blog.categories': 'Categories',
    'blog.published': 'Published',
    'blog.updated': 'Updated',
    'blog.draft': 'Draft',
    'blog.prev': 'Previous',
    'blog.next': 'Next',
    'blog.related': 'Related posts',

    'search.title': 'Search',
    'search.placeholder': 'Search posts…',

    'about.title': 'About',
    'about.education': 'Education',
    'about.experience': 'Experience',
    'about.skills': 'Skills',
    'about.skills.built': 'Built with',
    'about.skills.familiar': 'Familiar with',
    'about.skills.languages': 'Languages',

    'notfound.title': 'Page not found',
    'notfound.body': 'That page does not exist.',
    'notfound.home': 'Back to home',

    'theme.label': 'Theme',
    'theme.light': 'Light',
    'theme.dark': 'Dark',
    'theme.system': 'System',
    'motion.label': 'Motion',
    'motion.system': 'Follow system',
    'motion.full': 'Full',
    'motion.reduced': 'Reduced',

    'footer.builtWith': 'Built with Astro',
    'a11y.skip': 'Skip to content',
    'nav.main': 'Main',
  },
  zh: {
    'site.title': '黃浩華',
    'site.tagline': '香港科技大學計算機科學學生',
    'site.description': '黃浩華（Andy Huang）的個人網站與技術博客 —— 香港科技大學計算機科學學生，主要使用 C++ 與 Python。',

    'nav.home': '首頁',
    'nav.projects': '項目',
    'nav.blog': '文章',
    'nav.about': '關於',
    'nav.search': '搜尋',

    'section.featured': '精選項目',
    'section.about': '關於我',
    'section.contact': '聯絡我',

    'projects.title': '項目',
    'projects.all': '全部',
    'projects.filter.course': '課程項目',
    'projects.filter.personal': '個人項目',
    'projects.filter.tool': '工具',
    'projects.empty': '此分類暫無項目。',
    'projects.repo': '代碼倉庫',
    'projects.demo': '線上演示',

    'blog.title': '文章',
    'blog.empty': '暫無文章。',
    'blog.readMore': '閱讀全文',
    'blog.tags': '標籤',
    'blog.categories': '分類',
    'blog.published': '發佈於',
    'blog.updated': '更新於',
    'blog.draft': '草稿',
    'blog.prev': '上一篇',
    'blog.next': '下一篇',
    'blog.related': '相關文章',

    'search.title': '搜尋',
    'search.placeholder': '搜尋文章…',

    'about.title': '關於',
    'about.education': '教育背景',
    'about.experience': '經歷',
    'about.skills': '技能',
    'about.skills.built': '實際項目中使用',
    'about.skills.familiar': '熟悉',
    'about.skills.languages': '語言',

    'notfound.title': '找不到頁面',
    'notfound.body': '此頁面不存在。',
    'notfound.home': '返回首頁',

    'theme.label': '主題',
    'theme.light': '淺色',
    'theme.dark': '深色',
    'theme.system': '跟隨系統',
    'motion.label': '動效',
    'motion.system': '跟隨系統',
    'motion.full': '完整',
    'motion.reduced': '減少',

    'footer.builtWith': '使用 Astro 構建',
    'a11y.skip': '跳至主要內容',
    'nav.main': '主導覽',
  },
} as const;

export type UIKey = keyof (typeof ui)['en'];

/** Translate a key for a locale, falling back to the default locale. */
export function t(lang: Lang, key: UIKey): string {
  return ui[lang][key] ?? ui[defaultLang][key];
}

/** Derive the active locale from a URL pathname. */
export function getLangFromUrl(url: URL): Lang {
  const [, first] = url.pathname.split('/');
  if (first === 'zh') return 'zh';
  return defaultLang;
}

/**
 * Build a locale-aware path.
 * `localizePath('zh', '/projects/')` -> '/zh/projects/'
 * `localizePath('en', '/projects/')` -> '/projects/'
 */
export function localizePath(lang: Lang, path: string): string {
  const clean = '/' + path.replace(/^\/+/, '');
  const withSlash = clean.endsWith('/') ? clean : `${clean}/`;
  if (lang === defaultLang) return withSlash;
  return `/${lang}${withSlash}`;
}

/** Swap the locale segment of a pathname, preserving the rest of the path. */
export function switchLocalePath(pathname: string, target: Lang): string {
  const stripped = pathname.replace(/^\/zh(?=\/|$)/, '');
  const normalized = stripped === '' ? '/' : stripped;
  return localizePath(target, normalized);
}
