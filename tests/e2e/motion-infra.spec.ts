// Infraestrutura de movimento (A-01; doc 04 §4.2 R4, §4.3 e §5), no build de produção e nas 6
// larguras. Confere:
// - os 5 aliases --deco-* resolvem para as cores da §5 nos dois temas (getComputedStyle);
// - <html data-reduced-motion> certo com `reduce` e `no-preference`, e mudando sem recarregar;
// - um [data-loop] rolado para fora da tela recebe data-offscreen="true" e fica pausado; volta a
//   rodar na tela; a aba oculta (visibilitychange) também pausa; o mesmo vale para [data-float];
// - com movimento reduzido, os ganchos ficam sem animação, entradas no estado final e as
//   transições de cor continuam.
// As sondas são montadas no próprio spec (ainda não há seções) e saem no fim de cada teste.
import { expect, test, type Page } from '@playwright/test';
import { THEME_STORAGE_KEY, type Theme } from '../../src/theme/constants.ts';

/** Doc 04 §5: aliases do A-01 → cor computada (claro / escuro). */
const ALIASES: Record<string, Record<Theme, string>> = {
  '--deco-node': { light: 'rgb(247, 183, 208)', dark: 'rgba(240, 108, 163, 0.4)' },
  '--deco-chart-1': { light: 'rgb(242, 134, 176)', dark: 'rgb(240, 108, 163)' },
  '--deco-chart-2': { light: 'rgb(224, 81, 138)', dark: 'rgb(245, 143, 184)' },
  '--deco-burst-1': { light: 'rgb(224, 81, 138)', dark: 'rgb(245, 143, 184)' },
  '--deco-burst-2': { light: 'rgb(242, 134, 176)', dark: 'rgb(240, 108, 163)' },
};

async function abrir(page: Page, tema: Theme = 'light'): Promise<void> {
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

/**
 * Sonda de loop: keyframes de opacidade de 2,4 s, e um espaçador que permite rolar para longe.
 * `atributo` escolhe o gancho: `data-loop` (decorações) ou `data-float` (cartões do A-11a).
 */
async function montarLoop(
  page: Page,
  atributo: 'data-loop' | 'data-float' = 'data-loop',
): Promise<void> {
  await page.evaluate((gancho) => {
    const estilo = document.createElement('style');
    estilo.id = 'a01-estilo';
    estilo.textContent =
      '@keyframes a01-cintila { 0%, 100% { opacity: 1 } 50% { opacity: 0.5 } }' +
      '#a01-loop { width: 40px; height: 40px; animation: a01-cintila 2400ms linear infinite; }';
    document.head.append(estilo);
    const caixa = document.createElement('div');
    caixa.id = 'a01-caixa';
    caixa.innerHTML =
      `<div id="a01-loop" ${gancho} data-decor="teste" aria-hidden="true"></div>` +
      '<div style="height: 5000px"></div>';
    document.body.prepend(caixa);
  }, atributo);
}

async function desmontar(page: Page): Promise<void> {
  await page.evaluate(() => {
    document.getElementById('a01-estilo')?.remove();
    document.getElementById('a01-caixa')?.remove();
  });
}

const estadoDoLoop = (page: Page) =>
  page.locator('#a01-loop').evaluate((el) => ({
    offscreen: el.getAttribute('data-offscreen'),
    estado: getComputedStyle(el).animationPlayState,
  }));

test.describe('A-01: aliases --deco-* (§5)', () => {
  for (const tema of ['light', 'dark'] as const) {
    test(`os 5 aliases resolvem para as cores da §5 no tema ${tema}`, async ({ page }) => {
      await abrir(page, tema);
      const lidos = await page.evaluate((nomes) => {
        const sonda = document.createElement('div');
        document.body.append(sonda);
        const saida: Record<string, string> = {};
        for (const nome of nomes) {
          sonda.style.backgroundColor = `var(${nome})`;
          saida[nome] = getComputedStyle(sonda).backgroundColor;
        }
        sonda.remove();
        return saida;
      }, Object.keys(ALIASES));
      const esperado = Object.fromEntries(
        Object.entries(ALIASES).map(([nome, cores]) => [nome, cores[tema]]),
      );
      expect(lidos).toEqual(esperado);
    });
  }
});

test.describe('A-01: data-reduced-motion no <html>', () => {
  test('reduce → "true"', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await abrir(page);
    await expect(page.locator('html')).toHaveAttribute('data-reduced-motion', 'true');
  });

  test('no-preference → "false", e muda sem recarregar', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await abrir(page);
    const html = page.locator('html');
    await expect(html).toHaveAttribute('data-reduced-motion', 'false');
    const marca = await page.evaluate(() => {
      (window as unknown as { __a01: number }).__a01 = 1;
      return performance.timeOrigin;
    });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(html).toHaveAttribute('data-reduced-motion', 'true');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await expect(html).toHaveAttribute('data-reduced-motion', 'false');
    // Mesma página (sem recarregar): a marca e a origem de tempo continuam.
    expect(
      await page.evaluate(() => [
        (window as unknown as { __a01?: number }).__a01,
        performance.timeOrigin,
      ]),
    ).toEqual([1, marca]);
  });
});

test.describe('A-01: pausa de loops (§4.3)', () => {
  test('fora da tela → data-offscreen="true" e paused; de volta → "false" e running', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await abrir(page);
    await montarLoop(page);
    await expect.poll(() => estadoDoLoop(page)).toEqual({ offscreen: 'false', estado: 'running' });
    await page.evaluate(() => window.scrollTo({ top: 3000, behavior: 'instant' }));
    await expect.poll(() => estadoDoLoop(page)).toEqual({ offscreen: 'true', estado: 'paused' });
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await expect.poll(() => estadoDoLoop(page)).toEqual({ offscreen: 'false', estado: 'running' });
    await desmontar(page);
  });

  test('[data-float] (cartão flutuante) também pausa fora da tela e com a aba oculta', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await abrir(page);
    await montarLoop(page, 'data-float');
    await expect.poll(() => estadoDoLoop(page)).toEqual({ offscreen: 'false', estado: 'running' });
    await page.evaluate(() => window.scrollTo({ top: 3000, behavior: 'instant' }));
    await expect.poll(() => estadoDoLoop(page)).toEqual({ offscreen: 'true', estado: 'paused' });
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await expect.poll(() => estadoDoLoop(page)).toEqual({ offscreen: 'false', estado: 'running' });
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => 'hidden',
      });
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await expect(page.locator('html')).toHaveAttribute('data-page-hidden', '');
    expect((await estadoDoLoop(page)).estado).toBe('paused');
    await desmontar(page);
  });

  test('aba oculta (visibilitychange) → html[data-page-hidden] e loop pausado', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await abrir(page);
    await montarLoop(page);
    await expect.poll(() => estadoDoLoop(page)).toEqual({ offscreen: 'false', estado: 'running' });
    const mudarVisibilidade = (estado: 'hidden' | 'visible') =>
      page.evaluate((valor) => {
        Object.defineProperty(document, 'visibilityState', {
          configurable: true,
          get: () => valor,
        });
        Object.defineProperty(document, 'hidden', {
          configurable: true,
          get: () => valor === 'hidden',
        });
        document.dispatchEvent(new Event('visibilitychange'));
      }, estado);
    await mudarVisibilidade('hidden');
    await expect(page.locator('html')).toHaveAttribute('data-page-hidden', '');
    expect((await estadoDoLoop(page)).estado).toBe('paused');
    await mudarVisibilidade('visible');
    await expect(page.locator('html')).not.toHaveAttribute('data-page-hidden');
    expect((await estadoDoLoop(page)).estado).toBe('running');
    await desmontar(page);
  });
});

test.describe('A-01: movimento reduzido nos ganchos (R4)', () => {
  test('ganchos sem animação, entradas no estado final, cor continua transicionando', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await abrir(page);
    await montarLoop(page);
    const lido = await page.evaluate(() => {
      const sonda = document.createElement('div');
      sonda.setAttribute('data-reveal', '');
      sonda.style.opacity = '0';
      sonda.style.transform = 'translateY(24px)';
      sonda.style.transition = 'transform 200ms, opacity 200ms, background-color 200ms';
      document.body.append(sonda);
      const s = getComputedStyle(sonda);
      const loop = getComputedStyle(document.getElementById('a01-loop') as HTMLElement);
      const saida = {
        revealOpacity: s.opacity,
        revealTransform: s.transform,
        revealTransition: s.transitionProperty,
        loopAnimation: loop.animationName,
      };
      sonda.remove();
      return saida;
    });
    expect(lido).toEqual({
      revealOpacity: '1',
      revealTransform: 'none',
      revealTransition: 'color, background-color, border-color, fill, stroke',
      loopAnimation: 'none',
    });
    await desmontar(page);
  });

  test('sem movimento reduzido, os ganchos ficam intactos (atributos inertes)', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await abrir(page);
    const lido = await page.evaluate(() => {
      const sonda = document.createElement('div');
      sonda.setAttribute('data-reveal', '');
      sonda.style.opacity = '0';
      sonda.style.transform = 'translateY(24px)';
      document.body.append(sonda);
      const s = getComputedStyle(sonda);
      const saida = { opacity: s.opacity, transform: s.transform };
      sonda.remove();
      return saida;
    });
    expect(lido).toEqual({ opacity: '0', transform: 'matrix(1, 0, 0, 1, 0, 24)' });
  });
});
