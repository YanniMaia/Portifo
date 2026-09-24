// Dicionário pt-BR: FONTE DAS CHAVES do site (F-10; o conteúdo é preenchido pela C-02).
// Esquema único de chaves: doc 05 §4.1 e Anexo A. Só escrevem aqui a F-10 (infraestrutura) e a C-02.
// Valores: só string, lista de strings ou função de interpolação que devolve string (doc 05 §4.1).
// Texto sugerido não é marcado aqui: vai no registro `SUGERIDOS` de `./sugeridos.ts` (R7).
import type { DictionaryShape } from '@/i18n/types';

export const pt = {
  // Anexo A.2 (doc de design §7.1).
  nav: {
    sobre: 'Sobre',
    interesses: 'Interesses',
    habilidades: 'Habilidades',
    projetos: 'Projetos',
    formacao: 'Formação',
    contato: 'Contato',
  },
  // Anexo A.1.
  a11y: {
    skipToContent: 'Pular para o conteúdo', // doc §11
    opensInNewTab: 'abre em nova aba', // doc §11
    themeToDark: 'Alternar para modo escuro', // doc §6
    themeToLight: 'Alternar para modo claro', // doc §6
    language: 'Idioma', // novo (a11y): prefixo oculto do nome acessível do botão PT/EN (DS-20)
    languageNamePt: 'Português', // novo (a11y): nome do idioma na própria língua
    languageNameEn: 'English', // novo (a11y): nome do idioma na própria língua
  },
  // Anexo A.14 (doc §11). Os outros `meta.*` são da C-02/C-11.
  meta: {
    title: 'Yanni Elyssa | Portfólio',
  },
} as const satisfies DictionaryShape;
