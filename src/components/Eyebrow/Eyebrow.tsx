// Sobretítulo das seções (DS-09; doc de design §4, §3.5, §7.4–§7.11; D13; DV-16).
// 13/13/12 px, peso 700, caixa alta por CSS, +12% entre letras (classe global `.t-eyebrow`, DS-03).
//
// - Sem texto fixo (D5): o rótulo chega por `children`, em caixa normal, vindo do dicionário. O CSS
//   aplica `text-transform: uppercase`, e o leitor de tela lê a palavra normal.
// - `tone="default"` (padrão): `--color-eyebrow` (#C93A77 / #FFB3D1), sobre branco ou #FFF7FA.
// - `tone="tint"`: `--color-eyebrow-on-tint` (#A82560 / #FFB3D1), obrigatória sobre #FFEEF4
//   ("O que me move" na Frase e "Contato" no painel em degradê). O `SectionHeader` repassa a prop.
// - Sem margem própria: o espaçamento é do `SectionHeader` (DS-14).
// - Não é interativo: sem hover, foco, ativo nem alvo de toque.
import type { ReactNode } from 'react';
import styles from './Eyebrow.module.css';

export type EyebrowTag = 'p' | 'span';
export type EyebrowTone = 'default' | 'tint';

export interface EyebrowProps {
  /** Elemento renderizado (padrão `p`; `span` dentro de outro bloco de texto). */
  as?: EyebrowTag;
  /** Fundo onde o eyebrow aparece: `default` (branco/#FFF7FA) ou `tint` (#FFEEF4). */
  tone?: EyebrowTone;
  /** Classe extra do consumidor, colocada no fim. */
  className?: string;
  children: ReactNode;
}

export function Eyebrow({ as: Tag = 'p', tone = 'default', className, children }: EyebrowProps) {
  const classes = ['t-eyebrow', styles.eyebrow, tone === 'tint' && styles.tint, className]
    .filter(Boolean)
    .join(' ');
  return (
    <Tag className={classes} data-tone={tone}>
      {children}
    </Tag>
  );
}
