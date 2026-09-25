// Tokens de movimento (DS-02; doc 02 §4.7; D14). Confere:
// (1) os 14 tokens do §4.7 em `motion.css`, com os valores da tabela;
// (2) o bloco `prefers-reduced-motion: reduce` zera `--lift-*` e `--arrow-shift`;
// (3) declaração única: nenhum `--dur-*`, `--ease-*`, `--lift-*` ou `--arrow-shift` é declarado
//     fora de `motion.css` (exceção: `--dur-burst` e `--ease-in-out` em `motion-extra.css`, A-01),
//     nem em CSS nem em estilo inline de TS/TSX;
// (4) os nomes abandonados (`--dur-hover-btn` etc.) e `tokens-motion.css` não existem.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const RAIZ = process.cwd();
const SRC = resolve(RAIZ, 'src');
const DONO = 'src/styles/tokens/motion.css';
const EXTRA = 'src/styles/tokens/motion-extra.css';
const PERMITIDOS_NO_EXTRA = ['--dur-burst', '--ease-in-out'];

const semComentarios = (css: string): string => css.replace(/\/\*[\s\S]*?\*\//g, '');

function arquivos(extensoes: string[]): { caminho: string; texto: string }[] {
  return readdirSync(SRC, { recursive: true, encoding: 'utf8' })
    .filter((f) => extensoes.some((e) => f.endsWith(e)))
    .map((f) => ({
      caminho: relative(RAIZ, join(SRC, f)).replaceAll('\\', '/'),
      texto: readFileSync(join(SRC, f), 'utf8'),
    }));
}

const CSS = arquivos(['.css']).map((a) => ({ ...a, texto: semComentarios(a.texto) }));
const TS = arquivos(['.ts', '.tsx']);

const motion = semComentarios(readFileSync(resolve(RAIZ, DONO), 'utf8'));

function declaracoes(trecho: string): Record<string, string> {
  const obj: Record<string, string> = {};
  for (const m of trecho.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g))
    obj[m[1] as string] = (m[2] as string).trim();
  return obj;
}

const blocoReduzido =
  /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{\s*:root\s*\{([^}]*)\}\s*\}/.exec(motion)?.[1];
const base = declaracoes(
  /:root\s*\{([^}]*)\}/.exec(motion.replace(/@media[^{]*\{\s*:root\s*\{[^}]*\}\s*\}/g, ''))?.[1] ??
    '',
);

/** Tabela §4.7. */
const ESPERADO = {
  '--dur-fast': '200ms',
  '--dur-base': '250ms',
  '--dur-theme': '300ms',
  '--dur-enter': '600ms',
  '--dur-chip': '400ms',
  '--dur-draw': '800ms',
  '--dur-count': '1200ms',
  '--dur-pulse': '2400ms',
  '--ease-out': 'cubic-bezier(0.22, 1, 0.36, 1)',
  '--lift-card': '-6px',
  '--lift-panel': '-4px',
  '--lift-button': '-2px',
  '--lift-chip': '-2px',
  '--arrow-shift': '4px',
};

const DE_MOVIMENTO = /^--(?:dur|ease|lift)-|^--arrow-shift$/;

describe('motion.css (§4.7)', () => {
  it('os 14 tokens com os valores da tabela, e nada além', () => {
    expect(Object.keys(ESPERADO)).toHaveLength(14);
    expect(base).toEqual(ESPERADO);
  });

  it('8 --dur-*, 1 --ease-*, 4 --lift-* e --arrow-shift', () => {
    const nomes = Object.keys(base);
    expect(nomes.filter((n) => n.startsWith('--dur-'))).toHaveLength(8);
    expect(nomes.filter((n) => n.startsWith('--ease-'))).toHaveLength(1);
    expect(nomes.filter((n) => n.startsWith('--lift-'))).toHaveLength(4);
    expect(nomes).toContain('--arrow-shift');
  });

  it('prefers-reduced-motion: reduce zera os 4 --lift-* e --arrow-shift (e só eles)', () => {
    expect(blocoReduzido).toBeDefined();
    expect(declaracoes(blocoReduzido ?? '')).toEqual({
      '--lift-card': '0px',
      '--lift-panel': '0px',
      '--lift-button': '0px',
      '--lift-chip': '0px',
      '--arrow-shift': '0px',
    });
  });
});

describe('declaração única dos tokens de movimento (D14)', () => {
  it('nenhum CSS fora de motion.css declara --dur-*/--ease-*/--lift-*/--arrow-shift', () => {
    const achados: string[] = [];
    for (const { caminho, texto } of CSS) {
      if (caminho === DONO) continue;
      for (const m of texto.matchAll(/(--[\w-]+)\s*:/g)) {
        const nome = m[1] as string;
        if (!DE_MOVIMENTO.test(nome)) continue;
        if (caminho === EXTRA && PERMITIDOS_NO_EXTRA.includes(nome)) continue;
        achados.push(`${caminho}: ${nome}`);
      }
    }
    expect(achados).toEqual([]);
  });

  it('motion-extra.css, se existir, não redefine nenhum token do §4.7', () => {
    const extra = CSS.find((a) => a.caminho === EXTRA);
    if (!extra) return;
    const nomes = [...extra.texto.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1] as string);
    expect(nomes.filter((n) => n in ESPERADO)).toEqual([]);
  });

  it('nenhum TS/TSX declara esses tokens em estilo inline', () => {
    const achados = TS.flatMap(({ caminho, texto }) =>
      [...texto.matchAll(/['"`](--(?:dur|ease|lift)-[\w-]+|--arrow-shift)['"`]\s*:/g)].map(
        (m) => `${caminho}: ${m[1]}`,
      ),
    );
    expect(achados).toEqual([]);
  });

  it('não existem tokens-motion.css nem os nomes abandonados', () => {
    expect(existsSync(resolve(SRC, 'styles/tokens/tokens-motion.css'))).toBe(false);
    const abandonados = /--dur-(?:hover-btn|hover-card|reveal|line)\b/;
    const achados = CSS.filter(({ texto }) => abandonados.test(texto)).map((a) => a.caminho);
    expect(achados).toEqual([]);
  });
});
