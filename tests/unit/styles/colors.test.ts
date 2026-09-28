// Tokens de cor e de decoração (DS-01; doc 02 §4.1). Lê o CSS como texto e confere:
// paridade claro × escuro, valores da tabela §4.1, os 27 hex do doc de design, ausência de
// azul/roxo em todo `src/**/*.css` e a posse única dos prefixos `--deco-*` (D14).
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { hueSaturation } from '../support/contrast';

const RAIZ = process.cwd();
const SRC = resolve(RAIZ, 'src');
const CAMINHO_CORES = resolve(SRC, 'styles/tokens/colors.css');
const cssCores = readFileSync(CAMINHO_CORES, 'utf8');

const semComentarios = (css: string): string => css.replace(/\/\*[\s\S]*?\*\//g, '');

/** Forma canônica de um valor CSS: minúsculas, sem espaços supérfluos, sem zeros à direita. */
function normalizar(valor: string): string {
  return valor
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/\s*([(),])\s*/g, '$1')
    .replace(/(\d\.\d*?)0+\b/g, '$1')
    .replace(/\.(?=\D|$)/g, '')
    .trim();
}

function bloco(regex: RegExp): Map<string, string> {
  const corpo = regex.exec(semComentarios(cssCores))?.[1];
  if (corpo === undefined) throw new Error(`Bloco não encontrado: ${regex}`);
  const mapa = new Map<string, string>();
  for (const m of corpo.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    mapa.set(m[1] as string, normalizar(m[2] as string));
  }
  return mapa;
}

const claro = bloco(/:root,\s*\[data-theme=['"]light['"]\]\s*\{([^}]*)\}/);
const escuro = bloco(/\[data-theme=['"]dark['"]\]\s*\{([^}]*)\}/);

/** Tabela §4.1 do doc 02: token → [claro, escuro]. */
const ESPERADO: Record<string, [string, string]> = {
  '--color-bg': ['#FFFFFF', '#150A10'],
  '--color-bg-alt': ['#FFF7FA', '#1C0E16'],
  '--color-bg-tint': ['#FFEEF4', '#1C0E16'],
  '--color-surface': ['#FFFFFF', '#251320'],
  '--color-fill-soft': ['#FFEEF4', 'rgba(245, 143, 184, 0.12)'],
  '--color-chip-bg': ['#FFF7FA', '#1C0E16'],
  '--color-chip-bg-hover': ['#FFEEF4', 'rgba(245, 143, 184, 0.12)'],
  '--color-border': ['#F9D5E3', '#3B2030'],
  '--color-border-hover': ['#F286B0', 'rgba(245, 143, 184, 0.60)'],
  '--color-text': ['#2B1620', '#FDF0F5'],
  '--color-text-secondary': ['#6E4B5C', '#D8B4C4'],
  '--color-text-muted': ['#8C6A7A', '#A98496'],
  '--color-accent': ['#E0518A', '#F58FB8'],
  '--color-link': ['#C93A77', '#FFB3D1'],
  '--color-text-pink-on-tint': ['#A82560', '#FFB3D1'],
  '--color-eyebrow': ['#C93A77', '#FFB3D1'],
  '--color-eyebrow-on-tint': ['#A82560', '#FFB3D1'],
  '--color-primary': ['#C93A77', '#F58FB8'],
  '--color-primary-hover': ['#A82560', '#F06CA3'],
  '--color-on-primary': ['#FFFFFF', '#2A0A1A'],
  '--color-on-brand': ['#FFFFFF', '#FFFFFF'], // DS-18 (pendência DS-01 V-03 #5)
  '--color-secondary-border': ['#F286B0', 'rgba(245, 143, 184, 0.60)'],
  '--color-secondary-text': ['#A82560', '#FFB3D1'],
  '--color-focus': ['#E0518A', '#F58FB8'],
  '--color-skip-bg': ['#C93A77', '#C93A77'],
  '--color-skip-text': ['#FFFFFF', '#FFFFFF'],
  '--color-theme-icon': ['#C93A77', '#F58FB8'],
  '--glass-bg': ['rgba(255, 255, 255, 0.65)', 'rgba(255, 255, 255, 0.05)'],
  '--glass-border': ['#F9D5E3', 'rgba(255, 179, 209, 0.16)'],
  '--glass-blur': ['16px', '16px'],
  '--glass-bg-fallback': ['rgba(255, 255, 255, 0.92)', 'rgba(37, 19, 32, 0.92)'],
  '--header-bg': ['rgba(255, 255, 255, 0.80)', 'rgba(21, 10, 16, 0.75)'],
  '--header-blur': ['14px', '14px'],
  '--header-border': ['#F9D5E3', '#3B2030'],
  '--mobile-menu-bg': ['rgba(255, 255, 255, 0.96)', 'rgba(21, 10, 16, 0.96)'],
  '--control-bg': ['rgba(255, 255, 255, 0.60)', 'rgba(255, 255, 255, 0.05)'],
  '--control-border': ['#F9D5E3', 'rgba(255, 179, 209, 0.16)'],
  '--gradient-text': [
    'linear-gradient(135deg, #E0518A, #A82560)',
    'linear-gradient(135deg, #FFB3D1, #F06CA3)',
  ],
  '--gradient-primary': [
    'linear-gradient(135deg, #C93A77, #A82560)',
    'linear-gradient(135deg, #F58FB8, #F06CA3)',
  ],
  '--gradient-brand': [
    'linear-gradient(135deg, #E0518A, #A82560)',
    'linear-gradient(135deg, #E0518A, #A82560)',
  ],
  '--hero-glow-1': [
    'radial-gradient(circle 320px at 100% 0%, rgba(255, 220, 233, 0.70), transparent)',
    'radial-gradient(circle 320px at 100% 0%, rgba(74, 26, 51, 0.55), transparent)',
  ],
  '--hero-glow-2': [
    'radial-gradient(circle 240px at 0% 100%, #FFEEF4, transparent)',
    'radial-gradient(circle 240px at 0% 100%, rgba(42, 16, 32, 0.40), transparent)',
  ],
  '--gradient-contact': [
    'linear-gradient(160deg, #FFEEF4, #FFFFFF)',
    'linear-gradient(160deg, #2A1422, #1C0E16)',
  ],
  '--gradient-timeline': [
    'linear-gradient(180deg, #F286B0, #F7B7D0, transparent)',
    'linear-gradient(180deg, #F58FB8, #3B2030)',
  ],
  '--shadow-card': ['0 8px 28px rgba(201, 58, 119, 0.08)', '0 8px 28px rgba(0, 0, 0, 0.35)'],
  '--shadow-card-hover': [
    '0 16px 40px rgba(201, 58, 119, 0.16)',
    '0 16px 40px rgba(245, 143, 184, 0.14)',
  ],
  '--shadow-header': ['0 4px 20px rgba(201, 58, 119, 0.08)', '0 4px 20px rgba(0, 0, 0, 0.35)'],
  '--glow-deco': ['rgba(242, 134, 176, 0.25)', 'rgba(240, 108, 163, 0.18)'],
  '--color-deco-soft': ['#F7B7D0', 'rgba(240, 108, 163, 0.40)'],
  '--color-deco': ['#F286B0', '#F06CA3'],
  '--deco-grid-line': ['rgba(249, 213, 227, 0.35)', 'rgba(255, 255, 255, 0.05)'],
  '--deco-particle': ['#F7B7D0', '#F06CA3'],
  '--deco-network-line': ['rgba(247, 183, 208, 0.60)', 'rgba(240, 108, 163, 0.40)'],
  '--deco-code': ['rgba(224, 81, 138, 0.12)', 'rgba(245, 143, 184, 0.12)'],
  '--deco-bits': ['rgba(242, 134, 176, 0.20)', 'rgba(240, 108, 163, 0.20)'],
  '--deco-watermark': ['rgba(249, 213, 227, 0.50)', 'rgba(59, 32, 48, 0.50)'],
  '--deco-shape-stroke': ['#F7B7D0', '#3B2030'],
};

/** 12 hex do §3.2, 10 do §3.3 e 5 extras do §3.4 (doc de design v1.1). */
const HEX_DOC = {
  '§3.2': [
    '#FFFFFF',
    '#FFF7FA',
    '#FFEEF4',
    '#F9D5E3',
    '#F7B7D0',
    '#F286B0',
    '#E0518A',
    '#C93A77',
    '#A82560',
    '#2B1620',
    '#6E4B5C',
    '#8C6A7A',
  ],
  '§3.3': [
    '#150A10',
    '#1C0E16',
    '#251320',
    '#3B2030',
    '#F06CA3',
    '#F58FB8',
    '#FFB3D1',
    '#FDF0F5',
    '#D8B4C4',
    '#A98496',
  ],
  '§3.4': ['#FFDCE9', '#4A1A33', '#2A1020', '#2A1422', '#2A0A1A'],
} as const;

/** Converte um hex em `rgba(r,g,b,` para achar cores do doc escritas como rgba com alfa. */
function comoRgb(hex: string): string {
  const n = (i: number): number => parseInt(hex.slice(i, i + 2), 16);
  return `rgba(${n(1)},${n(3)},${n(5)},`;
}

function arquivosCss(dir: string): string[] {
  return readdirSync(dir, { recursive: true, encoding: 'utf8' })
    .filter((f) => f.endsWith('.css'))
    .map((f) => join(dir, f));
}

const TODOS_CSS = arquivosCss(SRC).map((caminho) => ({
  caminho: relative(RAIZ, caminho).replaceAll('\\', '/'),
  css: semComentarios(readFileSync(caminho, 'utf8')),
}));

describe('colors.css: estrutura', () => {
  it('os blocos claro e escuro têm o mesmo conjunto de tokens (paridade 100%)', () => {
    const a = [...claro.keys()].sort();
    const b = [...escuro.keys()].sort();
    expect(a.length).toBeGreaterThan(0);
    expect(b).toEqual(a);
  });

  it('cada token da tabela §4.1 existe nos dois temas com o valor da tabela', () => {
    for (const [token, [vClaro, vEscuro]] of Object.entries(ESPERADO)) {
      expect({ token, valor: claro.get(token) }).toEqual({ token, valor: normalizar(vClaro) });
      expect({ token, valor: escuro.get(token) }).toEqual({ token, valor: normalizar(vEscuro) });
    }
    // Nada além da tabela.
    expect([...claro.keys()].sort()).toEqual(Object.keys(ESPERADO).sort());
  });

  it('declara color-scheme light no bloco claro e dark no escuro', () => {
    const css = semComentarios(cssCores);
    expect(css).toMatch(/:root,\s*\[data-theme=['"]light['"]\]\s*\{[^}]*color-scheme:\s*light;/);
    expect(css).toMatch(/\[data-theme=['"]dark['"]\]\s*\{[^}]*color-scheme:\s*dark;/);
  });

  it('global.css importa colors.css depois das fontes e antes do base.css', () => {
    const global = semComentarios(readFileSync(resolve(SRC, 'styles/global.css'), 'utf8'));
    const imports = [...global.matchAll(/@import\s+['"]([^'"]+)['"]/g)].map((m) => m[1]);
    expect(imports).toContain('./tokens/colors.css');
    const iCores = imports.indexOf('./tokens/colors.css');
    expect(iCores).toBeGreaterThan(imports.indexOf('./fonts.css'));
    expect(iCores).toBeLessThan(imports.indexOf('./base.css'));
  });
});

describe('colors.css: decisões fixadas', () => {
  it('--color-secondary-border claro = #F286B0 (DV-1)', () => {
    expect(claro.get('--color-secondary-border')).toBe('#f286b0');
  });
  it('--color-bg-tint escuro = #1C0E16 (DV-10)', () => {
    expect(escuro.get('--color-bg-tint')).toBe('#1c0e16');
  });
  it('--color-chip-bg = #FFF7FA / #1C0E16 (D17)', () => {
    expect(claro.get('--color-chip-bg')).toBe('#fff7fa');
    expect(escuro.get('--color-chip-bg')).toBe('#1c0e16');
  });
  it('--color-eyebrow-on-tint claro = #A82560 (D13, DV-16)', () => {
    expect(claro.get('--color-eyebrow-on-tint')).toBe('#a82560');
  });
});

describe('paleta do doc de design', () => {
  const valores = [...claro.values(), ...escuro.values()].join(' ');

  for (const [secao, lista] of Object.entries(HEX_DOC)) {
    it(`os ${lista.length} hex do ${secao} aparecem em colors.css (hex ou rgba)`, () => {
      const faltando = lista.filter(
        (hex) => !valores.includes(hex.toLowerCase()) && !valores.includes(comoRgb(hex)),
      );
      expect(faltando).toEqual([]);
    });
  }

  it('são 27 hex no total (12 + 10 + 5)', () => {
    expect(Object.values(HEX_DOC).flat()).toHaveLength(27);
  });

  it('nenhuma cor com matiz 190°–300° (azul/roxo) em src/**/*.css', () => {
    expect(TODOS_CSS.length).toBeGreaterThan(0);
    const proibidas: string[] = [];
    for (const { caminho, css } of TODOS_CSS) {
      const cores = [
        ...(css.match(/#[0-9a-f]{8}\b|#[0-9a-f]{6}\b|#[0-9a-f]{3}\b/gi) ?? []),
        ...(css.match(/rgba?\([^)]*\)/gi) ?? []),
      ];
      for (const cor of cores) {
        const { hue, saturation } = hueSaturation(cor);
        if (saturation > 0 && hue >= 190 && hue <= 300) proibidas.push(`${caminho}: ${cor}`);
      }
    }
    expect(proibidas).toEqual([]);
  });
});

describe('prefixos de decoração (D14)', () => {
  it('nenhum token --decor-* em src/**/*.css', () => {
    const achados = TODOS_CSS.filter(({ css }) => /--decor-/.test(css)).map((a) => a.caminho);
    expect(achados).toEqual([]);
  });

  it('fora de colors.css e deco-extra.css, --deco-* só recebe var() (sem cor própria)', () => {
    const donos = ['src/styles/tokens/colors.css', 'src/styles/tokens/deco-extra.css'];
    const achados: string[] = [];
    for (const { caminho, css } of TODOS_CSS) {
      if (donos.includes(caminho)) continue;
      for (const m of css.matchAll(/(--deco-[\w-]+)\s*:\s*([^;]+);/g)) {
        const valor = m[2] as string;
        if (/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/i.test(valor) || !/var\(/.test(valor)) {
          achados.push(`${caminho}: ${m[1]}: ${valor.trim()}`);
        }
      }
    }
    expect(achados).toEqual([]);
  });

  it('deco-extra.css, se existir, só tem aliases var() (sem hex novo)', () => {
    const extra = TODOS_CSS.find((a) => a.caminho === 'src/styles/tokens/deco-extra.css');
    if (!extra) return;
    const invalidos = [...extra.css.matchAll(/(--deco-[\w-]+)\s*:\s*([^;]+);/g)]
      .filter((m) => !/^var\(--[\w-]+\)$/.test((m[2] as string).trim()))
      .map((m) => `${m[1]}: ${(m[2] as string).trim()}`);
    expect(invalidos).toEqual([]);
  });
});
