// Gera a imagem de prévia Open Graph 1200 × 630 (C-10; doc de design §11, §3.2, §3.4; D14).
// Abre o modelo assets-src/og/og.html no Chromium do Playwright (F-04), injeta os textos das
// fontes únicas (site.ts → nome; pt.ts → meta.ogFrase) e captura public/og-image.png.
// Amostragens (falha com exit 1):
//   - dimensão exata 1200 × 630 e peso ≤ 300 kB;
//   - só monograma, nome e frase (nenhum outro texto ou imagem no modelo);
//   - área segura: nome, frase e monograma dentro dos 1080 × 560 centrais;
//   - nenhum pixel com matiz HSL entre 190° e 300° (pixels acromáticos, R = G = B, não têm matiz);
//   - contraste ≥ 4,5:1 do nome (cor mais clara do degradê) e da frase contra o fundo amostrado
//     (pixel mais escuro do fundo, renderizado sem os textos, dentro da caixa de cada texto).
// Uso: node scripts/build-og.mjs
import { readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from '@playwright/test';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MODELO = join(RAIZ, 'assets-src/og/og.html');
const SAIDA = join(RAIZ, 'public/og-image.png');
const W = 1200;
const H = 630;
const SEGURA = { x0: (W - 1080) / 2, y0: (H - 560) / 2, x1: (W + 1080) / 2, y1: (H + 560) / 2 };
const PESO_MAX = 300 * 1024;
const CONTRASTE_MIN = 4.5;
const CROMA_ARREDONDAMENTO = 3; // ver corrigirQuantizacao

function lerTextos() {
  const site = readFileSync(join(RAIZ, 'src/content/site.ts'), 'utf8');
  const pt = readFileSync(join(RAIZ, 'src/content/pt.ts'), 'utf8');
  const nome = /\bnome:\s*'([^']+)'/.exec(site)?.[1];
  const frase = /\bogFrase:\s*'([^']+)'/.exec(pt)?.[1];
  if (!nome || !frase) throw new Error('nome (site.ts) ou meta.ogFrase (pt.ts) não encontrado');
  return { nome, frase };
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
const hex = (rgb) => `#${rgb.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
const rgbDe = (css) =>
  css
    .match(/\d+(\.\d+)?/g)
    .slice(0, 3)
    .map(Number);

/** Decodifica um PNG no navegador e devolve os pixels RGBA (Uint8 em array simples). */
async function decodificar(page, png) {
  return page.evaluate(async (b64) => {
    const img = new Image();
    img.src = `data:image/png;base64,${b64}`;
    await img.decode();
    const cv = document.createElement('canvas');
    cv.width = img.naturalWidth;
    cv.height = img.naturalHeight;
    const ctx = cv.getContext('2d');
    ctx.drawImage(img, 0, 0);
    return {
      w: cv.width,
      h: cv.height,
      d: Array.from(ctx.getImageData(0, 0, cv.width, cv.height).data),
    };
  }, png.toString('base64'));
}

/**
 * Correção de arredondamento de 8 bits: um degradê de rosa (#FFDCE9, #F9D5E3) para branco gera
 * pixels quase brancos como #FFFEFF ou #FEFBFE, cujo matiz calculado é 300° (G arredonda antes
 * de B). Esses pixels (croma max − min ≤ 3, invisível) viram cinza neutro; qualquer pixel com
 * croma maior no intervalo proibido continua reprovando a checagem. Reencoda o PNG no Chromium.
 */
async function corrigirQuantizacao(page, png) {
  return page.evaluate(
    async ({ b64, limite }) => {
      const img = new Image();
      img.src = `data:image/png;base64,${b64}`;
      await img.decode();
      const cv = document.createElement('canvas');
      cv.width = img.naturalWidth;
      cv.height = img.naturalHeight;
      const ctx = cv.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const dados = ctx.getImageData(0, 0, cv.width, cv.height);
      const d = dados.data;
      let corrigidos = 0;
      for (let i = 0; i < d.length; i += 4) {
        const [r, g, b] = [d[i], d[i + 1], d[i + 2]];
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const c = max - min;
        if (c === 0 || c > limite) continue;
        let h = max === r ? ((g - b) / c) % 6 : max === g ? (b - r) / c + 2 : (r - g) / c + 4;
        h *= 60;
        if (h < 0) h += 360;
        if (h >= 190 && h <= 300) {
          const cinza = Math.round((r + g + b) / 3);
          d[i] = cinza;
          d[i + 1] = cinza;
          d[i + 2] = cinza;
          corrigidos += 1;
        }
      }
      ctx.putImageData(dados, 0, 0);
      return { b64: cv.toDataURL('image/png').split(',')[1], corrigidos };
    },
    { b64: png.toString('base64'), limite: CROMA_ARREDONDAMENTO },
  );
}

function matiz([r, g, b]) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === min) return null;
  const d = max - min;
  let h;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h *= 60;
  return h < 0 ? h + 360 : h;
}

async function main() {
  const textos = lerTextos();
  const falhas = [];
  // Sem antialiasing subpixel (LCD): ele cria franjas azuladas nas letras (matiz ~225°).
  const browser = await chromium.launch({ args: ['--disable-lcd-text'] });
  try {
    const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
    await page.goto(pathToFileURL(MODELO).href);
    await page.evaluate((t) => {
      document.querySelector('[data-texto="nome"]').textContent = t.nome;
      document.querySelector('[data-texto="frase"]').textContent = t.frase;
    }, textos);
    await page.evaluate(async () => {
      await document.fonts.ready;
      await Promise.all([...document.images].map((i) => i.decode()));
    });
    const fontesOk = await page.evaluate(
      () =>
        document.fonts.check('800 104px "Plus Jakarta Sans"', 'Y') &&
        document.fonts.check('600 40px "Plus Jakarta Sans"', 'D') &&
        [...document.fonts].filter((f) => f.status === 'loaded').length >= 2,
    );
    if (!fontesOk) falhas.push('Plus Jakarta Sans 800/600 não carregou');

    // Só monograma, nome e frase: texto visível total e imagens do modelo.
    const inventario = await page.evaluate(() => ({
      texto: document.body.innerText.replace(/\s+/g, ' ').trim(),
      imagens: [...document.images].map((i) => i.getAttribute('src')),
      graficos: document.querySelectorAll('svg, canvas, video').length,
    }));
    const esperado = `${textos.nome} ${textos.frase}`;
    if (inventario.texto !== esperado) falhas.push(`texto "${inventario.texto}" ≠ "${esperado}"`);
    if (inventario.imagens.length !== 1 || !inventario.imagens[0].endsWith('favicon.svg')) {
      falhas.push(`imagens inesperadas: ${inventario.imagens.join(', ')}`);
    }
    if (inventario.graficos) falhas.push('elementos gráficos extras no modelo');

    // Caixas reais (Range no nó de texto; caixa do monograma).
    const caixas = await page.evaluate(() => {
      const doTexto = (sel) => {
        const r = document.createRange();
        r.selectNodeContents(document.querySelector(sel));
        const b = r.getBoundingClientRect();
        return { x0: b.left, y0: b.top, x1: b.right, y1: b.bottom };
      };
      const m = document.querySelector('.monograma').getBoundingClientRect();
      return {
        nome: doTexto('[data-texto="nome"]'),
        frase: doTexto('[data-texto="frase"]'),
        monograma: { x0: m.left, y0: m.top, x1: m.right, y1: m.bottom },
      };
    });
    for (const [nome, c] of Object.entries(caixas)) {
      const dentro =
        c.x0 >= SEGURA.x0 && c.y0 >= SEGURA.y0 && c.x1 <= SEGURA.x1 && c.y1 <= SEGURA.y1;
      console.log(
        `${nome}: [${c.x0.toFixed(0)}, ${c.y0.toFixed(0)}] – [${c.x1.toFixed(0)}, ${c.y1.toFixed(0)}]` +
          ` ${dentro ? 'dentro' : 'FORA'} da área segura`,
      );
      if (!dentro) falhas.push(`${nome} fora da área segura 1080 × 560`);
    }

    // Cores declaradas dos textos: paradas do degradê do nome e cor da frase.
    const cores = await page.evaluate(() => ({
      nome: getComputedStyle(document.querySelector('.nome')).backgroundImage,
      frase: getComputedStyle(document.querySelector('.frase')).color,
    }));
    const paradasNome = [...cores.nome.matchAll(/rgba?\([^)]+\)/g)].map((m) => rgbDe(m[0]));
    const corFrase = rgbDe(cores.frase);

    const clip = { x: 0, y: 0, width: W, height: H };
    const png = await page.screenshot({ type: 'png', clip });
    await page.evaluate(() => document.body.classList.add('sem-texto'));
    const pngFundo = await page.screenshot({ type: 'png', clip });

    const { b64, corrigidos } = await corrigirQuantizacao(page, png);
    console.log(`correção de arredondamento (croma ≤ 3 → cinza): ${corrigidos} pixels`);
    const final = Buffer.from(b64, 'base64');
    writeFileSync(SAIDA, final);

    // As checagens abaixo leem o arquivo final gravado.
    const img = await decodificar(page, final);
    const fundo = await decodificar(page, pngFundo);
    if (img.w !== W || img.h !== H) falhas.push(`dimensão ${img.w} × ${img.h}`);

    // Matiz: nenhum pixel entre 190° e 300° (inclusive), sem tolerância.
    let proibidos = 0;
    let exemplo = null;
    for (let i = 0; i < img.d.length; i += 4) {
      const rgb = [img.d[i], img.d[i + 1], img.d[i + 2]];
      const h = matiz(rgb);
      if (h !== null && h >= 190 && h <= 300) {
        proibidos += 1;
        const p = i / 4;
        exemplo ??= `${hex(rgb)} (${h.toFixed(0)}°) em (${p % W}, ${Math.floor(p / W)})`;
      }
    }
    console.log(`matiz 190°–300°: ${proibidos} pixels${exemplo ? `, ex.: ${exemplo}` : ''}`);
    if (proibidos) falhas.push(`${proibidos} pixels com matiz 190°–300°`);

    // Contraste: pior caso = cor mais clara do texto × pixel mais escuro do fundo na caixa.
    const fundoMaisEscuro = (c) => {
      let pior = null;
      for (let y = Math.floor(c.y0); y < Math.ceil(c.y1); y += 1) {
        for (let x = Math.floor(c.x0); x < Math.ceil(c.x1); x += 1) {
          const i = (y * W + x) * 4;
          const rgb = [fundo.d[i], fundo.d[i + 1], fundo.d[i + 2]];
          if (!pior || luminancia(rgb) < luminancia(pior)) pior = rgb;
        }
      }
      return pior;
    };
    const maisClara = (lista) => lista.reduce((a, b) => (luminancia(b) > luminancia(a) ? b : a));
    for (const [nome, cor] of [
      ['nome', maisClara(paradasNome)],
      ['frase', corFrase],
    ]) {
      const bg = fundoMaisEscuro(caixas[nome]);
      const r = contraste(cor, bg);
      console.log(`contraste ${nome}: ${hex(cor)} sobre ${hex(bg)} = ${r.toFixed(2)}:1`);
      if (r < CONTRASTE_MIN) falhas.push(`contraste do ${nome} ${r.toFixed(2)}:1 (< 4,5:1)`);
    }
  } finally {
    await browser.close();
  }

  const peso = statSync(SAIDA).size;
  console.log(`og-image.png: ${W} × ${H}, ${(peso / 1024).toFixed(1)} kB`);
  if (peso > PESO_MAX) falhas.push(`peso ${(peso / 1024).toFixed(1)} kB (> 300 kB)`);
  if (falhas.length) {
    console.error(`build-og: FALHOU\n- ${falhas.join('\n- ')}`);
    process.exit(1);
  }
  console.log('build-og: OK');
}

await main();
