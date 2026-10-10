// Chip de tecnologia ou de assunto (DS-12; doc de design §4, §5, §7.6, §7.7; D17; R-DS-1).
//
// - `size="default"`: 40 px de altura, padding 0 16 px, 15 px/500 (§7.7).
//   `size="sm"`: 32 px, padding 0 12 px (D), 13 px/500 (§7.6).
// - `mono`: JetBrains Mono (linguagens e ferramentas, §4 e §7.7). Nomes de tecnologia não traduzem
//   (§15), mas continuam vindo do conteúdo (D5): o texto chega por `children`.
// - Dentro de `ChipList` vira `<li>`; fora, `<span>`.
// - Não é interativo: não recebe foco nem clique. O hover (só com ponteiro) é realce visual.
// - `data-state="hover"` força o visual de hover (styleguide e prints, regra do doc 02 §1).
import { useContext, type ReactNode } from 'react';
import { DentroDeChipList } from './contexto';
import styles from './Chip.module.css';

export type ChipSize = 'default' | 'sm';

export interface ChipProps {
  size?: ChipSize;
  mono?: boolean;
  /** Classe extra do consumidor, colocada no fim. */
  className?: string;
  /** Força o visual de hover (styleguide/prints). */
  'data-state'?: 'hover';
  /** Gancho de item da cascata do doc 04 §4.4 (A-03; S-09), repassado sem mudar o visual. */
  'data-stagger-item'?: string;
  children: ReactNode;
}

export function Chip({
  size = 'default',
  mono = false,
  className,
  'data-state': estado,
  'data-stagger-item': itemDaCascata,
  children,
}: ChipProps) {
  const Tag = useContext(DentroDeChipList) ? 'li' : 'span';
  const classes = [styles.chip, size === 'sm' && styles.sm, mono && styles.mono, className]
    .filter(Boolean)
    .join(' ');
  return (
    <Tag className={classes} data-size={size} data-state={estado} data-stagger-item={itemDaCascata}>
      {children}
    </Tag>
  );
}
