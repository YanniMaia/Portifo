// Superfície de vidro discreto (DS-17; doc de design §3.4, §7.1, §7.2, §7.3, §7.10).
//
// Usado em 5 lugares e só neles: cabeçalho (e painel do menu), cartão do hero, cartões flutuantes,
// faixa de destaques e trilhas. O orçamento de `backdrop-filter` do doc 04 (§4.3/A-19) conta esses 5.
//
// - `variant="glass"`: branco 65% (escuro 5%), desfoque 16 px, borda 1 px (§3.4).
// - `variant="header"`: branco 80% (escuro #150A10 a 75%), desfoque 14 px, só borda inferior; a
//   sombra do cabeçalho fica numa camada que acende por `opacity` com `scrolled` →
//   `data-scrolled="true"` (gancho do doc 04 §4.4; o S-01 liga após 8 px de rolagem).
// - `variant="menu"`: branco 96% (escuro 96%), desfoque 14 px (D).
// - `radius`: `media` 20, `card` 24, `panel` 32 ou `none` 0 px. Padrão: `card` no vidro e `none`
//   no cabeçalho e no menu.
// - `padding`: `none`, `sm` (16), `md` (24) ou `lg` (32 px), só por tokens de espaço.
// - Não é interativo e não tem texto próprio.
import type { ReactNode } from 'react';
import styles from './GlassPanel.module.css';

export type GlassPanelVariant = 'glass' | 'header' | 'menu';
export type GlassPanelRadius = 'media' | 'card' | 'panel' | 'none';
export type GlassPanelPadding = 'none' | 'sm' | 'md' | 'lg';
export type GlassPanelTag = 'div' | 'header' | 'nav' | 'section' | 'aside' | 'ul';

export interface GlassPanelProps {
  variant?: GlassPanelVariant;
  radius?: GlassPanelRadius;
  padding?: GlassPanelPadding;
  as?: GlassPanelTag;
  /** Só no `header`: acende a sombra (`data-scrolled="true"`). */
  scrolled?: boolean;
  /** Classe extra do consumidor, colocada no fim. */
  className?: string;
  /** Id (ex.: painel do menu referenciado por `aria-controls`). */
  id?: string;
  children?: ReactNode;
}

const CLASSE_RAIO: Record<GlassPanelRadius, string | undefined> = {
  media: styles.radiusMedia,
  card: styles.radiusCard,
  panel: styles.radiusPanel,
  none: undefined,
};

const CLASSE_PADDING: Record<GlassPanelPadding, string | undefined> = {
  none: undefined,
  sm: styles.paddingSm,
  md: styles.paddingMd,
  lg: styles.paddingLg,
};

export function GlassPanel({
  variant = 'glass',
  radius,
  padding = 'none',
  as: Tag = 'div',
  scrolled = false,
  className,
  id,
  children,
}: GlassPanelProps) {
  const raio = radius ?? (variant === 'glass' ? 'card' : 'none');
  const classes = [
    styles.panel,
    styles[variant],
    CLASSE_RAIO[raio],
    CLASSE_PADDING[padding],
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <Tag
      id={id}
      className={classes}
      data-glass={variant}
      data-scrolled={variant === 'header' ? String(scrolled) : undefined}
    >
      {children}
    </Tag>
  );
}
