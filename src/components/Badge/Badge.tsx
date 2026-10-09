// Selo / pílula (DS-13; doc de design §7.2, §7.6, §7.8, §7.9; 00-INDICE §3 e D10; DV-4, DV-7;
// D17; D20). O componente não conhece os rótulos: o texto chega por `children`, vindo do dicionário.
//
// - `variant="filled"` (padrão): fundo `--color-fill-soft` (#FFEEF4 / rosa 12%), texto
//   `--color-text-pink-on-tint` (#A82560 / #FFB3D1), sem borda. "Foco principal", "Projeto de
//   estudo" (D17), "Em destaque" (D20), etiqueta de linguagem e "Formação em andamento".
// - `variant="dashed"`: fundo transparente e borda 1 px tracejada `--color-deco` (#F286B0 /
//   #F06CA3). Só o "Em estudo" do card de IA (DV-4), mais leve que "Foco principal".
// - `size="sm"` (padrão): 26 px, padding 0 12 px, 12 px/600, gap 6 px (canvas, R-DS-10).
//   `size="lg"`: pílula do hero, 36 px, padding 0 16 px, 13 px, borda 1 px `--color-border`, gap
//   10 px (§7.2, canvas).
// - `mono`: JetBrains Mono (etiqueta de linguagem, pílula do hero).
// - `dot`: `PulseDot` de 8 px à esquerda (já é `aria-hidden`); pulsa em 2,4 s e fica estático com
//   movimento reduzido (DS-08).
// - Não é interativo: sem hover, foco, ativo nem alvo de toque.
import type { ReactNode } from 'react';
import { PulseDot } from '@/components/PulseDot';
import styles from './Badge.module.css';

export type BadgeVariant = 'filled' | 'dashed';
export type BadgeSize = 'sm' | 'lg';

export interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  mono?: boolean;
  dot?: boolean;
  /** Classe extra do consumidor (posição no layout), colocada no fim. */
  className?: string;
  children: ReactNode;
}

export function Badge({
  variant = 'filled',
  size = 'sm',
  mono = false,
  dot = false,
  className,
  children,
}: BadgeProps) {
  const classes = [
    styles.badge,
    variant === 'dashed' && styles.dashed,
    size === 'lg' && styles.lg,
    mono && styles.mono,
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <span className={classes} data-variant={variant} data-size={size}>
      {dot ? <PulseDot size={8} /> : null}
      {children}
    </span>
  );
}
