import react from '@vitejs/plugin-react';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
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

// Styleguide (DS-05): no dev, `http://localhost:5173/__styleguide` (sem a base /Portifolio/) redireciona
// para `<base>__styleguide`, onde o main.tsx monta a página. Só `serve`: não existe no build.
function atalhoStyleguide(): Plugin {
  return {
    name: 'portifolio:atalho-styleguide',
    apply: 'serve',
    configureServer(server) {
      const base = server.config.base;
      server.middlewares.use((req, res, next) => {
        const url = req.url ?? '';
        if (base !== '/' && /^\/__styleguide\/?(?:[?#]|$)/.test(url)) {
          res.statusCode = 302;
          res.setHeader(
            'Location',
            `${base}${url.slice(1).replace(/^__styleguide\/?/, '__styleguide')}`,
          );
          res.end();
          return;
        }
        next();
      });
    },
  };
}

// Página 404 no preview (D-03): imita o GitHub Pages. Caminho dentro do `base` que não é arquivo nem
// pasta com index.html responde 404 com o `404.html` do build (em vez do index.html do fallback SPA).
// O site é página única (âncoras), então nenhuma rota depende do fallback. Só `vite preview`.
function pagina404NoPreview(): Plugin {
  return {
    name: 'portifolio:pagina-404-preview',
    configurePreviewServer(server) {
      const base = server.config.base;
      const dist = resolve(server.config.root, server.config.build.outDir);
      server.middlewares.use((req, res, next) => {
        if (req.method !== 'GET' && req.method !== 'HEAD') return next();
        const caminho = decodeURIComponent((req.url ?? '/').split(/[?#]/)[0] ?? '/');
        if (!caminho.startsWith(base)) return next();
        const alvo = join(dist, caminho.slice(base.length));
        const existe =
          existsSync(alvo) && (statSync(alvo).isFile() || existsSync(join(alvo, 'index.html')));
        const pagina = join(dist, '404.html');
        if (existe || !existsSync(pagina)) return next();
        res.statusCode = 404;
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(req.method === 'HEAD' ? undefined : readFileSync(pagina));
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  // `vite build --base …` (script build:pages-test) sobrepõe este valor sem variável de ambiente.
  base: BASE_PATH,
  plugins: [react(), preloadFontes(), atalhoStyleguide(), pagina404NoPreview()],
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
