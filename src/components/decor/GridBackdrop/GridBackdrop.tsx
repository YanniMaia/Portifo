// Grade de linhas finas com máscara radial (A-12; doc 04 §5 e §7 "Grade"; doc de design §7.2
// "Fundo", §7.11 "Layout", §8 "Grade" e §10 "Tela grande").
// Camada decorativa, estática e sem texto: linhas de 1 px a cada 48 px em `--deco-grid-line`
// (#F9D5E3 a 35% no claro, branco a 5% no escuro), apagadas nas bordas por uma máscara radial.
// Fica atrás do conteúdo: o consumidor (S-04/S-15 ou o SectionBackdrop do A-19) põe a camada num
// pai com `position: relative` e o conteúdo com `position: relative` e `z-index` ≥ 1.
import type { CSSProperties } from 'react';
import styles from './GridBackdrop.module.css';

export interface GridBackdropProps {
  /**
   * Centro da máscara, em posição CSS (padrão `'50% 50%'`). Hero: centro da composição visual.
   * Contato: centro do painel.
   */
  center?: string;
  /** Raio da máscara em px (padrão 480). A grade some por completo a 85% dele. */
  radius?: number;
  /**
   * Tela grande (§10): de 1440 px em diante, a grade deixa o círculo em volta do centro e se
   * estende até as bordas da camada, sumindo só no fim. Use com a camada na largura da janela
   * (seção de largura total, fora do contêiner de 1200 px).
   */
  bleed?: boolean;
  /** Classe extra (posição da camada no consumidor). */
  className?: string;
}

type EstiloDaGrade = CSSProperties & Record<'--grid-center' | '--grid-radius', string>;

export function GridBackdrop({
  center = '50% 50%',
  radius = 480,
  bleed = false,
  className,
}: GridBackdropProps) {
  const classes = [styles.grid, bleed ? styles.bleed : undefined, className]
    .filter(Boolean)
    .join(' ');
  const estilo: EstiloDaGrade = {
    '--grid-center': center,
    '--grid-radius': `${Math.max(0, radius)}px`,
  };

  return <div className={classes} style={estilo} aria-hidden="true" data-decor="grid" />;
}
