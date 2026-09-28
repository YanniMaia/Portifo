// Tokens acrescentados pelo A-01 (doc 04 §4.1 e §5; D14). Lê os `.css` como texto e confere:
// (1) motion-extra.css tem SÓ --dur-burst (2000ms) e --ease-in-out (cubic-bezier(0.45, 0, 0.55, 1));
// (2) deco-extra.css tem SÓ os 5 aliases --deco-* da §5, cada um `var()` do token certo do DS-01;
// (3) nenhum dos dois redefine nome já presente em motion.css/colors.css, nem contém hex/rgb/hsl;
// (4) nenhum `--decor-*` em src/ (CSS, TS, TSX);
// (5) ordem dos imports no global.css: motion-extra logo depois de motion, deco-extra depois dos
//     tokens do DS e antes do base.css, typography.css por último (DS-03);
// (6) a regra anti-piscada (R5) está documentada no cabeçalho de motion-extra.css.
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const RAIZ = process.cwd();
const SRC = resolve(RAIZ, 'src');
const ler = (p: string): string => readFileSync(resolve(RAIZ, p), 'utf8');
const semComentarios = (css: string): string => css.replace(/\/\*[\s\S]*?\*\//g, '');

const motionExtraBruto = ler('src/styles/tokens/motion-extra.css');
const motionExtra = semComentarios(motionExtraBruto);
const decoExtra = semComentarios(ler('src/styles/tokens/deco-extra.css'));
const motion = semComentarios(ler('src/styles/tokens/motion.css'));
const cores = semComentarios(ler('src/styles/tokens/colors.css'));

function declaracoes(css: string): [string, string][] {
  return [...css.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map((m) => [
    m[1] as string,
    (m[2] as string).replace(/\s+/g, ' ').trim(),
  ]);
}
const nomes = (css: string): Set<string> => new Set(declaracoes(css).map(([n]) => n));

describe('motion-extra.css (§4.1)', () => {
  it('só --dur-burst e --ease-in-out, com os valores da tabela', () => {
    expect(Object.fromEntries(declaracoes(motionExtra))).toEqual({
      '--dur-burst': '2000ms',
      '--ease-in-out': 'cubic-bezier(0.45, 0, 0.55, 1)',
    });
    expect(declaracoes(motionExtra)).toHaveLength(2);
  });

  it('não redefine nenhum nome de motion.css', () => {
    const dono = nomes(motion);
    expect([...nomes(motionExtra)].filter((n) => dono.has(n))).toEqual([]);
  });

  it('documenta a regra anti-piscada (R5) no cabeçalho', () => {
    const cabecalho = /^\/\*[\s\S]*?\*\//.exec(motionExtraBruto.trim())?.[0] ?? '';
    expect(cabecalho).toMatch(/ANTI-PISCADA/);
    expect(cabecalho).toMatch(/3 vezes por segundo/);
    expect(cabecalho).toMatch(/1 s/);
    expect(cabecalho).toMatch(/333 ms/);
  });
});

describe('deco-extra.css (§5)', () => {
  const ESPERADO = {
    '--deco-node': 'var(--color-deco-soft)',
    '--deco-chart-1': 'var(--color-deco)',
    '--deco-chart-2': 'var(--color-accent)',
    '--deco-burst-1': 'var(--color-accent)',
    '--deco-burst-2': 'var(--color-deco)',
  };

  it('só os 5 aliases da §5, cada um var() do token do DS-01', () => {
    expect(Object.fromEntries(declaracoes(decoExtra))).toEqual(ESPERADO);
    expect(declaracoes(decoExtra)).toHaveLength(5);
  });

  it('cada token de origem existe em colors.css nos dois temas', () => {
    const claro = /:root,\s*\[data-theme=['"]light['"]\]\s*\{([^}]*)\}/.exec(cores)?.[1] ?? '';
    const escuro = /\[data-theme=['"]dark['"]\]\s*\{([^}]*)\}/.exec(cores)?.[1] ?? '';
    for (const valor of Object.values(ESPERADO)) {
      const origem = /var\((--[\w-]+)\)/.exec(valor)?.[1] as string;
      expect({ origem, claro: nomes(claro).has(origem) }).toEqual({ origem, claro: true });
      expect({ origem, escuro: nomes(escuro).has(origem) }).toEqual({ origem, escuro: true });
    }
  });

  it('não redefine nenhum nome de colors.css', () => {
    const dono = nomes(cores);
    expect([...nomes(decoExtra)].filter((n) => dono.has(n))).toEqual([]);
  });
});

describe('sem cor literal e sem --decor-* (D14)', () => {
  it('motion-extra.css e deco-extra.css não contêm hex, rgb(), hsl() nem cor nomeada nos valores', () => {
    for (const css of [motionExtra, decoExtra]) {
      expect(css).not.toMatch(/#[0-9a-f]{3,8}\b/i);
      expect(css).not.toMatch(/\b(rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(/i);
      for (const [, valor] of declaracoes(css)) {
        expect(valor).toMatch(/^(var\(--[\w-]+\)|\d+ms|cubic-bezier\([^)]*\))$/);
      }
    }
  });

  it('nenhum --decor-* em src/ (CSS, TS e TSX)', () => {
    const achados = readdirSync(SRC, { recursive: true, encoding: 'utf8' })
      .filter((f) => /\.(css|ts|tsx)$/.test(f))
      // Só código: os comentários dos donos citam "não existe `--decor-*`".
      .filter((f) =>
        /--decor-/.test(
          semComentarios(readFileSync(join(SRC, f), 'utf8')).replace(/(^|[^:])\/\/.*$/gm, '$1'),
        ),
      )
      .map((f) => relative(RAIZ, join(SRC, f)).replaceAll('\\', '/'));
    expect(achados).toEqual([]);
  });
});

describe('global.css: imports do A-01', () => {
  const imports = [
    ...semComentarios(ler('src/styles/global.css')).matchAll(/@import\s+['"]([^'"]+)['"]/g),
  ].map((m) => m[1]);

  it('motion-extra.css logo depois de motion.css', () => {
    const i = imports.indexOf('./tokens/motion.css');
    expect(i).toBeGreaterThanOrEqual(0);
    expect(imports[i + 1]).toBe('./tokens/motion-extra.css');
  });

  it('deco-extra.css depois de todos os tokens do DS e antes do base.css', () => {
    const iDeco = imports.indexOf('./tokens/deco-extra.css');
    expect(iDeco).toBeGreaterThanOrEqual(0);
    for (const dono of [
      './tokens/colors.css',
      './tokens/spacing.css',
      './tokens/shape.css',
      './tokens/motion.css',
      './tokens/typography.css',
    ]) {
      expect(imports.indexOf(dono)).toBeLessThan(iDeco);
    }
    expect(iDeco).toBeLessThan(imports.indexOf('./base.css'));
  });

  it('cada arquivo importado uma vez e typography.css continua por último (DS-03)', () => {
    expect(new Set(imports).size).toBe(imports.length);
    expect(imports.at(-1)).toBe('./typography.css');
  });
});
