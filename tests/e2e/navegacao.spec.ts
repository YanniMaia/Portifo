// Q-08 — E2E de navegação: âncoras (offset 80 px), link ativo, logo e "Voltar ao topo" (doc 06
// linhas 253-277; doc de design §2, §7.1, §7.12, §9; D14 `aria-current="location"`, ativo no
// escuro = `--color-link` #FFB3D1).
//
// Escopo adaptado pelo doc 09 (V1 enxuta): só os 6 projetos `vp*-claro` (o Q-07, que criaria os
// `-escuro`, é ⏭ V2 — nenhum existe ainda); o tema escuro do passo 4 é alternado por
// `localStorage['ye-theme']`, como `theme-persist.spec.ts`/`identidade-cores.spec.ts`. As
// verificações "A-07/A-08" citadas na task são ⏭ V2 (só confirmam o que F-12/F-13/S-01 já fazem de
// verdade, testado aqui). O passo 10 (rolagem instantânea com movimento reduzido) é do Q-17, ⏭ V2:
// não entra neste spec.
//
// Seletores por atributo real do DOM (nunca inventados): `header nav a[href="#id"]` (menu
// desktop, S-01), `section#inicio a[href="#id"]` (botões do hero, S-03), `section#sobre
// a[href="#habilidades"]` ("Ver habilidades →", S-07), `footer nav a[href="#id"]` / `footer
// a[href="#inicio"]` (rodapé, S-16). O `<nav>` do cabeçalho existe no DOM em qualquer largura (só
// o CSS esconde abaixo de 1024 px, Header.module.css `.nav { display: none }`); por isso os
// testes do menu desktop são pulados abaixo de 1024 px (o Q-09 cobre o hambúrguer).
import { expect, test, type Page } from '@playwright/test';
import {
  NAV_ITEMS,
  SECTION_IDS,
  navTargetOf,
  type NavTarget,
  type SectionId,
} from '../../src/content/sections.ts';
import { THEME_STORAGE_KEY, type Theme } from '../../src/theme/constants.ts';

const OFFSET_PX = 80;
const TOLERANCIA_PX = 2;
/** O `<nav>` do cabeçalho só é visível (e clicável) a partir de 1024 px (S-01/S-02). */
const LARGURAS_MENU_DESKTOP = [1024, 1280, 1440];

const ID_INICIO: SectionId = 'inicio';
const ID_PROJETOS: SectionId = 'projetos';
const ID_CONTATO: SectionId = 'contato';
const ID_HABILIDADES: SectionId = 'habilidades';

/** Cor do link ativo (`--color-link`, D14) em `rgb()`, como o `getComputedStyle` devolve. */
const COR_LINK_ATIVO: Record<Theme, string> = {
  light: 'rgb(201, 58, 119)', // #C93A77
  dark: 'rgb(255, 179, 209)', // #FFB3D1
};

async function abrir(page: Page, caminho = './'): Promise<void> {
  await page.goto(caminho);
  await page.waitForLoadState('networkidle');
}

/** Grava o tema no `localStorage` ANTES do boot (como `identidade-cores.spec.ts`) e abre a página. */
async function abrirComTema(page: Page, tema: Theme): Promise<void> {
  await page.addInitScript(([chave, valor]) => localStorage.setItem(chave, valor), [
    THEME_STORAGE_KEY,
    tema,
  ] as const);
  await abrir(page);
  await expect(page.locator('html')).toHaveAttribute('data-theme', tema);
}

/**
 * Espera `getBoundingClientRect().top` de `#id` parar de mudar (rolagem assentada, suave ou não) e
 * devolve o valor final. Nenhuma espera fixa: só para quando duas leituras seguidas (100 ms) batem.
 */
async function topoAssentado(page: Page, id: string): Promise<number> {
  let anterior = Number.NaN;
  let atual = Number.NaN;
  await expect
    .poll(
      async () => {
        anterior = atual;
        atual = await page.evaluate((alvo) => {
          const el = document.getElementById(alvo);
          if (!el) throw new Error(`#${alvo} não encontrado`);
          return el.getBoundingClientRect().top;
        }, id);
        return anterior === atual;
      },
      { timeout: 5_000, intervals: [100] },
    )
    .toBe(true);
  return atual;
}

/** Idem, para `window.scrollY` (logo e "Voltar ao topo ↑", que não rolam até um alvo próprio). */
async function scrollYAssentado(page: Page): Promise<number> {
  let anterior = Number.NaN;
  let atual = Number.NaN;
  await expect
    .poll(
      async () => {
        anterior = atual;
        atual = await page.evaluate(() => window.scrollY);
        return anterior === atual;
      },
      { timeout: 5_000, intervals: [100] },
    )
    .toBe(true);
  return atual;
}

/** `true` se a página já rolou até o fim (a seção final pode ser mais baixa que a viewport). */
async function estaNoFim(page: Page): Promise<boolean> {
  return page.evaluate(
    (tolerancia) =>
      window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - tolerancia,
    TOLERANCIA_PX,
  );
}

/** Confere o offset de 80 px de `id`, aceitando "ficou no fim da página" para a última seção. */
async function conferirOffset(page: Page, id: string): Promise<void> {
  const topo = await topoAssentado(page, id);
  const noOffset = Math.abs(topo - OFFSET_PX) <= TOLERANCIA_PX;
  const noFim = (await estaNoFim(page)) && topo >= OFFSET_PX - TOLERANCIA_PX;
  expect(noOffset || noFim, `topo de #${id} = ${topo}px`).toBe(true);
}

/**
 * Rola para o meio vertical da seção `id` (passo 3: "link ativo ao rolar até o meio da seção").
 * Centralizar sozinho (`offsetTop + altura/2 - innerHeight/2`) não basta: numa seção mais baixa que
 * a viewport (comum em `vp1440`, ex. "Sobre"), isso deixa o topo bem abaixo da faixa de leitura de
 * 80 px do `useActiveSection` e nenhum link fica ativo. Por isso usa o MAIOR entre o alvo
 * centralizado e um alvo que garante o topo a 40 px do viewport (dentro da faixa de 81 px) — para
 * seções altas (maiores que a viewport, ex. o hero) prevalece o centro real; para as demais, a
 * garantia da faixa de leitura.
 */
async function rolarParaMeioDe(page: Page, id: string): Promise<void> {
  await page.evaluate((alvo) => {
    const el = document.getElementById(alvo);
    if (!el) throw new Error(`#${alvo} não encontrado`);
    const peloCentro = el.offsetTop + el.offsetHeight / 2 - window.innerHeight / 2;
    const pelaFaixaDeLeitura = el.offsetTop - 40;
    window.scrollTo(0, Math.max(0, peloCentro, pelaFaixaDeLeitura));
  }, id);
}

const linkDoMenu = (page: Page, id: string) => page.locator(`header nav a[href="#${id}"]`);
const linkAtivoDoMenu = (page: Page) => page.locator('header nav a[aria-current="location"]');

/** Componente `scaleX` da matriz do `::after` do link (sublinhado, Header.module.css). */
async function escalaXDoSublinhado(page: Page, href: string): Promise<number> {
  return page.evaluate((h) => {
    const link = document.querySelector<HTMLElement>(`header nav a[href="${h}"]`);
    if (!link) throw new Error(`link ${h} não encontrado`);
    const transform = getComputedStyle(link, '::after').transform;
    if (transform === 'none') return 1; // identidade: equivalente a scaleX(1)
    const match = /matrix\(([^,]+),/.exec(transform);
    if (!match?.[1]) throw new Error(`transform inesperado: ${transform}`);
    return Number.parseFloat(match[1]);
  }, href);
}

test.describe('menu desktop (vp1024/1280/1440): âncoras, voltar e link ativo', () => {
  test.skip(
    ({ viewport }) => !LARGURAS_MENU_DESKTOP.includes(viewport?.width ?? 0),
    'o <nav> do cabeçalho só é visível a partir de 1024px (abaixo disso é o Q-09)',
  );

  // Passo 1: os 6 links do menu.
  for (const item of NAV_ITEMS) {
    test(`clicar em "${item.id}" rola até #${item.id} a 80±2px e grava o hash`, async ({
      page,
    }) => {
      await abrir(page);
      await linkDoMenu(page, item.id).click();
      await conferirOffset(page, item.id);
      expect(page.url().endsWith(`#${item.id}`)).toBe(true);
    });
  }

  // Passo 2: carga direta com hash e botão "Voltar".
  test(`carregar direto com /#${ID_PROJETOS} já rola até a seção a 80±2px`, async ({ page }) => {
    await abrir(page, `./#${ID_PROJETOS}`);
    await conferirOffset(page, ID_PROJETOS);
  });

  test(`carregar direto com /#${ID_CONTATO} rola até a seção a 80±2px (ou fica no fim)`, async ({
    page,
  }) => {
    await abrir(page, `./#${ID_CONTATO}`);
    await conferirOffset(page, ID_CONTATO);
  });

  test('o botão "Voltar" do navegador restaura o offset da âncora anterior', async ({ page }) => {
    await abrir(page);
    await linkDoMenu(page, ID_PROJETOS).click();
    await conferirOffset(page, ID_PROJETOS);
    await linkDoMenu(page, ID_CONTATO).click();
    await conferirOffset(page, ID_CONTATO);

    await page.goBack();
    await expect(page).toHaveURL(new RegExp(`#${ID_PROJETOS}$`));
    await conferirOffset(page, ID_PROJETOS);
  });

  // Passos 3 e 5: link ativo pela tabela do navTarget de sections.ts, exatamente 1 por vez (ou 0).
  const CASOS_LINK_ATIVO = SECTION_IDS.map((id) => ({ id, esperado: navTargetOf(id) })) satisfies {
    id: SectionId;
    esperado: NavTarget | null;
  }[];

  for (const { id, esperado } of CASOS_LINK_ATIVO) {
    test(`rolar até o meio de #${id} ativa "${esperado ?? '(nenhum)'}" e só ele`, async ({
      page,
    }) => {
      await abrir(page);
      await rolarParaMeioDe(page, id);
      if (esperado) {
        await expect(linkAtivoDoMenu(page)).toHaveCount(1);
        await expect(linkAtivoDoMenu(page)).toHaveAttribute('href', `#${esperado}`);
      } else {
        await expect(linkAtivoDoMenu(page)).toHaveCount(0);
      }
    });
  }

  test('os links sem destaque não têm aria-current (nunca um valor diferente de "location")', async ({
    page,
  }) => {
    await abrir(page);
    await rolarParaMeioDe(page, 'sobre');
    // Espera o estado assentar (o `useActiveSection` recalcula num `requestAnimationFrame` após o
    // evento de `scroll`) antes de ler os atributos de uma vez: sem isso, a leitura corre antes do
    // React re-renderizar e nenhum link ainda tem `aria-current`.
    await expect(linkAtivoDoMenu(page)).toHaveAttribute('href', '#sobre');
    const valores = await page
      .locator('header nav a')
      .evaluateAll((els) => els.map((el) => el.getAttribute('aria-current')));
    for (const valor of valores) {
      expect(valor === null || valor === 'location').toBe(true);
    }
    expect(valores.filter((v) => v === 'location')).toHaveLength(1);
  });

  // Passo 4: estilo do ativo nos dois temas (claro padrão; escuro via localStorage).
  for (const tema of ['light', 'dark'] as const satisfies readonly Theme[]) {
    test(`tema ${tema}: link ativo com a cor de --color-link, peso 600 e sublinhado visível`, async ({
      page,
    }) => {
      await abrirComTema(page, tema);
      await rolarParaMeioDe(page, 'sobre');

      const ativo = linkAtivoDoMenu(page);
      await expect(ativo).toHaveCount(1);
      await expect(ativo).toHaveAttribute('href', '#sobre');
      await expect(ativo).toHaveCSS('color', COR_LINK_ATIVO[tema]);
      await expect(ativo).toHaveCSS('font-weight', '600');

      const escalaAtivo = await escalaXDoSublinhado(page, '#sobre');
      expect(escalaAtivo).toBeGreaterThan(0.9);
      const escalaInativo = await escalaXDoSublinhado(page, '#contato');
      expect(escalaInativo).toBeLessThan(0.1);

      // Nenhum aria-current com valor diferente de "location" em nenhum tema.
      const valores = await page
        .locator('[aria-current]')
        .evaluateAll((els) => els.map((el) => el.getAttribute('aria-current')));
      for (const valor of valores) expect(valor).toBe('location');
    });
  }
});

test.describe('logo, botões de rolagem fora do menu e rodapé (todos os 6 projetos)', () => {
  // Passo 6: logo volta ao topo.
  test('clicar no logo volta a scrollY = 0±2', async ({ page }) => {
    await abrir(page);
    await page.locator(`section#${ID_INICIO} a[href="#${ID_PROJETOS}"]`).click();
    const antes = await scrollYAssentado(page);
    expect(antes).toBeGreaterThan(OFFSET_PX);

    await page.locator(`header a[href="#${ID_INICIO}"]`).click();
    const depois = await scrollYAssentado(page);
    expect(depois).toBeLessThanOrEqual(TOLERANCIA_PX);
  });

  // Passo 7: botões do hero.
  test('botão "Ver meus projetos" do hero rola para #projetos com offset 80px', async ({
    page,
  }) => {
    await abrir(page);
    await page.locator(`section#${ID_INICIO} a[href="#${ID_PROJETOS}"]`).click();
    await conferirOffset(page, ID_PROJETOS);
    expect(page.url().endsWith(`#${ID_PROJETOS}`)).toBe(true);
  });

  test('botão "Entre em contato" do hero rola para #contato com offset 80px', async ({ page }) => {
    await abrir(page);
    await page.locator(`section#${ID_INICIO} a[href="#${ID_CONTATO}"]`).click();
    await conferirOffset(page, ID_CONTATO);
  });

  // Passo 8: "Ver habilidades →" (Sobre).
  test('"Ver habilidades →" (Sobre) rola para #habilidades com offset 80px', async ({ page }) => {
    await abrir(page);
    await page.locator(`section#sobre a[href="#${ID_HABILIDADES}"]`).click();
    await conferirOffset(page, ID_HABILIDADES);
  });

  // Passo 9: rodapé.
  test('rodapé: os 6 links rápidos levam às mesmas âncoras', async ({ page }) => {
    await abrir(page);
    for (const item of NAV_ITEMS) {
      await page.locator(`footer nav a[href="#${item.id}"]`).click();
      await conferirOffset(page, item.id);
    }
  });

  test('rodapé: "Voltar ao topo ↑" volta scrollY=0 e o foco vai para o topo, não para o rodapé', async ({
    page,
  }) => {
    await abrir(page);
    await page.locator(`section#${ID_INICIO} a[href="#${ID_PROJETOS}"]`).click();
    await scrollYAssentado(page);

    const botaoVoltar = page.locator(`footer a[href="#${ID_INICIO}"]`);
    await botaoVoltar.click();
    const y = await scrollYAssentado(page);
    expect(y).toBeLessThanOrEqual(TOLERANCIA_PX);

    const focoNoBotaoDoRodape = await botaoVoltar.evaluate((el) => el === document.activeElement);
    expect(focoNoBotaoDoRodape).toBe(false);
    const nomeDoFocado = await page.evaluate(() => document.activeElement?.tagName ?? null);
    expect(nomeDoFocado).toBe('H1'); // scrollToTop (F-13) foca o h1 do hero, nunca o <body>/rodapé.
  });
});
