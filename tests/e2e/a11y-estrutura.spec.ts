// Q-14 — Estrutura semântica (doc 06 linhas 425-446, passos 3, 4 e 7; doc de design §11
// "Idioma"/"Estrutura"/"Imagens e ícones"), no build de produção e nas 6 larguras
// (`playwright.config.ts`, só `-claro`, sem EN — Q-07/C-03 `⏭ V2`, doc 09 §3).
//
// O passo 5 (decorativos com `aria-hidden`) já é coberto de ponta a ponta por
// `tests/e2e/decor-a11y.spec.ts` (A-20): este arquivo não reimplementa aquela varredura, só confia
// nela (D14 — um dono por artefato). O passo 1/2 (axe por seção, com o menu aberto e com o foco no
// skip link) vive em `tests/e2e/a11y-axe.spec.ts`. Aqui ficam só os passos de ESTRUTURA (3, 4, 7) e
// a conferência dos landmarks (que `tests/e2e/shell.spec.ts`, da F-14, já cobre em parte — repetido
// aqui como entregável próprio da Q-14, mais a checagem de nome acessível do `<nav>` e a unicidade
// do landmark de navegação com o painel do menu aberto, que o shell.spec.ts não testa).
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { pt } from '../../src/content/pt.ts';
import { SECTION_IDS, type SectionId } from '../../src/content/sections.ts';

/**
 * As 8 seções com exatamente 1 `<h2>` próprio (`SectionHeader`, DS-14, ou o `<h2>` manual do
 * `Motto`, S-06): todas as seções do registro, menos o Hero (`h1`) e a Faixa de destaques
 * (`destaques`, sem título visível, só `aria-label`, AMB-S-13).
 */
const SECOES_COM_H2: readonly SectionId[] = [
  'frase',
  'sobre',
  'interesses',
  'habilidades',
  'projetos',
  'formacao',
  'objetivos',
  'contato',
];
const SECOES_SEM_H2: readonly SectionId[] = ['inicio', 'destaques'];

async function abrir(page: Page): Promise<void> {
  await page.goto('./');
  await page.waitForLoadState('networkidle');
}

test.describe('Q-14: exatamente 1 h1 (hero)', () => {
  test('1 único <h1> na página, dentro de #inicio', async ({ page }) => {
    await abrir(page);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('#inicio h1')).toHaveCount(1);
  });
});

test.describe('Q-14: cada seção de conteúdo tem 1 h2; a Faixa e o Hero não têm h2', () => {
  for (const id of SECOES_COM_H2) {
    test(`#${id} tem exatamente 1 <h2>`, async ({ page }) => {
      await abrir(page);
      await expect(page.locator(`#${id} > h2, #${id} h2`)).toHaveCount(1);
    });
  }

  for (const id of SECOES_SEM_H2) {
    test(`#${id} não tem nenhum <h2>`, async ({ page }) => {
      await abrir(page);
      await expect(page.locator(`#${id} h2`)).toHaveCount(0);
    });
  }

  test('o total de h2 da página é exatamente 8 (SECOES_COM_H2)', async ({ page }) => {
    await abrir(page);
    await expect(page.locator('main#conteudo h2')).toHaveCount(SECOES_COM_H2.length);
  });
});

test.describe('Q-14: nenhum salto de nível de título (h2 → h4 etc.) e nenhum h4/h5/h6', () => {
  test('h4, h5 e h6 não existem em nenhum lugar da página', async ({ page }) => {
    await abrir(page);
    await expect(page.locator('h4, h5, h6')).toHaveCount(0);
  });

  test('a sequência de níveis de título, na ordem do documento, nunca sobe mais de 1 por vez', async ({
    page,
  }) => {
    await abrir(page);
    const niveis = await page
      .locator('h1, h2, h3, h4, h5, h6')
      .evaluateAll((els) => els.map((el) => Number(el.tagName[1])));
    expect(niveis.length).toBeGreaterThan(SECOES_COM_H2.length); // h1 + 8×h2 + várias h3 de cards
    expect(niveis[0]).toBe(1);
    for (let i = 1; i < niveis.length; i++) {
      const anterior = niveis[i - 1] ?? 0;
      const atual = niveis[i] ?? 0;
      expect(atual - anterior, `posição ${i}: h${anterior} → h${atual}`).toBeLessThanOrEqual(1);
    }
  });

  test('todo <h3> da página está dentro de alguma seção com h2 (cards de conteúdo, não decorativos)', async ({
    page,
  }) => {
    await abrir(page);
    const total = await page.locator('h3').count();
    expect(total).toBeGreaterThan(0);
    const foraDeSecaoComH2 = await page.evaluate((idsComH2: string[]) => {
      return [...document.querySelectorAll('h3')]
        .filter((h3) => !idsComH2.some((id) => h3.closest(`#${id}`) !== null))
        .map((h3) => h3.textContent?.trim() ?? '(sem texto)');
    }, SECOES_COM_H2 as string[]);
    expect(foraDeSecaoComH2).toEqual([]);
  });
});

test.describe('Q-14: landmarks header/nav/main/footer presentes e únicos', () => {
  test('1 banner, 1 main#conteudo, 1 contentinfo; <header> de topo único', async ({ page }) => {
    await abrir(page);
    await expect(page.getByRole('banner')).toHaveCount(1);
    await expect(page.getByRole('main')).toHaveCount(1);
    await expect(page.locator('main')).toHaveAttribute('id', 'conteudo');
    await expect(page.getByRole('contentinfo')).toHaveCount(1);
    // Os `SectionHeader` (DS-14) renderizam o próprio `<header>` dentro de `<section>`: válido (não
    // é "banner" porque não é de topo), mas não deve ser contado como cabeçalho da página.
    const headersDeTopo = await page.evaluate(
      () =>
        document.querySelectorAll('header').length -
        document.querySelectorAll('main header').length,
    );
    expect(headersDeTopo).toBe(1);
  });

  // `page.accessibility.snapshot()` foi removido do Playwright (não existe mais em ^1.63);
  // `getByRole` usa o MESMO cálculo de nome acessível (W3C AccName) e já respeita `display: none`/
  // `inert`/`aria-hidden`, exatamente como um leitor de tela veria — por isso serve ao mesmo
  // propósito (contar landmarks de navegação "ligados" à árvore de acessibilidade).
  //
  // Abaixo de 1024 px (hambúrguer, S-02/D14) o painel só existe na árvore de acessibilidade quando
  // ABERTO (`inert={!aberto}`, confirmado lendo `MobileMenu.tsx`): com o painel fechado não há
  // NENHUM `<nav>` acessível, por desenho (o botão "Abrir menu", com `aria-label` próprio, é o
  // único jeito de alcançá-lo) — o mesmo padrão de qualquer menu hambúrguer "off-canvas" e já
  // aceito pelo `menu-mobile.spec.ts` (Q-09). Por isso este teste só roda nos projetos desktop
  // (≥1024 px, onde o `<nav>` do `Header` fica sempre visível); o teste abaixo cobre o caso
  // compacto com o painel aberto.
  test('desktop (≥1024 px): exatamente 1 <nav> com nome acessível', async ({ page, viewport }) => {
    test.skip((viewport?.width ?? 0) < 1024, 'só nos projetos desktop (≥1024)');
    await abrir(page);
    await expect(page.getByRole('navigation', { name: pt.menu.navAria })).toHaveCount(1);
  });

  test('abaixo de 1024 px, com o menu aberto, continua existindo exatamente 1 <nav> acessível', async ({
    page,
    viewport,
  }) => {
    test.skip((viewport?.width ?? 0) >= 1024, 'só nos projetos compactos (<1024)');
    await abrir(page);
    await page.locator('button[data-open]').click();
    await expect(page.locator('button[data-open]')).toHaveAttribute('aria-expanded', 'true');

    await expect(page.getByRole('navigation', { name: pt.menu.navAria })).toHaveCount(1);
  });

  test('ordem no DOM: skip link → header → main → footer', async ({ page }) => {
    await abrir(page);
    const ordem = await page.evaluate(() => {
      const main = document.querySelector('main');
      const pai = main?.parentElement;
      if (!pai) return [];
      return Array.from(pai.children)
        .map((el) => el.tagName.toLowerCase())
        .filter((tag) => tag !== 'div');
    });
    expect(ordem).toEqual(['a', 'header', 'main', 'footer']);
  });

  test('as 10 seções do registro existem, 1 vez cada, na ordem de SECTION_IDS', async ({
    page,
  }) => {
    await abrir(page);
    const ids = await page
      .locator('main#conteudo > section')
      .evaluateAll((secoes) => secoes.map((s) => s.id));
    expect(ids).toEqual([...SECTION_IDS]);
  });
});

test.describe('Q-14: <html lang="pt-BR"> (sem EN na V1, Q-07/C-03 ⏭ V2)', () => {
  test('o atributo lang do documento é pt-BR', async ({ page }) => {
    await abrir(page);
    await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
  });
});

test.describe('Q-14: nenhum tabindex > 0 em lugar nenhum da página', () => {
  test('todo [tabindex] da página tem valor ≤ 0', async ({ page }) => {
    await abrir(page);
    const valores = await page
      .locator('[tabindex]')
      .evaluateAll((els) => els.map((el) => Number(el.getAttribute('tabindex'))));
    expect(valores.length).toBeGreaterThan(0);
    for (const valor of valores) {
      expect(valor).toBeLessThanOrEqual(0);
    }
  });

  test('o mesmo vale com o painel do menu aberto (abaixo de 1024 px)', async ({
    page,
    viewport,
  }) => {
    test.skip((viewport?.width ?? 0) >= 1024, 'só nos projetos compactos (<1024)');
    await abrir(page);
    await page.locator('button[data-open]').click();
    await expect(page.locator('button[data-open]')).toHaveAttribute('aria-expanded', 'true');
    const valores = await page
      .locator('[tabindex]')
      .evaluateAll((els) => els.map((el) => Number(el.getAttribute('tabindex'))));
    for (const valor of valores) {
      expect(valor).toBeLessThanOrEqual(0);
    }
  });
});

// Doc 06 Q-14 passo 6: mídia de projeto (C-08/C-07) com nome acessível não vazio; ícones dentro de
// botões/links COM TEXTO são aria-hidden (o nome acessível vem só do texto, `ConteudoDoBotao.tsx`).
test.describe('Q-14: mídia de projeto com nome acessível; ícones em botões com texto são aria-hidden', () => {
  test('toda <img>/[role="img"] de #projetos (imagem real ou ilustração C-08) tem alt/aria-label não vazio', async ({
    page,
  }) => {
    await abrir(page);
    const midias = page.locator('#projetos img, #projetos [role="img"]');
    const total = await midias.count();
    expect(total).toBeGreaterThan(0);
    const nomes = await midias.evaluateAll((els) =>
      els.map((el) => el.getAttribute('alt') ?? el.getAttribute('aria-label') ?? ''),
    );
    for (const nome of nomes) {
      expect(nome.trim().length).toBeGreaterThan(0);
    }
  });

  test('nenhum <svg> dentro de um <button>/<a> com texto visível fica fora de aria-hidden', async ({
    page,
  }) => {
    await abrir(page);
    const problemas = await page.evaluate(() => {
      const clicaveis = [...document.querySelectorAll('button, a')];
      const achados: string[] = [];
      for (const el of clicaveis) {
        const temTexto = (el.textContent ?? '').trim().length > 0;
        if (!temTexto) continue;
        for (const svg of el.querySelectorAll('svg')) {
          if (svg.getAttribute('aria-hidden') !== 'true') {
            achados.push(el.outerHTML.slice(0, 120));
          }
        }
      }
      return achados;
    });
    expect(problemas).toEqual([]);
  });
});

// Confirmação pontual do passo 5 do doc 06 (decorativos), sem reimplementar a varredura completa
// do `decor-a11y.spec.ts` (A-20, D14): só garante que o axe (aqui com as tags extras pedidas pela
// Q-14) continua sem apontar nenhuma violação dentro de um `[data-decor]`.
test.describe('Q-14: decorativos (confirmação pontual — dona: A-20/decor-a11y.spec.ts)', () => {
  test('0 violações do axe (tags da Q-14) com o nó dentro de algum [data-decor]', async ({
    page,
  }) => {
    await abrir(page);
    const resultado = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
      .analyze();
    const achados: string[] = [];
    for (const violacao of resultado.violations) {
      for (const no of violacao.nodes) {
        const seletor = no.target[0];
        if (typeof seletor !== 'string') continue;
        const dentroDeDecor = await page.evaluate((sel) => {
          const el = document.querySelector(sel);
          return el !== null && el.closest('[data-decor]') !== null;
        }, seletor);
        if (dentroDeDecor) achados.push(`${violacao.id}: ${seletor}`);
      }
    }
    expect(achados).toEqual([]);
  });
});
