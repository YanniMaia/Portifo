// Mini gráfico de barras ilustrativo (A-17; doc de design §7.2 "cartão gráfico de barras", §7.8
// "Imagem do projeto" e §8 "Gráficos": são ilustrações, não dados reais). Alturas FIXAS e
// ilustrativas, sem eixo, rótulo nem número. Cores `--deco-chart-1` e `--deco-chart-2` (aliases do
// A-01 para #F286B0/#E0518A no claro e #F06CA3/#F58FB8 no escuro), cantos arredondados, escala
// pelo `viewBox`. Decorativo: `aria-hidden`, `focusable="false"`, sem eventos de ponteiro.
// Animação opcional (`animar`): as barras crescem uma vez (scaleY 0 → 1, 600 ms, ease-out) ao
// montar; desligada com movimento reduzido. Pode ser aninhado no SVG da ilustração do projeto
// (C-08) pelas props `x`, `y`, `width` e `height`.
import type { CSSProperties } from 'react';
import { BARRAS, CAIXA_DO_MINI_GRAFICO } from './formas';
import styles from './MiniCharts.module.css';

export interface MiniChartProps {
  /** Classe extra (tamanho e posição dados pelo consumidor). */
  className?: string;
  /** Posição e tamanho quando aninhado em outro SVG (unidades do SVG pai). */
  x?: number;
  y?: number;
  width?: number | string;
  height?: number | string;
}

export interface MiniBarChartProps extends MiniChartProps {
  /** Barras crescem uma vez ao montar (opcional, padrão `false`). */
  animar?: boolean;
}

type EstiloDaBarra = CSSProperties & Record<'--bar-delay', string>;

/** Intervalo entre o crescimento de uma barra e o da seguinte. */
const PASSO_DA_CASCATA_MS = 60;

export function MiniBarChart({
  className,
  animar = false,
  x,
  y,
  width,
  height,
}: MiniBarChartProps) {
  const { largura, altura } = CAIXA_DO_MINI_GRAFICO;
  const classes = [styles.grafico, animar ? styles.animado : undefined, className]
    .filter(Boolean)
    .join(' ');

  return (
    <svg
      className={classes}
      viewBox={`0 0 ${largura} ${altura}`}
      x={x}
      y={y}
      width={width}
      height={height}
      aria-hidden="true"
      focusable="false"
      data-decor="chart"
      data-chart="bar"
    >
      {BARRAS.map((b, i) => {
        const estilo: EstiloDaBarra = { '--bar-delay': `${i * PASSO_DA_CASCATA_MS}ms` };
        return (
          <rect
            key={i}
            className={b.destaque ? styles.barraDestaque : styles.barra}
            x={b.x}
            y={altura - b.altura}
            width={b.largura}
            height={b.altura}
            rx={3}
            ry={3}
            style={estilo}
          />
        );
      })}
    </svg>
  );
}
