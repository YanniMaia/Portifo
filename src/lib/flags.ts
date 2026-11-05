// Flags de produto (F-15). Constantes de build: o Vite troca `import.meta.env.DEV`
// por `true`/`false` e o minificador elimina o ramo morto em produção.
// Caminhos para `public/` no código: sempre `${import.meta.env.BASE_URL}arquivo` (F-07, base /Portifolio/).

/** Placeholders `[…]` visíveis só em desenvolvimento; em produção o elemento some (D11, doc §1).
 * `?.` porque o Node do Playwright importa o pt.ts sem `import.meta.env` (correção C-02/e2e):
 * lá vale `false`, como em produção. No Vite/Vitest o valor é o mesmo de `import.meta.env.DEV`. */
export const SHOW_PLACEHOLDERS: boolean =
  (import.meta.env as ImportMetaEnv | undefined)?.DEV === true;

/** Card "Projeto de IA — em breve": ÚNICA chave para ligar/desligar o card (00-INDICE §3, D10). */
export const SHOW_AI_COMING_SOON_CARD: boolean = true;

/** Botão PT / EN visível (D6, doc §15; o DS-20 respeita esta flag).
 * Inerte na V1 (doc 09): nenhum componente de UI lê esta flag ainda, porque o seletor
 * PT/EN é o DS-20, adiado para a V2. Fica `true` "adiantada" para quando o DS-20 existir;
 * só os testes a importam hoje. Achado baixo do Portão V-03/V-04 de 2026-11-05. */
export const SHOW_LANGUAGE_TOGGLE: boolean = true;
