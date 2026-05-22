export const defaultLocale = 'zh';
export const locales = ['zh', 'en'] as const;
export type Locale = (typeof locales)[number];

const translations = {
  zh: {
    'nav.posts': '文章',
    'nav.tags': '标签',
    'nav.archives': '归档',
    'nav.search': '搜索',
    'ui.allPosts': '所有文章',
    'ui.recentPosts': '最新文章',
    'ui.skipToContent': '跳转到内容',
    'ui.backToTop': '返回顶部',
    'ui.goBack': '← 返回列表',
    'ui.viewSource': '查看原文 ↗',
    'ui.noArticles': '暂无文章',
    'ui.noTags': '暂无标签',
    'action.copy': '复制',
    'action.copied': '已复制',
    'action.previous': '上一页',
    'action.next': '下一页',
    'footer.copyright': '版权所有 ©',
    'footer.allRightsReserved': '保留所有权利。',
    'search.placeholder': '搜索文章...',
    'search.noResults': '未找到结果',
  },
  en: {
    'nav.posts': 'Posts',
    'nav.tags': 'Tags',
    'nav.archives': 'Archives',
    'nav.search': 'Search',
    'ui.allPosts': 'All Posts',
    'ui.recentPosts': 'Recent Posts',
    'ui.skipToContent': 'Skip to content',
    'ui.backToTop': 'Back To Top',
    'ui.goBack': '← Back to list',
    'ui.viewSource': 'View source ↗',
    'ui.noArticles': 'No articles yet',
    'ui.noTags': 'No tags yet',
    'action.copy': 'Copy',
    'action.copied': 'Copied',
    'action.previous': 'Previous',
    'action.next': 'Next',
    'footer.copyright': 'Copyright ©',
    'footer.allRightsReserved': 'All rights reserved.',
    'search.placeholder': 'Search posts...',
    'search.noResults': 'No results found',
  },
} as const;

type TranslationKey = keyof (typeof translations)['zh'];

export function t(key: TranslationKey, locale: Locale = defaultLocale): string {
  return translations[locale][key] ?? translations[defaultLocale][key] ?? key;
}

export function getLocaleFromUrl(url: URL): Locale {
  const seg = url.pathname.split('/')[1];
  return locales.includes(seg as Locale) ? (seg as Locale) : defaultLocale;
}
