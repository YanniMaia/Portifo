// Marco da linha do tempo da Formação (S-13; doc de design §7.9, §3.4; D14, D21).
//
// - `<li>` com o nó (decorativo, `aria-hidden`) sobre a linha vertical e o cartão ao lado.
// - `variant`:
//   - `principal`: nó = `PulseDot` de 20 px do DS-08 (núcleo #E0518A / #F58FB8 + anel que o A-10
//     pulsa); cartão `Card` padrão do DS-15 (superfície, borda 1 px, raio 24, padding 32/28/24).
//   - `comum`: nó sólido de 20 px na cor de destaque; mesmo cartão (cursos e certificações, quando o
//     conteúdo tiver itens).
//   - `futuro`: nó vazado de 20 px com borda tracejada e `Card variant="dashed"` do DS-15 (borda
//     1,5 px tracejada, fundo transparente, sem sombra; a mesma do card de IA do S-12, D21).
// - Cartões informativos: nunca interativos (sem hover de elevação, nada focável).
// - Sem texto próprio (D5): o conteúdo chega por `children`.
import type { ReactNode } from 'react';
import { Card } from '@/components/Card';
import { PulseDot } from '@/components/PulseDot';
import styles from './TimelineItem.module.css';

export type TimelineItemVariant = 'principal' | 'comum' | 'futuro';

export interface TimelineItemProps {
  variant: TimelineItemVariant;
  children: ReactNode;
}

export function TimelineItem({ variant, children }: TimelineItemProps) {
  return (
    <li className={styles.item} data-marco={variant}>
      <span className={`${styles.no} ${styles[variant]}`} aria-hidden="true">
        {variant === 'principal' ? <PulseDot size={20} /> : null}
      </span>
      <Card variant={variant === 'futuro' ? 'dashed' : 'default'} className={styles.cartao}>
        {children}
      </Card>
    </li>
  );
}
