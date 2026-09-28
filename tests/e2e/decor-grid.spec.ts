// Grade de linhas finas com máscara radial (A-12; doc de design §8 "Grade", §10; doc 04 §5).
// O GridBackdrop só entra na página com as S-04/S-15 e o A-19. Por isso este spec abre o servidor
// de DESENVOLVIMENTO (o mesmo do projeto `styleguide`, que o playwright.config.ts sempre sobe) e
// monta o componente isolado por `tests/e2e/support/montar-decor.tsx`, numa camada fixa que
// cobre a janela, com o fundo da página transparente.
// A medida é por pixel: `page.screenshot({ omitBackground: true })` guarda o alfa real da grade,
// que o próprio navegador decodifica num <canvas>.
// Confere, nas 6 larguras e nos dois temas:
// - espaçamento de 48 px e espessura de 1 px;
// - cor da linha no centro = `--deco-grid-line` (#F9D5E3 a 35% no claro, branco a 5% no escuro);
// - máscara: alfa ≥ 0,25 no centro (claro) e ≤ 0,05 a 90% do raio;
// - `bleed` estende a grade até perto das bordas só de 1440 px em diante (§10);
// - aria-hidden="true" e pointer-events: none.
import { expect, test, type Page } from '@playwright/test';
import { BASE_PATH } from '../../src/site.config.ts';
import { THEME_STORAGE_KEY, type Theme } from '../../src/theme/constants.ts';

/** Origem do servidor dev (porta do projeto `styleguide`); pode ser trocada por variável. */
const ORIGEM_DEV = process.env.PW_ORIGEM_DEV ?? 'http://localhost:5173';
const MODULO = `${BASE_PATH}tests/e2e/support/montar-decor.tsx`;

const PASSO = 48;
const RAIO = 300;

/** Doc 04 §5: cor da linha (rgb) e alfa do token, por tema. */
const LINHA: Record<Theme, { rgb: [number, number, number]; alfa: number; css: string }> = {
  light: { rgb: [249, 213, 227], alfa: 0.35, css: 'rgba(249, 213, 227, 0.35)' },
  dark: { rgb: [255, 255, 255], alfa: 0.05, css: 'rgba(255, 255, 255, 0.05)' },
};

type Pixel = [number, number, number, number];

async function abrir(page: Page, tema: Theme): Promise<void> {
  await page.addInitScript(
    ([chave, valor]) => {
      try {
        localStorage.setItem(chave, valor);
      } catch {
        // sem storage: a checagem de data-theme abaixo acusa.
      }
    },
    [THEME_STORAGE_KEY, tema] as const,
  );
  await page.goto(`${ORIGEM_DEV}${BASE_PATH}`);
  await expect(page.locator('html')).toHaveAttribute('data-theme', tema);
  // Página de teste: sem o app e com fundo transparente, para o screenshot guardar o alfa.
  await page.addStyleTag({
    content:
      'html, body { background: transparent !important; } #root { display: none !important; }' +
      '#a12-camada { position: fixed; inset: 0; }',
  });
  await page.addScriptTag({
    type: 'module',
    content: `import * as m from '${MODULO}'; window.__decor = m;`,
  });
  await page.waitForFunction(() => '__decor' in window);
}

async function montarGrade(page: Page, props: Record<string, unknown>): Promise<void> {
  await page.evaluate((p) => {
    let camada = document.getElementById('a12-camada');
    if (!camada) {
      camada = document.createElement('div');
      camada.id = 'a12-camada';
      document.body.append(camada);
    }
    const decor = (window as unknown as { __decor: { montar: (...a: unknown[]) => void } }).__decor;
    decor.montar('GridBackdrop', p, camada);
  }, props);
}

/** Tira o screenshot sem fundo e devolve os pixels pedidos, decodificados no navegador. */
async function pixels(page: Page, pontos: [number, number][]): Promise<Pixel[]> {
  const png = (await page.screenshot({ omitBackground: true })).toString('base64');
  return page.evaluate(
    async ([dados, lista]) => {
      const img = new Image();
      img.src = `data:image/png;base64,${dados}`;
      await img.decode();
      const tela = document.createElement('canvas');
      tela.width = img.width;
      tela.height = img.height;
      const ctx = tela.getContext('2d', { willReadFrequently: true });
      if (!ctx) throw new Error('sem canvas 2d');
      ctx.drawImage(img, 0, 0);
      return lista.map(([x, y]) => {
        const d = ctx.getImageData(x, y, 1, 1).data;
        return [d[0] ?? 0, d[1] ?? 0, d[2] ?? 0, (d[3] ?? 0) / 255] as [
          number,
          number,
          number,
          number,
        ];
      });
    },
    [png, pontos] as const,
  );
}

/** Coordenada da linha vertical (múltiplo de 48) mais perto de `x`. */
const linhaPerto = (x: number) => Math.round(x / PASSO) * PASSO;
/** Linha de pixels entre duas linhas horizontais (nunca sobre uma delas). */
const entreLinhas = (y: number) => Math.floor(y / PASSO) * PASSO + PASSO / 2;

for (const tema of ['light', 'dark'] as const) {
  test.describe(`A-12: grade no tema ${tema}`, () => {
    test('48 px, 1 px, cor do token, máscara no centro e a 90% do raio', async ({ page }) => {
      await abrir(page, tema);
      await montarGrade(page, { center: '50% 50%', radius: RAIO });
      const { width: W, height: H } = page.viewportSize() ?? { width: 0, height: 0 };
      const cx = W / 2;
      const cy = H / 2;

      // Acessibilidade e ponteiro.
      const grade = page.locator('#a12-camada [data-decor="grid"]');
      await expect(grade).toHaveAttribute('aria-hidden', 'true');
      const estilo = await grade.evaluate((el) => {
        const cs = getComputedStyle(el);
        return { ponteiro: cs.pointerEvents, fundo: cs.backgroundImage };
      });
      expect(estilo.ponteiro).toBe('none');
      expect(estilo.fundo).toContain(LINHA[tema].css);

      // Espaçamento e espessura: varre uma linha de pixels entre as horizontais, perto do centro.
      const yVarredura = entreLinhas(cy);
      const xs = Array.from({ length: 241 }, (_, i) => Math.round(cx) - 120 + i);
      const linha = await pixels(
        page,
        xs.map((x) => [x, yVarredura] as [number, number]),
      );
      const limiar = LINHA[tema].alfa * 0.3;
      const acesos = xs.filter((_, i) => (linha[i]?.[3] ?? 0) > limiar);
      expect(acesos.length).toBeGreaterThanOrEqual(4);
      for (let i = 1; i < acesos.length; i++) {
        expect((acesos[i] ?? 0) - (acesos[i - 1] ?? 0)).toBe(PASSO); // 1 px de largura, a cada 48
      }
      for (const x of acesos) expect(x % PASSO).toBe(0);

      // Centro e 90% do raio, sobre a linha vertical mais perto do centro.
      const xl = linhaPerto(cx);
      const dx = Math.abs(xl - cx);
      const yCentro = entreLinhas(cy);
      let y90 = Math.ceil(cy + Math.sqrt((0.9 * RAIO) ** 2 - dx ** 2));
      if (y90 % PASSO === 0) y90 += 1;
      const yMeio = Math.round(cy + 0.6 * RAIO);
      const [centro, meio, noventa] = await pixels(page, [
        [xl, yCentro],
        [xl, yMeio % PASSO === 0 ? yMeio + 1 : yMeio],
        [xl, y90],
      ]);
      const alfaCentro = centro?.[3] ?? 0;
      const alfa90 = noventa?.[3] ?? 1;
      test.info().annotations.push({
        type: 'amostras',
        description: JSON.stringify({ tema, W, H, xl, yCentro, y90, centro, meio, noventa }),
      });

      // Cor da linha no centro = token (rgb ±3, alfa ±0,02).
      const [r, g, b] = centro ?? [0, 0, 0, 0];
      const [er, eg, eb] = LINHA[tema].rgb;
      expect(Math.abs(r - er)).toBeLessThanOrEqual(3);
      expect(Math.abs(g - eg)).toBeLessThanOrEqual(3);
      expect(Math.abs(b - eb)).toBeLessThanOrEqual(3);
      expect(Math.abs(alfaCentro - LINHA[tema].alfa)).toBeLessThanOrEqual(0.02);

      // Máscara: forte no centro (≥ 0,25 no claro), some a 90% do raio, e decresce no caminho.
      if (tema === 'light') expect(alfaCentro).toBeGreaterThanOrEqual(0.25);
      expect(alfa90).toBeLessThanOrEqual(0.05);
      expect(meio?.[3] ?? 1).toBeLessThan(alfaCentro);
      expect(meio?.[3] ?? 1).toBeGreaterThanOrEqual(alfa90);
    });

    test('bleed: de 1440 px em diante a grade vai até perto das bordas (§10)', async ({ page }) => {
      await abrir(page, tema);
      const { width: W, height: H } = page.viewportSize() ?? { width: 0, height: 0 };
      // Ponto a 70% da meia-largura, à direita do centro, fora do círculo de 300 px.
      const x = linhaPerto(W / 2 + 0.7 * (W / 2));
      const y = entreLinhas(H / 2);
      await montarGrade(page, { center: '50% 50%', radius: RAIO });
      const [semBleed] = await pixels(page, [[x, y]]);
      await montarGrade(page, { center: '50% 50%', radius: RAIO, bleed: true });
      const [comBleed] = await pixels(page, [[x, y]]);
      test.info().annotations.push({
        type: 'amostras',
        description: JSON.stringify({ tema, W, x, y, semBleed, comBleed }),
      });
      // Nas larguras em que o ponto fica fora do círculo (≥ 90% do raio), a grade já sumiu ali.
      if (x - W / 2 >= 0.9 * RAIO) expect(semBleed?.[3]).toBe(0);
      if (W >= 1440) {
        expect(comBleed?.[3] ?? 0).toBeGreaterThanOrEqual(LINHA[tema].alfa * 0.3);
      } else {
        // Abaixo de 1440 px o `bleed` não muda nada.
        expect(comBleed).toEqual(semBleed);
      }
    });
  });
}
