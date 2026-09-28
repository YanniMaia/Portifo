// Formas fixas dos mini gráficos (A-17). Valores ILUSTRATIVOS: não são dados, não viram rótulo e
// não aparecem como número em lugar nenhum (doc de design §8 "Gráficos").

/** Caixa comum aos dois mini gráficos (proporção 3:2). */
export const CAIXA_DO_MINI_GRAFICO = { largura: 120, altura: 80 } as const;

export interface Barra {
  readonly x: number;
  readonly largura: number;
  readonly altura: number;
  /** Barra na cor de destaque (`--deco-chart-2`). */
  readonly destaque?: boolean;
}

/** 5 barras de 16 de largura, 10 de espaço, alturas variadas; a 4ª em destaque. */
export const BARRAS: readonly Barra[] = [
  { x: 2, largura: 16, altura: 34 },
  { x: 28, largura: 16, altura: 52 },
  { x: 54, largura: 16, altura: 42 },
  { x: 80, largura: 16, altura: 70, destaque: true },
  { x: 106, largura: 12, altura: 56 },
];

/** Pontos da linha, da esquerda para a direita, com uma subida geral. */
export const PONTOS_DA_LINHA: readonly (readonly [number, number])[] = [
  [4, 62],
  [26, 50],
  [46, 56],
  [68, 34],
  [90, 40],
  [116, 14],
];

/** Caminho da linha (`M x y L x y …`). */
export function caminhoDaLinha(pontos = PONTOS_DA_LINHA): string {
  return pontos.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x} ${y}`).join(' ');
}

/** Área sob a linha, fechada na base da caixa. */
export function caminhoDaArea(pontos = PONTOS_DA_LINHA): string {
  const primeiro = pontos[0];
  const ultimo = pontos.at(-1);
  if (!primeiro || !ultimo) return '';
  const base = CAIXA_DO_MINI_GRAFICO.altura;
  return `${caminhoDaLinha(pontos)} L${ultimo[0]} ${base} L${primeiro[0]} ${base} Z`;
}
