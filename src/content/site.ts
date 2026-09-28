// ÚNICO arquivo de contatos e perfil (D14, N10) — a F-11 criou; a C-04 completou.
// Valores copiados do documento de design v1.1 (regra de ouro: nada inventado):
// capa (nome, LinkedIn, GitHub, e-mail), §7.9/§7.3 (curso, instituição, situação) e §13 (usuário).
// A URL do próprio site não fica aqui: é o `SITE_URL` de `src/site.config.ts` (D-02, D14).
//
// Ausentes de propósito (não são placeholders neste arquivo):
// - currículo em PDF: pendência P-07 (sem link, o botão "Baixar currículo" não existe);
// - foto: pendência P-08 (o hero usa o monograma "YE");
// - cidade e modalidade de trabalho: não entram por enquanto (§7.11, §16; P-09).

export const site = {
  nome: 'Yanni Elyssa',
  iniciais: 'YE',
  linkedin: 'https://www.linkedin.com/in/yanni-elyssa-48171b349',
  github: 'https://github.com/YanniMaia',
  email: 'yannielyssa64@gmail.com',
  /** Destino do botão "E-mail" (§7.11) e do ícone de e-mail do rodapé (§7.12). */
  mailto: 'mailto:yannielyssa64@gmail.com',
  /** Usuário do GitHub (§12.5, §13): prefixo dos repositórios `https://github.com/YanniMaia/…`. */
  githubUsuario: 'YanniMaia',
  /** Formação (§7.9, §7.3). */
  curso: 'Ciência da Computação',
  instituicao: 'UniCEUB',
  situacao: 'em andamento',
} as const;

export type Site = typeof site;
