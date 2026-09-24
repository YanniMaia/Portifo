// Dicionário EN (F-10; o conteúdo é preenchido pela C-03). Tipado como `Dictionary`: o TypeScript
// acusa erro se faltar ou sobrar chave em relação a `pt.ts`.
// Origem EN (doc 05 §4.5): `§15` = tradução do documento de design; `nova` = tradução proposta para
// texto que o §15 não traz. As `nova` entram em `TRADUCAO_EN` (doc 05 §4.4) na C-01/C-03, para a
// revisão P-12; não entram em `SUGERIDOS` (doc 05 §4.2).
import type { Dictionary } from '@/i18n/types';

export const en: Dictionary = {
  // §15.
  nav: {
    sobre: 'About',
    interesses: 'Interests',
    habilidades: 'Skills',
    projetos: 'Projects',
    formacao: 'Education',
    contato: 'Contact',
  },
  a11y: {
    skipToContent: 'Skip to content', // nova
    opensInNewTab: 'opens in a new tab', // nova
    themeToDark: 'Switch to dark mode', // nova
    themeToLight: 'Switch to light mode', // nova
    language: 'Language', // nova
    languageNamePt: 'Português', // igual nos dois idiomas (nome do idioma na própria língua)
    languageNameEn: 'English', // igual nos dois idiomas (nome do idioma na própria língua)
  },
  meta: {
    title: 'Yanni Elyssa | Portfolio', // nova
  },
};
