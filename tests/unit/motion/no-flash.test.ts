// Regra anti-piscada (A-01; doc 04 §4.2 R5; doc de design §11; WCAG 2.3.1): nada pisca mais de
// 3 vezes por segundo. Todo `@keyframes` que altera `opacity` e roda em loop (`infinite` ou mais de
// uma repetição) precisa de duração ≥ 1 s. Varre todo src/**/*.css:
// - acha os @keyframes com `opacity`;
// - acha os usos (`animation` abreviado e `animation-name`/`-duration`/`-iteration-count`);
// - resolve a duração (ms, s ou `var(--dur-*)` dos tokens do DS-02/A-01);
// - falha se o loop for < 1000 ms ou se a duração não puder ser resolvida.
// Também garante que nenhum loop roda em JS (`repeat: Infinity`), porque loops são CSS (§4.3).
// O A-20 transforma esta verificação em `scripts/check-motion-css.mjs`.
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const RAIZ = process.cwd();
const SRC = resolve(RAIZ, 'src');
const PERIODO_MINIMO_MS = 1000;

const semComentarios = (css: string): string => css.replace(/\/\*[\s\S]*?\*\//g, '');

/** Divide por `sep` fora de parênteses (`cubic-bezier(…, …)`, `var(…)`). */
function dividir(valor: string, sep: RegExp): string[] {
  const partes: string[] = [];
  let nivel = 0;
  let atual = '';
  for (const c of valor) {
    if (c === '(') nivel++;
    if (c === ')') nivel--;
    if (nivel === 0 && sep.test(c)) {
      if (atual.trim()) partes.push(atual.trim());
      atual = '';
    } else atual += c;
  }
  if (atual.trim()) partes.push(atual.trim());
  return partes;
}

/** Tokens de duração (`--dur-*`) em ms, lidos do `:root` de motion.css e motion-extra.css. */
function lerTokensDeDuracao(): Map<string, number> {
  const mapa = new Map<string, number>();
  for (const arq of ['src/styles/tokens/motion.css', 'src/styles/tokens/motion-extra.css']) {
    const css = semComentarios(readFileSync(resolve(RAIZ, arq), 'utf8')).replace(
      /@media[^{]*\{[\s\S]*?\}\s*\}/g,
      '',
    );
    for (const m of css.matchAll(/(--dur-[\w-]+)\s*:\s*([^;]+);/g)) {
      const ms = emMs((m[2] as string).trim(), new Map());
      if (ms !== null) mapa.set(m[1] as string, ms);
    }
  }
  return mapa;
}

/** `600ms`/`.6s`/`var(--dur-x)` → ms; outra coisa → null. */
function emMs(token: string, tokens: Map<string, number>): number | null {
  const tempo = /^(\d*\.?\d+)(ms|s)$/i.exec(token);
  if (tempo) return Number(tempo[1]) * (tempo[2]?.toLowerCase() === 'ms' ? 1 : 1000);
  const v = /^var\((--[\w-]+)\s*(?:,\s*([^)]+))?\)$/.exec(token);
  if (v) {
    const valor = tokens.get(v[1] as string);
    if (valor !== undefined) return valor;
    return v[2] ? emMs(v[2].trim(), tokens) : null;
  }
  return null;
}

interface Uso {
  nome: string;
  duracao: string | undefined;
  repeticoes: string;
}

/** Corpos dos @keyframes (com chaves aninhadas) e o CSS sem eles. */
function separarKeyframes(css: string): { keyframes: Map<string, string>; resto: string } {
  const keyframes = new Map<string, string>();
  let resto = '';
  let i = 0;
  const re = /@keyframes\s+([\w-]+)\s*\{/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(css))) {
    resto += css.slice(i, m.index);
    let nivel = 1;
    let j = re.lastIndex;
    while (j < css.length && nivel > 0) {
      if (css[j] === '{') nivel++;
      if (css[j] === '}') nivel--;
      j++;
    }
    keyframes.set(m[1] as string, css.slice(re.lastIndex, j - 1));
    i = j;
    re.lastIndex = j;
  }
  resto += css.slice(i);
  return { keyframes, resto };
}

const PALAVRAS_DE_ANIMACAO = new Set([
  'none',
  'infinite',
  'normal',
  'reverse',
  'alternate',
  'alternate-reverse',
  'forwards',
  'backwards',
  'both',
  'running',
  'paused',
  'linear',
  'ease',
  'ease-in',
  'ease-out',
  'ease-in-out',
  'step-start',
  'step-end',
  'initial',
  'inherit',
  'unset',
]);

/** Usos de animação em cada bloco de declarações (sem aninhamento). */
function usosDeAnimacao(resto: string): Uso[] {
  const usos: Uso[] = [];
  for (const bloco of resto.matchAll(/\{([^{}]*)\}/g)) {
    const corpo = bloco[1] as string;
    const decl = (prop: string): string | undefined =>
      new RegExp(`(?:^|[;\\s])${prop}\\s*:\\s*([^;]+)`)
        .exec(corpo)?.[1]
        ?.replace(/!important/, '')
        .trim();

    const abreviada = decl('animation');
    if (abreviada) {
      for (const item of dividir(abreviada, /,/)) {
        const partes = dividir(item, /\s/);
        const tempos = partes.filter(
          (p) => /^(\d*\.?\d+)(ms|s)$/i.test(p) || /^var\(--dur-/.test(p),
        );
        const nome =
          partes.find(
            (p) =>
              !PALAVRAS_DE_ANIMACAO.has(p) &&
              !tempos.includes(p) &&
              !/^\d/.test(p) &&
              !/^(var|cubic-bezier|steps)\(/.test(p),
          ) ?? '';
        const repeticoes = partes.find((p) => p === 'infinite' || /^\d*\.?\d+$/.test(p)) ?? '1';
        usos.push({ nome, duracao: tempos[0], repeticoes });
      }
    }

    const nomes = decl('animation-name');
    if (nomes) {
      const duracoes = dividir(decl('animation-duration') ?? '0s', /,/);
      const reps = dividir(decl('animation-iteration-count') ?? '1', /,/);
      dividir(nomes, /,/).forEach((nome, k) => {
        usos.push({
          nome,
          duracao: duracoes[k % duracoes.length],
          repeticoes: reps[k % reps.length] ?? '1',
        });
      });
    }
  }
  return usos;
}

/** Violações da regra R5 num CSS (sem comentários). */
function verificarPiscadas(css: string, tokens: Map<string, number>): string[] {
  const { keyframes, resto } = separarKeyframes(semComentarios(css));
  const deOpacidade = new Set(
    [...keyframes].filter(([, corpo]) => /\bopacity\s*:/.test(corpo)).map(([nome]) => nome),
  );
  const violacoes: string[] = [];
  for (const uso of usosDeAnimacao(resto)) {
    if (!deOpacidade.has(uso.nome)) continue;
    const emLoop = uso.repeticoes === 'infinite' || Number(uso.repeticoes) > 1;
    if (!emLoop) continue;
    const ms = uso.duracao === undefined ? null : emMs(uso.duracao, tokens);
    if (ms === null) violacoes.push(`${uso.nome}: duração não resolvida (${uso.duracao ?? '—'})`);
    else if (ms < PERIODO_MINIMO_MS)
      violacoes.push(`${uso.nome}: ${ms} ms < ${PERIODO_MINIMO_MS} ms`);
  }
  return violacoes;
}

const TOKENS = lerTokensDeDuracao();

describe('verificador anti-piscada (autoteste com CSS de exemplo)', () => {
  it('lê os tokens de duração do DS-02 e do A-01', () => {
    expect(TOKENS.get('--dur-fast')).toBe(200);
    expect(TOKENS.get('--dur-pulse')).toBe(2400);
    expect(TOKENS.get('--dur-burst')).toBe(2000);
  });

  it('reprova loop de opacidade abaixo de 1 s (abreviada, ms, s e token)', () => {
    const kf = '@keyframes pisca { 0%, 100% { opacity: 1 } 50% { opacity: 0 } }';
    expect(verificarPiscadas(`${kf} .a { animation: pisca 300ms infinite; }`, TOKENS)).toHaveLength(
      1,
    );
    expect(
      verificarPiscadas(`${kf} .a { animation: pisca .9s ease-in-out infinite; }`, TOKENS),
    ).toHaveLength(1);
    expect(
      verificarPiscadas(`${kf} .a { animation: pisca var(--dur-fast) infinite; }`, TOKENS),
    ).toHaveLength(1);
    expect(verificarPiscadas(`${kf} .a { animation: infinite 0.5s pisca; }`, TOKENS)).toHaveLength(
      1,
    );
    expect(verificarPiscadas(`${kf} .a { animation: pisca 300ms 5; }`, TOKENS)).toHaveLength(1);
  });

  it('reprova pelos longhands e por duração que não se resolve', () => {
    const kf = '@keyframes pisca { to { opacity: 0 } }';
    expect(
      verificarPiscadas(
        `${kf} .a { animation-name: pisca; animation-duration: 250ms; animation-iteration-count: infinite; }`,
        TOKENS,
      ),
    ).toHaveLength(1);
    expect(
      verificarPiscadas(`${kf} .a { animation: pisca var(--dur-inexistente) infinite; }`, TOKENS),
    ).toEqual(['pisca: duração não resolvida (var(--dur-inexistente))']);
  });

  it('aprova: loop ≥ 1 s, opacidade sem loop, loop só de transform', () => {
    const op = '@keyframes cintila { 0%, 100% { opacity: 1 } 50% { opacity: 0.5 } }';
    const tr = '@keyframes flutua { 50% { transform: translateY(-10px) } }';
    const css = [
      op,
      tr,
      '.a { animation: cintila 6s var(--ease-in-out) infinite; }',
      '.b { animation: cintila var(--dur-pulse) cubic-bezier(0.22, 1, 0.36, 1) infinite; }',
      '.c { animation: cintila 300ms 1; }',
      '.d { animation: flutua 500ms infinite; }',
      '.e { animation: cintila 1000ms infinite alternate; }',
    ].join('\n');
    expect(verificarPiscadas(css, TOKENS)).toEqual([]);
  });
});

describe('regra anti-piscada em src/ (R5)', () => {
  const arquivosCss = readdirSync(SRC, { recursive: true, encoding: 'utf8' })
    .filter((f) => f.endsWith('.css'))
    .map((f) => ({
      caminho: relative(RAIZ, join(SRC, f)).replaceAll('\\', '/'),
      css: readFileSync(join(SRC, f), 'utf8'),
    }));

  it('nenhum loop de opacidade com período < 1 s em src/**/*.css', () => {
    expect(arquivosCss.length).toBeGreaterThan(0);
    const violacoes = arquivosCss.flatMap(({ caminho, css }) =>
      verificarPiscadas(css, TOKENS).map((v) => `${caminho}: ${v}`),
    );
    expect(violacoes).toEqual([]);
  });

  it('nenhum loop em JS (`repeat: Infinity`) em src/: loops são keyframes CSS (§4.3)', () => {
    const achados = readdirSync(SRC, { recursive: true, encoding: 'utf8' })
      .filter((f) => /\.(ts|tsx)$/.test(f))
      .filter((f) => /repeat\s*:\s*Infinity/.test(readFileSync(join(SRC, f), 'utf8')))
      .map((f) => relative(RAIZ, join(SRC, f)).replaceAll('\\', '/'));
    expect(achados).toEqual([]);
  });
});
