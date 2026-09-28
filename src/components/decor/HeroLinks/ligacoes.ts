// Ligações do hero (A-14; doc de design §7.2 "Composição visual"; DV-8, DV-9; doc 03 S-04
// passos 1, 4 e 5). Sistema de coordenadas de 520 × 520 do `HeroVisual` (S-04), que escala por
// igual para 420 (tablet) e 320 (celular).
//
// Disposição proposta no S-04: cartão central de vidro 300 × 300 no meio (110–410 nos dois eixos);
// cadeado no canto superior esquerdo, banco de dados no superior direito, gráfico no inferior
// esquerdo e código (212 × 60, DV-8) no inferior direito, sobrepondo levemente as bordas do
// central. Como os cartões sobrepõem o central, uma linha na direção do centro ficaria escondida
// atrás deles: cada ligação vai de um nó na borda do cartão flutuante a um nó na borda do cartão
// central, pelo espaço livre entre os dois. O S-04 pode passar outras coordenadas pela prop
// `cards` se mudar a disposição.
import type { NomeDeFlutuacao } from '../float/presets';

export interface Ponto {
  readonly x: number;
  readonly y: number;
}

export interface LigacaoDoHero {
  /** Cartão flutuante ligado (mesmo nome do `data-float`, A-11a). */
  readonly nome: NomeDeFlutuacao;
  /** Nó na borda do cartão flutuante. */
  readonly cartao: Ponto;
  /** Nó na borda do cartão central. */
  readonly centro: Ponto;
}

/** Tamanho do sistema de coordenadas do `HeroVisual` (S-04). */
export const LADO_DO_HERO = 520;

/** Cartão central proposto no S-04 (300 × 300, centrado). */
export const CARTAO_CENTRAL = { x: 110, y: 110, largura: 300, altura: 300 } as const;

/**
 * Caixas propostas dos cartões flutuantes (x, y = canto superior esquerdo), só para documentar
 * e testar que as ligações passam pelo espaço livre. Quem posiciona os cartões é o S-04.
 */
export const CAIXAS_PROPOSTAS: Record<
  NomeDeFlutuacao,
  { x: number; y: number; largura: number; altura: number }
> = {
  lock: { x: 48, y: 36, largura: 96, altura: 96 },
  database: { x: 384, y: 52, largura: 96, altura: 96 },
  chart: { x: 40, y: 376, largura: 96, altura: 96 },
  code: { x: 266, y: 408, largura: 212, altura: 60 },
};

/** As 4 ligações da disposição proposta (desktop e tablet). */
export const LIGACOES_DO_HERO: readonly LigacaoDoHero[] = [
  { nome: 'lock', cartao: { x: 144, y: 72 }, centro: { x: 200, y: 110 } },
  { nome: 'database', cartao: { x: 384, y: 84 }, centro: { x: 330, y: 110 } },
  { nome: 'chart', cartao: { x: 72, y: 376 }, centro: { x: 110, y: 330 } },
  { nome: 'code', cartao: { x: 266, y: 438 }, centro: { x: 200, y: 410 } },
];

/** Ligações só dos cartões presentes (ex.: celular sem o de código, DV-9). */
export function ligacoesPara(
  nomes: readonly NomeDeFlutuacao[],
  ligacoes: readonly LigacaoDoHero[] = LIGACOES_DO_HERO,
): LigacaoDoHero[] {
  return ligacoes.filter((l) => nomes.includes(l.nome));
}
