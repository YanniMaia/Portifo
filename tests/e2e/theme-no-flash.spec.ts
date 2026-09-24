// Tema sem "piscada" (F-08, D7, doc §6). O estado é lido no próprio evento DOMContentLoaded, por um
// ouvinte registrado com addInitScript (roda antes de qualquer script da página). O Q-18 estende.
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test, type Page } from '@playwright/test';

interface Estado {
  tema: string | undefined;
  fundo: string;
  corBarra: string | null;
  lang: string;
}

declare global {
  interface Window {
    __estadoDcl?: Estado;
  }
}

const ESCURO = { tema: 'dark', fundo: 'rgb(21, 10, 16)', corBarra: '#150A10' };
const CLARO = { tema: 'light', fundo: 'rgb(255, 255, 255)', corBarra: '#FFF7FA' };

/** Registra o ouvinte de DOMContentLoaded e, se pedido, preenche o localStorage antes do script. */
async function prepararPagina(page: Page, storage: Record<string, string> = {}) {
  await page.addInitScript((valores: Record<string, string>) => {
    for (const [chave, valor] of Object.entries(valores)) {
      window.localStorage.setItem(chave, valor);
    }
    document.addEventListener('DOMContentLoaded', () => {
      const html = document.documentElement;
      window.__estadoDcl = {
        tema: html.dataset.theme,
        fundo: getComputedStyle(html).backgroundColor,
        corBarra:
          document.querySelector('meta[name="theme-color"]')?.getAttribute('content') ?? null,
        lang: html.lang,
      };
    });
  }, storage);
}

/** Coleta erros de console e de página (nenhum é tolerado). */
function coletarErros(page: Page): string[] {
  const erros: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') erros.push(`console.error: ${m.text()}`);
  });
  page.on('pageerror', (e) => erros.push(`pageerror: ${e.message}`));
  return erros;
}

async function estadoNoDcl(page: Page): Promise<Estado | undefined> {
  await page.goto('./', { waitUntil: 'domcontentloaded' });
  return page.evaluate(() => window.__estadoDcl);
}

test.describe('aparelho no escuro', () => {
  test.use({ colorScheme: 'dark' });

  test('storage vazio: já nasce escuro no DOMContentLoaded', async ({ page }) => {
    const erros = coletarErros(page);
    await prepararPagina(page);
    expect(await estadoNoDcl(page)).toEqual({ ...ESCURO, lang: 'pt-BR' });
    expect(erros).toEqual([]);
  });

  test('storage lançando exceção: sem erro no console e segue o aparelho', async ({ page }) => {
    const erros = coletarErros(page);
    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        configurable: true,
        get() {
          throw new DOMException('localStorage bloqueado (teste F-08)', 'SecurityError');
        },
      });
    });
    await prepararPagina(page);
    expect(await estadoNoDcl(page)).toEqual({ ...ESCURO, lang: 'pt-BR' });
    await page.waitForLoadState('networkidle');
    expect(erros).toEqual([]);
  });

  test('primeiro frame no escuro (screenshot do checkpoint)', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'vp1440-claro', 'um screenshot basta');
    await page.goto('./', { waitUntil: 'domcontentloaded' });
    const imagem = await page.screenshot();
    await testInfo.attach('primeiro-frame-escuro', { body: imagem, contentType: 'image/png' });
    // Só grava no diário quando pedido, para o e2e normal não alterar arquivos do repositório.
    if (process.env.F08_SALVAR_PRINT === '1') {
      writeFileSync(resolve('plano/checkpoints/F-08-primeiro-frame-escuro.png'), imagem);
    }
    await expect(page.locator('html')).toHaveCSS('background-color', ESCURO.fundo);
  });
});

test.describe('aparelho no claro', () => {
  test.use({ colorScheme: 'light' });

  test('storage vazio: claro, fundo branco e barra #FFF7FA', async ({ page }) => {
    await prepararPagina(page);
    expect(await estadoNoDcl(page)).toEqual({ ...CLARO, lang: 'pt-BR' });
  });

  test('escolha manual "dark" vence a preferência do aparelho', async ({ page }) => {
    await prepararPagina(page, { 'ye-theme': 'dark' });
    expect(await estadoNoDcl(page)).toEqual({ ...ESCURO, lang: 'pt-BR' });
  });

  test('idioma salvo "en" vira <html lang="en">', async ({ page }) => {
    await prepararPagina(page, { 'ye-lang': 'en' });
    expect(await estadoNoDcl(page)).toEqual({ ...CLARO, lang: 'en' });
  });
});

test('no HTML servido, o script vem antes do CSS e do módulo, com 1 theme-color', async ({
  request,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'vp1440-claro', 'o HTML é o mesmo em todos os projetos');
  const html = await (await request.get('./')).text();
  const script = html.indexOf('<script>');
  const css = html.indexOf('<link rel="stylesheet"');
  const modulo = html.indexOf('<script type="module"');
  expect(script).toBeGreaterThan(-1);
  expect(modulo).toBeGreaterThan(script);
  if (css !== -1) expect(css).toBeGreaterThan(script);
  expect(html.match(/<meta name="theme-color"[^>]*>/g)).toEqual([
    '<meta name="theme-color" content="#FFF7FA" />',
  ]);
});
