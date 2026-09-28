// Texto com degradê de marca (DS-07; doc de design §3.4, §3.5, §7.2, §7.3, §7.4; D19/R-DS-5).
// Claro: 135° #E0518A → #A82560. Escuro: 135° #FFB3D1 → #F06CA3. Tudo via `--gradient-text`.
//
// - Sem texto fixo (D5): o conteúdo chega por `children`, vindo de `src/content/`.
// - O texto continua no DOM (selecionável e copiável): o degradê é só pintura (`background-clip`).
// - Uso previsto só em texto ≥ 36 px e peso 800 (nome do hero, valores da faixa, palavras da
//   frase de destaque). Abaixo de 36 px é proibido (R-DS-5); o componente não impõe tamanho,
//   quem define é a tipografia do consumidor.
// - Não é interativo: sem hover, foco, ativo nem alvo de toque.
import type { ReactNode } from 'react';
import styles from './GradientText.module.css';

export type GradientTextTag = 'span' | 'strong';

export interface GradientTextProps {
  /** Elemento renderizado (padrão `span`; `strong` quando o trecho tem ênfase semântica). */
  as?: GradientTextTag;
  /** Classe extra (tipografia/posição do consumidor), colocada no fim. */
  className?: string;
  children: ReactNode;
}

export function GradientText({ as: Tag = 'span', className, children }: GradientTextProps) {
  const classes = [styles.text, className].filter(Boolean).join(' ');
  return <Tag className={classes}>{children}</Tag>;
}
