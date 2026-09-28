// Contêiner de conteúdo (DS-10; doc de design §5, §10; §7.4, §7.9–§7.11 para as larguras estreitas).
// Largura 100%, limitada a `largura + 2 × --gutter`, com `padding-inline: var(--gutter)` e centralizada.
// Assim o conteúdo fica com 1200 px no desktop (margens de 120 px em 1440) e com a largura da janela
// menos as margens laterais (20/32 px) no celular e no tablet.
//
// `size`: `default` → `--container-max` (1200 px no desktop, 100% abaixo); `narrow` → 760 px
// (`--measure-narrow`); `motto` → 900 px (`--measure-motto`); `contact` → 1000 px
// (`--measure-contact`). Não é interativo e não tem texto próprio.
import type { ReactNode } from 'react';
import styles from './Container.module.css';

export type ContainerSize = 'default' | 'narrow' | 'motto' | 'contact';

export interface ContainerProps {
  size?: ContainerSize;
  /** Classe extra do consumidor, colocada no fim. */
  className?: string;
  children?: ReactNode;
}

export function Container({ size = 'default', className, children }: ContainerProps) {
  const classes = [styles.container, size !== 'default' && styles[size], className]
    .filter(Boolean)
    .join(' ');
  return (
    <div className={classes} data-size={size}>
      {children}
    </div>
  );
}
