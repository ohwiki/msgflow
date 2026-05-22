import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import remarkDirective from 'remark-directive';
import { remarkEmbeds } from './src/plugins/remark-embeds.mjs';

export default defineConfig({
  site: 'https://read.yourdomain.com',
  output: 'static',
  i18n: {
    defaultLocale: 'zh',
    locales: ['zh', 'en'],
    routing: { prefixDefaultLocale: false },
  },
  integrations: [sitemap()],
  markdown: {
    remarkPlugins: [remarkDirective, remarkEmbeds],
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark-dimmed',
      },
    },
  },
  vite: {
    css: {
      postcss: {
        plugins: [(await import('@tailwindcss/postcss')).default],
      },
    },
  },
});
