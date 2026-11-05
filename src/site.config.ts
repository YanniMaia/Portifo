// ÚNICA fonte da URL base (D14). Decisão original da D-01 (24/09/2026) era GitHub Pages (opção B,
// /Portifolio/); trocada em 2026-11-05 a pedido do usuário para Vercel (opção A, raiz). Sem
// variável de ambiente nem outra fonte: `BASE_PATH` é derivado de `SITE_URL` (formato conferido
// por tests/unit/site-config.test.ts).
export const SITE_URL: string = 'https://portfolio-yanni-elyssa.vercel.app/';
export const BASE_PATH: string = new URL(SITE_URL).pathname;
