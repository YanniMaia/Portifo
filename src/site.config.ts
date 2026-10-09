// ÚNICA fonte da URL base (D14). Valor decidido na D-01 (24/09/2026, opção B: repositório
// YanniMaia/Portifolio) e fixado na D-02. Sem variável de ambiente nem outra fonte: `BASE_PATH` é
// derivado de `SITE_URL` (formato conferido por tests/unit/site-config.test.ts).
export const SITE_URL: string = 'https://yannimaia.github.io/Portifolio/';
export const BASE_PATH: string = new URL(SITE_URL).pathname;
