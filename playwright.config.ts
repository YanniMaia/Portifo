// Configuração do Playwright (F-04). O Q-07 estende (6 projetos `-escuro`, fixtures em
// tests/e2e/support/, tags) e o DS-05 acrescenta o projeto `styleguide`. Não crie outro config.
import { defineConfig, devices } from '@playwright/test';
// URL base (F-07, D14): a mesma do vite.config.ts. Extensão obrigatória (`module: nodenext`).
// Com baseURL em subcaminho, os specs navegam com `page.goto('./')` (nunca `'/'`, que vai à raiz do servidor).
import { BASE_PATH } from './src/site.config.ts';

const PORTA = 4173;
const ORIGEM = `http://localhost:${PORTA}`;

// Larguras de teste do doc de design §10 (nomes definitivos do doc 06), tema claro.
const viewports = [
  { nome: 'vp360-claro', width: 360, height: 800 },
  { nome: 'vp390-claro', width: 390, height: 844 },
  { nome: 'vp768-claro', width: 768, height: 1024 },
  { nome: 'vp1024-claro', width: 1024, height: 768 },
  { nome: 'vp1280-claro', width: 1280, height: 800 },
  { nome: 'vp1440-claro', width: 1440, height: 900 },
] as const;

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `${ORIGEM}${BASE_PATH}`,
    trace: 'on-first-retry',
  },
  projects: viewports.map(({ nome, width, height }) => ({
    name: nome,
    use: {
      ...devices['Desktop Chrome'],
      viewport: { width, height },
      colorScheme: 'light' as const,
    },
  })),
  webServer: {
    command: `npm run build && npm run preview -- --port ${PORTA} --strictPort`,
    url: `${ORIGEM}${BASE_PATH}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
