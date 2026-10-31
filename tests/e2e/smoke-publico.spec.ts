// D-05 — Smoke test pós-deploy na URL pública (doc 07 linhas 181-207; doc de design §6, §11, §7.1,
// §7.11; doc 09 §4, regime leve: sem validador por task).
//
// *** TODA execução registrada no checkpoint `cp/D-05` foi contra `npm run preview` (build de
// produção local), NUNCA contra uma URL pública real. *** A URL pública só existirá depois da
// primeira publicação (D-06), que é um passo manual da Yanni — fora do escopo deste agente. O
// critério de aceite do próprio doc 07 já prevê isso: "Rodando contra npm run preview... passa,
// exceto o status 404, que o preview não emula (registrado no checkpoint)." Achado desta rodada
// (documentado no checkpoint): o `vite.config.ts` já ganhou, na D-03, o plugin
// `portifolio:pagina-404-preview`, que FAZ o `vite preview` responder 404 de verdade — então o
// teste de 404 abaixo já passa localmente, ao contrário do texto original do doc 07. A confirmação
// contra o Pages real (HTTPS, DNS, CDN) só é possível depois do D-06.
//
// Adaptações da V1 (doc 09 §4, instrução desta rodada):
// - Q-07 (6 projetos "-escuro" + infra de tags) é ⏭ V2 e conta como satisfeita sem existir: não há
//   projetos `vp390-escuro`/`vp1280-escuro`. Em vez disso, este spec roda só nos dois projetos reais
//   mais próximos do pedido do doc 07 (`vp390-claro`, `vp1280-claro`, um celular e um desktop) e
//   alterna o tema escuro por `localStorage['ye-theme']` DENTRO do teste de tema, igual a
//   `theme-persist.spec.ts`/`seo.spec.ts`/`navegacao.spec.ts` — mesmo padrão já usado no repositório.
// - Sem infra de `--grep`/tags nova: a tag `@publico` é só o sufixo literal no título de cada teste
//   (suficiente para o `--grep`/`--grep-invert` nativos do Playwright, sem nenhum código extra).
// - `SMOKE_URL`: variável opcional. Sem ela, usa o `baseURL` do `playwright.config.ts`
//   (`http://localhost:4173<BASE_PATH>`, o preview local). Com ela (pós-D-06), sobrepõe o `baseURL`
//   do arquivo inteiro.
// - `og:image`/`canonical` começam com `SITE_URL` (checado pela STRING, sem variável de ambiente
//   nova) mas o "respondem 200" é verificado pedindo o MESMO caminho relativo ao servidor que esta
//   suíte está testando (preview local hoje; a própria URL pública quando `SMOKE_URL` apontar para
//   ela) — nunca um fetch de internet contra um domínio que ainda não existe publicamente. Decisão
//   registrada no checkpoint `cp/D-05`.
import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { execSync } from 'node:child_process';
import { encurtarSha } from '../../src/build/gitSha.ts';
import { BASE_PATH, SITE_URL } from '../../src/site.config.ts';
import { THEME_STORAGE_KEY } from '../../src/theme/constants.ts';

/** Projetos do `playwright.config.ts` usados pelo smoke (adaptação acima: sem os "-escuro" do Q-07). */
const PROJETOS_SMOKE = ['vp390-claro', 'vp1280-claro'];

const OFFSET_PX = 80;
const TOLERANCIA_PX = 2;

/** SHA esperado: `SMOKE_SHA` (D-11/rollback) > `GIT_SHA` (CI, mesmo valor do build) > HEAD local. */
function shaEsperado(): string {
  const bruto =
    process.env.SMOKE_SHA?.trim() ||
    process.env.GIT_SHA?.trim() ||
    execSync('git rev-parse HEAD').toString();
  return encurtarSha(bruto);
}
const SHA_ESPERADO = shaEsperado();

const SMOKE_URL = process.env.SMOKE_URL?.trim();
if (SMOKE_URL) {
  // Sobrepõe o baseURL do arquivo inteiro (D-05, doc 07: "Entradas: URL pública (variável
  // `SMOKE_URL`, padrão = `SITE_URL`)"). Sem a variável, fica o baseURL do playwright.config.ts
  // (preview local), que é o modo usado em toda esta rodada.
  test.use({ baseURL: SMOKE_URL });
}

/**
 * Pula o teste fora de `vp390-claro`/`vp1280-claro` (como `rodaSoEm` de `seo.spec.ts`). Chamado no
 * início de cada teste — o Playwright exige que `test.skip` com condição seja usado dentro do corpo
 * do teste (ou no `test.skip(callback, motivo)` de nível de `describe`, que não dá acesso cômodo ao
 * `testInfo` junto dos outros fixtures usados aqui).
 */
function pularForaDosProjetosSmoke(testInfo: TestInfo): void {
  test.skip(
    !PROJETOS_SMOKE.includes(testInfo.project.name),
    'smoke público roda só em vp390-claro e vp1280-claro (adaptação desta rodada: Q-07, que criaria os projetos "-escuro", é ⏭ V2)',
  );
}

/** Espera `getBoundingClientRect().top` de `#id` assentar e devolve o valor (como navegacao.spec.ts). */
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

/** Clica em "Projetos": menu desktop (≥1024px) ou painel do hambúrguer (<1024px, Q-09). */
async function clicarProjetosNoMenu(page: Page, viewport: { width: number } | null): Promise<void> {
  if ((viewport?.width ?? 0) < 1024) {
    await page.locator('button[data-open]').click();
    await page.locator('div[data-open] nav a[href="#projetos"]').click();
  } else {
    await page.locator('header nav a[href="#projetos"]').click();
  }
}

/** Caminho relativo ao baseURL atual, a partir de uma URL absoluta que começa com SITE_URL. */
function caminhoRelativoASiteUrl(urlAbsoluta: string): string {
  if (!urlAbsoluta.startsWith(SITE_URL)) {
    throw new Error(`esperava um valor começando com SITE_URL (${SITE_URL}): "${urlAbsoluta}"`);
  }
  const resto = urlAbsoluta.slice(SITE_URL.length);
  return resto === '' ? './' : resto;
}

test('página responde 200; <title> = "Yanni Elyssa | Portfólio" @publico', async ({
  page,
}, testInfo) => {
  pularForaDosProjetosSmoke(testInfo);
  const resposta = await page.goto('./');
  expect(resposta?.status()).toBe(200);
  await expect(page).toHaveTitle('Yanni Elyssa | Portfólio');
});

test('0 erros/avisos de console; 0 respostas ≥ 400 do próprio domínio @publico', async ({
  page,
  baseURL,
}, testInfo) => {
  pularForaDosProjetosSmoke(testInfo);
  const mensagens: string[] = [];
  const ruins: string[] = [];
  const origemDoSite = new URL(baseURL ?? 'http://localhost').origin;
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') mensagens.push(`${m.type()}: ${m.text()}`);
  });
  page.on('pageerror', (e) => mensagens.push(`pageerror: ${e.message}`));
  page.on('response', (r) => {
    if (r.status() >= 400 && new URL(r.url()).origin === origemDoSite) {
      ruins.push(`${r.status()} ${r.url()}`);
    }
  });

  await page.goto('./');
  await page.waitForLoadState('networkidle');

  expect(ruins).toEqual([]);
  expect(mensagens).toEqual([]);
});

test('fontes, favicon, og-image.png, robots.txt e sitemap.xml respondem 200 @publico', async ({
  page,
  request,
}, testInfo) => {
  pularForaDosProjetosSmoke(testInfo);
  const statusDasFontes: number[] = [];
  page.on('response', (r) => {
    if (/\.woff2(\?|$)/.test(r.url())) statusDasFontes.push(r.status());
  });

  await page.goto('./');
  await page.waitForLoadState('networkidle');

  expect(statusDasFontes.length).toBeGreaterThan(0);
  for (const status of statusDasFontes) expect(status).toBe(200);

  for (const caminho of ['favicon.svg', 'og-image.png', 'robots.txt', 'sitemap.xml']) {
    const resposta = await request.get(caminho);
    expect(resposta.status(), caminho).toBe(200);
  }
});

test('og:image e canonical começam com SITE_URL e respondem 200 @publico', async ({
  page,
  request,
}, testInfo) => {
  pularForaDosProjetosSmoke(testInfo);
  await page.goto('./');

  const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content');
  const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
  expect(ogImage).not.toBeNull();
  expect(canonical).not.toBeNull();
  expect(ogImage?.startsWith(SITE_URL)).toBe(true);
  expect(canonical?.startsWith(SITE_URL)).toBe(true);

  // "Respondem 200" verificado contra o MESMO servidor que esta suíte está testando (preview local
  // hoje; a URL pública real quando SMOKE_URL apontar para ela) — ver nota no topo do arquivo.
  const respostaOgImage = await request.get(caminhoRelativoASiteUrl(ogImage ?? ''));
  expect(respostaOgImage.status()).toBe(200);
  const respostaCanonical = await request.get(caminhoRelativoASiteUrl(canonical ?? ''));
  expect(respostaCanonical.status()).toBe(200);
});

test('clicar em "Projetos" no menu leva a #projetos com offset 80±2px @publico', async ({
  page,
  viewport,
}, testInfo) => {
  pularForaDosProjetosSmoke(testInfo);
  await page.goto('./');
  await clicarProjetosNoMenu(page, viewport);
  const topo = await topoAssentado(page, 'projetos');
  expect(Math.abs(topo - OFFSET_PX)).toBeLessThanOrEqual(TOLERANCIA_PX);
  expect(page.url().endsWith('#projetos')).toBe(true);
});

test('alternar tema funciona e persiste após reload @publico', async ({ page }, testInfo) => {
  pularForaDosProjetosSmoke(testInfo);
  await page.goto('./');
  const html = page.locator('html');
  await expect(html).toHaveAttribute('data-theme', 'light');

  await page.locator('button[data-theme-atual]').click();
  await expect(html).toHaveAttribute('data-theme', 'dark');
  expect(await page.evaluate((chave) => localStorage.getItem(chave), THEME_STORAGE_KEY)).toBe(
    'dark',
  );

  await page.reload();
  await page.waitForLoadState('networkidle');
  await expect(html).toHaveAttribute('data-theme', 'dark');
});

test('rota inexistente dentro do BASE_PATH responde 404 @publico', async ({ page }, testInfo) => {
  pularForaDosProjetosSmoke(testInfo);
  const rota = `nao-existe-${Date.now()}`;
  const resposta = await page.goto(rota);
  // Documentado no cabeçalho do arquivo e no checkpoint: contra o preview local isto JÁ passa,
  // graças ao plugin de 404 da D-03 — diferente do texto original do doc 07 ("o preview não
  // emula"). Contra o Pages real (após o D-06), o próprio GitHub serve o 404.html da mesma forma.
  expect(resposta?.status()).toBe(404);
  expect(new URL(page.url()).pathname).toBe(`${BASE_PATH}${rota}`);
});

test('<meta name="version"> = SHA esperado @publico', async ({ page }, testInfo) => {
  pularForaDosProjetosSmoke(testInfo);
  await page.goto('./');
  await expect(page.locator('meta[name="version"]')).toHaveAttribute('content', SHA_ESPERADO);
});
