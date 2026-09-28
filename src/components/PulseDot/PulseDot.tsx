// Ponto pulsante (DS-08; doc de design §7.2, §7.9, §7.11, §8, §9; canvas: anel scale 1→1,8,
// opacidade 0,7→0). ÚNICO PulseDot do projeto (D14): o A-10 não cria outro componente.
//
// Estrutura: um único <span> decorativo. O núcleo é o próprio span; o anel é o `::after` dele
// (CSS Module). Por isso o span é "o elemento do anel" citado no A-10 (doc 04, passo 1):
// - `data-decor="pulse"` já vem daqui (gancho R2 do doc 04);
// - para pausar fora da tela, o A-10 só acrescenta `data-loop` NESTE span. O `reduced-motion.css`
//   do A-01 já pausa `[data-loop][data-offscreen='true']::after` e `html[data-page-hidden]
//   [data-loop]::after`, então o anel para sem nenhum CSS novo.
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

  return <span className={classes} aria-hidden="true" data-decor="pulse" data-size={size} />;
}
