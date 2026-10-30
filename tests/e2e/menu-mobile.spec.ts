// Q-09 — E2E do menu hambúrguer (celular e tablet) (doc 06 linhas 279-299; doc de design §7.1,
// §10, §11). Cobre S-01 (cabeçalho/menu desktop) e S-02 (hambúrguer + painel) de verdade, no build
// de produção, nos 3 projetos compactos (`vp360-claro`, `vp390-claro`, `vp768-claro`, < 1024 px) e,
// para o passo 1 (hambúrguer desaparece / 6 links aparecem), também nos 3 projetos desktop
// (`vp1024-claro`, `vp1280-claro`, `vp1440-claro`).
//
// Adaptações da V1 (doc 09 §3), registradas aqui em vez de no checkpoint sozinho:
// - **DV-12 (botão PT/EN dentro do painel) não se aplica.** DS-20/C-03 estão `⏭ V2` e não existe
//   NENHUM controle de idioma em lugar nenhum do site hoje (confirmado lendo `Header.tsx`,
//   `MobileMenu.tsx` e `plano/checkpoints/S-02.md`). Este spec não testa esse controle.
// - **Dependência Q-07 (6 projetos "-escuro") conta como satisfeita sem existir.** Só há os 6
//   projetos "-claro" em `playwright.config.ts`. O tema escuro é testado dentro desses mesmos
//   projetos via `localStorage` (`THEME_STORAGE_KEY`), igual a `shell.spec.ts`/`pagina-404.spec.ts`,
//   não por projetos de navegador à parte. A cobertura no escuro fica num bloco dedicado, mais
//   enxuto (regime leve do doc 09 §4), em vez de duplicar os 6 passos inteiros.
// - **Dependência A-07 conta como satisfeita sem existir.** A-07 (verificação/ajuste fino do menu,
//   que incluiria a transição de abertura) está `⏭ V2` (doc 09 §1). Lendo `MobileMenu.module.css` e
//   `MenuButton.module.css` hoje: nenhuma `transition` é declarada para `data-open` nem para as
//   linhas do hambúrguer — a troca é sempre imediata. O passo 6 do doc 06 (250 ms ± 10% no normal,
//   0 ms com movimento reduzido) testa por isso o comportamento REAL de hoje: 0 ms nos dois casos.
//   Quando a V2 implementar a A-07, o bloco "Passo 6" deste spec precisa trocar para 250 ms/0 ms.
import { expect, test, type Page } from '@playwright/test';
import { pt } from '../../src/content/pt.ts';
import { NAV_ITEMS } from '../../src/content/sections.ts';
import { THEME_STORAGE_KEY, type Theme } from '../../src/theme/constants.ts';

/** F-13 (base.css): offset fixo de 80 px, igual em qualquer largura. */
const OFFSET_PX = 80;
const TOLERANCIA_OFFSET_PX = 2;
/** DS-02 (`--touch-min`), §10. */
const TOQUE_MIN_PX = 44;

/** `MenuButton` (S-02): único `<button>` com `data-open` na página. */
const BOTAO = 'button[data-open]';
/** `MobileMenu` (S-02): único `<div>` com `data-open` na página. */
const PAINEL = 'div[data-open]';

async function abrir(page: Page, tema?: Theme): Promise<void> {
  if (tema) {
    await page.addInitScript(
      ([chave, valor]) => {
        try {
          localStorage.setItem(chave, valor);
        } catch {
          // storage indisponível: o teste de data-theme abaixo acusa.
        }
      },
      [THEME_STORAGE_KEY, tema] as const,
    );
  }
  await page.goto('./');
  await page.waitForLoadState('networkidle');
  if (tema) await expect(page.locator('html')).toHaveAttribute('data-theme', tema);
}

/** Header.tsx (`TABLET_MAX` = 1023): hambúrguer e painel só existem abaixo de 1024 px. */
function ehCompacto(viewport: { width: number } | null): boolean {
  return (viewport?.width ?? 0) < 1024;
}

/** Valor numérico (px) do token `--header-height` no momento, já resolvido por breakpoint. */
async function alturaCabecalho(page: Page): Promise<number> {
  return page.evaluate(() =>
    parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-height')),
  );
}

/** Espera a rolagem (suave ou instantânea) assentar e devolve o topo de `seletor` na viewport. */
async function topoAssentado(page: Page, seletor: string): Promise<number> {
  let anterior = Number.NaN;
  let atual = Number.NaN;
  await expect
    .poll(
      async () => {
        anterior = atual;
        atual = await page.evaluate((s) => {
          const el = document.querySelector(s);
          if (!el) throw new Error(`${s} não encontrado`);
          return el.getBoundingClientRect().top;
        }, seletor);
        return anterior === atual;
      },
      { timeout: 5_000, intervals: [100] },
    )
    .toBe(true);
  return atual;
}

test.describe('Passo 1 — visibilidade por breakpoint', () => {
  test('compacto (<1024): hambúrguer e tema visíveis ≥44×44; 6 links do menu desktop não aparecem', async ({
    page,
    viewport,
  }) => {
    test.skip(!ehCompacto(viewport), 'só roda nos projetos compactos (<1024)');
    await abrir(page);

    await expect(page.locator('header nav')).toBeHidden();
    await expect(page.locator(BOTAO)).toHaveCount(1);
    await expect(page.locator(PAINEL)).toHaveCount(1);

    const botao = page.locator(BOTAO);
    const tema = page.locator('[data-theme-atual]');
    await expect(botao).toBeVisible();
    await expect(tema).toBeVisible();

    const caixaBotao = await botao.boundingBox();
    const caixaTema = await tema.boundingBox();
    expect(caixaBotao?.width ?? 0).toBeGreaterThanOrEqual(TOQUE_MIN_PX);
    expect(caixaBotao?.height ?? 0).toBeGreaterThanOrEqual(TOQUE_MIN_PX);
    expect(caixaTema?.width ?? 0).toBeGreaterThanOrEqual(TOQUE_MIN_PX);
    expect(caixaTema?.height ?? 0).toBeGreaterThanOrEqual(TOQUE_MIN_PX);
  });

  test('desktop (≥1024): hambúrguer e painel não existem no DOM; os 6 links do menu aparecem', async ({
    page,
    viewport,
  }) => {
    test.skip(ehCompacto(viewport), 'só roda nos projetos desktop (≥1024)');
    await abrir(page);
    await expect(page.locator(BOTAO)).toHaveCount(0);
    await expect(page.locator(PAINEL)).toHaveCount(0);
    await expect(page.locator('header nav')).toBeVisible();
    await expect(page.locator('header nav a')).toHaveCount(NAV_ITEMS.length);
  });
});

test.describe('Passo 2 — abrir o painel', () => {
  test('aria-expanded, aria-controls, painel em largura total abaixo do cabeçalho, ícone vira X', async ({
    page,
    viewport,
  }) => {
    test.skip(!ehCompacto(viewport), 'só compacto');
    await abrir(page);
    const botao = page.locator(BOTAO);
    const painel = page.locator(PAINEL);
    const idPainel = await painel.getAttribute('id');

    await expect(botao).toHaveAttribute('aria-expanded', 'false');
    await expect(botao).toHaveAttribute('aria-controls', idPainel ?? '');

    const linhas = botao.locator('span > span');
    await expect(linhas).toHaveCount(3);
    const antes = await linhas.evaluateAll((els) =>
      els.map((el) => getComputedStyle(el).transform),
    );

    await botao.click();

    await expect(botao).toHaveAttribute('aria-expanded', 'true');
    await expect(painel).toHaveAttribute('data-open', 'true');

    // Ícone vira X: as linhas 1 e 3 giram/deslocam, a do meio fica com opacidade 0 (MenuButton.module.css).
    const depois = await linhas.evaluateAll((els) =>
      els.map((el) => getComputedStyle(el).transform),
    );
    expect(depois[0]).not.toBe(antes[0]);
    expect(depois[2]).not.toBe(antes[2]);
    const opacidadeMeio = await linhas.nth(1).evaluate((el) => getComputedStyle(el).opacity);
    expect(opacidadeMeio).toBe('0');

    // Painel logo abaixo do cabeçalho, em largura total.
    const caixaPainel = await painel.boundingBox();
    const alturaCab = await alturaCabecalho(page);
    expect(caixaPainel).not.toBeNull();
    expect(caixaPainel?.x ?? -1).toBe(0);
    expect(Math.abs((caixaPainel?.y ?? -1) - alturaCab)).toBeLessThanOrEqual(1);
    expect(Math.abs((caixaPainel?.width ?? -1) - (viewport?.width ?? 0))).toBeLessThanOrEqual(1);

    // Links: altura 56 px, fonte 20 px.
    const links = painel.locator('nav a');
    await expect(links).toHaveCount(NAV_ITEMS.length);
    const caixasLinks = await links.evaluateAll((els) =>
      els.map((el) => el.getBoundingClientRect().height),
    );
    for (const altura of caixasLinks) {
      expect(Math.round(altura)).toBe(56);
    }
    const fontes = await links.evaluateAll((els) => els.map((el) => getComputedStyle(el).fontSize));
    for (const fonte of fontes) {
      expect(fonte).toBe('20px');
    }

    // Divisórias de 1 px entre os itens (nenhuma no primeiro).
    const itens = painel.locator('nav ul > li');
    await expect(itens.first()).toHaveCSS('border-top-width', '0px');
    const totalItens = await itens.count();
    for (let i = 1; i < totalItens; i++) {
      await expect(itens.nth(i)).toHaveCSS('border-top-width', '1px');
    }
  });

  test('rótulo acessível alterna entre "abrir menu" e "fechar menu" do dicionário', async ({
    page,
    viewport,
  }) => {
    test.skip(!ehCompacto(viewport), 'só compacto');
    await abrir(page);
    const botao = page.locator(BOTAO);
    await expect(botao).toHaveAttribute('aria-label', pt.menu.abrir);
    await botao.click();
    await expect(botao).toHaveAttribute('aria-label', pt.menu.fechar);
    await botao.click();
    await expect(botao).toHaveAttribute('aria-label', pt.menu.abrir);
  });
});

test.describe('Passo 3 — rolagem do fundo travada', () => {
  test('window.scrollY não muda com mouse.wheel enquanto o menu está aberto', async ({
    page,
    viewport,
  }) => {
    test.skip(!ehCompacto(viewport), 'só compacto');
    await abrir(page);

    await page.evaluate(() => window.scrollTo({ top: 300, behavior: 'instant' }));
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);

    await page.locator(BOTAO).click();
    await expect(page.locator(BOTAO)).toHaveAttribute('aria-expanded', 'true');
    const aoAbrir = await page.evaluate(() => window.scrollY);

    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(200);
    const depoisDaRoda = await page.evaluate(() => window.scrollY);
    expect(depoisDaRoda).toBe(aoAbrir);
  });
});

test.describe('Passo 4 — fechar o painel', () => {
  for (const item of NAV_ITEMS) {
    test(`(a) tocar no link "${item.id}": fecha e navega com offset 80 ± 2`, async ({
      page,
      viewport,
    }) => {
      test.skip(!ehCompacto(viewport), 'só compacto');
      await abrir(page);
      const botao = page.locator(BOTAO);
      await botao.click();
      await expect(botao).toHaveAttribute('aria-expanded', 'true');

      const link = page.locator(PAINEL).getByRole('link', { name: pt.nav[item.id] });
      await link.click();

      await expect(botao).toHaveAttribute('aria-expanded', 'false');
      await expect(page.locator(PAINEL)).toHaveAttribute('data-open', 'false');

      const topo = await topoAssentado(page, `#${item.id}`);
      expect(Math.abs(topo - OFFSET_PX)).toBeLessThanOrEqual(TOLERANCIA_OFFSET_PX);
      expect(page.url().endsWith(`#${item.id}`)).toBe(true);
    });
  }

  test('(b) tocar no X: fecha, foco volta ao botão, rolagem volta a funcionar', async ({
    page,
    viewport,
  }) => {
    test.skip(!ehCompacto(viewport), 'só compacto');
    await abrir(page);
    await page.evaluate(() => window.scrollTo({ top: 300, behavior: 'instant' }));
    const antesDeAbrir = await page.evaluate(() => window.scrollY);

    const botao = page.locator(BOTAO);
    await botao.click();
    await expect(botao).toHaveAttribute('aria-expanded', 'true');
    await botao.click(); // o próprio botão virou o X
    await expect(botao).toHaveAttribute('aria-expanded', 'false');
    await expect(botao).toBeFocused();

    const aoFechar = await page.evaluate(() => window.scrollY);
    expect(Math.abs(aoFechar - antesDeAbrir)).toBeLessThanOrEqual(1);

    await page.mouse.wheel(0, 200);
    await page.waitForTimeout(200);
    const depois = await page.evaluate(() => window.scrollY);
    expect(depois).toBeGreaterThan(aoFechar);
  });

  test('(c) tocar fora do painel: fecha, foco volta ao botão, rolagem volta a funcionar', async ({
    page,
    viewport,
  }) => {
    test.skip(!ehCompacto(viewport), 'só compacto');
    await abrir(page);
    await page.evaluate(() => window.scrollTo({ top: 300, behavior: 'instant' }));
    const antesDeAbrir = await page.evaluate(() => window.scrollY);

    const botao = page.locator(BOTAO);
    await botao.click();
    await expect(botao).toHaveAttribute('aria-expanded', 'true');

    const caixaPainel = await page.locator(PAINEL).boundingBox();
    expect(caixaPainel).not.toBeNull();
    const alturaViewport = viewport?.height ?? 800;
    const y = Math.min((caixaPainel?.y ?? 0) + (caixaPainel?.height ?? 0) + 20, alturaViewport - 5);
    await page.mouse.click(5, y);

    await expect(botao).toHaveAttribute('aria-expanded', 'false');
    await expect(botao).toBeFocused();

    const aoFechar = await page.evaluate(() => window.scrollY);
    expect(Math.abs(aoFechar - antesDeAbrir)).toBeLessThanOrEqual(1);

    await page.mouse.wheel(0, 200);
    await page.waitForTimeout(200);
    const depois = await page.evaluate(() => window.scrollY);
    expect(depois).toBeGreaterThan(aoFechar);
  });

  test('(d) tecla Esc: fecha, foco volta ao botão, rolagem volta a funcionar', async ({
    page,
    viewport,
  }) => {
    test.skip(!ehCompacto(viewport), 'só compacto');
    await abrir(page);
    await page.evaluate(() => window.scrollTo({ top: 300, behavior: 'instant' }));
    const antesDeAbrir = await page.evaluate(() => window.scrollY);

    const botao = page.locator(BOTAO);
    await botao.click();
    await expect(botao).toHaveAttribute('aria-expanded', 'true');

    await page.keyboard.press('Escape');

    await expect(botao).toHaveAttribute('aria-expanded', 'false');
    await expect(botao).toBeFocused();

    const aoFechar = await page.evaluate(() => window.scrollY);
    expect(Math.abs(aoFechar - antesDeAbrir)).toBeLessThanOrEqual(1);

    await page.mouse.wheel(0, 200);
    await page.waitForTimeout(200);
    const depois = await page.evaluate(() => window.scrollY);
    expect(depois).toBeGreaterThan(aoFechar);
  });
});

// Adaptação registrada no topo do arquivo: A-07 (⏭ V2) ainda não declara nenhuma transição. Este
// bloco confirma o estado REAL de hoje (0 ms nos dois casos), não o valor final do doc (250 ms).
test.describe('Passo 6 — duração da animação (hoje: 0 ms, sem A-07; não é o valor final do doc)', () => {
  for (const reduzido of [false, true]) {
    test(`abrir o painel não declara transição (reducedMotion=${reduzido})`, async ({
      page,
      viewport,
    }) => {
      test.skip(!ehCompacto(viewport), 'só compacto');
      if (reduzido) await page.emulateMedia({ reducedMotion: 'reduce' });
      await abrir(page);

      const painel = page.locator(PAINEL);
      expect(await painel.evaluate((el) => getComputedStyle(el).transitionDuration)).toBe('0s');

      await page.locator(BOTAO).click();
      await expect(page.locator(BOTAO)).toHaveAttribute('aria-expanded', 'true');

      expect(await painel.evaluate((el) => getComputedStyle(el).transitionDuration)).toBe('0s');
      // Só as animações do PRÓPRIO painel (a página tem decorações com loop legítimo em A-10/A-11
      // quando o movimento não está reduzido; o que importa aqui é o painel, não a página inteira).
      const emExecucaoNoPainel = await painel.evaluate(
        (el) => el.getAnimations({ subtree: true }).filter((a) => a.playState === 'running').length,
      );
      expect(emExecucaoNoPainel).toBe(0);
    });
  }
});

// Entregável #2 do doc 06 Q-09: medido só em `vp360-claro` (viewport 360 × 800 do playwright.config.ts).
test.describe('Entregável #2 — vp360×800: links do painel dentro da viewport', () => {
  test('bottom de todos os links ≤ 800 e top do primeiro ≥ altura do cabeçalho', async ({
    page,
    viewport,
  }) => {
    test.skip((viewport?.width ?? 0) !== 360, 'só vp360');
    await abrir(page);
    await page.locator(BOTAO).click();
    await expect(page.locator(BOTAO)).toHaveAttribute('aria-expanded', 'true');

    const alturaCab = await alturaCabecalho(page);
    const links = page.locator(PAINEL).locator('nav a');
    const caixas = await links.evaluateAll((els) =>
      els.map((el) => {
        const r = el.getBoundingClientRect();
        return { top: r.top, bottom: r.bottom };
      }),
    );
    expect(caixas.length).toBe(NAV_ITEMS.length);
    for (const caixa of caixas) {
      expect(caixa.bottom).toBeLessThanOrEqual(800);
    }
    const primeiro = caixas[0];
    expect(primeiro).toBeDefined();
    expect(primeiro?.top ?? -1).toBeGreaterThanOrEqual(alturaCab);
  });
});

// Tema escuro (adaptação: Q-07 ⏭ V2, sem projeto "-escuro" — tema setado por localStorage no mesmo
// projeto "-claro", igual a shell.spec.ts/pagina-404.spec.ts). Bloco mais enxuto (regime leve, doc
// 09 §4): confirma que abrir/fechar continua funcionando e os tokens do escuro citados no 00-INDICE
// (D14: link ativo `--color-link` #FFB3D1) e no comentário do MobileMenu.module.css (divisória
// `--color-border` #3B2030) realmente aparecem no painel.
test.describe('Tema escuro', () => {
  test('abre/fecha normalmente; link ativo e divisórias usam os tokens do escuro', async ({
    page,
    viewport,
  }) => {
    test.skip(!ehCompacto(viewport), 'só compacto');
    await abrir(page, 'dark');
    await page.evaluate(() =>
      document.getElementById('sobre')?.scrollIntoView({ behavior: 'instant', block: 'start' }),
    );

    const botao = page.locator(BOTAO);
    await botao.click();
    await expect(botao).toHaveAttribute('aria-expanded', 'true');

    const linkAtivo = page.locator(PAINEL).getByRole('link', { name: pt.nav.sobre });
    await expect(linkAtivo).toHaveAttribute('aria-current', 'location');
    await expect(linkAtivo).toHaveCSS('color', 'rgb(255, 179, 209)'); // #FFB3D1
    await expect(linkAtivo).toHaveCSS('font-weight', '600');

    const itens = page.locator(PAINEL).locator('nav ul > li');
    await expect(itens.nth(1)).toHaveCSS('border-top-color', 'rgb(59, 32, 48)'); // #3B2030

    await page.keyboard.press('Escape');
    await expect(botao).toHaveAttribute('aria-expanded', 'false');
    await expect(botao).toBeFocused();
  });
});
