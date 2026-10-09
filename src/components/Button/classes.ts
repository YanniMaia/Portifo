// Estilo compartilhado do Button e do ButtonLink (DS-11, passo 1): props comuns e montagem das
// classes do CSS Module. Fica fora dos componentes por causa da regra react-refresh (um arquivo de
// componente só exporta componentes).
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'text';
export type ButtonSize = 'default' | 'compact';
/** Estado forçado para o styleguide e os prints (doc 02 §1). */
export type ButtonForcedState = 'hover' | 'focus' | 'active';

export interface ButtonBaseProps {
  variant: ButtonVariant;
  /** `default`: 52/52/48 px (`--button-height`); `compact`: 44 px (§14). */
  size?: ButtonSize;
  /** Ícone de 20 px à esquerda do texto (§7.11). */
  iconLeft?: LucideIcon;
  /** Seta `ArrowRight` de 20 px à direita, que anda 4 px no hover (§7.2, §9). */
  arrow?: boolean;
  /** Largura total abaixo de 640 px (§7.2, §7.8, §7.11). */
  fullWidthOnMobile?: boolean;
  /** Nome acessível quando o texto visível não basta (ex.: "Copiar endereço de e-mail"). */
  'aria-label'?: string;
  /** Classe extra do consumidor, colocada no fim. */
  className?: string;
  /** Força o visual de um estado (styleguide/prints). */
  'data-state'?: ButtonForcedState;
  children: ReactNode;
}

export function classesDoBotao({
  variant,
  size = 'default',
  fullWidthOnMobile = false,
  className,
}: Pick<ButtonBaseProps, 'variant' | 'size' | 'fullWidthOnMobile' | 'className'>): string {
  return [
    styles.button,
    styles[variant],
    size === 'compact' && styles.compact,
    fullWidthOnMobile && styles.fullWidthOnMobile,
    className,
  ]
    .filter(Boolean)
    .join(' ');
}
