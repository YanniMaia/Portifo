// Q-10 — E2E de links externos (estático): destino, nova aba, `rel`, aviso ao leitor de tela
// (doc 06 Q-10; 00-INDICE D11, D14, D21; doc de design §7.8, §7.11, §7.12, §11, §12.5), no build de
// produção real.
//
// V1 (doc 09 §1/§3): a versão em inglês (C-03/Q-03) foi adiada e a V1 não mostra o botão PT/EN
// (DS-20 ⏭ V2) — não existe caminho de interface para EN. Por isso os specs rodam só em PT, a única
// língua navegável hoje (mesma adaptação registrada em `honestidade.spec.ts`/Q-19). Q-07 (12
// projetos claro/escuro) também é ⏭ V2; os specs alternam o tema via `localStorage['ye-theme']`
// (mesmo mecanismo de `identidade-cores.spec.ts`/Q-19), nos projetos `vp390-claro`/`vp1280-claro`
// já existentes (filtrados pela largura real da viewport, como `anchors.spec.ts`/F-13 já faz).
import { expect, test, type Page } from '@playwright/test';
import { pt } from '../../src/content/pt.ts';
import { PROJECTS } from '../../src/content/projects.ts';
import { SECTION_IDS } from '../../src/content/sections.ts';
import { site } from '../../src/content/site.ts';
import { THEME_STORAGE_KEY, type Theme } from '../../src/theme/constants.ts';

/** Larguras medidas pelo critério da Q-10: desktop 1280 e mobile 390 (projetos vp1280/vp390). */
const LARGURAS_MEDIDAS = [1280, 390];

/** Aviso de nova aba (§11), já com os parênteses do `ConteudoDoBotao`/`Footer`. */
const AVISO = `(${pt.a11y.opensInNewTab})`;

/**
 * Lista branca de destinos externos (passo 2): LinkedIn, GitHub do perfil e — só quando
 * `publicado: true` — o link de demonstração e/ou de repositório de cada projeto do §12.5. Hoje
 * nenhum projeto está publicado (P-01), então a lista fica só com os 2 primeiros; se um repositório
 * for publicado, este teste passa a aceitá-lo sem precisar ser editado.
 */
const PUBLICADOS = PROJECTS.filter((projeto) => projeto.publicado);
const LISTA_BRANCA_EXTERNA = new Set<string>([
  site.linkedin,
  site.github,
  ...PUBLICADOS.flatMap((projeto) =>
    [projeto.linkGithub, projeto.linkProjeto].filter((link): link is string => Boolean(link)),
  ),
]);

/** `mailto:` permitido (passo 2): só o e-mail real de `site.ts`. */
const MAILTO_PERMITIDO = site.mailto;

/**
 * Ids válidos de âncora interna (passo 5): o registro único de seções + o alvo do SkipLink
 * (`MAIN_CONTENT_ID` de `src/components/SkipLink/SkipLink.tsx`, fixo em `'conteudo'`, F-14).
 */
const ID_DO_CONTEUDO = 'conteudo';
const IDS_PERMITIDOS = new Set<string>([...SECTION_IDS, ID_DO_CONTEUDO]);

interface AnchorInfo {
  href: string;
  target: string | null;
  rel: string | null;
}

type TipoLink = 'interna' | 'mailto' | 'externa';

function classificar(href: string): TipoLink {
  if (href.startsWith('#')) return 'interna';
  if (href.startsWith('mailto:')) return 'mailto';
  return 'externa';
}

async function abrirComTema(page: Page, tema: Theme): Promise<void> {
  await page.addInitScript(([chave, valor]) => localStorage.setItem(chave, valor), [
    THEME_STORAGE_KEY,
    tema,
  ] as const);
  await page.goto('./');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('html')).toHaveAttribute('data-theme', tema);
}

/** Todos os `<a href>` da página (passo 1), com `target`/`rel` crus (sem normalização do browser). */
async function coletarAnchors(page: Page): Promise<AnchorInfo[]> {
  return page.evaluate(() =>
    [...document.querySelectorAll<HTMLAnchorElement>('a[href]')].map((a) => ({
      href: a.getAttribute('href') ?? '',
      target: a.getAttribute('target'),
      rel: a.getAttribute('rel'),
    })),
  );
}

test.describe('Q-10 — links externos (estático)', () => {
  test.skip(
    ({ viewport }) => !LARGURAS_MEDIDAS.includes(viewport?.width ?? 0),
    'o critério mede 1280 e 390 (vp1280-claro/vp390-claro)',
  );

  for (const tema of ['light', 'dark'] as const satisfies readonly Theme[]) {
    test.describe(`tema ${tema}`, () => {
      test('passo 1-2: todo link é âncora interna, mailto autorizado ou externo da lista branca', async ({
        page,
      }) => {
        await abrirComTema(page, tema);
        const anchors = await coletarAnchors(page);
        expect(anchors.length).toBeGreaterThan(0);

        const foraDaListaBranca = anchors.filter(
          (a) => classificar(a.href) === 'externa' && !LISTA_BRANCA_EXTERNA.has(a.href),
        );
        expect(foraDaListaBranca.map((a) => a.href)).toEqual([]);

        const mailtosInvalidos = anchors.filter(
          (a) => classificar(a.href) === 'mailto' && a.href !== MAILTO_PERMITIDO,
        );
        expect(mailtosInvalidos.map((a) => a.href)).toEqual([]);
      });

      test('hoje nenhum link de repositório/demonstração individual de projeto aparece (P-01: os 5 projetos estão publicado: false)', async ({
        page,
      }) => {
        await abrirComTema(page, tema);
        const projetos = page.locator('#projetos');
        // Qualquer link para um repositório específico (github.com/YanniMaia/<repo>), diferente do
        // perfil (github.com/YanniMaia) usado em "Ver todos no GitHub →".
        const linksDeRepositorio = await projetos
          .locator('a[href^="https://github.com/YanniMaia/"]')
          .count();
        expect(linksDeRepositorio).toBe(0);
      });

      test('passo 3: todo link externo tem target="_blank" e rel com noopener e noreferrer', async ({
        page,
      }) => {
        await abrirComTema(page, tema);
        const anchors = await coletarAnchors(page);
        const externos = anchors.filter((a) => classificar(a.href) === 'externa');
        expect(externos.length).toBeGreaterThan(0);
        for (const a of externos) {
          expect(a.target, `target de ${a.href}`).toBe('_blank');
          expect(a.rel?.includes('noopener'), `rel de ${a.href} (${a.rel})`).toBe(true);
          expect(a.rel?.includes('noreferrer'), `rel de ${a.href} (${a.rel})`).toBe(true);
        }
      });

      test('passo 3: o nome acessível de cada link externo termina com o aviso de nova aba', async ({
        page,
      }) => {
        await abrirComTema(page, tema);
        const anchors = await coletarAnchors(page);
        const externos = anchors.filter((a) => classificar(a.href) === 'externa');
        // Contagem total de links externos == contagem de nomes acessíveis terminados no aviso:
        // nenhum link externo escapa do aviso.
        const comAviso = page.getByRole('link', {
          name: new RegExp(`\\(${pt.a11y.opensInNewTab}\\)$`),
        });
        await expect(comAviso).toHaveCount(externos.length);
      });

      test('passo 4: links mailto: não abrem em nova aba e não têm o aviso', async ({ page }) => {
        await abrirComTema(page, tema);
        const anchors = await coletarAnchors(page);
        const mailtos = anchors.filter((a) => classificar(a.href) === 'mailto');
        expect(mailtos.length).toBeGreaterThan(0);
        for (const a of mailtos) {
          expect(a.target, `target de ${a.href}`).toBeNull();
          expect(a.rel, `rel de ${a.href}`).toBeNull();
        }

        const linksMailtoComAviso = page.locator(`a[href="${MAILTO_PERMITIDO}"]`).filter({
          hasText: AVISO,
        });
        await expect(linksMailtoComAviso).toHaveCount(0);
      });

      test('passo 5: toda âncora interna aponta para um id que existe no DOM e no registro de seções (ou #conteudo)', async ({
        page,
      }) => {
        await abrirComTema(page, tema);
        const anchors = await coletarAnchors(page);
        const internas = anchors.filter((a) => classificar(a.href) === 'interna');
        expect(internas.length).toBeGreaterThan(0);
        for (const a of internas) {
          const id = a.href.slice(1);
          expect(IDS_PERMITIDOS.has(id), `#${id} não está em sections.ts nem é #conteudo`).toBe(
            true,
          );
          // Ids do registro são identificadores simples (sem `#`/`.`/espaço): não precisam de
          // `CSS.escape` (indisponível no contexto Node do test runner).
          await expect(page.locator(`[id="${id}"]`), `#${id} ausente no DOM`).toHaveCount(1);
        }
      });

      test('passo 6: contagens — LinkedIn = 2, GitHub do perfil = 3, mailto = 2', async ({
        page,
      }) => {
        await abrirComTema(page, tema);
        const anchors = await coletarAnchors(page);
        const linkedin = anchors.filter((a) => a.href === site.linkedin).length;
        const github = anchors.filter((a) => a.href === site.github).length;
        const mailto = anchors.filter((a) => a.href === MAILTO_PERMITIDO).length;
        expect(linkedin, 'LinkedIn (Contato + Rodapé)').toBe(2);
        expect(github, 'GitHub do perfil (Contato + Rodapé + "Ver todos no GitHub →")').toBe(3);
        expect(mailto, 'mailto: (Contato + Rodapé)').toBe(2);
      });

      test('passo 8: os 3 ícones sociais do rodapé (só ícone) têm nome acessível', async ({
        page,
      }) => {
        await abrirComTema(page, tema);
        const rodape = page.locator('footer');
        await expect(rodape.getByRole('link', { name: /LinkedIn/i })).toHaveCount(1);
        await expect(rodape.getByRole('link', { name: /GitHub/i })).toHaveCount(1);
        await expect(rodape.getByRole('link', { name: /e-mail/i })).toHaveCount(1);
      });
    });
  }

  test.describe('passo 7: clicar num link externo abre nova página com a URL exata', () => {
    test('botão "LinkedIn" do Contato abre nova página com a URL exata de site.ts', async ({
      page,
      context,
    }) => {
      await abrirComTema(page, 'light');
      const botao = page.locator('#contato').getByRole('link', { name: /linkedin/i });
      const [novaPagina] = await Promise.all([context.waitForEvent('page'), botao.click()]);
      expect(novaPagina.url()).toBe(site.linkedin);
    });

    test('ícone "GitHub" do rodapé abre nova página com a URL exata de site.ts', async ({
      page,
      context,
    }) => {
      await abrirComTema(page, 'light');
      const icone = page.locator('footer').getByRole('link', { name: /github/i });
      const [novaPagina] = await Promise.all([context.waitForEvent('page'), icone.click()]);
      expect(novaPagina.url()).toBe(site.github);
    });
  });
});
