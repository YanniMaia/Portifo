// Fundo por seção (A-19; doc de design §3.4, §6, §7.2, §7.11, §8, §10; doc 04 §6.2/§7; doc 09 §2:
// "a A-19 vale só com grade, brilhos e constelações" — por isso este spec roda contra a PÁGINA REAL
// (build de produção, `playwright.config.ts`, nenhum servidor dev/`montar-decor.tsx`: o
// `SectionBackdrop` já está ligado por `src/App.tsx`), nas 6 larguras do doc 06 (um projeto por
// largura) e nos dois temas (`data-theme`, F-08).
//
// Confere, no navegador real:
// - nenhuma rolagem horizontal (também dentro das seções Hero/Contato), nos dois temas;
// - todo `[data-decor]` dentro do `SectionBackdrop` (`[data-section-backdrop]`) tem
//   `aria-hidden="true"`;
// - no Contato: os 2 `.glow` têm diâmetro 280 px (dentro de 240–320) e `filter: blur(100px)`
//   (dentro de 80–120, §3.4/critério do A-19);
// - nenhum `backdrop-filter` novo dentro do `SectionBackdrop` (orçamento do doc 04 §4.3: só
//   cabeçalho, cartões do hero, faixa de destaques e trilhas usam vidro — nenhum deles é o
//   `SectionBackdrop`);
// - contraste do texto real (H1/subtítulo do Hero, H2/parágrafo do Contato) permanece alto nos dois
//   temas: amostra simples (não exaustiva, por já ficar comprovado que a camada é `z-index: 0`,
//   atrás do conteúdo) combinando a cor computada do texto (`getComputedStyle`) com o fundo —
//   sólido no Hero (`--color-bg`, por `getComputedStyle(section).backgroundColor`) e por pixel real
//   da captura de tela no Contato (o painel usa `--gradient-contact`, sem `background-color` sólido
//   equivalente);
// - escopo da V1 (doc 09 §1): nenhum `[data-decor]` fora de "grid"/"network"/"glow" existe na
//   página (partículas/código/bits/marca-d'água ficam para a V2).
import { expect, test, type Page } from '@playwright/test';
import { THEME_STORAGE_KEY, type Theme } from '../../src/theme/constants.ts';
import { contrastRatio } from '../unit/support/contrast.ts';

/** `--color-bg` (DS-01): fundo sólido do Hero por trás dos brilhos/decoração. */
const COLOR_BG: Record<Theme, string> = {
  light: 'rgb(255, 255, 255)',
  dark: 'rgb(21, 10, 16)',
};

async function abrir(page: Page, tema: Theme): Promise<void> {
  await page.addInitScript(
    ([chave, valor]) => {
      try {
        localStorage.setItem(chave, valor);
      } catch {
        // storage indisponível: a checagem de data-theme abaixo acusa.
      }
    },
    [THEME_STORAGE_KEY, tema] as const,
  );
  await page.goto('./');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('html')).toHaveAttribute('data-theme', tema);
}

/** Lê 1 pixel (RGB, opaco) de uma captura de tela já tirada (base64 PNG), decodificado no navegador. */
async function pixelDaCaptura(
  page: Page,
  capturaBase64: string,
  x: number,
  y: number,
): Promise<[number, number, number]> {
  return page.evaluate(
    async ([dados, px, py]) => {
      const img = new Image();
      img.src = `data:image/png;base64,${dados}`;
      await img.decode();
      const tela = document.createElement('canvas');
      tela.width = img.width;
      tela.height = img.height;
      const ctx = tela.getContext('2d', { willReadFrequently: true });
      if (!ctx) throw new Error('sem canvas 2d');
      ctx.drawImage(img, 0, 0);
      const d = ctx.getImageData(Math.round(px), Math.round(py), 1, 1).data;
      return [d[0] ?? 0, d[1] ?? 0, d[2] ?? 0] as [number, number, number];
    },
    [capturaBase64, x, y] as const,
  );
}

for (const tema of ['light', 'dark'] as const) {
  test.describe(`A-19: fundo por seção (tema ${tema})`, () => {
    test('sem rolagem horizontal (página inteira, com Hero e Contato decorados)', async ({
      page,
    }) => {
      // Critério do A-19 (doc 04): rolagem horizontal é medida no documento, não em cada seção —
      // o Hero e o Contato têm `overflow: hidden` de propósito (S-03/S-15, D14) para ABSORVER o
      // `bleed` da grade (§10) sem criar rolagem; o `scrollWidth` de um elemento com
      // `overflow: hidden` reporta o conteúdo interno (que pode ultrapassar), não o que a página
      // de fato rola, então medir por seção daria falso positivo aqui.
      await abrir(page, tema);
      const medidas = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(medidas.scrollWidth).toBeLessThanOrEqual(medidas.clientWidth);
    });

    test('todo [data-decor] dentro do SectionBackdrop (hero/contato) tem aria-hidden="true"', async ({
      page,
    }) => {
      await abrir(page, tema);
      for (const variant of ['hero', 'contato'] as const) {
        const camada = page.locator(`[data-section-backdrop="${variant}"]`);
        await expect(camada).toHaveAttribute('aria-hidden', 'true');
        const decorativos = camada.locator('[data-decor]');
        const total = await decorativos.count();
        // Escopo da V1 (doc 09 §1): grade (A-12) + constelações (A-14) no hero; + brilhos no
        // contato. Nunca zero (a variante sempre monta pelo menos a grade e as constelações).
        expect(total).toBeGreaterThan(0);
        for (let i = 0; i < total; i++) {
          await expect(decorativos.nth(i)).toHaveAttribute('aria-hidden', 'true');
        }
      }
    });

    test("escopo da V1 dentro do SectionBackdrop: só grid/network/glow (partículas/código/bits/marca-d'água ficam para a V2)", async ({
      page,
    }) => {
      // Escopo só do `SectionBackdrop` (hero/contato) — fora dele, outros donos legítimos usam
      // outros `data-decor` (ex.: `chart` do A-17/C-08 nas ilustrações de projeto), que não são
      // desta task e não entram nesta checagem.
      await abrir(page, tema);
      const tipos = await page.evaluate(() =>
        Array.from(document.querySelectorAll('[data-section-backdrop] [data-decor]')).map((el) =>
          el.getAttribute('data-decor'),
        ),
      );
      expect(tipos.length).toBeGreaterThan(0);
      const permitidos = new Set(['grid', 'network', 'glow']);
      for (const tipo of tipos) expect(permitidos.has(tipo ?? '')).toBe(true);
      // Nenhuma partícula em nenhum lugar da página (A-13 ⏭ V2; o A-19 não as usa nesta rodada).
      expect(await page.locator('[data-decor="particle"]').count()).toBe(0);
    });

    test('contato: os 2 glows têm diâmetro 280 px (240–320) e filter blur(100px) (80–120)', async ({
      page,
    }) => {
      await abrir(page, tema);
      const glows = page.locator('[data-section-backdrop="contato"] [data-decor="glow"]');
      await expect(glows).toHaveCount(2);
      for (let i = 0; i < 2; i++) {
        const glow = glows.nth(i);
        const caixa = await glow.boundingBox();
        expect(caixa?.width).toBeGreaterThanOrEqual(240);
        expect(caixa?.width).toBeLessThanOrEqual(320);
        expect(caixa?.height).toBeGreaterThanOrEqual(240);
        expect(caixa?.height).toBeLessThanOrEqual(320);
        expect(caixa?.width).toBeCloseTo(280, 0);

        const filtro = await glow.evaluate((el) => getComputedStyle(el).filter);
        const m = /blur\(([\d.]+)px\)/.exec(filtro);
        expect(m).not.toBeNull();
        const px = Number(m?.[1]);
        expect(px).toBeGreaterThanOrEqual(80);
        expect(px).toBeLessThanOrEqual(120);
        expect(px).toBeCloseTo(100, 0);
      }
    });

    test('nenhum backdrop-filter dentro do SectionBackdrop (orçamento do doc 04 §4.3)', async ({
      page,
    }) => {
      await abrir(page, tema);
      for (const variant of ['hero', 'contato'] as const) {
        const valores = await page.evaluate((sel) => {
          const raiz = document.querySelector(sel);
          if (!raiz) throw new Error(`${sel} não encontrado`);
          const todos = [raiz, ...Array.from(raiz.querySelectorAll('*'))];
          return todos.map((el) => getComputedStyle(el).backdropFilter);
        }, `[data-section-backdrop="${variant}"]`);
        for (const v of valores) expect(v === 'none' || v === '').toBe(true);
      }
    });

    test('contraste do texto do Hero permanece alto (H1 e subtítulo × --color-bg)', async ({
      page,
    }) => {
      await abrir(page, tema);
      const cores = await page.evaluate(() => {
        const secao = document.getElementById('inicio') as HTMLElement;
        const h1 = secao.querySelector('h1') as HTMLElement;
        const sub = secao.querySelector<HTMLElement>('p.t-hero-sub');
        return {
          fundo: getComputedStyle(secao).backgroundColor,
          titulo: getComputedStyle(h1).color,
          subtitulo: sub ? getComputedStyle(sub).color : null,
        };
      });
      expect(cores.fundo).toBe(COLOR_BG[tema]);
      expect(contrastRatio(cores.titulo, cores.fundo)).toBeGreaterThanOrEqual(7);
      if (cores.subtitulo) {
        expect(contrastRatio(cores.subtitulo, cores.fundo)).toBeGreaterThanOrEqual(4.5);
      }
    });

    test('contraste do texto do Contato permanece alto (H2 e parágrafo × pixel real do painel)', async ({
      page,
    }) => {
      await abrir(page, tema);
      // O Contato fica no fim da página: centraliza o H2 na janela (sem animação), para a captura
      // de tela (abaixo) enquadrar H2 e parágrafo nas MESMAS coordenadas do getBoundingClientRect.
      await page.evaluate(() => {
        document
          .querySelector('#contato h2')
          ?.scrollIntoView({ behavior: 'instant', block: 'center' });
      });
      const dados = await page.evaluate(() => {
        const secao = document.getElementById('contato') as HTMLElement;
        const h2 = secao.querySelector('h2') as HTMLElement;
        const paragrafo = secao.querySelector('p') as HTMLElement; // 1º <p>: o texto do painel (d.texto)
        const caixaH2 = h2.getBoundingClientRect();
        const caixaP = paragrafo.getBoundingClientRect();
        return {
          titulo: getComputedStyle(h2).color,
          corpo: getComputedStyle(paragrafo).color,
          // Ponto 8 px acima do topo de cada texto: dentro da margem (>= 16 px nos dois casos),
          // fora da tinta das letras — mesma técnica de "amostra simples" do doc 09.
          pontoTitulo: { x: caixaH2.left + Math.min(10, caixaH2.width / 2), y: caixaH2.top - 8 },
          pontoCorpo: { x: caixaP.left + Math.min(10, caixaP.width / 2), y: caixaP.top - 8 },
        };
      });

      const captura = (await page.screenshot()).toString('base64');
      const [rgbTitulo, rgbCorpo] = await Promise.all([
        pixelDaCaptura(page, captura, dados.pontoTitulo.x, Math.max(0, dados.pontoTitulo.y)),
        pixelDaCaptura(page, captura, dados.pontoCorpo.x, Math.max(0, dados.pontoCorpo.y)),
      ]);
      const fundoTitulo = `rgb(${rgbTitulo.join(', ')})`;
      const fundoCorpo = `rgb(${rgbCorpo.join(', ')})`;

      test.info().annotations.push({
        type: 'amostra-contato',
        description: JSON.stringify({ tema, dados, fundoTitulo, fundoCorpo }),
      });

      expect(contrastRatio(dados.titulo, fundoTitulo)).toBeGreaterThanOrEqual(7);
      expect(contrastRatio(dados.corpo, fundoCorpo)).toBeGreaterThanOrEqual(4.5);
    });
  });
}
