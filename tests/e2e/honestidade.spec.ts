// Guardas de honestidade (Q-19; doc 06 Q-19; 00-INDICE D10, D11, D17, D21, D23; doc de design §1, §2,
// §3.1, §7.6, §7.7, §7.8, §16, §17 itens 1, 5, 8, 10, 13), no build de produção real.
//
// V1 (doc 09 §1/§3): a versão em inglês (C-03/Q-03) foi adiada e a V1 não mostra o botão PT/EN
// (DS-20 ⏭ V2) — não existe nenhum caminho de interface para trocar para EN. Por isso os 8 grupos
// desta task rodam só em PT, a única língua navegável hoje; forçar EN via acesso interno ao React
// (como `secoes.spec.ts`/F-10 fazem para o teste "trocar idioma não quebra a página") testaria um
// idioma que a Yanni não vai ver nesta versão, então não foi adotado aqui. Esta adaptação está
// registrada também no checkpoint `plano/checkpoints/Q-19.md`.
import { expect, test, type Page } from '@playwright/test';
import { pt } from '../../src/content/pt.ts';
import { SECTION_IDS } from '../../src/content/sections.ts';
import { site } from '../../src/content/site.ts';

async function abrir(page: Page): Promise<void> {
  await page.goto('./');
  await page.waitForLoadState('networkidle');
}

/** Regex do passo 1 da Q-19: placeholder = `[` + ao menos 2 caracteres que não sejam `]` + `]`. */
const REGEX_PLACEHOLDER = /\[[^\]]{2,}\]/;

/** Palavras de nível (PT/EN) proibidas em #habilidades (doc §7.7 "Não usar... nem níveis"). */
const REGEX_NIVEL = /avançado|intermediário|básico|especialista|expert|advanced/i;

/** Tecnologias/termos de IA (P-IA-1: nenhuma tecnologia de IA é listada em Habilidades). */
const REGEX_TECNOLOGIA_IA =
  /intelig[êe]ncia artificial|machine learning|aprendizado de m[áa]quina|deep learning|tensorflow|pytorch|scikit|keras|\bia\b/i;

test.describe('Q-19 — grupo 1: nenhum placeholder em produção', () => {
  test('nenhum texto do DOM casa com /\\[[^\\]]{2,}\\]/ no build de produção', async ({ page }) => {
    await abrir(page);
    const texto = await page.evaluate(() => document.body.textContent ?? '');
    const achados = texto.match(new RegExp(REGEX_PLACEHOLDER, 'g')) ?? [];
    expect(achados).toEqual([]);
  });
});

test.describe('Q-19 — grupo 2: habilidades sem nível, sem tecnologia de IA', () => {
  test('#habilidades não tem %, <progress>, role="progressbar" nem palavra de nível', async ({
    page,
  }) => {
    await abrir(page);
    const habilidades = page.locator('#habilidades');
    const texto = await habilidades.evaluate((el) => el.textContent ?? '');
    expect(texto).not.toContain('%');
    expect(texto).not.toMatch(REGEX_NIVEL);
    await expect(habilidades.locator('progress')).toHaveCount(0);
    await expect(habilidades.locator('[role="progressbar"]')).toHaveCount(0);
  });

  test('#habilidades não lista nenhuma tecnologia de IA (P-IA-1)', async ({ page }) => {
    await abrir(page);
    const texto = await page.locator('#habilidades').evaluate((el) => el.textContent ?? '');
    expect(texto).not.toMatch(REGEX_TECNOLOGIA_IA);
  });
});

test.describe('Q-19 — grupo 3: selos (D17, DV-4)', () => {
  test('os 4 cards de estudo têm o selo "Projeto de estudo" com fundo/texto do D17', async ({
    page,
  }) => {
    await abrir(page);
    const selos = page.locator('#projetos').getByText(pt.projetos.seloEstudo, { exact: true });
    await expect(selos).toHaveCount(4);
    for (let i = 0; i < 4; i++) {
      const selo = selos.nth(i);
      await expect(selo).toHaveCSS('background-color', 'rgb(255, 238, 244)');
      await expect(selo).toHaveCSS('color', 'rgb(168, 37, 96)');
    }
  });

  test('"Foco principal" aparece exatamente 2 vezes, nos cards Dados e Cibersegurança', async ({
    page,
  }) => {
    await abrir(page);
    const todos = page.getByText(pt.interesses.seloFoco, { exact: true });
    await expect(todos).toHaveCount(2);

    const cards = page.locator('#interesses article');
    await expect(cards.nth(0).getByText(pt.interesses.seloFoco, { exact: true })).toHaveCount(1);
    await expect(cards.nth(1).getByText(pt.interesses.seloFoco, { exact: true })).toHaveCount(1);
    // Nenhuma outra ocorrência fora desses dois cards (soma já confirmada = 2 pelo `todos`).
  });

  test('o card de IA tem "Em estudo" com fundo transparente e borda tracejada de 1 px (DV-4)', async ({
    page,
  }) => {
    await abrir(page);
    // Ordem dos cards é Dados(0), Cibersegurança(1), IA(2), Desenvolvimento(3) — grupo 5/6.
    const cardIA = page.locator('#interesses article').nth(2);
    const selo = cardIA.getByText(pt.interesses.seloEstudo, { exact: true });
    await expect(selo).toHaveCount(1);
    await expect(selo).toHaveCSS('border-style', 'dashed');
    await expect(selo).toHaveCSS('border-width', '1px');
    const fundo = await selo.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(['transparent', 'rgba(0, 0, 0, 0)']).toContain(fundo);
  });
});

test.describe('Q-19 — grupo 4: ordem das seções no DOM (§2)', () => {
  test('cabeçalho → ids de sections.ts na ordem do registro → rodapé', async ({ page }) => {
    await abrir(page);
    const ids = await page
      .locator('main#conteudo > section')
      .evaluateAll((secoes) => secoes.map((s) => s.id));
    expect(ids).toEqual([...SECTION_IDS]);

    const ordem = await page.evaluate(() => {
      const header = document.querySelector('header');
      const main = document.querySelector('main#conteudo');
      const footer = document.querySelector('footer');
      if (!header || !main || !footer) throw new Error('header/main/footer ausente no DOM');
      const headerAntesDoMain =
        (header.compareDocumentPosition(main) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
      const footerDepoisDoMain =
        (main.compareDocumentPosition(footer) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
      return { headerAntesDoMain, footerDepoisDoMain };
    });
    expect(ordem.headerAntesDoMain).toBe(true);
    expect(ordem.footerDepoisDoMain).toBe(true);
  });
});

test.describe('Q-19 — grupo 5: ordem dos cards de interesse', () => {
  test('Dados, Cibersegurança, IA, Desenvolvimento, nesta ordem', async ({ page }) => {
    await abrir(page);
    const titulos = await page
      .locator('#interesses h3')
      .evaluateAll((els) => els.map((e) => e.textContent?.trim()));
    expect(titulos).toEqual([
      pt.interesses.dados.titulo,
      pt.interesses.ciber.titulo,
      pt.interesses.ia.titulo,
      pt.interesses.dev.titulo,
    ]);
  });
});

test.describe('Q-19 — grupo 6: destaque de Dados e Cibersegurança', () => {
  test('a pílula do hero começa com "Dados · Cibersegurança"', async ({ page }) => {
    await abrir(page);
    expect(pt.hero.pilula.startsWith('Dados · Cibersegurança')).toBe(true);
    const pilula = page.locator('#inicio').getByText(pt.hero.pilula, { exact: true });
    await expect(pilula).toHaveCount(1);
  });

  test('Dados e Cibersegurança são os 2 primeiros cards de interesse', async ({ page }) => {
    await abrir(page);
    const titulos = await page
      .locator('#interesses h3')
      .evaluateAll((els) => els.map((e) => e.textContent?.trim()));
    expect(titulos.slice(0, 2)).toEqual([pt.interesses.dados.titulo, pt.interesses.ciber.titulo]);
  });

  test('as trilhas Dados e Cibersegurança vêm antes da trilha IA', async ({ page }) => {
    await abrir(page);
    const nomes = await page
      .locator('#objetivos h3')
      .evaluateAll((els) => els.map((e) => e.textContent?.trim()));
    expect(nomes).toEqual([
      pt.objetivos.trilhaDados.nome,
      pt.objetivos.trilhaCiber.nome,
      pt.objetivos.trilhaIA.nome,
    ]);
  });
});

test.describe('Q-19 — grupo 8: dados fixos (e-mail, LinkedIn, GitHub, formação, anos)', () => {
  test('e-mail, LinkedIn e GitHub exatamente como em site.ts', async ({ page }) => {
    await abrir(page);
    const links = page.locator(
      'a[href^="mailto:"], a[href*="linkedin.com"], a[href*="github.com"]',
    );
    const hrefs = await links.evaluateAll((els) => els.map((e) => e.getAttribute('href')));
    expect(hrefs.length).toBeGreaterThan(0);

    const mailto = hrefs.filter((h) => h?.startsWith('mailto:'));
    const linkedin = hrefs.filter((h) => h?.includes('linkedin.com'));
    const github = hrefs.filter((h) => h?.includes('github.com'));

    expect(mailto.length).toBeGreaterThan(0);
    expect(linkedin.length).toBeGreaterThan(0);
    expect(github.length).toBeGreaterThan(0);
    for (const h of mailto) expect(h).toBe(site.mailto);
    for (const h of linkedin) expect(h).toBe(site.linkedin);
    for (const h of github) expect(h).toBe(site.github);
  });

  test('"UniCEUB" e "Ciência da Computação" estão presentes', async ({ page }) => {
    await abrir(page);
    const texto = await page.evaluate(() => document.body.textContent ?? '');
    expect(texto).toContain(site.instituicao);
    expect(texto).toContain(site.curso);
  });

  test('nenhum ano de 4 dígitos na página, exceto "2026" do rodapé (§7.12)', async ({ page }) => {
    await abrir(page);
    const texto = await page.evaluate(() => document.body.textContent ?? '');
    const anos = texto.match(/\b(19|20)\d{2}\b/g) ?? [];
    expect(anos.length).toBeGreaterThan(0); // o próprio "2026" do rodapé precisa estar lá.
    const diferentesDe2026 = anos.filter((ano) => ano !== '2026');
    expect(diferentesDe2026).toEqual([]);
  });
});
