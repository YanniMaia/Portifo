// Página 404 (D-03) no build servido. O `vite preview` imita o GitHub Pages pelo plugin
// `portifolio:pagina-404-preview` do vite.config.ts: caminho inexistente dentro do BASE_PATH responde
// 404 com o `404.html`. No Pages real, o smoke D-05 confere o mesmo. V1 só PT (doc 09): os textos
// vêm de `erro404.*` em pt.ts. Contraste medido com o helper da DS-01.
//
// O pt.ts não é importado: ele lê `import.meta.env.DEV` (flags.ts), que não existe no Node do
// Playwright. Os 2 valores são lidos do bloco `erro404` do arquivo (o unitário
// tests/unit/deploy/pagina-404.test.ts importa o dicionário de verdade).
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { BASE_PATH } from '../../src/site.config.ts';
import { THEME_STORAGE_KEY, type Theme } from '../../src/theme/constants.ts';
import { contrastRatio } from '../unit/support/contrast.ts';

const ROTA = 'rota-que-nao-existe';

function lerErro404(): { titulo: string; voltar: string } {
  const fonte = readFileSync(resolve(process.cwd(), 'src/content/pt.ts'), 'utf8');
  const bloco = /\berro404:\s*\{([^}]*)\}/.exec(fonte)?.[1] ?? '';
  const valor = (chave: string) => {
    const v = new RegExp(`\\b${chave}:\\s*'([^']*)'`).exec(bloco)?.[1];
    if (!v) throw new Error(`erro404.${chave} não encontrado em src/content/pt.ts`);
    return v;
  };
  return { titulo: valor('titulo'), voltar: valor('voltar') };
}
const pt = { erro404: lerErro404() };

/** Conteúdo do primeiro `<script>` inline (sem atributos) de um HTML. */
function scriptInline(html: string): string {
  const m = /<script>([\s\S]*?)<\/script>/.exec(html);
  if (!m?.[1]) throw new Error('script inline não encontrado');
  return m[1];
}

/**
 * Erros de console/página e respostas ≥ 400. O próprio documento responde 404 de propósito, e o
 * Chromium registra isso no console ("Failed to load resource") com a URL do documento: só essa
 * mensagem é descontada. Qualquer outro recurso com erro (favicon, CSS) aparece nas listas.
 */
function coletarErros(page: Page): { erros: string[]; ruins: string[] } {
  const erros: string[] = [];
  const ruins: string[] = [];
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const doDocumento =
      m.text().startsWith('Failed to load resource') &&
      new URL(m.location().url).pathname === `${BASE_PATH}${ROTA}`;
    if (!doDocumento) erros.push(`console.error: ${m.text()} (${m.location().url})`);
  });
  page.on('pageerror', (e) => erros.push(`pageerror: ${e.message}`));
  page.on('response', (r) => {
    if (r.status() >= 400) ruins.push(`${r.status()} ${new URL(r.url()).pathname}`);
  });
  return { erros, ruins };
}

test('caminho inexistente responde 404 com a página, só com os 2 textos de erro404', async ({
  page,
}) => {
  const { erros, ruins } = coletarErros(page);
  const resposta = await page.goto(ROTA);
  expect(resposta?.status()).toBe(404);
  await expect(page).toHaveTitle(pt.erro404.titulo);
  await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(pt.erro404.titulo);
  const linhas = (await page.locator('body').innerText())
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  expect(linhas).toEqual([pt.erro404.titulo, pt.erro404.voltar]);
  await page.waitForLoadState('networkidle');
  expect(ruins).toEqual([`404 ${BASE_PATH}${ROTA}`]);
  expect(erros).toEqual([]);
});

test('"Voltar ao início" leva à página principal (status 200)', async ({ page }) => {
  await page.goto(ROTA);
  const link = page.getByRole('link', { name: pt.erro404.voltar });
  await expect(link).toHaveAttribute('href', BASE_PATH);
  const [resposta] = await Promise.all([
    page.waitForResponse((r) => r.request().isNavigationRequest()),
    link.click(),
  ]);
  expect(resposta.status()).toBe(200);
  expect(new URL(page.url()).pathname).toBe(BASE_PATH);
  await expect(page).toHaveTitle('Yanni Elyssa | Portfólio');
});

test('dist/404.html ≤ 10 KB e com o mesmo script de tema do dist/index.html', async ({
  request,
}) => {
  const r404 = await request.get('404.html');
  const rIndex = await request.get('./');
  expect(r404.status()).toBe(200);
  const corpo404 = await r404.body();
  expect(corpo404.byteLength).toBeLessThanOrEqual(10 * 1024);
  expect(scriptInline(corpo404.toString('utf8'))).toBe(scriptInline(await rIndex.text()));
});

for (const tema of ['light', 'dark'] as const satisfies readonly Theme[]) {
  const esperado =
    tema === 'light'
      ? { bg: 'rgb(255, 255, 255)', texto: 'rgb(43, 22, 32)', link: 'rgb(201, 58, 119)' }
      : { bg: 'rgb(21, 10, 16)', texto: 'rgb(253, 240, 245)', link: 'rgb(255, 179, 209)' };

  test(`tema ${tema}: cores dos tokens, contraste medido e axe sem violações`, async ({ page }) => {
    await page.addInitScript(([chave, valor]) => localStorage.setItem(chave, valor), [
      THEME_STORAGE_KEY,
      tema,
    ] as const);
    await page.goto(ROTA);
    await expect(page.locator('html')).toHaveAttribute('data-theme', tema);

    const cores = await page.evaluate(() => {
      const cs = (sel: string) => getComputedStyle(document.querySelector(sel) as Element);
      return { bg: cs('body').backgroundColor, texto: cs('h1').color, link: cs('a').color };
    });
    expect(cores).toEqual(esperado);
    expect(contrastRatio(cores.texto, cores.bg)).toBeGreaterThanOrEqual(7);
    expect(contrastRatio(cores.link, cores.bg)).toBeGreaterThanOrEqual(4.5);

    const axe = await new AxeBuilder({ page }).analyze();
    expect(axe.violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
}
