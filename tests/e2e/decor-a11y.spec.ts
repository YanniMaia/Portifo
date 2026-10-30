// Acessibilidade decorativa (A-20; doc 04 §4.2 R2, §4.3 "Decorações"), no build de produção e
// nas 6 larguras (`playwright.config.ts`). Confere, na página real (todas as 10 seções +
// decorações A-10/A-11b/A-12/A-14/A-17/A-19 montadas):
// - todo `[data-decor]` tem `aria-hidden="true"`;
// - todo `[data-decor]` tem `pointer-events: none` (computado) — nenhum decorativo intercepta clique;
// - nenhum `[data-decor]` é alcançável por `Tab` (percorrendo a página inteira só com teclado,
//   `document.activeElement` nunca é nem está dentro de um `[data-decor]`);
// - SVGs decorativos (`Constellation`/`MiniCharts`/`HeroLinks`) têm `focusable="false"` (IE/Edge
//   legado tratam SVG como focável por padrão; o atributo documenta a intenção mesmo nos
//   navegadores atuais, que já respeitam `aria-hidden`/`tabindex`);
// - axe-core (`wcag2a`, `wcag2aa`) não aponta nenhuma violação cujo nó alvo esteja dentro de um
//   `[data-decor]` (0 violações "relacionadas a decoração"); a varredura geral de a11y da página
//   (sem foco nisso) já é do `shell.spec.ts` (F-14).
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

async function abrir(page: Page): Promise<void> {
  await page.goto('./');
  await page.waitForLoadState('networkidle');
}

test.describe('A-20: todo [data-decor] com aria-hidden e pointer-events: none', () => {
  test('aria-hidden="true" e pointer-events: none em 100% dos [data-decor]', async ({ page }) => {
    await abrir(page);
    const total = await page.locator('[data-decor]').count();
    expect(total).toBeGreaterThan(0);

    const estados = await page.evaluate(() =>
      [...document.querySelectorAll('[data-decor]')].map((el) => ({
        tipo: el.getAttribute('data-decor'),
        ariaHidden: el.getAttribute('aria-hidden'),
        pointerEvents: getComputedStyle(el).pointerEvents,
      })),
    );
    expect(estados).toHaveLength(total);
    for (const estado of estados) {
      expect(estado.ariaHidden, `tipo=${estado.tipo}`).toBe('true');
      expect(estado.pointerEvents, `tipo=${estado.tipo}`).toBe('none');
    }
  });

  test('SVG decorativo (network/chart) tem focusable="false"', async ({ page }) => {
    await abrir(page);
    const svgs = page.locator('svg[data-decor]');
    const total = await svgs.count();
    expect(total).toBeGreaterThan(0);
    const focusable = await svgs.evaluateAll((els) =>
      els.map((el) => el.getAttribute('focusable')),
    );
    for (const valor of focusable) {
      expect(valor).toBe('false');
    }
  });
});

test.describe('A-20: nenhum [data-decor] é alcançável por Tab', () => {
  test('percorrendo a página inteira só com Tab, o foco nunca entra em um [data-decor]', async ({
    page,
  }) => {
    await abrir(page);
    // Limite de segurança bem acima do nº real de elementos focáveis da página (evita loop
    // infinito se o foco ficar preso); o teste falha por outro motivo antes de chegar aqui.
    const totalFocaveis = 400;

    const dentroDeDecor: string[] = [];
    for (let i = 0; i < totalFocaveis; i++) {
      await page.keyboard.press('Tab');
      const info = await page.evaluate(() => {
        const ativo = document.activeElement as HTMLElement | null;
        if (!ativo || ativo === document.body) return null;
        const decor = ativo.closest('[data-decor]');
        return {
          fimDaPagina: ativo.tagName === 'BODY',
          dentroDeDecor: decor !== null,
          descricao: decor
            ? `${decor.getAttribute('data-decor')} (${ativo.tagName.toLowerCase()})`
            : null,
        };
      });
      if (!info || info.fimDaPagina) break;
      if (info.dentroDeDecor && info.descricao) dentroDeDecor.push(info.descricao);
    }
    expect(dentroDeDecor).toEqual([]);
  });
});

test.describe('A-20: axe-core sem violações relacionadas a decoração', () => {
  test('0 violações (wcag2a, wcag2aa) com nó dentro de algum [data-decor]', async ({ page }) => {
    await abrir(page);
    const resultado = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();

    // Cada `n.target` é uma lista de seletores CSS (só 1 nível, sem iframes nesta página). Resolve
    // cada seletor de volta no DOM real e confere se o elemento está dentro de um `[data-decor]`.
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
