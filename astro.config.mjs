// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://allinone.elconceptodigital.com',
  output: 'static',
  integrations: [
    // Solo páginas indexables (privacidad y 404 llevan noindex).
    sitemap({ filter: (page) => !/\/(privacidad|404)$/.test(page) }),
  ],
  trailingSlash: 'never',
  // Sin la barra de herramientas de Astro en `npm run dev` (tapa la barra CTA móvil).
  devToolbar: { enabled: false },
  build: {
    // Una sola página: el CSS va inline y no bloquea el render con una petición extra.
    inlineStylesheets: 'always',
    format: 'file',
  },
  // Las fuentes se descargan en el build y se sirven desde el propio dominio (sin Google Fonts en runtime).
  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: 'Inter',
      cssVariable: '--font-inter',
      weights: [400, 500, 600],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['system-ui', 'sans-serif'],
    },
    {
      provider: fontProviders.fontsource(),
      name: 'Playfair Display',
      cssVariable: '--font-playfair',
      weights: [400],
      styles: ['italic'],
      subsets: ['latin'],
      fallbacks: ['Georgia', 'serif'],
    },
    {
      // PROVISIONAL: se elimina cuando llegue el logo SVG oficial.
      provider: fontProviders.fontsource(),
      name: 'Bebas Neue',
      cssVariable: '--font-bebas',
      weights: [400],
      styles: ['normal'],
      subsets: ['latin'],
      fallbacks: ['sans-serif'],
    },
  ],
});
