// Estilos globais (DS-04; doc de design §5, §6, §9, §10, §11), no build de produção e nas 6
// larguras: foco visível nos dois temas, transição de tema de 300 ms, movimento reduzido, nenhuma
// rolagem horizontal e caixas iguais entre os temas. Sondas injetadas saem no fim de cada teste.
//
// Ainda não existe botão de tema (DS-19/S-01): como no theme-persist.spec.ts (F-09), o teste chama
// o `toggleTheme()` REAL do bundle achando o contexto na árvore de fibras do React. O Q-02/A-09
// trocam por um clique no botão.
import { expect, test, type Page } from '@playwright/test';
import { pt } from '../../src/content/pt.ts';
import { THEME_STORAGE_KEY, type Theme } from '../../src/theme/constants.ts';

/** `--color-focus`: #E0518A no claro (§5) e #F58FB8 no escuro (§11). */
const FOCO: Record<Theme, string> = {
  light: 'rgb(224, 81, 138)',
  dark: 'rgb(245, 143, 184)',
};
const TEMAS: readonly Theme[] = ['light', 'dark'];

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

/** Link de teste como primeiro filho do <body>: o primeiro Tab cai nele. */
async function injetarLinkDeTeste(page: Page): Promise<void> {
  await page.evaluate(() => {
    const a = document.createElement('a');
    a.id = 'ds04-link';
    a.href = '#ds04-alvo';
    a.textContent = 'link de teste';
    a.style.display = 'inline-block';
    a.style.margin = '40px';
    a.style.padding = '12px';
    a.style.borderRadius = '9999px';
    a.addEventListener('click', (e) => e.preventDefault());
    document.body.prepend(a);
  });
}

async function lerContorno(page: Page, seletor: string) {
  return page.locator(seletor).evaluate((el) => {
    const c = getComputedStyle(el);
    return {
      style: c.outlineStyle,
      width: c.outlineWidth,
      color: c.outlineColor,
      offset: c.outlineOffset,
    };
  });
}

for (const tema of TEMAS) {
  test.describe(`foco visível (tema ${tema})`, () => {
    test('Tab mostra contorno 3 px a 3 px na cor do tema; clique com mouse não', async ({
      page,
    }, testInfo) => {
      await abrir(page, tema);
      await injetarLinkDeTeste(page);

      await page.keyboard.press('Tab');
      await expect(page.locator('#ds04-link')).toBeFocused();
      expect(await lerContorno(page, '#ds04-link')).toEqual({
        style: 'solid',
        width: '3px',
        color: FOCO[tema],
        offset: '3px',
      });
      // Contorno acompanha o raio (pílula): o `border-radius` continua no elemento com foco.
      await expect(page.locator('#ds04-link')).toHaveCSS('border-top-left-radius', '9999px');
      await testInfo.attach(`foco-teclado-${tema}`, {
        body: await page.screenshot({ clip: { x: 0, y: 0, width: 320, height: 140 } }),
        contentType: 'image/png',
      });

      // Mesmo link, agora focado por clique: sem contorno.
      await page.locator('#ds04-link').evaluate((el) => (el as HTMLElement).blur());
      await page.locator('#ds04-link').click();
      await expect(page.locator('#ds04-link')).toBeFocused();
      expect((await lerContorno(page, '#ds04-link')).style).toBe('none');
    });

    test('skip link: contorno na cor do tema e nunca na cor de link padrão (azul)', async ({
      page,
    }) => {
      await abrir(page, tema);
      const skip = page.getByRole('link', { name: pt.a11y.skipToContent });

      // Oculto: cor do token (#FFFFFF), não o azul padrão do navegador (Portão F, V-03 #4).
      await expect(skip).toHaveCSS('color', 'rgb(255, 255, 255)');

      await page.keyboard.press('Tab');
      await expect(skip).toBeFocused();
      expect(await lerContorno(page, `a[href="#conteudo"]`)).toEqual({
        style: 'solid',
        width: '3px',
        color: FOCO[tema],
        offset: '3px',
      });
    });
  });
}

test('link sem classe usa --color-link (nunca o azul padrão), nos dois temas', async ({ page }) => {
  await abrir(page, 'light');
  await injetarLinkDeTeste(page);
  await expect(page.locator('#ds04-link')).toHaveCSS('color', 'rgb(201, 58, 119)');
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await expect(page.locator('#ds04-link')).toHaveCSS('color', 'rgb(255, 179, 209)');
});

test('seleção de texto usa --color-fill-soft e --color-text', async ({ page }) => {
  await abrir(page, 'light');
  const sel = await page.evaluate(() => {
    const c = getComputedStyle(document.body, '::selection');
    return { fundo: c.backgroundColor, texto: c.color };
  });
  expect(sel).toEqual({ fundo: 'rgb(255, 238, 244)', texto: 'rgb(43, 22, 32)' });
});

/** Aciona o toggle real e, no mesmo tique, lê as durações do body e de uma sonda com transição própria. */
async function alternarTemaELer(page: Page): Promise<{ body: string; sonda: string }> {
  return page.evaluate(() => {
    const raiz = document.getElementById('root');
    if (!raiz) throw new Error('#root não encontrado');
    const chave = Object.keys(raiz).find((k) => k.startsWith('__reactContainer$'));
    if (!chave) throw new Error('raiz do React não encontrada');
    interface Fibra {
      child: Fibra | null;
      sibling: Fibra | null;
      stateNode?: { current?: Fibra } | null;
      memoizedProps: { value?: { toggleTheme?: unknown } } | null;
    }
    const hostRoot = (raiz as unknown as Record<string, Fibra | undefined>)[chave];
    const inicio = hostRoot?.stateNode?.current;
    if (!inicio) throw new Error('fibra raiz do React não encontrada');
    const pilha: Fibra[] = [inicio];
    let alternar: (() => void) | undefined;
    while (pilha.length > 0 && !alternar) {
      const fibra = pilha.pop();
      if (!fibra) continue;
      const f = fibra.memoizedProps?.value?.toggleTheme;
      if (typeof f === 'function') alternar = f as () => void;
      if (fibra.sibling) pilha.push(fibra.sibling);
      if (fibra.child) pilha.push(fibra.child);
    }
    if (!alternar) throw new Error('ThemeProvider não encontrado na árvore do React');
    alternar();
    const sonda = document.getElementById('ds04-sonda');
    return {
      body: getComputedStyle(document.body).transitionDuration,
      sonda: sonda ? getComputedStyle(sonda).transitionDuration : '',
    };
  });
}

async function injetarSondaComTransicao(page: Page): Promise<void> {
  await page.evaluate(() => {
    const d = document.createElement('div');
    d.id = 'ds04-sonda';
    d.style.transition = 'transform 0.2s ease';
    d.style.animation = 'ds04-giro 2s infinite';
    document.body.append(d);
  });
}

test('transição de tema: 0.3s durante a troca; fora dela, cada elemento mantém a sua', async ({
  page,
}) => {
  await abrir(page, 'light');
  await injetarSondaComTransicao(page);
  const html = page.locator('html');

  // Antes: nenhuma transição global.
  expect(await page.evaluate(() => getComputedStyle(document.body).transitionDuration)).toBe('0s');
  await expect(page.locator('#ds04-sonda')).toHaveCSS('transition-duration', '0.2s');

  const durante = await alternarTemaELer(page);
  expect(durante.body.split(', ')).toContain('0.3s');
  expect(durante.sonda.split(', ')).toContain('0.3s');
  await expect(html).toHaveAttribute('data-theme', 'dark');

  // Depois dos 300 ms a classe sai e as durações próprias voltam.
  await expect(html).not.toHaveClass(/theme-transition/, { timeout: 2_000 });
  expect(await page.evaluate(() => getComputedStyle(document.body).transitionDuration)).toBe('0s');
  await expect(page.locator('#ds04-sonda')).toHaveCSS('transition-duration', '0.2s');
});

test.describe('movimento reduzido', () => {
  test.use({ reducedMotion: 'reduce' });

  test('animações a 0.01ms × 1, rolagem auto; transições de cor seguem', async ({ page }) => {
    await abrir(page, 'light');
    await injetarSondaComTransicao(page);
    const lido = await page.evaluate(() => {
      const s = getComputedStyle(document.getElementById('ds04-sonda') as HTMLElement);
      return {
        animDur: s.animationDuration,
        animIter: s.animationIterationCount,
        transDur: s.transitionDuration,
        scroll: getComputedStyle(document.documentElement).scrollBehavior,
      };
    });
    expect(lido).toEqual({
      animDur: '1e-05s',
      animIter: '1',
      transDur: '0.2s',
      scroll: 'auto',
    });
  });
});

test('nenhuma rolagem horizontal (scrollWidth = largura da janela)', async ({ page }) => {
  await abrir(page, 'light');
  const largura = page.viewportSize()?.width ?? 0;
  const medida = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    cliente: document.documentElement.clientWidth,
  }));
  expect(medida.scroll).toBe(medida.cliente);
  expect(medida.scroll).toBe(largura);
});

test('.visually-hidden: 1×1 px, recortado, sem display:none', async ({ page }) => {
  await abrir(page, 'light');
  const r = await page.evaluate(() => {
    const s = document.createElement('span');
    s.className = 'visually-hidden';
    s.textContent = 'abre em nova aba';
    document.body.append(s);
    // getComputedStyle é "vivo": copia os valores antes de remover a sonda.
    const c = getComputedStyle(s);
    const caixa = s.getBoundingClientRect();
    const lido = {
      display: c.display,
      position: c.position,
      clipPath: c.clipPath,
      largura: caixa.width,
      altura: caixa.height,
    };
    s.remove();
    return lido;
  });
  expect(r.display).not.toBe('none');
  expect(r.position).toBe('absolute');
  expect(r.clipPath).toBe('inset(50%)');
  expect(r.largura).toBeLessThanOrEqual(1);
  expect(r.altura).toBeLessThanOrEqual(1);
});

test('nenhuma medida muda entre os temas (5 caixas iguais ±0 px)', async ({ page }, testInfo) => {
  await abrir(page, 'light');
  await page.evaluate(() => {
    const bloco = document.createElement('div');
    bloco.id = 'ds04-bloco';
    bloco.innerHTML =
      '<h2 class="t-h2">Sonda</h2><p class="t-body">Texto de sonda.</p><a href="#ds04">sonda</a>';
    document.getElementById('conteudo')?.prepend(bloco);
  });
  const seletores = [
    'main#conteudo',
    'main#conteudo > section:first-of-type',
    '#ds04-bloco h2',
    '#ds04-bloco p',
    '#ds04-bloco a',
  ];
  const caixas = async () =>
    Promise.all(seletores.map(async (s) => page.locator(s).first().boundingBox()));

  const claro = await caixas();
  const shotClaro = await page.screenshot();
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(21, 10, 16)');
  const escuro = await caixas();
  const shotEscuro = await page.screenshot();

  expect(claro.every((c) => c !== null)).toBe(true);
  expect(escuro).toEqual(claro);
  await testInfo.attach('caixas-claro', { body: shotClaro, contentType: 'image/png' });
  await testInfo.attach('caixas-escuro', { body: shotEscuro, contentType: 'image/png' });
});
