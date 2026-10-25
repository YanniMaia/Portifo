// App shell semântico + "Pular para o conteúdo" (F-14; doc de design §11 e §2), nos dois temas.
// Roda no build de produção (webServer do playwright.config.ts). Ids e ordem vêm do registro da
// F-12 (`SECTION_IDS`); o texto do skip link vem do dicionário (F-10). Nada de lista à mão.
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { pt } from '../../src/content/pt.ts';
import { SECTION_IDS } from '../../src/content/sections.ts';
import { THEME_STORAGE_KEY, type Theme } from '../../src/theme/constants.ts';

const TEMAS: readonly Theme[] = ['light', 'dark'];
/** #C93A77 e #FFFFFF (tokens `--color-skip-bg`/`--color-skip-text`, iguais nos dois temas, D14). */
const SKIP_FUNDO = 'rgb(201, 58, 119)';
const SKIP_TEXTO = 'rgb(255, 255, 255)';

async function abrir(page: Page, tema: Theme): Promise<void> {
  // Escolha manual de tema gravada antes de qualquer script (o script inline da F-08 lê a chave).
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
  await page.goto('./');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('html')).toHaveAttribute('data-theme', tema);
}

for (const tema of TEMAS) {
  test.describe(`App shell (tema ${tema})`, () => {
    // S-17 montou as seções reais no lugar dos stubs: a partir daqui o Hero traz o único <h1> da
    // página e cada `SectionHeader` (DS-14) usado dentro das 7 seções com cabeçalho renderiza o
    // PRÓPRIO <header> (válido: <header> dentro de section/article não é "banner", só decorativo
    // na árvore de acessibilidade — por isso `page.locator('header')`, que conta pela tag e não
    // pelo papel ARIA, precisa ser filtrado para o <header> de topo nos dois testes abaixo).
    test('exatamente um <h1> (o do Hero, doc 03 S-03)', async ({ page }) => {
      await abrir(page, tema);
      await expect(page.locator('h1')).toHaveCount(1);
    });

    test('landmarks: 1 banner, 1 main, 1 contentinfo, irmãos no mesmo nível', async ({ page }) => {
      await abrir(page, tema);
      await expect(page.getByRole('banner')).toHaveCount(1);
      await expect(page.getByRole('main')).toHaveCount(1);
      await expect(page.getByRole('contentinfo')).toHaveCount(1);
      // <header> de topo (fora do <main>): só o do Header (S-01). Os demais <header> da página são
      // os `SectionHeader` (DS-14) dentro de cada <section>, que não contam como "banner".
      const headersDeTopo = await page.evaluate(
        () =>
          document.querySelectorAll('header').length -
          document.querySelectorAll('main header').length,
      );
      expect(headersDeTopo).toBe(1);
      await expect(page.locator('main')).toHaveCount(1);
      await expect(page.locator('footer')).toHaveCount(1);
      await expect(page.locator('main')).toHaveAttribute('id', 'conteudo');

      // Ordem no DOM: skip link → header → main → footer, todos filhos do mesmo pai (fora de
      // article/section/main, onde header/footer deixariam de ser banner/contentinfo). Abaixo de
      // 1024 px o painel do hambúrguer (S-02, `MobileMenu`) é irmão do <header> (não filho, porque
      // o `backdrop-filter` do cabeçalho prenderia o `position: fixed` dele — comentário do
      // `Header.tsx`): filtramos esse <div> extra, que não afeta a ordem dos landmarks.
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

    test('10 <section> dentro do main, na ordem de SECTION_IDS', async ({ page }) => {
      await abrir(page, tema);
      const ids = await page
        .locator('main#conteudo > section')
        .evaluateAll((secoes) => secoes.map((s) => s.id));
      expect(ids).toEqual([...SECTION_IDS]);
      await expect(page.locator('main#conteudo > section')).toHaveCount(SECTION_IDS.length);
    });

    // D23: placeholder = qualquer string que contenha "[" e "]". O `postbuild` (check-placeholders,
    // C-01) já falha o build se o `dist/` tiver algum; este teste é a 2ª confirmação, no navegador
    // real servindo o mesmo build. Não exige mais texto vazio (isso só valia com os stubs da F-14).
    test('nenhum placeholder "[...]" visível no conteúdo da página', async ({ page }) => {
      await abrir(page, tema);
      const texto = await page.locator('main#conteudo').innerText();
      const comPlaceholder = /\[[^[\]]*\]/.test(texto);
      expect(comPlaceholder, texto).toBe(false);
    });

    test('primeiro Tab foca o skip link, visível e com as cores do token', async ({ page }) => {
      await abrir(page, tema);
      await page.keyboard.press('Tab');

      const link = page.getByRole('link', { name: pt.a11y.skipToContent });
      await expect(link).toBeFocused();
      await expect(link).toHaveAttribute('href', '#conteudo');
      await expect(link).toBeVisible();
      await expect(link).toHaveCSS('background-color', SKIP_FUNDO);
      await expect(link).toHaveCSS('color', SKIP_TEXTO);
      await expect(link).toHaveCSS('position', 'fixed');
      await expect(link).toHaveCSS('outline-width', '3px');
      await expect(link).toHaveCSS('outline-offset', '3px');

      const caixa = await link.boundingBox();
      expect(caixa).not.toBeNull();
      expect(caixa?.x).toBe(16);
      expect(caixa?.y).toBe(16);
      expect(caixa?.width ?? 0).toBeGreaterThan(40);
      expect(caixa?.height ?? 0).toBeGreaterThan(20);
    });

    test('skip link fica oculto (visually-hidden) sem foco', async ({ page }) => {
      await abrir(page, tema);
      const link = page.getByRole('link', { name: pt.a11y.skipToContent });
      await expect(link).toBeAttached();
      await expect(link).not.toHaveCSS('display', 'none');
      const caixa = await link.boundingBox();
      expect((caixa?.width ?? 0) <= 1 && (caixa?.height ?? 0) <= 1).toBe(true);
    });

    test('Enter no skip link leva o foco ao main#conteudo e rola até ele', async ({ page }) => {
      await abrir(page, tema);
      // Começa longe do main para a rolagem ser observável.
      await page.evaluate(() =>
        window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }),
      );
      expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);

      await page.keyboard.press('Tab');
      await expect(page.getByRole('link', { name: pt.a11y.skipToContent })).toBeFocused();
      await page.keyboard.press('Enter');

      await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe('conteudo');
      // Foco no <main> sem contorno visível (passo 3), mesmo sendo `:focus-visible` no Chrome.
      await expect(page.locator('main#conteudo')).toHaveCSS('outline-style', 'none');
      // O main começa no topo do documento: "rolar até o main" é voltar a scrollY = 0.
      await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 5_000 }).toBe(0);
      const topoDoMain = await page.evaluate(
        () => document.getElementById('conteudo')?.getBoundingClientRect().top ?? Number.NaN,
      );
      expect(topoDoMain).toBeGreaterThanOrEqual(0);
      expect(topoDoMain).toBeLessThanOrEqual(80);
    });

    test('axe (wcag2a, wcag2aa) sem violações serious/critical', async ({ page }) => {
      await abrir(page, tema);
      const semFoco = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();

      // De novo com o skip link visível (contraste do texto sobre o fundo rosa).
      await page.keyboard.press('Tab');
      const comFoco = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();

      const graves = [...semFoco.violations, ...comFoco.violations]
        .filter((v) => v.impact === 'serious' || v.impact === 'critical')
        .map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
      expect(graves).toEqual([]);
    });
  });
}
