// Ponto pulsante (DS-08; doc de design §7.2, §7.9, §7.11, §8, §9; canvas: anel scale 1→1,8,
// opacidade 0,7→0). ÚNICO PulseDot do projeto (D14): o A-10 não cria outro componente.
//
// Estrutura: um único <span> decorativo. O núcleo é o próprio span; o anel é o `::after` dele
// (CSS Module). Por isso o span é "o elemento do anel" citado no A-10 (doc 04, passo 1):
// - `data-decor="pulse"` já vem daqui (gancho R2 do doc 04);
// - `data-loop` foi acrescentado pelo A-10 NESTE span: o observador do A-01 (`loopPause.ts`)
//   escreve `data-offscreen` nele, e o `reduced-motion.css` pausa o `::after` (anel) fora da tela
//   e com a aba oculta (`html[data-page-hidden]`), sem nenhum CSS novo.
//
// Sem texto (D5): é decorativo, sempre `aria-hidden="true"` (§8, §11).
import styles from './PulseDot.module.css';

/** 8 px: pílula do hero (§7.2), selo e disponibilidade (§7.9, §7.11). 20 px: nó do marco (§7.9). */
export type PulseDotSize = 8 | 20;

export interface PulseDotProps {
  /** Diâmetro do núcleo em px (padrão 8). O anel chega a `size × 1,8` no pico nos dois tamanhos. */
  size?: PulseDotSize;
  /** Classe extra (posição no layout do consumidor). */
  className?: string;
}

export function PulseDot({ size = 8, className }: PulseDotProps) {
  const classes = [styles.dot, size === 20 ? styles.size20 : styles.size8, className]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classes} aria-hidden="true" data-decor="pulse" data-loop="" data-size={size} />
  );
}
