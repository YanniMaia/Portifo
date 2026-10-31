// Q-12 — "Sem rolagem horizontal" e áreas de toque ≥ 44 px em todos os viewports (doc 06 linhas
// 357-375; doc de design §10, §5, §17 item "Não há rolagem horizontal em nenhuma largura"; DS-02
// `--touch-min` 44 px).
//
// Escopo adaptado (doc 09 §1/§3, regime leve da V1 + instrução desta rodada):
// - Só os 6 projetos `vp*-claro` de `playwright.config.ts` (a task original pede "12 projetos":
//   6 claros + 6 escuros do Q-07, que é `⏭ V2` e nunca existiu — conta como satisfeito, igual a
//   `navegacao.spec.ts`/`menu-mobile.spec.ts`).
// - Sem EN: a V1 não tem NENHUM controle de idioma (DS-20/C-03 `⏭ V2`), confirmado lendo
//   `honestidade.spec.ts` e `Header.tsx`/`MobileMenu.tsx` — não existe caminho de interface para
//   trocar de língua, então "repetir com EN" não se aplica (mesma adaptação já registrada em
//   `navegacao.spec.ts`/`menu-mobile.spec.ts`).
// - Menu hambúrguer aberto: só nos 3 projetos compactos (`vp360-claro`, `vp390-claro`,
//   `vp768-claro`, < 1024 px — `Header.tsx`/`TABLET_MAX`), onde o hambúrguer existe no DOM.
// - Larguras extras de estresse (320/1920 px): fora dos 6 projetos oficiais, por isso usam um
//   `browser.newContext` próprio dentro do mesmo spec, em vez de um projeto novo em
//   `playwright.config.ts` (D14: não crie outro config). Rodam 1x só (ancoradas no projeto
//   `vp1280-claro`), para não repetir 6x a mesma sondagem.
//
// Metodologia (passos 1-2 do doc 06): com a página real (build de produção), rola em passos de
// 1 viewport (`window.innerHeight`) do topo ao fim, dando tempo às entradas animadas (A-02/A-03/
// A-04/A-05) dispararem a cada passo, e em cada passo confere
// `document.documentElement.scrollWidth <= innerWidth` e `document.body.scrollWidth <= innerWidth`.
// Ao achar violação, varre `body *` por elementos com `getBoundingClientRect().right >
// innerWidth + 1` que não estão dentro de um ancestral com `overflow: hidden|clip` (candidatos ao
// "culpado" real — um elemento coberto por um ancestral assim, como o `overflow: hidden` do Hero
// que absorve o `bleed` da grade, A-19, não cria rolagem de página e não é listado).
import { expect, test, type Browser, type Page } from '@playwright/test';

/** `--touch-min` (DS-02, §10). */
const TOQUE_MIN_PX = 44;
/** Tolerância do critério "sem rolagem horizontal" (1 px, igual ao resto da suíte). */
const TOLERANCIA_PX = 1;
/** `MenuButton`/`MobileMenu` (S-02): únicos elementos com `data-open` na página. */
const BOTAO_MENU = 'button[data-open]';
const PAINEL_MENU = 'div[data-open]';

async function abrir(page: Page): Promise<void> {
  await page.goto('./');
  await page.waitForLoadState('networkidle');
}

/** `Header.tsx` (`TABLET_MAX` = 1023): hambúrguer e painel só existem abaixo de 1024 px. */
function ehCompacto(viewport: { width: number } | null): boolean {
  return (viewport?.width ?? 0) < 1024;
}

interface Culpado {
  tag: string;
  id: string | null;
  classe: string | null;
  right: number;
  texto: string;
}

/**
 * Varre `escopoSeletor` (padrão: toda a página) por elementos cujo lado direito passa de
 * `innerWidth + 1` e que NÃO estão dentro de um ancestral com `overflow-x`/`overflow`
 * `hidden`/`clip` (esses são absorvidos por um contêiner de propósito — ex.: o `overflow: hidden`
 * do Hero/Contato que absorve o `bleed` decorativo, A-19 — e não criam rolagem de página real).
 * Limitado a 20 resultados para manter a mensagem de erro legível.
 */
async function listarCulpados(page: Page, escopoSeletor = 'body *'): Promise<Culpado[]> {
  return page.evaluate((seletor) => {
    const limite = window.innerWidth + 1;
    const achados: Culpado[] = [];
    for (const el of Array.from(document.querySelectorAll(seletor))) {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) continue;
      if (rect.right <= limite) continue;

      let contido = false;
      for (let atual = el.parentElement; atual; atual = atual.parentElement) {
        const estilo = getComputedStyle(atual);
        if (/hidden|clip/.test(estilo.overflowX) || /hidden|clip/.test(estilo.overflow)) {
          contido = true;
          break;
        }
      }
      if (contido) continue;

      achados.push({
        tag: el.tagName.toLowerCase(),
        id: el.id || null,
        classe: typeof el.className === 'string' && el.className ? el.className : null,
        right: Math.round(rect.right),
        texto: (el.textContent ?? '').trim().slice(0, 40),
      });
      if (achados.length >= 20) break;
    }
    return achados;
  }, escopoSeletor);
}

/**
 * Rola a página inteira em passos de 1 `innerHeight` (passo 1 do doc 06), dando tempo a cada passo
 * para as entradas animadas dispararem, e confere `scrollWidth` de `documentElement`/`body` contra
 * `innerWidth`. Devolve `null` se nunca houver violação, ou uma mensagem de diagnóstico completa
 * (com os culpados encontrados) na primeira violação.
 */
async function verificarOverflowAoRolar(page: Page): Promise<string | null> {
  const alturaJanela = await page.evaluate(() => window.innerHeight);
  const alturaTotal = await page.evaluate(() => document.documentElement.scrollHeight);
  const passos = Math.max(1, Math.ceil(alturaTotal / Math.max(1, alturaJanela)));

  for (let passo = 0; passo <= passos; passo++) {
    const y = Math.min(passo * alturaJanela, alturaTotal);
    await page.evaluate((destino) => {
      window.scrollTo({ top: destino, left: 0, behavior: 'instant' });
    }, y);
    // Tempo para as entradas animadas (A-02/A-03/A-04/A-05) do passo atual dispararem/assentarem.
    await page.waitForTimeout(150);

    const medidas = await page.evaluate(() => ({
      scrollWidthHtml: document.documentElement.scrollWidth,
      scrollWidthBody: document.body.scrollWidth,
      innerWidth: window.innerWidth,
    }));

    if (
      medidas.scrollWidthHtml > medidas.innerWidth + TOLERANCIA_PX ||
      medidas.scrollWidthBody > medidas.innerWidth + TOLERANCIA_PX
    ) {
      const culpados = await listarCulpados(page);
      return (
        `Rolagem horizontal no passo ${passo}/${passos} (scrollY=${y}px de ${alturaTotal}px): ` +
        `documentElement.scrollWidth=${medidas.scrollWidthHtml}, body.scrollWidth=${medidas.scrollWidthBody}, ` +
        `innerWidth=${medidas.innerWidth}.\nCulpados (até 20): ${JSON.stringify(culpados, null, 2)}`
      );
    }
  }
  return null;
}

interface AlvoDeToque {
  tag: string;
  rotulo: string;
  width: number;
  height: number;
  excecao: boolean;
}

/**
 * Exceções explícitas da WCAG 2.5.8 (link embutido numa linha de texto corrido/parágrafo — a
 * exceção não vale para links isolados só porque usam estilo "de texto"). Lista VAZIA nesta
 * rodada: inspecionei `src/sections/**` e `src/components/**` (todo `<a`/`<button`/`role="button"`
 * do build de produção real — Styleguide/Card.demo são dev-only, fora da página) e nenhum link do
 * site real fica embutido dentro de uma frase de parágrafo. Todos são links autônomos: menu
 * desktop, hambúrguer + painel, logo, botões do hero, "Ver habilidades →" (`ButtonLink
 * variant="text"`, já com `min-height: var(--touch-min)` no CSS), card de projetos, rodapé (links
 * rápidos, ícones sociais, "Voltar ao topo") e o skip link (oculto até o foco, por isso nem entra
 * na varredura "visível" abaixo). Se um link inline de verdade for criado no futuro, acrescente o
 * seletor exato aqui — nunca uma regra genérica.
 */
const EXCECOES_TOQUE_INLINE: readonly string[] = [];

/**
 * Mede todo `a`/`button`/`[role="button"]`/`input` VISÍVEL (área > 1×1 px — exclui a técnica
 * "visually-hidden" do skip link antes do foco, que usa `width:1px;height:1px;clip-path`, e
 * `display:none`/`visibility:hidden`/`opacity:0`), dentro de `escopoSeletor` (padrão: a página
 * inteira). Marca como `excecao` os elementos que casam com algum seletor de
 * `EXCECOES_TOQUE_INLINE`.
 */
async function medirAlvosDeToque(
  page: Page,
  excecoes: readonly string[],
  escopoSeletor = 'a, button, [role="button"], input',
): Promise<AlvoDeToque[]> {
  return page.evaluate(
    ([seletor, excecoesSel]) => {
      const elementosDeExcecao = new Set<Element>();
      for (const sel of excecoesSel) {
        document.querySelectorAll(sel).forEach((el) => elementosDeExcecao.add(el));
      }
      const resultado: AlvoDeToque[] = [];
      for (const el of Array.from(document.querySelectorAll(seletor))) {
        const rect = el.getBoundingClientRect();
        const estilo = getComputedStyle(el);
        const visivel =
          rect.width > 1 &&
          rect.height > 1 &&
          estilo.visibility !== 'hidden' &&
          estilo.display !== 'none' &&
          Number(estilo.opacity) > 0;
        if (!visivel) continue;
        resultado.push({
          tag: el.tagName.toLowerCase(),
          rotulo: (el.getAttribute('aria-label') ?? el.textContent ?? '').trim().slice(0, 40),
          width: rect.width,
          height: rect.height,
          excecao: elementosDeExcecao.has(el),
        });
      }
      return resultado;
    },
    [escopoSeletor, excecoes] as const,
  );
}

function violacoesDeToque(alvos: AlvoDeToque[]): AlvoDeToque[] {
  return alvos.filter((a) => !a.excecao && (a.width < TOQUE_MIN_PX || a.height < TOQUE_MIN_PX));
}

// ---------------------------------------------------------------------------------------------
// Passos 1-2 — sem rolagem horizontal ao rolar a página inteira (6 projetos oficiais vp*-claro).
// ---------------------------------------------------------------------------------------------
test.describe('Passos 1-2 — sem rolagem horizontal ao rolar a página inteira', () => {
  test('document.documentElement/body.scrollWidth <= innerWidth em cada passo de 1 viewport', async ({
    page,
  }) => {
    await abrir(page);
    const diagnostico = await verificarOverflowAoRolar(page);
    expect(diagnostico, diagnostico ?? '').toBeNull();
  });
});

// ---------------------------------------------------------------------------------------------
// Passo 3 — repetir com o menu hambúrguer aberto (só vp360/vp390/vp768, onde ele existe no DOM).
// ---------------------------------------------------------------------------------------------
test.describe('Passo 3 — sem rolagem horizontal com o menu hambúrguer aberto (vp360/vp390/vp768)', () => {
  test('abrir o painel não cria rolagem horizontal (página nem dentro do painel)', async ({
    page,
    viewport,
  }) => {
    test.skip(
      !ehCompacto(viewport),
      'só roda nos 3 projetos compactos (<1024), onde o hambúrguer existe',
    );
    await abrir(page);

    const botao = page.locator(BOTAO_MENU);
    await botao.click();
    await expect(botao).toHaveAttribute('aria-expanded', 'true');
    await page.waitForTimeout(150);

    const medidas = await page.evaluate(() => ({
      scrollWidthHtml: document.documentElement.scrollWidth,
      scrollWidthBody: document.body.scrollWidth,
      innerWidth: window.innerWidth,
    }));
    if (
      medidas.scrollWidthHtml > medidas.innerWidth + TOLERANCIA_PX ||
      medidas.scrollWidthBody > medidas.innerWidth + TOLERANCIA_PX
    ) {
      const culpados = await listarCulpados(page);
      throw new Error(
        `Rolagem horizontal com o menu aberto: documentElement.scrollWidth=${medidas.scrollWidthHtml}, ` +
          `body.scrollWidth=${medidas.scrollWidthBody}, innerWidth=${medidas.innerWidth}.\n` +
          `Culpados (até 20): ${JSON.stringify(culpados, null, 2)}`,
      );
    }

    // Dentro do próprio painel: nenhum elemento (ex.: um link com texto longo) estoura a largura.
    const culpadosNoPainel = await listarCulpados(page, `${PAINEL_MENU} *`);
    expect(culpadosNoPainel, JSON.stringify(culpadosNoPainel, null, 2)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------------------------
// Passo 4 — larguras extras de estresse (320 px aviso / 1920 px crítico), fora dos 6 projetos.
// Ancoradas no projeto vp1280-claro para rodar 1x só (não depende do viewport do projeto).
// ---------------------------------------------------------------------------------------------
test.describe('Passo 4 — larguras extras de estresse (320 px e 1920 px, fora do §10)', () => {
  test.skip(
    ({ viewport }) => (viewport?.width ?? 0) !== 1280,
    'sondagem 1x só, não depende da largura do projeto — ancorada em vp1280-claro',
  );

  const casos = [
    { largura: 320, altura: 800, falhaViraAviso: true },
    { largura: 1920, altura: 1080, falhaViraAviso: false },
  ] as const;

  for (const { largura, altura, falhaViraAviso } of casos) {
    test(`${largura}×${altura}: sem rolagem horizontal ao rolar a página inteira${
      falhaViraAviso ? ' (falha vira aviso, não reprova — doc 06 Q-12 passo 4)' : ''
    }`, async ({ browser }: { browser: Browser }) => {
      const context = await browser.newContext({
        viewport: { width: largura, height: altura },
        colorScheme: 'light',
      });
      const page = await context.newPage();
      try {
        await abrir(page);
        const diagnostico = await verificarOverflowAoRolar(page);
        if (diagnostico) {
          if (falhaViraAviso) {
            test.info().annotations.push({ type: `aviso-${largura}px`, description: diagnostico });
          } else {
            throw new Error(diagnostico);
          }
        }
      } finally {
        await context.close();
      }
    });
  }
});

// ---------------------------------------------------------------------------------------------
// Passo 5 — áreas de toque ≥ 44×44 (todo a/button/[role=button]/input visível, fora das exceções
// explícitas de WCAG 2.5.8, lista vazia nesta rodada — ver comentário de EXCECOES_TOQUE_INLINE).
// ---------------------------------------------------------------------------------------------
test.describe('Passo 5 — áreas de toque ≥ 44×44', () => {
  test('nenhum alvo interativo visível (estado de repouso) fica abaixo de 44×44', async ({
    page,
  }) => {
    await abrir(page);
    const alvos = await medirAlvosDeToque(page, EXCECOES_TOQUE_INLINE);
    expect(alvos.length).toBeGreaterThan(0);
    const violacoes = violacoesDeToque(alvos);
    expect(violacoes, JSON.stringify(violacoes, null, 2)).toEqual([]);
  });

  test('menu desktop (≥1024): cada link do <nav> também cumpre 44×44 de altura', async ({
    page,
    viewport,
  }) => {
    test.skip(
      ehCompacto(viewport),
      'o <nav> do cabeçalho só é visível a partir de 1024px (Q-09 cobre o hambúrguer)',
    );
    await abrir(page);
    const alvos = await medirAlvosDeToque(page, EXCECOES_TOQUE_INLINE, 'header nav a');
    expect(alvos.length).toBeGreaterThan(0);
    expect(violacoesDeToque(alvos), JSON.stringify(alvos, null, 2)).toEqual([]);
  });

  test('menu hambúrguer aberto (compacto): botão, tema e todos os links do painel cumprem 44×44', async ({
    page,
    viewport,
  }) => {
    test.skip(!ehCompacto(viewport), 'só compacto');
    await abrir(page);
    await page.locator(BOTAO_MENU).click();
    await expect(page.locator(BOTAO_MENU)).toHaveAttribute('aria-expanded', 'true');

    const alvos = await medirAlvosDeToque(
      page,
      EXCECOES_TOQUE_INLINE,
      `${BOTAO_MENU}, [data-theme-atual], ${PAINEL_MENU} a`,
    );
    expect(alvos.length).toBeGreaterThan(0);
    expect(violacoesDeToque(alvos), JSON.stringify(alvos, null, 2)).toEqual([]);
  });
});
