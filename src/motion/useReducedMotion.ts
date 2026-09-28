// Movimento reduzido no JS (A-01; doc 04 §4.2 R4; doc de design §9 e §11).
// ÚNICO ponto novo do código React que consulta `prefers-reduced-motion` (as consultas da F-09 no
// ThemeProvider e da F-13 em lib/scroll.ts são anteriores e ficam com os donos, D14; ver o diário
// do A-01). Componentes e presets de animação leem daqui, nunca direto do `matchMedia`.
import { useMediaQuery } from '@/hooks/useMediaQuery';

/** Media query do movimento reduzido (§9). */
export const CONSULTA_MOVIMENTO_REDUZIDO = '(prefers-reduced-motion: reduce)';

/** Atributo do <html> com o estado do movimento reduzido, escrito pelo MotionProvider. */
export const ATRIBUTO_MOVIMENTO_REDUZIDO = 'data-reduced-motion';

/**
 * `true` quando a pessoa pediu movimento reduzido no sistema. Reage em tempo real (listener de
 * `matchMedia` via `useMediaQuery`, F-12): mudar a preferência com a página aberta atualiza quem
 * usa o hook, sem recarregar. Sem `matchMedia` devolve `false` (e o CSS do DS-04/A-01 continua
 * valendo, porque lê a mesma media query).
 *
 * @example const reduzido = useReducedMotion();
 */
export function useReducedMotion(): boolean {
  return useMediaQuery(CONSULTA_MOVIMENTO_REDUZIDO);
}
