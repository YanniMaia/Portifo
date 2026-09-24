// Rolagem por âncora com offset de 80 px (F-13; doc de design §9). O offset vem só do CSS do
// `<html>` (base.css) e o `scroll.ts` usa `scrollIntoView`, que respeita o mesmo CSS.
//
// Dois blocos:
// 1. CSS da rolagem: ATIVO desde a F-13 (não depende de seções).
// 2. Medidas de offset: DESATIVADO até a F-14, porque as seções-stub só existem no App shell dela.
//    Para ligar, troque `test.describe.skip` por `test.describe` no bloco marcado `// ativado na F-14`.
// Ids de seção: tipados pelo registro da F-12 (`SectionId`); nada de lista escrita à mão.
import { expect, test, type Page } from '@playwright/test';
import { SECTION_IDS, type SectionId } from '../../src/content/sections.ts';

const OFFSET_PX = 80;
const TOLERANCIA_PX = 1;
/** Larguras medidas pelo critério da F-13: desktop 1280 e mobile 390 (projetos vp1280/vp390). */
const LARGURAS_MEDIDAS = [1280, 390];

const PROJETOS: SectionId = 'projetos';
const CONTATO: SectionId = 'contato';

async function abrir(page: Page, caminho = './'): Promise<void> {
  await page.goto(caminho);
  await page.waitForLoadState('networkidle');
}

test.describe('CSS da rolagem (base.css)', () => {
  test('com movimento reduzido, scroll-behavior do <html> é auto', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await abrir(page);
    const comportamento = await page.evaluate(
      () => getComputedStyle(document.documentElement).scrollBehavior,
    );
    expect(comportamento).toBe('auto');
  });

  test('sem preferência de movimento, scroll-behavior é smooth', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await abrir(page);
    const comportamento = await page.evaluate(
      () => getComputedStyle(document.documentElement).scrollBehavior,
    );
    expect(comportamento).toBe('smooth');
  });

  test('scroll-padding-top do <html> é 80px', async ({ page }) => {
    await abrir(page);
    const padding = await page.evaluate(
      () => getComputedStyle(document.documentElement).scrollPaddingTop,
    );
    expect(padding).toBe(`${OFFSET_PX}px`);
  });
});

/** Espera a rolagem (suave) assentar e devolve o topo da seção na viewport. */
async function topoAssentado(page: Page, id: SectionId): Promise<number> {
  let anterior = Number.NaN;
  let atual = Number.NaN;
  await expect
    .poll(
      async () => {
        anterior = atual;
        atual = await page.evaluate((alvo) => {
          const secao = document.getElementById(alvo);
          if (!secao) throw new Error(`#${alvo} não encontrado`);
          return secao.getBoundingClientRect().top;
        }, id);
        return anterior === atual;
      },
      { timeout: 5_000, intervals: [100] },
    )
    .toBe(true);
  return atual;
}

async function estaNoFim(page: Page): Promise<boolean> {
  return page.evaluate(
    (tolerancia) =>
      window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - tolerancia,
    TOLERANCIA_PX,
  );
}

// ativado na F-14: trocar `test.describe.skip` por `test.describe` quando o App shell tiver as seções.
test.describe.skip('offset de 80 px nas âncoras (precisa das seções da F-14)', () => {
  test.skip(
    ({ viewport }) => !LARGURAS_MEDIDAS.includes(viewport?.width ?? 0),
    'o critério mede 1280 e 390',
  );

  test('todas as seções do registro existem no DOM', async ({ page }) => {
    await abrir(page);
    for (const id of SECTION_IDS) {
      await expect(page.locator(`section#${id}`)).toHaveCount(1);
    }
  });

  test(`clicar num link #${PROJETOS} para a seção a 80 ± 1 px do topo`, async ({ page }) => {
    await abrir(page);
    // Link nativo, sem JS: prova que o CSS sozinho aplica o offset. Fixo no topo para o clique
    // não precisar rolar antes.
    await page.evaluate((alvo) => {
      const link = document.createElement('a');
      link.href = `#${alvo}`;
      link.id = 'e2e-link-ancora';
      link.textContent = alvo;
      link.style.cssText = 'position:fixed;top:0;left:0;z-index:2147483647;';
      document.body.append(link);
    }, PROJETOS);
    await page.locator('#e2e-link-ancora').click();

    const topo = await topoAssentado(page, PROJETOS);
    expect(Math.abs(topo - OFFSET_PX)).toBeLessThanOrEqual(TOLERANCIA_PX);
    expect(page.url().endsWith(`#${PROJETOS}`)).toBe(true);
  });

  test(`abrir ./#${CONTATO} direto para a seção a 80 ± 1 px (ou no fim da página)`, async ({
    page,
  }) => {
    await abrir(page, `./#${CONTATO}`);
    await page.evaluate(() => document.fonts.ready);

    const topo = await topoAssentado(page, CONTATO);
    const noOffset = Math.abs(topo - OFFSET_PX) <= TOLERANCIA_PX;
    // A seção pode ser mais baixa que a viewport: aí a página fica no fim e o topo passa de 80 px.
    const noFim = (await estaNoFim(page)) && topo >= OFFSET_PX - TOLERANCIA_PX;
    expect(noOffset || noFim, `topo de #${CONTATO} = ${topo}px`).toBe(true);
  });

  test('hash desconhecido não rola nem gera erro', async ({ page }) => {
    const erros: string[] = [];
    page.on('pageerror', (e) => erros.push(e.message));
    await abrir(page, './#nao-existe');
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    expect(erros).toEqual([]);
  });
});
