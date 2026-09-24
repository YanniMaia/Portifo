// Teste de fumaça e2e (F-04): a página carrega, o título está certo, o idioma é pt-BR e o console
// não tem erros. O Q-07 reaproveita este arquivo. Não filtre erros aqui para esconder problemas.
import { expect, test } from '@playwright/test';

test('página carrega sem erros no console, com título e idioma corretos', async ({ page }) => {
  const erros: string[] = [];
  page.on('console', (mensagem) => {
    if (mensagem.type() === 'error') {
      erros.push(`console.error: ${mensagem.text()}`);
    }
  });
  page.on('pageerror', (erro) => {
    erros.push(`pageerror: ${erro.message}`);
  });

  await page.goto('./');
  await page.waitForLoadState('networkidle');

  await expect(page).toHaveTitle('Yanni Elyssa | Portfólio');
  await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
  await expect(page.locator('main#conteudo')).toBeAttached();
  expect(erros).toEqual([]);
});
