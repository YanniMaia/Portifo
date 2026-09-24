// ÚNICO arquivo de contatos (D14, N10) — task F-11 cria; a C-04 completa.
// Valores copiados do cabeçalho do documento de design v1.1 (regra de ouro: nada inventado).
// A URL do próprio site não fica aqui: é o `SITE_URL` de `src/site.config.ts` (D-02).

export const site = {
  nome: 'Yanni Elyssa',
  iniciais: 'YE',
  linkedin: 'https://www.linkedin.com/in/yanni-elyssa-48171b349',
  github: 'https://github.com/YanniMaia',
  email: 'yannielyssa64@gmail.com',
} as const;

export type Site = typeof site;
