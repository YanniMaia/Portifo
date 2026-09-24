// Flags de produto (F-15). Constantes de build: o Vite troca `import.meta.env.DEV`
// por `true`/`false` e o minificador elimina o ramo morto em produção.
// Caminhos para `public/` no código: sempre `${import.meta.env.BASE_URL}arquivo` (F-07, base /Portifolio/).

/** Placeholders `[…]` visíveis só em desenvolvimento; em produção o elemento some (D11, doc §1). */
export const SHOW_PLACEHOLDERS: boolean = import.meta.env.DEV;

/** Card "Projeto de IA — em breve": ÚNICA chave para ligar/desligar o card (00-INDICE §3, D10). */
export const SHOW_AI_COMING_SOON_CARD: boolean = true;

/** Botão PT / EN visível (D6, doc §15; o DS-20 respeita esta flag). */
export const SHOW_LANGUAGE_TOGGLE: boolean = true;
