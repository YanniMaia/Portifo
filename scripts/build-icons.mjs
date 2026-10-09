// Gera o favicon "YE" em degradê rosa (C-09; doc de design §11 e §7.1; D14).
//   1. public/favicon.svg: quadrado com raio 12/36 do lado, degradê 135° #E0518A → #A82560 e
//      "YE" branco em Plus Jakarta Sans 800 CONVERTIDO EM CONTORNO (sem <text>, sem fonte).
//   2. public/favicon-32.png (32 × 32, cantos transparentes) e public/apple-touch-icon.png
//      (180 × 180, fundo #FFF7FA e margem interna), renderizados com o Chromium do Playwright (F-04).
//   3. Amostragem: renderiza a 16 × 16 e mede o contraste entre o pixel mais claro da letra e o
//      pixel de fundo mais próximo (o fundo "ao lado"). Falha (exit 1) se < 3:1, se o SVG passar
//      de 2 kB ou se tiver <text>.
// Uso: node scripts/build-icons.mjs
import { readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { caixaDe, carregarFonte, paraPathD } from './lib/contorno-fonte.mjs';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = join(RAIZ, 'public');
const FONTE = join(
  RAIZ,
  'node_modules/@fontsource/plus-jakarta-sans/files/plus-jakarta-sans-latin-800-normal.woff',
);

// Cores do §7.1 / token --gradient-brand (DS-01) e --color-on-brand (DS-18).
const COR_INICIO = '#E0518A';
const COR_FIM = '#A82560';
const COR_LETRA = '#FFFFFF';
const FUNDO_APPLE = '#FFF7FA'; // §3.2 Rosa névoa (cor da barra do navegador, §6)

const LADO = 64; // viewBox
const RAIO = (LADO * 12) / 36; // raio 12 px num monograma de 36 px (§7.1)
const LARGURA_LETRAS = 0.6; // "YE" ocupa 60% do lado (legível a 16 px)
const LIMITE_SVG = 2048;
const CONTRASTE_MIN = 3;

/** Iniciais vêm do site.ts (fonte única), sem duplicar o texto aqui. */
function lerIniciais() {
  const site = readFileSync(join(RAIZ, 'src/content/site.ts'), 'utf8');
  const m = /iniciais:\s*'([^']+)'/.exec(site);
  if (!m) throw new Error('site.iniciais não encontrado em src/content/site.ts');
  return m[1];
}

function gerarSvg(iniciais) {
  const { contornar } = carregarFonte(FONTE);
  const { contornos } = contornar(iniciais);
  const cx = caixaDe(contornos);
  const escala = (LADO * LARGURA_LETRAS) / (cx.xMax - cx.xMin);
  // Centro óptico = centro da caixa das letras (maiúsculas retas: sem descendente).
  const dx = LADO / 2 - ((cx.xMin + cx.xMax) / 2) * escala;
  const dy = LADO / 2 + ((cx.yMin + cx.yMax) / 2) * escala;
  const d = paraPathD(contornos, (x, y) => [x * escala + dx, dy - y * escala], 2);
  const r = Number(RAIO.toFixed(2));
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${LADO} ${LADO}">` +
    `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="${COR_INICIO}"/><stop offset="1" stop-color="${COR_FIM}"/>` +
    `</linearGradient></defs>` +
    `<rect width="${LADO}" height="${LADO}" rx="${r}" fill="url(#g)"/>` +
    `<path fill="${COR_LETRA}" d="${d}"/></svg>\n`
  );
}

const luminancia = ([r, g, b]) => {
  const c = (v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * c(r) + 0.7152 * c(g) + 0.0722 * c(b);
};
const contraste = (a, b) => {
  const [l1, l2] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
};
const hex = ([r, g, b]) => `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;

/** Renderiza um SVG num canvas N × N dentro do navegador e devolve os pixels RGBA. */
async function pixels(page, svg, n) {
  const dados = await page.evaluate(
    async ({ svg, n }) => {
      const img = new Image();
      img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
      await img.decode();
      const cv = document.createElement('canvas');
      cv.width = n;
      cv.height = n;
      const ctx = cv.getContext('2d');
      ctx.drawImage(img, 0, 0, n, n);
      return Array.from(ctx.getImageData(0, 0, n, n).data);
    },
    { svg, n },
  );
  return (x, y) => dados.slice((y * n + x) * 4, (y * n + x) * 4 + 4);
}

async function renderizarPng(page, svg, { tamanho, fundo, icone }) {
  const margem = (tamanho - icone) / 2;
  await page.setViewportSize({ width: tamanho, height: tamanho });
  await page.setContent(
    `<!doctype html><html><body style="margin:0;background:${fundo}">` +
      `<img alt="" style="display:block;position:absolute;left:${margem}px;top:${margem}px;` +
      `width:${icone}px;height:${icone}px" src="data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}">` +
      `</body></html>`,
  );
  await page.locator('img').evaluate((img) => img.decode());
  return page.screenshot({ omitBackground: fundo === 'transparent', type: 'png' });
}

async function main() {
  const iniciais = lerIniciais();
  const svg = gerarSvg(iniciais);
  const falhas = [];
  if (/<text[\s>]/i.test(svg)) falhas.push('favicon.svg contém <text>');
  const bytes = Buffer.byteLength(svg);
  if (bytes > LIMITE_SVG) falhas.push(`favicon.svg tem ${bytes} B (> ${LIMITE_SVG})`);
  writeFileSync(join(PUBLIC, 'favicon.svg'), svg);

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ deviceScaleFactor: 1 });

    // Amostragem a 16 × 16: com letras e só o fundo (mesmo SVG sem o <path> das letras).
    const N = 16;
    const com = await pixels(page, svg, N);
    const sem = await pixels(page, svg.replace(/<path[^>]*\/>/, ''), N);
    let letra = null;
    for (let y = 0; y < N; y += 1) {
      for (let x = 0; x < N; x += 1) {
        const px = com(x, y);
        if (px[3] < 255) continue;
        const l = luminancia(px);
        if (!letra || l > letra.l) letra = { x, y, l, rgb: px.slice(0, 3) };
      }
    }
    // Fundo ao lado: pixel opaco mais próximo que é igual ao render sem letras (sem tinta da letra).
    let fundo = null;
    for (let raio = 1; raio < N && !fundo; raio += 1) {
      for (let y = letra.y - raio; y <= letra.y + raio && !fundo; y += 1) {
        for (let x = letra.x - raio; x <= letra.x + raio && !fundo; x += 1) {
          if (x < 0 || y < 0 || x >= N || y >= N) continue;
          if (Math.max(Math.abs(x - letra.x), Math.abs(y - letra.y)) !== raio) continue;
          const a = com(x, y);
          const b = sem(x, y);
          if (a[3] < 255) continue;
          if (a.slice(0, 3).every((v, i) => Math.abs(v - b[i]) <= 2)) {
            fundo = { x, y, rgb: a.slice(0, 3) };
          }
        }
      }
    }
    const razao = contraste(letra.rgb, fundo.rgb);
    console.log(
      `16×16: letra ${hex(letra.rgb)} em (${letra.x},${letra.y}); fundo ao lado ` +
        `${hex(fundo.rgb)} em (${fundo.x},${fundo.y}); contraste ${razao.toFixed(2)}:1`,
    );
    if (razao < CONTRASTE_MIN) falhas.push(`contraste a 16 px ${razao.toFixed(2)}:1 (< 3:1)`);

    const png32 = await renderizarPng(page, svg, { tamanho: 32, fundo: 'transparent', icone: 32 });
    writeFileSync(join(PUBLIC, 'favicon-32.png'), png32);
    const png180 = await renderizarPng(page, svg, { tamanho: 180, fundo: FUNDO_APPLE, icone: 136 });
    writeFileSync(join(PUBLIC, 'apple-touch-icon.png'), png180);
  } finally {
    await browser.close();
  }

  for (const f of ['favicon.svg', 'favicon-32.png', 'apple-touch-icon.png']) {
    console.log(`${f}: ${statSync(join(PUBLIC, f)).size} B`);
  }
  if (falhas.length) {
    console.error(`build-icons: FALHOU\n- ${falhas.join('\n- ')}`);
    process.exit(1);
  }
  console.log('build-icons: OK');
}

await main();
