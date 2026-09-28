// Desenhos das constelações (A-14; doc de design §8 "Nós de rede"; doc 04 §7 "Cintilar dos nós").
// Pontos de 6 a 8 px (raio 3 ou 4) ligados por linhas de 1 px, formando pequenas constelações
// nos cantos do hero (2) e do contato (2). Formas abstratas: não representam dados nem nada sobre
// a Yanni. Coordenadas em px, na caixa `largura × altura` de cada desenho.
//
// Cintilar: cada nó tem período sorteado entre 6 e 10 s e atraso próprio, com SEMENTE FIXA
// (determinístico), para as capturas dos testes serem estáveis. Período ≥ 1 s (R5: nada pisca).

export interface PontoDaConstelacao {
  readonly x: number;
  readonly y: number;
  /** Raio em px: 3 (nó de 6 px) ou 4 (nó de 8 px). */
  readonly r: 3 | 4;
}

export interface CintilarDoNo {
  /** Ciclo completo 1 → 0,5 → 1, em s (6–10). */
  readonly periodoS: number;
  /** Atraso negativo, em s: cada nó começa num ponto diferente do ciclo. */
  readonly atrasoS: number;
}

export interface DesenhoDeConstelacao {
  readonly id: string;
  readonly largura: number;
  readonly altura: number;
  readonly pontos: readonly PontoDaConstelacao[];
  /** Pares de índices de `pontos` ligados por uma linha. */
  readonly ligacoes: readonly (readonly [number, number])[];
  /** Um item por ponto, na mesma ordem. */
  readonly cintilar: readonly CintilarDoNo[];
}

export const CINTILAR_PERIODO_MIN_S = 6;
export const CINTILAR_PERIODO_MAX_S = 10;
/** Opacidade no vale do cintilar (doc 04 §7: 1 → 0,5 → 1). */
export const CINTILAR_OPACIDADE_MIN = 0.5;

/** Gerador pseudoaleatório determinístico (mulberry32): mesma semente, mesma sequência. */
function gerador(semente: number): () => number {
  let a = semente >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const umaCasa = (n: number) => Math.round(n * 10) / 10;

/** Períodos (6–10 s) e atrasos (0 a −período) sorteados com semente fixa. */
export function sortearCintilar(semente: number, quantidade: number): CintilarDoNo[] {
  const aleatorio = gerador(semente);
  return Array.from({ length: quantidade }, () => {
    const periodoS = umaCasa(
      CINTILAR_PERIODO_MIN_S + aleatorio() * (CINTILAR_PERIODO_MAX_S - CINTILAR_PERIODO_MIN_S),
    );
    const atrasoS = -umaCasa(aleatorio() * periodoS) || 0;
    return { periodoS, atrasoS };
  });
}

function desenho(
  id: string,
  semente: number,
  largura: number,
  altura: number,
  pontos: readonly PontoDaConstelacao[],
  ligacoes: readonly (readonly [number, number])[],
): DesenhoDeConstelacao {
  return {
    id,
    largura,
    altura,
    pontos,
    ligacoes,
    cintilar: sortearCintilar(semente, pontos.length),
  };
}

/** Semente única do A-14; cada desenho soma o próprio índice. */
export const SEMENTE_DAS_CONSTELACOES = 1414;

export const CONSTELACOES = {
  /** Hero, canto superior esquerdo. */
  heroSuperiorEsquerdo: desenho(
    'hero-superior-esquerdo',
    SEMENTE_DAS_CONSTELACOES + 1,
    180,
    120,
    [
      { x: 12, y: 20, r: 4 },
      { x: 58, y: 44, r: 3 },
      { x: 104, y: 16, r: 3 },
      { x: 92, y: 84, r: 4 },
      { x: 150, y: 70, r: 3 },
      { x: 36, y: 100, r: 3 },
    ],
    [
      [0, 1],
      [1, 2],
      [1, 3],
      [3, 4],
      [2, 4],
      [1, 5],
    ],
  ),
  /** Hero, canto inferior direito. */
  heroInferiorDireito: desenho(
    'hero-inferior-direito',
    SEMENTE_DAS_CONSTELACOES + 2,
    170,
    120,
    [
      { x: 20, y: 90, r: 3 },
      { x: 64, y: 60, r: 4 },
      { x: 120, y: 96, r: 3 },
      { x: 150, y: 36, r: 3 },
      { x: 96, y: 18, r: 4 },
    ],
    [
      [0, 1],
      [1, 2],
      [1, 4],
      [4, 3],
      [3, 2],
    ],
  ),
  /** Contato, canto superior direito. */
  contatoSuperiorDireito: desenho(
    'contato-superior-direito',
    SEMENTE_DAS_CONSTELACOES + 3,
    160,
    110,
    [
      { x: 146, y: 14, r: 4 },
      { x: 102, y: 36, r: 3 },
      { x: 124, y: 86, r: 3 },
      { x: 56, y: 22, r: 3 },
      { x: 18, y: 64, r: 4 },
    ],
    [
      [0, 1],
      [1, 2],
      [1, 3],
      [3, 4],
    ],
  ),
  /** Contato, canto inferior esquerdo. */
  contatoInferiorEsquerdo: desenho(
    'contato-inferior-esquerdo',
    SEMENTE_DAS_CONSTELACOES + 4,
    170,
    110,
    [
      { x: 14, y: 96, r: 3 },
      { x: 50, y: 58, r: 4 },
      { x: 104, y: 76, r: 3 },
      { x: 88, y: 20, r: 3 },
      { x: 154, y: 40, r: 4 },
      { x: 140, y: 96, r: 3 },
    ],
    [
      [0, 1],
      [1, 2],
      [1, 3],
      [3, 4],
      [2, 5],
      [2, 4],
    ],
  ),
} as const satisfies Record<string, DesenhoDeConstelacao>;

export type NomeDaConstelacao = keyof typeof CONSTELACOES;
