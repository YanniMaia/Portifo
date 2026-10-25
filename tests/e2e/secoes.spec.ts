// Montagem final da página (S-17; doc de design §2, §7.1, §9; doc 03 S-17 passo 8). Confere, no
// navegador real: o menu desktop leva a cada seção com o título 80 px abaixo do topo (só o
// mecanismo da F-13); o item ativo do menu acompanha a rolagem com `aria-current="location"`
// (D14); nenhum link ativo no hero/faixa/frase; "Formação" continua ativo em "Onde quero chegar";
// sem rolagem horizontal; trocar tema (e, na V1, o idioma por dentro) não quebra a página; os ids
// no DOM são iguais aos de `SECTION_IDS` (F-12), na mesma ordem.
//
// V1 (doc 09): o botão PT/EN (DS-20) foi adiado para a V2 — `Header.tsx` não monta o
// `LanguageToggle` (confirmado na leitura do componente para esta task). "Trocar idioma não quebra
// a página" por isso usa o mesmo acesso à árvore de fibras do React que `tests/e2e/i18n.spec.ts`
// (F-10) já usa para acionar o `toggleLang()` real, sem inventar um controle que ainda não existe.
import { expect, test, type Page } from '@playwright/test';
import { pt } from '../../src/content/pt.ts';
import { NAV_ITEMS, SECTION_IDS, type SectionId } from '../../src/content/sections.ts';

const OFFSET_PX = 80;
const TOLERANCIA_PX = 1;
/** Header.tsx (`TABLET_MAX` = 1023): o menu desktop (`<nav>` com os 6 links) só existe a partir daqui. */
const DESKTOP_MIN_PX = 1024;
/** Seções sem item no menu: nenhum link deve ficar ativo nelas (§9). */
const SEM_ITEM_ATIVO: readonly SectionId[] = ['inicio', 'destaques', 'frase'];

async function abrir(page: Page): Promise<void> {
  await page.goto('./');
  await page.waitForLoadState('networkidle');
}

/** Espera a rolagem (suave) assentar e devolve o topo do elemento `seletor` na viewport. */
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

/** Rola `id` para o topo sem animação (equivalente ao `scrollIntoView` instantâneo do F-13). */
async function irParaSemAnimar(page: Page, id: string): Promise<void> {
  await page.evaluate((alvo) => {
    document.getElementById(alvo)?.scrollIntoView({ behavior: 'instant', block: 'start' });
  }, id);
}

/**
 * Aciona o `toggleLang()` real do `LanguageProvider` pela árvore de fibras do React (mesmo acesso
 * de `tests/e2e/i18n.spec.ts`, F-10): não existe botão PT/EN visível na V1 (DS-20 ⏭ V2).
 */
async function alternarIdioma(page: Page): Promise<string> {
  return page.evaluate(() => {
    const raiz = document.getElementById('root');
    if (!raiz) throw new Error('#root não encontrado');
    const chave = Object.keys(raiz).find((k) => k.startsWith('__reactContainer$'));
    if (!chave) throw new Error('raiz do React não encontrada');

    interface Valor {
      lang?: unknown;
      toggleLang?: unknown;
    }
    interface Fibra {
      child: Fibra | null;
      sibling: Fibra | null;
      stateNode?: { current?: Fibra } | null;
      memoizedProps: { value?: Valor } | null;
    }
    const hostRoot = (raiz as unknown as Record<string, Fibra | undefined>)[chave];
    const inicio = hostRoot?.stateNode?.current;
    if (!inicio) throw new Error('fibra raiz do React não encontrada');
    const pilha: Fibra[] = [inicio];
    while (pilha.length > 0) {
      const fibra = pilha.pop();
      if (!fibra) continue;
      const valor = fibra.memoizedProps?.value;
      if (valor && typeof valor.toggleLang === 'function') {
        (valor.toggleLang as () => void)();
        return String(valor.lang);
      }
      if (fibra.sibling) pilha.push(fibra.sibling);
      if (fibra.child) pilha.push(fibra.child);
    }
    throw new Error('LanguageProvider não encontrado na árvore do React');
  });
}

function registrarErros(page: Page, erros: string[]): void {
  page.on('pageerror', (e) => erros.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') erros.push(m.text());
  });
}

test.describe('Montagem final da página (S-17)', () => {
  test('os ids das <section> no DOM são iguais a SECTION_IDS, na mesma ordem', async ({ page }) => {
    await abrir(page);
    const ids = await page
      .locator('main#conteudo > section')
      .evaluateAll((secoes) => secoes.map((s) => s.id));
    expect(ids).toEqual([...SECTION_IDS]);
    await expect(page.locator('main#conteudo > section')).toHaveCount(SECTION_IDS.length);
  });

  test('sem rolagem horizontal', async ({ page }) => {
    await abrir(page);
    const semRolagemHorizontal = await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
    );
    expect(semRolagemHorizontal).toBe(true);
  });

  test.describe('menu desktop (>= 1024 px)', () => {
    // Abaixo de 1024 px o `<nav>` do cabeçalho não existe no DOM (hambúrguer do S-02); estes
    // critérios são do menu desktop e rodam só nos projetos de 1024 px ou mais.
    test.skip(
      ({ viewport }) => (viewport?.width ?? 0) < DESKTOP_MIN_PX,
      'menu desktop só existe a partir de 1024 px',
    );

    for (const item of NAV_ITEMS) {
      test(`link "${item.id}" leva à seção com o título 80 ± 1 px do topo`, async ({ page }) => {
        await abrir(page);
        await page
          .getByRole('navigation', { name: pt.menu.navAria })
          .getByRole('link', { name: pt.nav[item.id] })
          .click();

        const topo = await topoAssentado(page, `#${item.id}`);
        expect(Math.abs(topo - OFFSET_PX)).toBeLessThanOrEqual(TOLERANCIA_PX);
        expect(page.url().endsWith(`#${item.id}`)).toBe(true);
        await expect(page.locator(`#${item.id}`).getByRole('heading').first()).toBeVisible();
      });
    }

    test('o item ativo do menu acompanha a rolagem, com aria-current="location"', async ({
      page,
    }) => {
      await abrir(page);
      const nav = page.getByRole('navigation', { name: pt.menu.navAria });

      for (const item of NAV_ITEMS) {
        await irParaSemAnimar(page, item.id);
        await expect(nav.getByRole('link', { name: pt.nav[item.id] })).toHaveAttribute(
          'aria-current',
          'location',
        );
        for (const outro of NAV_ITEMS) {
          if (outro.id === item.id) continue;
          await expect(nav.getByRole('link', { name: pt.nav[outro.id] })).not.toHaveAttribute(
            'aria-current',
            'location',
          );
        }
      }
    });

    test('"Formação" continua ativo em #objetivos (Onde quero chegar)', async ({ page }) => {
      await abrir(page);
      await irParaSemAnimar(page, 'objetivos');
      const nav = page.getByRole('navigation', { name: pt.menu.navAria });
      await expect(nav.getByRole('link', { name: pt.nav.formacao })).toHaveAttribute(
        'aria-current',
        'location',
      );
    });

    test('nenhum item do menu fica ativo no hero, na faixa ou na frase', async ({ page }) => {
      await abrir(page);
      const nav = page.getByRole('navigation', { name: pt.menu.navAria });
      for (const id of SEM_ITEM_ATIVO) {
        await irParaSemAnimar(page, id);
        await expect(nav.locator('[aria-current="location"]')).toHaveCount(0);
      }
    });
  });

  test('trocar o tema não quebra a página (clique real no botão, sem erro de console)', async ({
    page,
  }) => {
    const erros: string[] = [];
    registrarErros(page, erros);

    await abrir(page);
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await page.getByRole('button', { name: pt.a11y.themeToDark }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('main#conteudo > section')).toHaveCount(SECTION_IDS.length);

    await page.getByRole('button', { name: pt.a11y.themeToLight }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    expect(erros).toEqual([]);
  });

  test('trocar o idioma não quebra a página (V1: sem botão PT/EN visível, DS-20 ⏭ V2)', async ({
    page,
  }) => {
    const erros: string[] = [];
    registrarErros(page, erros);

    await abrir(page);
    // O valor devolvido por `alternarIdioma` é o `lang` memorizado no instante da chamada (antes
    // do re-render do React, que é assíncrono); por isso a confirmação é sempre pelo `<html lang>`
    // (via `expect.poll`/`toHaveAttribute`, que tentam de novo), igual ao `i18n.spec.ts` (F-10).
    await alternarIdioma(page);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('main#conteudo > section')).toHaveCount(SECTION_IDS.length);
    const ids = await page
      .locator('main#conteudo > section')
      .evaluateAll((secoes) => secoes.map((s) => s.id));
    expect(ids).toEqual([...SECTION_IDS]);
    expect(erros).toEqual([]);
  });
});
