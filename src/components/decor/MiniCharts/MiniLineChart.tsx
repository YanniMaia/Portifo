// Mini gráfico de linha ilustrativo (A-17; doc de design §7.8 e §8 "Gráficos": ilustração, não
// dado real). Linha FIXA em `--deco-chart-2` com área suave em `--deco-chart-1` e um ponto no fim,
// sem eixo, rótulo nem número. Pontas e junções arredondadas; escala pelo `viewBox`. Estático.
// Decorativo: `aria-hidden`, `focusable="false"`, sem eventos de ponteiro. Pode ser aninhado no
// SVG da ilustração do projeto (C-08) pelas props `x`, `y`, `width` e `height`.
import type { MiniChartProps } from './MiniBarChart';
import { CAIXA_DO_MINI_GRAFICO, PONTOS_DA_LINHA, caminhoDaArea, caminhoDaLinha } from './formas';
import styles from './MiniCharts.module.css';

export type MiniLineChartProps = MiniChartProps;

export function MiniLineChart({ className, x, y, width, height }: MiniLineChartProps) {
  const { largura, altura } = CAIXA_DO_MINI_GRAFICO;
  const classes = [styles.grafico, className].filter(Boolean).join(' ');
  const fim = PONTOS_DA_LINHA.at(-1) ?? [0, 0];

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
      data-chart="line"
    >
      <path className={styles.area} d={caminhoDaArea()} />
      <path className={styles.linha} d={caminhoDaLinha()} />
      <circle className={styles.ponto} cx={fim[0]} cy={fim[1]} r={4} />
    </svg>
  );
}
