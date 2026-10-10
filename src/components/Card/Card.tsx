// Card base (DS-15; doc de design §3.4, §5, §7.6, §7.8, §7.9, §14; 00-INDICE §3; D21; R-DS-19).
//
// - `variant`: `default` (fundo de superfície, borda 1 px, raio 24 px, sombra de repouso),
//   `panel` (raio 32 px, padding 40/40/24 px, sobe 4 px no hover) ou `dashed` (borda 1,5 px
//   tracejada rosa médio, sem sombra, fundo transparente e nunca interativo; só para o card
//   "Projeto de IA — em breve" e o marco futuro da Formação, D21).
// - `interactive`: hover (só com ponteiro), `:focus-within` e `data-state="hover"` sobem o card
//   (`--lift-card`/`--lift-panel`), trocam a borda e acendem a sombra de hover numa camada
//   `::before` por `opacity` (não se anima `box-shadow`, regra R1 do doc 04).
// - `accentBar`: filete de 3 px em `--gradient-primary` na base, com 24 px de recuo, que aparece
//   no hover.
// - `padding`: `default` (--card-padding 32/28/24), `compact` (28 px; 24 no celular, §14) ou
//   `panel` (40 px; 24 no celular, §7.8). O padrão segue a variante.
// - O card não é link nem tem `onClick` (os botões ficam dentro). Expõe `data-card` e
//   `data-interactive` para os filhos reagirem ao hover (IconBox, DS-16).
import type { ReactNode } from 'react';
import styles from './Card.module.css';

export type CardTag = 'div' | 'article' | 'li';
export type CardVariant = 'default' | 'panel' | 'dashed';
export type CardPadding = 'default' | 'compact' | 'panel';

export interface CardProps {
  as?: CardTag;
  variant?: CardVariant;
  interactive?: boolean;
  accentBar?: boolean;
  padding?: CardPadding;
  /** Classe extra do consumidor, colocada no fim. */
  className?: string;
  /** Força o visual de hover (styleguide/prints). */
  'data-state'?: 'hover';
  /**
   * Gancho de cascata do doc 04 §4.4 (A-03), repassado sem mudar o visual. Ex.: `"chips"` no
   * cartão de categoria das Habilidades (S-09).
   */
  'data-stagger'?: string;
  children?: ReactNode;
}

const CLASSE_PADDING: Record<CardPadding, string | undefined> = {
  default: undefined,
  compact: styles.paddingCompact,
  panel: styles.paddingPanel,
};

export function Card({
  as: Tag = 'div',
  variant = 'default',
  interactive = false,
  accentBar = false,
  padding,
  className,
  'data-state': estado,
  'data-stagger': cascata,
  children,
}: CardProps) {
  // O card tracejado nunca é interativo (passo 4). O filete só aparece no hover, então só existe
  // em card interativo.
  const ativo = interactive && variant !== 'dashed';
  const filete = accentBar && ativo;
  const pad = padding ?? (variant === 'panel' ? 'panel' : 'default');
  const classes = [
    styles.card,
    variant !== 'default' && styles[variant],
    CLASSE_PADDING[pad],
    ativo && styles.interactive,
    filete && styles.accentBar,
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <Tag
      className={classes}
      data-card={variant}
      data-interactive={ativo ? 'true' : undefined}
      data-state={ativo ? estado : undefined}
      data-stagger={cascata}
    >
      {children}
    </Tag>
  );
}
