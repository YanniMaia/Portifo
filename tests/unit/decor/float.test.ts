// Flutuação dos cartões do hero (A-11a; doc 04 §7; doc de design §7.2 e §9; DV-8, DV-9).
// Confere:
// - presets: amplitude 8–12 px, período 6–9 s, combinações distintas;
// - CSS = presets.ts (o teste lê os dois);
// - só `transform` animado, com `--ease-in-out` e loop infinito;
// - `will-change: transform` só na regra `[data-float]`;
// - `global.css` importa o `float.css` depois do base e antes da tipografia.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  FLUTUANTES_NO_CELULAR,
  NOMES_DE_FLUTUACAO,
  PRESETS_DE_FLUTUACAO,
  type NomeDeFlutuacao,
} from '@/components/decor/float/presets';

const RAIZ = process.cwd();
const semComentarios = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '');
const CSS = semComentarios(
  readFileSync(resolve(RAIZ, 'src/components/decor/float/float.css'), 'utf8'),
);

/** Corpo da regra com seletor exato. */
function regra(seletor: string): string {
  const esc = seletor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?:^|\\n)${esc}\\s*\\{([^}]*)\\}`).exec(CSS)?.[1] ?? '';
}

const numero = (corpo: string, prop: string, unidade: 'px' | 's'): number => {
  const m = new RegExp(`${prop}:\\s*(-?\\d*\\.?\\d+)${unidade};`).exec(corpo);
  return m ? Number(m[1]) : Number.NaN;
};

describe('presets.ts (fonte única, N27)', () => {
  it('são exatamente os 4 nomes do contrato §4.4', () => {
    expect(NOMES_DE_FLUTUACAO).toEqual(['lock', 'database', 'chart', 'code']);
  });

  it('valores da tabela do A-11a', () => {
    expect(PRESETS_DE_FLUTUACAO).toEqual({
      lock: { amplitudePx: 8, periodoS: 6, atrasoS: -1.2 },
      database: { amplitudePx: 10, periodoS: 7.5, atrasoS: -3.1 },
      chart: { amplitudePx: 12, periodoS: 9, atrasoS: -4.4 },
      code: { amplitudePx: 9, periodoS: 6.8, atrasoS: -2 },
    });
  });

  it('amplitudes entre 8 e 12 px e períodos entre 6 e 9 s', () => {
    for (const p of Object.values(PRESETS_DE_FLUTUACAO)) {
      expect(p.amplitudePx).toBeGreaterThanOrEqual(8);
      expect(p.amplitudePx).toBeLessThanOrEqual(12);
      expect(p.periodoS).toBeGreaterThanOrEqual(6);
      expect(p.periodoS).toBeLessThanOrEqual(9);
      expect(p.atrasoS).toBeLessThanOrEqual(0);
      expect(Math.abs(p.atrasoS)).toBeLessThan(p.periodoS);
    }
  });

  it('nenhum par de presets com a mesma combinação (amplitude, período, atraso)', () => {
    const combos = Object.values(PRESETS_DE_FLUTUACAO).map(
      (p) => `${p.amplitudePx}|${p.periodoS}|${p.atrasoS}`,
    );
    expect(new Set(combos).size).toBe(combos.length);
    // E nem amplitude nem período se repetem: os cartões nunca andam em sincronia.
    const amps = Object.values(PRESETS_DE_FLUTUACAO).map((p) => p.amplitudePx);
    const pers = Object.values(PRESETS_DE_FLUTUACAO).map((p) => p.periodoS);
    expect(new Set(amps).size).toBe(4);
    expect(new Set(pers).size).toBe(4);
  });

  it('DV-9: no celular ficam cadeado, banco de dados e gráfico (sem o de código)', () => {
    expect([...FLUTUANTES_NO_CELULAR]).toEqual(['lock', 'database', 'chart']);
  });
});

describe('float.css = presets.ts', () => {
  it.each(Object.keys(PRESETS_DE_FLUTUACAO) as NomeDeFlutuacao[])(
    '[data-float="%s"]: --float-amp, --float-dur e --float-delay iguais ao preset',
    (nome) => {
      const corpo = regra(`[data-float='${nome}']`);
      expect(corpo).not.toBe('');
      const p = PRESETS_DE_FLUTUACAO[nome];
      expect(numero(corpo, '--float-amp', 'px')).toBe(p.amplitudePx);
      expect(numero(corpo, '--float-dur', 's')).toBe(p.periodoS);
      expect(numero(corpo, '--float-delay', 's')).toBe(p.atrasoS);
    },
  );

  it('não há regra [data-float="…"] para nome fora dos presets', () => {
    const nomes = [...CSS.matchAll(/\[data-float='([\w-]+)'\]/g)].map((m) => m[1]);
    expect(new Set(nomes)).toEqual(new Set(NOMES_DE_FLUTUACAO));
  });
});

describe('só transform animado, loop com --ease-in-out', () => {
  const keyframes = /@keyframes\s+deco-float\s*\{([\s\S]*?)\n\}/.exec(CSS)?.[1] ?? '';

  it('keyframes deco-float só com transform translateY, subindo --float-amp e voltando a 0', () => {
    const props = new Set([...keyframes.matchAll(/([a-z-]+)\s*:/g)].map((m) => m[1]));
    expect(props).toEqual(new Set(['transform']));
    expect(keyframes).toMatch(/0%,\s*100%\s*\{\s*transform: translateY\(0\);/);
    expect(keyframes).toMatch(
      /50%\s*\{\s*transform: translateY\(calc\(-1 \* var\(--float-amp\)\)\);/,
    );
  });

  it('[data-float]: animação infinita com duração, curva e atraso das variáveis', () => {
    expect(regra('[data-float]')).toContain(
      'animation: deco-float var(--float-dur) var(--ease-in-out) var(--float-delay) infinite;',
    );
  });

  it('nenhuma propriedade de layout ou de opacidade é declarada no float.css', () => {
    expect(CSS).not.toMatch(
      /(?:^|[\s;{])(top|left|right|bottom|width|height|margin[\w-]*|opacity)\s*:/,
    );
  });
});

describe('will-change e import global', () => {
  it('will-change: transform só na regra [data-float] (orçamento §4.3)', () => {
    expect(regra('[data-float]')).toContain('will-change: transform;');
    // Uma única declaração no arquivo: os presets por nome não repetem o will-change.
    expect(CSS.match(/will-change/g)).toHaveLength(1);
  });

  it('global.css importa o float.css depois do base.css e antes do typography.css', () => {
    const global = semComentarios(readFileSync(resolve(RAIZ, 'src/styles/global.css'), 'utf8'));
    const imports = [...global.matchAll(/@import\s+['"]([^'"]+)['"]/g)].map((m) => m[1]);
    const i = imports.indexOf('../components/decor/float/float.css');
    expect(i).toBeGreaterThan(imports.indexOf('./base.css'));
    expect(i).toBeLessThan(imports.indexOf('./typography.css'));
    expect(imports.at(-1)).toBe('./typography.css');
  });

  it('pausa e movimento reduzido vêm do A-01: [data-float] está no reduced-motion.css', () => {
    const rm = readFileSync(resolve(RAIZ, 'src/motion/reduced-motion.css'), 'utf8');
    expect(rm).toContain(":is([data-loop], [data-float])[data-offscreen='true']");
    expect(rm).toMatch(/\[data-float\],[\s\S]*animation: none !important;/);
  });
});
