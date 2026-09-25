// Breakpoints do site (DS-02; doc 02 §4.3; doc de design §5 e §10). Mobile-first.
// Os `.css` usam os mesmos números como literais (CSS não aceita var() em media query); o teste
// `tests/unit/styles/breakpoints.test.ts` garante que só 640/1024/1440 (ou 639/1023/1439) aparecem.

/** Celular: até 639 px (base, sem media query). */
export const MOBILE_MAX = 639;
/** Tablet: 640 a 1023 px. */
export const TABLET_MIN = 640;
export const TABLET_MAX = 1023;
/** Desktop: 1024 a 1439 px. */
export const DESKTOP_MIN = 1024;
export const DESKTOP_MAX = 1439;
/** Tela grande: 1440 px ou mais. */
export const WIDE_MIN = 1440;

/** Media queries prontas para `useMediaQuery` (F-12). */
export const mq = {
  tablet: `(min-width: ${TABLET_MIN}px)`,
  desktop: `(min-width: ${DESKTOP_MIN}px)`,
  wide: `(min-width: ${WIDE_MIN}px)`,
} as const;

export type MediaQueryName = keyof typeof mq;
