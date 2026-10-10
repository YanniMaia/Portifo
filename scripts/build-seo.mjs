// SEO (C-11): grava o bloco SEO do index.html, public/robots.txt e public/sitemap.xml a partir de
// src/content/seo.ts (que lê SITE_URL de src/site.config.ts, site.ts e pt.ts). Fonte única: este
// script não tem texto nem URL próprios.
//
// Uso: `node scripts/build-seo.mjs` (grava) ou `node scripts/build-seo.mjs --check` (só confere;
// exit 1 se algum arquivo estiver desatualizado). Rodado no `prebuild`.
// O módulo TS é carregado pelo próprio Vite (ssrLoadModule), com o alias `@/` do vite.config.ts.
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import * as prettier from 'prettier';
import { createServer } from 'vite';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const INICIO =
  '<!-- seo:inicio (gerado por scripts/build-seo.mjs a partir de src/content/seo.ts; não edite à mão) -->';
const FIM = '<!-- seo:fim -->';
const so_conferir = process.argv.includes('--check');

async function carregarSeo() {
  const servidor = await createServer({
    root: RAIZ,
    logLevel: 'error',
    appType: 'custom',
    server: { middlewareMode: true, hmr: false, ws: false },
    optimizeDeps: { noDiscovery: true, include: [] },
  });
  try {
    return await servidor.ssrLoadModule('/src/content/seo.ts');
  } finally {
    await servidor.close();
  }
}

async function indexComBloco(seo) {
  const caminho = join(RAIZ, 'index.html');
  const atual = readFileSync(caminho, 'utf8');
  const i = atual.indexOf('<!-- seo:inicio');
  const f = atual.indexOf(FIM);
  if (i < 0 || f < i)
    throw new Error('marcadores seo:inicio/seo:fim não encontrados no index.html');
  const bruto = `${atual.slice(0, i)}${INICIO}\n${seo.htmlSeo()}\n${atual.slice(f)}`;
  const opcoes = (await prettier.resolveConfig(caminho)) ?? {};
  return { caminho, atual, novo: await prettier.format(bruto, { ...opcoes, filepath: caminho }) };
}

const seo = await carregarSeo();
const index = await indexComBloco(seo);
const alvos = [
  { caminho: index.caminho, novo: index.novo },
  { caminho: join(RAIZ, 'public/robots.txt'), novo: seo.robotsTxt() },
  { caminho: join(RAIZ, 'public/sitemap.xml'), novo: seo.sitemapXml() },
];

let desatualizados = 0;
for (const { caminho, novo } of alvos) {
  const existe = existsSync(caminho);
  const atual = existe ? readFileSync(caminho, 'utf8') : undefined;
  if (atual === novo) continue;
  desatualizados += 1;
  if (so_conferir) {
    console.error(`build-seo: desatualizado: ${caminho}`);
  } else if (novo === undefined) {
    // Sem SITE_URL: não publica sitemap (nunca URL inventada).
    if (existe) rmSync(caminho);
    console.log(`build-seo: removido ${caminho} (SITE_URL vazio)`);
  } else {
    writeFileSync(caminho, novo, 'utf8');
    console.log(`build-seo: gravado ${caminho}`);
  }
}

if (!seo.caminhoOgImage()) {
  console.warn('build-seo: SITE_URL vazio: og:url, og:image, canonical, Sitemap e url omitidos');
}
if (so_conferir && desatualizados > 0) {
  console.error('build-seo: rode `node scripts/build-seo.mjs`');
  process.exit(1);
}
console.log(
  `build-seo: OK${desatualizados && !so_conferir ? ` (${desatualizados} atualizado(s))` : ''}`,
);
