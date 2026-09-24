import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
// URL base do GitHub Pages (F-07, D14): única fonte é src/site.config.ts. A extensão `.ts` é
// obrigatória porque o tsconfig.node.json usa `module: nodenext`.
import { BASE_PATH } from './src/site.config.ts';

// Fontes acima da dobra (F-06, passo 4): só estes 2 arquivos ganham <link rel="preload">.
const FONTES_PRELOAD = ['plus-jakarta-sans-latin-800-normal.woff2', 'inter-latin-400-normal.woff2'];

// Plugin de preload (F-06): no build, acha no bundle o .woff2 com hash que o fonts.css gerou e injeta
// o <link rel="preload"> com o `base` resolvido (acompanha `--base` do build:pages-test). No dev não faz nada.
function preloadFontes(): Plugin {
  let base = '/';
  return {
    name: 'portifolio:preload-fontes',
    apply: 'build',
    configResolved(config) {
      base = config.base;
    },
    transformIndexHtml: {
      order: 'post',
      handler(_html, ctx) {
        const bundle = ctx.bundle;
        if (!bundle) return [];
        return FONTES_PRELOAD.map((nome) => {
          const asset = Object.values(bundle).find(
            (item) => item.type === 'asset' && item.names.includes(nome),
          );
          if (!asset)
            throw new Error(`[preload-fontes] ${nome} não está no bundle (fonts.css mudou?)`);
          return {
            tag: 'link',
            attrs: {
              rel: 'preload',
              as: 'font',
              type: 'font/woff2',
              href: `${base}${asset.fileName}`,
              crossorigin: '',
            },
            injectTo: 'head' as const,
          };
        });
      },
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  // `vite build --base …` (script build:pages-test) sobrepõe este valor sem variável de ambiente.
  base: BASE_PATH,
  plugins: [react(), preloadFontes()],
  resolve: {
    // Alias `@/` → `src/` (F-05). Mesmo mapeamento do `paths` em tsconfig.app.json.
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    target: 'es2022',
    sourcemap: false,
    // assetsInlineLimit: padrão do Vite (4 KiB), de propósito.
  },
});
