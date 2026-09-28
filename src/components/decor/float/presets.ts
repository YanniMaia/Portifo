// Presets de flutuação dos cartões do hero (A-11a; doc 04 §7 "Flutuação dos cartões"; doc de
// design §7.2 e §9 "Elementos flutuantes"; DESIGN.md DV-8 e DV-9).
// FONTE ÚNICA dos valores (N27): o S-04 só põe `data-float="<nome>"` no cartão e não passa
// duração nem amplitude próprias. Este arquivo espelha o `float.css` para os testes e para o
// A-11b medir; o teste `tests/unit/decor/float.test.ts` garante que os dois batem.

/** Nomes aceitos no atributo `data-float` (contrato §4.4). */
export type NomeDeFlutuacao = 'lock' | 'database' | 'chart' | 'code';

export interface ParametrosDeFlutuacao {
  /** Deslocamento máximo para cima, em px (8–12). */
  readonly amplitudePx: number;
  /** Duração de um ciclo completo (sobe e volta), em s (6–9). */
  readonly periodoS: number;
  /** Atraso negativo, em s: cada cartão começa num ponto diferente do ciclo. */
  readonly atrasoS: number;
}

export const PRESETS_DE_FLUTUACAO = {
  lock: { amplitudePx: 8, periodoS: 6, atrasoS: -1.2 },
  database: { amplitudePx: 10, periodoS: 7.5, atrasoS: -3.1 },
  chart: { amplitudePx: 12, periodoS: 9, atrasoS: -4.4 },
  // DV-8: cartão de código de 212 × 60 px.
  code: { amplitudePx: 9, periodoS: 6.8, atrasoS: -2 },
} as const satisfies Record<NomeDeFlutuacao, ParametrosDeFlutuacao>;

export const NOMES_DE_FLUTUACAO = Object.keys(PRESETS_DE_FLUTUACAO) as NomeDeFlutuacao[];

/** DV-9: no celular o cartão de código some; ficam cadeado, banco de dados e gráfico. */
export const FLUTUANTES_NO_CELULAR: readonly NomeDeFlutuacao[] = ['lock', 'database', 'chart'];
