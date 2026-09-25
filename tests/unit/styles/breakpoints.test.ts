// Breakpoints e tokens de espaço/layout/forma (DS-02; doc 02 §4.2, §4.3, §4.4, §4.6).
// Lê os `.css` como texto: (1) toda media query de largura em `src/**/*.css` usa só 640/1024/1440
// (min) ou 639/1023/1439 (max); (2) as constantes de `breakpoints.ts` batem com o §4.3;
// (3) a escala `--space-*`, os tokens de layout por faixa e os de forma batem com as tabelas.
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  DESKTOP_MAX,
  DESKTOP_MIN,
  MOBILE_MAX,
  TABLET_MAX,
  TABLET_MIN,
  WIDE_MIN,
  mq,
} from '../../../src/styles/breakpoints';

const RAIZ = process.cwd();
const SRC = resolve(RAIZ, 'src');
const TOKENS = resolve(SRC, 'styles/tokens');

const semComentarios = (css: string): string => css.replace(/\/\*[\s\S]*?\*\//g, '');
const ler = (caminho: string): string => semComentarios(readFileSync(caminho, 'utf8'));

const TODOS_CSS = readdirSync(SRC, { recursive: true, encoding: 'utf8' })
  .filter((f) => f.endsWith('.css'))
  .map((f) => ({
    caminho: relative(RAIZ, join(SRC, f)).replaceAll('\\', '/'),
    css: ler(join(SRC, f)),
  }));

const MIN_PERMITIDOS = [640, 1024, 1440];
const MAX_PERMITIDOS = [639, 1023, 1439];

/** Declarações `--token: valor;` de um trecho de CSS. */
function declaracoes(trecho: string): Map<string, string> {
  const mapa = new Map<string, string>();
  for (const m of trecho.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    mapa.set(m[1] as string, (m[2] as string).trim());
  }
  return mapa;
}

/**
 * Blocos de um arquivo de tokens por faixa: `base` (`:root` fora de media query), `tablet`
 * (`@media (min-width: 640px)`) e `desktop` (`@media (min-width: 1024px)`).
 */
function faixas(css: string): {
  base: Map<string, string>;
  tablet: Map<string, string>;
  desktop: Map<string, string>;
} {
  const media = (px: number): Map<string, string> => {
    const re = new RegExp(
      `@media\\s*\\(min-width:\\s*${px}px\\)\\s*\\{\\s*:root\\s*\\{([^}]*)\\}\\s*\\}`,
    );
    return declaracoes(re.exec(css)?.[1] ?? '');
  };
  const semMedia = css.replace(/@media[^{]*\{\s*:root\s*\{[^}]*\}\s*\}/g, '');
  return {
    base: declaracoes(/:root\s*\{([^}]*)\}/.exec(semMedia)?.[1] ?? ''),
    tablet: media(640),
    desktop: media(1024),
  };
}

describe('breakpoints.ts (§4.3)', () => {
  it('constantes do §4.3', () => {
    expect({ MOBILE_MAX, TABLET_MIN, TABLET_MAX, DESKTOP_MIN, DESKTOP_MAX, WIDE_MIN }).toEqual({
      MOBILE_MAX: 639,
      TABLET_MIN: 640,
      TABLET_MAX: 1023,
      DESKTOP_MIN: 1024,
      DESKTOP_MAX: 1439,
      WIDE_MIN: 1440,
    });
  });

  it('faixas contíguas, sem buraco nem sobreposição', () => {
    expect(TABLET_MIN).toBe(MOBILE_MAX + 1);
    expect(DESKTOP_MIN).toBe(TABLET_MAX + 1);
    expect(WIDE_MIN).toBe(DESKTOP_MAX + 1);
  });

  it('mq para useMediaQuery', () => {
    expect(mq).toEqual({
      tablet: '(min-width: 640px)',
      desktop: '(min-width: 1024px)',
      wide: '(min-width: 1440px)',
    });
  });
});

describe('media queries de largura em src/**/*.css', () => {
  it('existem arquivos CSS para varrer', () => {
    expect(TODOS_CSS.length).toBeGreaterThan(0);
  });

  it('min-width só 640/1024/1440 e max-width só 639/1023/1439', () => {
    const invalidos: string[] = [];
    for (const { caminho, css } of TODOS_CSS) {
      for (const prelude of css.match(/@media[^{]*/g) ?? []) {
        for (const m of prelude.matchAll(/(min|max)-width\s*:\s*([\d.]+)(\w*)/g)) {
          const [, tipo, numero, unidade] = m;
          const valor = Number(numero);
          const lista = tipo === 'min' ? MIN_PERMITIDOS : MAX_PERMITIDOS;
          if (unidade !== 'px' || !lista.includes(valor)) {
            invalidos.push(`${caminho}: ${prelude.trim()}`);
          }
        }
        // Sintaxe de intervalo (`width >= 640px`) não é usada no projeto: qualquer uso cai aqui.
        if (/\bwidth\s*[<>=]/.test(prelude)) invalidos.push(`${caminho}: ${prelude.trim()}`);
      }
    }
    expect(invalidos).toEqual([]);
  });
});

describe('spacing.css: escala (§4.2)', () => {
  const { base } = faixas(ler(resolve(TOKENS, 'spacing.css')));
  const escala = [...base].filter(([t]) => t.startsWith('--space-'));

  it('escala 4/8/12/16/24/32/48/64/96/128 com nome = valor ÷ 4', () => {
    expect(Object.fromEntries(escala)).toEqual({
      '--space-1': '4px',
      '--space-2': '8px',
      '--space-3': '12px',
      '--space-4': '16px',
      '--space-6': '24px',
      '--space-8': '32px',
      '--space-12': '48px',
      '--space-16': '64px',
      '--space-24': '96px',
      '--space-32': '128px',
    });
  });

  it('todos os --space-* são múltiplos de 4', () => {
    const fora = escala.filter(([, v]) => !/^\d+px$/.test(v) || parseInt(v, 10) % 4 !== 0);
    expect(fora).toEqual([]);
  });
});

describe('spacing.css: layout por faixa (§4.4)', () => {
  const { base, tablet, desktop } = faixas(ler(resolve(TOKENS, 'spacing.css')));
  /** Valor efetivo numa faixa (mobile-first: a faixa herda a anterior). */
  const efetivo = (token: string, faixa: 'celular' | 'tablet' | 'desktop'): string | undefined => {
    if (faixa === 'desktop' && desktop.has(token)) return desktop.get(token);
    if (faixa !== 'celular' && tablet.has(token)) return tablet.get(token);
    return base.get(token);
  };

  /** token → [celular, tablet, desktop] */
  const TABELA: Record<string, [string, string, string]> = {
    '--container-max': ['100%', '100%', '1200px'],
    '--gutter': ['20px', '32px', '32px'],
    '--grid-columns': ['4', '8', '12'],
    '--grid-gap': ['16px', '24px', '24px'],
    '--section-py': ['64px', '88px', '112px'],
    '--section-py-motto': ['64px', '88px', '96px'],
    '--section-head-gap': ['40px', '48px', '56px'],
    '--card-gap': ['16px', '24px', '24px'],
    '--card-padding': ['24px', '28px', '32px'],
    '--header-height': ['64px', '68px', '72px'],
    '--button-height': ['48px', '52px', '52px'],
    '--button-height-compact': ['44px', '44px', '44px'],
    '--button-gap': ['12px', '16px', '16px'],
    '--anchor-offset': ['80px', '80px', '80px'],
    '--touch-min': ['44px', '44px', '44px'],
    '--measure-body': ['65ch', '65ch', '65ch'],
    '--measure-hero-sub': ['560px', '560px', '560px'],
    '--measure-narrow': ['760px', '760px', '760px'],
    '--measure-motto': ['900px', '900px', '900px'],
    '--measure-contact': ['1000px', '1000px', '1000px'],
    '--measure-contact-text': ['640px', '640px', '640px'],
  };

  for (const [token, valores] of Object.entries(TABELA)) {
    it(`${token} = ${valores.join(' / ')}`, () => {
      expect([
        efetivo(token, 'celular'),
        efetivo(token, 'tablet'),
        efetivo(token, 'desktop'),
      ]).toEqual(valores);
    });
  }

  it('nenhum token de layout fora da tabela (além da escala --space-*)', () => {
    const todos = new Set([...base.keys(), ...tablet.keys(), ...desktop.keys()]);
    const extras = [...todos].filter((t) => !t.startsWith('--space-') && !(t in TABELA));
    expect(extras).toEqual([]);
  });

  it('as faixas só sobrescrevem tokens que existem na base', () => {
    const orfaos = [...tablet.keys(), ...desktop.keys()].filter((t) => !base.has(t));
    expect(orfaos).toEqual([]);
  });
});

describe('shape.css (§4.6)', () => {
  const { base } = faixas(ler(resolve(TOKENS, 'shape.css')));

  it('raios, bordas, foco e ícones com os valores da tabela', () => {
    expect(Object.fromEntries(base)).toEqual({
      '--radius-pill': '9999px',
      '--radius-card': '24px',
      '--radius-panel': '32px',
      '--radius-media': '20px',
      '--radius-icon-box': '16px',
      '--radius-monogram-sm': '12px',
      '--border-width': '1px',
      '--border-width-strong': '1.5px',
      '--focus-width': '3px',
      '--focus-offset': '3px',
      '--icon-stroke': '1.75',
      '--icon-sm': '20px',
      '--icon-md': '24px',
      '--icon-lg': '28px',
      '--icon-xl': '32px',
      '--icon-box-size': '56px',
    });
  });
});

describe('global.css: ordem dos imports', () => {
  it('colors → spacing → shape → motion, todos antes do base.css', () => {
    const global = ler(resolve(SRC, 'styles/global.css'));
    const imports = [...global.matchAll(/@import\s+['"]([^'"]+)['"]/g)].map((m) => m[1]);
    const ordem = [
      './tokens/colors.css',
      './tokens/spacing.css',
      './tokens/shape.css',
      './tokens/motion.css',
      './base.css',
    ].map((i) => imports.indexOf(i));
    expect(ordem.every((i) => i >= 0)).toBe(true);
    expect([...ordem].sort((a, b) => a - b)).toEqual(ordem);
  });
});
