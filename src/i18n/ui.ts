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

    'hero.resume': 'Download résumé (PDF)',

    'nav.home': 'Home',
    'nav.projects': 'Projects',
    'nav.blog': 'Blog',
    'nav.about': 'About',
    'nav.creative': 'Creative',
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

    // Creative section — video editing and photography.
    'creative.title': 'Creative',
    'creative.lede':
      'Work outside code: short films I have edited, and photographs I have taken.',
    'creative.video.title': 'Video Editing',
    'creative.video.lede':
      'Pieces I have cut, graded and finished. Playback loads from YouTube only after you press play.',
    'creative.video.shortsNote': 'Vertical (9:16)',
    'creative.video.inno.desc':
      'A short introduction piece for the Inno team — shot on location and cut to a music bed.',
    'creative.video.pku.desc':
      'A vertical cut from the Peking University exchange, edited for a phone-first audience.',
    'creative.video.time.desc':
      'An explainer on the Pomodoro technique, built around motion graphics and on-screen typography.',
    'creative.photo.title': 'Photography',
    'creative.photo.lede': 'A selection of photographs I have taken.',

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

    'hero.resume': '下載履歷（PDF）',

    'nav.home': '首頁',
    'nav.projects': '項目',
    'nav.blog': '文章',
    'nav.about': '關於',
    'nav.creative': '創作',
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

    // Creative section — video editing and photography.
    'creative.title': '創作',
    'creative.lede': '寫程式以外的事：我剪輯的短片，以及我拍的照片。',
    'creative.video.title': '影片剪輯',
    'creative.video.lede': '我剪接、調色與完成的作品。按下播放後才會從 YouTube 載入。',
    'creative.video.shortsNote': '直式（9:16）',
    'creative.video.inno.desc': 'Inno 團隊的短片介紹 —— 實地拍攝，配上音樂剪輯。',
    'creative.video.pku.desc': '北京大學交換的直式短片，以手機觀看為前提剪輯。',
    'creative.video.time.desc': '番茄工作法的解說影片，以動態圖像與畫面文字構成。',
    'creative.photo.title': '攝影',
    'creative.photo.lede': '我拍攝的照片選集。',

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
