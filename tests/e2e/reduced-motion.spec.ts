// Auditoria de movimento reduzido (A-20; doc 04 §4.2 R4, §9 nota de movimento reduzido, passo 1;
// doc 09 §2 "auditoria LEVE"), no build de produção e nas 6 larguras (`playwright.config.ts`).
// Diferente dos specs por feature (reveal.spec.ts/stagger.spec.ts/countup.spec.ts/draw-line.spec.ts/
// motion-infra.spec.ts, que já testam `prefers-reduced-motion: reduce` isoladamente por gancho),
// este spec confere a PÁGINA REAL completa, de uma vez, com todas as 10 seções e todas as
// decorações (A-10/A-11b/A-12/A-14/A-17/A-19) montadas juntas:
// - `document.getAnimations().filter(a => a.playState === 'running')` fica vazio depois de rolar a
//   página inteira (nenhuma animação "escapou" do movimento reduzido quando tudo está montado ao
//   mesmo tempo, não só o componente isolado);
// - todo conteúdo (`[data-reveal]`, `[data-stagger-item]`) está visível (opacity 1, sem transform);
// - a contagem da Faixa de destaques já está no valor final (`data-countup`);
// - as linhas (Formação `[data-draw="y"]`, trilhas `[data-draw="trail"]` e pontas `[data-draw-tip]`)
//   já estão desenhadas por completo;
// - clicar no botão de tema real (DS-19) troca o tema sem nunca adicionar a classe
//   `theme-transition` (R4; já coberto isoladamente em `theme-persist.spec.ts`, aqui confirmado com
//   a página inteira montada) e sem deixar nenhuma animação "running" depois.
// A explosão do monograma (A-18) não é testada aqui: é `⏭ V2` (doc 09 §1) e não existe na página.
import { expect, test, type Page } from '@playwright/test';
import { SECTION_IDS } from '../../src/content/sections.ts';

const IDENTIDADE = new Set(['none', 'matrix(1, 0, 0, 1, 0, 0)']);

async function abrir(page: Page): Promise<void> {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('./');
  await page.waitForLoadState('networkidle');
}

/** Rola por todas as 10 seções (ordem do registro) e volta ao topo, com uma pequena pausa em cada. */
async function rolarPaginaInteira(page: Page): Promise<void> {
  for (const id of SECTION_IDS) {
    await page.locator(`#${id}`).scrollIntoViewIfNeeded();
    await page.waitForTimeout(60);
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
}

/** Animações do WAAPI com `playState === 'running'` na página inteira (inclui iframes? não há). */
const animacoesEmExecucao = (page: Page): Promise<string[]> =>
  page.evaluate(() =>
    document
      .getAnimations()
      .filter((a) => a.playState === 'running')
      .map((a) => {
        const alvo = (a.effect as KeyframeEffect | null)?.target as Element | null;
        return alvo
          ? `${alvo.tagName.toLowerCase()}${alvo.id ? `#${alvo.id}` : ''}${
              alvo.className ? `.${String(alvo.className).replace(/\s+/g, '.')}` : ''
            }`
          : '(sem alvo)';
      }),
  );

test.describe('A-20: movimento reduzido na página real (R4)', () => {
  test('nenhuma animação "running" depois de carregar e rolar a página inteira', async ({
    page,
  }) => {
    await abrir(page);
    // Instantâneo logo após o carregamento (antes de qualquer rolagem).
    expect(await animacoesEmExecucao(page)).toEqual([]);

    await rolarPaginaInteira(page);
    // Buffer para qualquer transição curta de hover/sombra do cabeçalho (200 ms, DS-04/S-01)
    // disparada pela própria rolagem programática terminar antes de medir.
    await page.waitForTimeout(400);
    expect(await animacoesEmExecucao(page)).toEqual([]);
  });

  test('todo [data-reveal] e [data-stagger-item] já está visível (opacity 1, sem transform)', async ({
    page,
  }) => {
    await abrir(page);
    const estados = await page.evaluate(() => {
      const els = [
        ...document.querySelectorAll('[data-reveal], [data-stagger-item]'),
      ] as HTMLElement[];
      return els.map((el) => {
        const s = getComputedStyle(el);
        return { opacity: s.opacity, transform: s.transform };
      });
    });
    expect(estados.length).toBeGreaterThan(0);
    for (const estado of estados) {
      expect(estado.opacity).toBe('1');
      expect(IDENTIDADE.has(estado.transform)).toBe(true);
    }
  });

  test('a contagem da Faixa de destaques já está no valor final, sem rolar', async ({ page }) => {
    await abrir(page);
    const itens = page.locator('#destaques [data-countup]');
    const total = await itens.count();
    expect(total).toBeGreaterThan(0);
    for (let i = 0; i < total; i++) {
      const item = itens.nth(i);
      const esperado = await item.getAttribute('data-countup');
      expect(await item.textContent()).toBe(esperado);
    }
  });

  test('a linha da Formação e as trilhas já estão desenhadas por completo', async ({ page }) => {
    await abrir(page);
    const linha = page.locator('[data-draw="y"]');
    await expect(linha).toHaveCount(1);
    const estadoLinha = await linha.evaluate((el) => getComputedStyle(el).transform);
    expect(IDENTIDADE.has(estadoLinha)).toBe(true);

    const conectores = page.locator('[data-draw="trail"]');
    const totalConectores = await conectores.count();
    expect(totalConectores).toBeGreaterThan(0);
    const transformsConectores = await conectores.evaluateAll((els) =>
      els.map((el) => getComputedStyle(el).transform),
    );
    for (const t of transformsConectores) {
      expect(IDENTIDADE.has(t)).toBe(true);
    }

    const pontas = page.locator('[data-draw-tip]');
    const totalPontas = await pontas.count();
    expect(totalPontas).toBeGreaterThan(0);
    const opacidadesPontas = await pontas.evaluateAll((els) =>
      els.map((el) => getComputedStyle(el).opacity),
    );
    for (const o of opacidadesPontas) {
      expect(o).toBe('1');
    }
  });

  test('clicar no botão de tema real: troca o tema sem a classe theme-transition e sem animação "running" depois', async ({
    page,
  }) => {
    await abrir(page);
    const botao = page.locator('[data-theme-atual]');
    await expect(botao).toHaveAttribute('data-theme-atual', 'light');

    await botao.click();
    await expect(botao).toHaveAttribute('data-theme-atual', 'dark');
    await expect(page.locator('html')).not.toHaveClass(/theme-transition/);
    await page.waitForTimeout(350);
    expect(await animacoesEmExecucao(page)).toEqual([]);
  });
});
