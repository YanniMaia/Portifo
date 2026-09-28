// Presets de animação (A-01; doc 04 §4.2 R1/R4, §6 A-01 passo 7; doc de design §9). Confere:
// (1) cada preset só anima opacity e transform, e o transform só usa translate/scale/rotate
//     (percorre PRESETS e, por garantia, o texto de animations.ts);
// (2) os valores da tabela §7 do doc 04 (24 px, --dur-enter, --dur-draw, --ease-out, origens);
// (3) a versão reduzida: duração 0, só o estado final, sem atraso;
// (4) a leitura dos tokens do CSS (ms/s e cubic-bezier) sem números copiados, inclusive pelos
//     auxiliares públicos duracaoDoToken/curvaDoToken (V-02 B1);
// (5) a duração sobrescrita em resolverPreset/animarPreset (V-02 B2);
// (6) staggerDelay em ms e sem cascata no reduzido.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  PRESETS,
  PROPRIEDADES_PERMITIDAS,
  animarPreset,
  curvaDoToken,
  curvaParaMotion,
  duracaoDoToken,
  duracaoEmSegundos,
  fade,
  fadeUp,
  lineDrawX,
  lineDrawY,
  resolverPreset,
  staggerDelay,
} from '@/motion/animations';

// O animate() real não roda no jsdom (sem WAAPI); o falso registra os argumentos (V-02 B2).
const animateFalso = vi.hoisted(() => vi.fn(() => ({ fim: true })));
vi.mock('motion', async (original) => ({
  ...(await original<typeof import('motion')>()),
  animate: animateFalso,
}));

const PERMITIDAS = new Set<string>(['opacity', 'transform']);
/** Um valor de transform aceito: só funções translate*, scale* e rotate*, com números e unidades. */
const TRANSFORM_PERMITIDO =
  /^(?:\s*(?:translate(?:X|Y|Z|3d)?|scale(?:X|Y|Z|3d)?|rotate(?:X|Y|Z)?)\([-\d.,\s a-z%]*\)\s*)+$/;

afterEach(() => {
  document.documentElement.removeAttribute('style');
  animateFalso.mockClear();
});

describe('presets: só transform e opacity (R1)', () => {
  it('a lista de permitidas é exatamente opacity e transform', () => {
    expect(new Set(PROPRIEDADES_PERMITIDAS)).toEqual(PERMITIDAS);
  });

  it('existem fadeUp, fade, lineDrawX e lineDrawY', () => {
    expect(Object.keys(PRESETS).sort()).toEqual(['fade', 'fadeUp', 'lineDrawX', 'lineDrawY']);
  });

  for (const [nome, preset] of Object.entries(PRESETS)) {
    it(`${nome}: nenhuma propriedade fora da lista (normal e reduzido)`, () => {
      const chaves = Object.keys(preset.quadros);
      expect(chaves.length).toBeGreaterThan(0);
      expect(chaves.filter((c) => !PERMITIDAS.has(c))).toEqual([]);
      for (const reduzido of [false, true]) {
        const { quadros } = resolverPreset(preset, reduzido);
        expect(Object.keys(quadros).filter((c) => !PERMITIDAS.has(c))).toEqual([]);
      }
    });

    it(`${nome}: transform em string, só translate/scale/rotate (vai para o WAAPI)`, () => {
      for (const valor of preset.quadros.transform ?? []) {
        expect(typeof valor).toBe('string');
        expect(valor).toMatch(TRANSFORM_PERMITIDO);
        expect(valor).not.toMatch(/top|left|right|bottom|width|height|matrix|skew|perspective/);
      }
    });
  }

  it('o filtro de transform recusa o que não é translate/scale/rotate', () => {
    expect('translateY(24px)').toMatch(TRANSFORM_PERMITIDO);
    expect('scaleX(0)').toMatch(TRANSFORM_PERMITIDO);
    expect('skewX(10deg)').not.toMatch(TRANSFORM_PERMITIDO);
    expect('matrix(1, 0, 0, 1, 0, 0)').not.toMatch(TRANSFORM_PERMITIDO);
    expect('none').not.toMatch(TRANSFORM_PERMITIDO);
  });

  it('o texto de animations.ts não cita propriedades de layout, sombra ou filtro', () => {
    const texto = readFileSync(resolve(process.cwd(), 'src/motion/animations.ts'), 'utf8')
      // Só código: comentários explicam as regras e podem citar nomes proibidos.
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '');
    const proibidas =
      /\b(top|left|right|bottom|width|height|margin\w*|padding\w*|boxShadow|filter|backgroundPosition|clipPath|x|y|scale|scaleX|scaleY|rotate)\s*:/;
    expect(texto).not.toMatch(proibidas);
  });
});

describe('presets: valores do doc 04 §7 (via tokens)', () => {
  it('fadeUp: opacity 0→1, translateY 24px→0, --dur-enter, --ease-out', () => {
    expect(fadeUp).toEqual({
      quadros: { opacity: [0, 1], transform: ['translateY(24px)', 'translateY(0px)'] },
      duracao: '--dur-enter',
      curva: '--ease-out',
    });
  });

  it('fade: opacity 0→1, --dur-enter, --ease-out', () => {
    expect(fade).toEqual({
      quadros: { opacity: [0, 1] },
      duracao: '--dur-enter',
      curva: '--ease-out',
    });
  });

  it('lineDrawX: scaleX 0→1 a partir da esquerda; lineDrawY: scaleY 0→1 a partir do topo; --dur-draw', () => {
    expect(lineDrawX).toEqual({
      quadros: { transform: ['scaleX(0)', 'scaleX(1)'] },
      duracao: '--dur-draw',
      curva: '--ease-out',
      origem: 'left center',
    });
    expect(lineDrawY).toEqual({
      quadros: { transform: ['scaleY(0)', 'scaleY(1)'] },
      duracao: '--dur-draw',
      curva: '--ease-out',
      origem: 'center top',
    });
  });

  it('resolverPreset lê a duração e a curva do CSS (600ms, cubic-bezier do DS-02)', () => {
    const html = document.documentElement;
    html.style.setProperty('--dur-enter', '600ms');
    html.style.setProperty('--ease-out', 'cubic-bezier(0.22, 1, 0.36, 1)');
    const { quadros, opcoes } = resolverPreset(fadeUp, false);
    expect(quadros).toEqual({
      opacity: [0, 1],
      transform: ['translateY(24px)', 'translateY(0px)'],
    });
    expect(opcoes).toEqual({ duration: 0.6, ease: [0.22, 1, 0.36, 1] });
  });

  it('sem o token no CSS a duração é 0 (aparece, nunca some) e a curva vira linear', () => {
    const { opcoes } = resolverPreset(lineDrawY, false);
    expect(opcoes.duration).toBe(0);
    expect(opcoes.ease).toBe('linear');
  });

  it('converte ms/s e cubic-bezier', () => {
    expect(duracaoEmSegundos('800ms')).toBe(0.8);
    expect(duracaoEmSegundos('.6s')).toBe(0.6);
    expect(duracaoEmSegundos('2000ms')).toBe(2);
    expect(duracaoEmSegundos('abc')).toBe(0);
    expect(curvaParaMotion('cubic-bezier(0.45, 0, 0.55, 1)')).toEqual([0.45, 0, 0.55, 1]);
    expect(curvaParaMotion('ease')).toBe('linear');
  });
});

describe('auxiliares públicos de token (V-02 B1)', () => {
  it('duracaoDoToken lê o token do <html> em segundos; ausente → 0', () => {
    const html = document.documentElement;
    expect(duracaoDoToken('--dur-burst')).toBe(0);
    html.style.setProperty('--dur-burst', '2000ms');
    html.style.setProperty('--dur-count', '1.2s');
    expect(duracaoDoToken('--dur-burst')).toBe(2);
    expect(duracaoDoToken('--dur-count')).toBe(1.2);
  });

  it('curvaDoToken lê a curva do <html>; ausente → linear', () => {
    expect(curvaDoToken('--ease-in-out')).toBe('linear');
    document.documentElement.style.setProperty('--ease-in-out', 'cubic-bezier(0.45, 0, 0.55, 1)');
    expect(curvaDoToken('--ease-in-out')).toEqual([0.45, 0, 0.55, 1]);
  });
});

describe('duração sobrescrita (V-02 B2)', () => {
  it('resolverPreset usa a duração dada no lugar do token, mantendo curva e atraso', () => {
    const html = document.documentElement;
    html.style.setProperty('--dur-draw', '800ms');
    html.style.setProperty('--ease-out', 'cubic-bezier(0.22, 1, 0.36, 1)');
    const terco = duracaoDoToken('--dur-draw') / 3;
    const { opcoes } = resolverPreset(lineDrawX, false, 0.1, { duracao: terco });
    expect(opcoes.duration).toBeCloseTo(0.8 / 3);
    expect(opcoes.ease).toEqual([0.22, 1, 0.36, 1]);
    expect(opcoes.delay).toBe(0.1);
  });

  it('sem sobrescrita segue o token; valor inválido vira 0; no reduzido é sempre 0', () => {
    document.documentElement.style.setProperty('--dur-draw', '800ms');
    expect(resolverPreset(lineDrawX, false, undefined, {}).opcoes.duration).toBe(0.8);
    expect(resolverPreset(lineDrawX, false, undefined, { duracao: -1 }).opcoes.duration).toBe(0);
    expect(resolverPreset(lineDrawX, false, undefined, { duracao: NaN }).opcoes.duration).toBe(0);
    expect(resolverPreset(lineDrawX, true, 0.2, { duracao: 0.5 }).opcoes).toEqual({
      duration: 0,
      ease: 'linear',
    });
  });

  it('animarPreset aplica a origem e passa quadros e a duração sobrescrita ao animate()', () => {
    document.documentElement.style.setProperty('--ease-out', 'cubic-bezier(0.22, 1, 0.36, 1)');
    const linha = document.createElement('div');
    const retorno = animarPreset(linha, lineDrawY, false, undefined, { duracao: 0.25 });
    expect(retorno).toEqual({ fim: true });
    expect(linha.style.transformOrigin).toBe('center top');
    expect(animateFalso).toHaveBeenCalledWith(
      [linha],
      { transform: ['scaleY(0)', 'scaleY(1)'] },
      { duration: 0.25, ease: [0.22, 1, 0.36, 1] },
    );
  });

  it('animarPreset no reduzido manda só o valor final com duração 0', () => {
    const itens = [document.createElement('p'), document.createElement('p')];
    animarPreset(itens, fadeUp, true, 0.3, { duracao: 1 });
    expect(animateFalso).toHaveBeenCalledWith(
      itens,
      { opacity: 1, transform: 'translateY(0px)' },
      { duration: 0, ease: 'linear' },
    );
  });
});

describe('presets: versão reduzida (R4)', () => {
  for (const [nome, preset] of Object.entries(PRESETS)) {
    it(`${nome}: duração 0, só o valor final e sem atraso`, () => {
      document.documentElement.style.setProperty('--dur-enter', '600ms');
      document.documentElement.style.setProperty('--dur-draw', '800ms');
      const { quadros, opcoes } = resolverPreset(preset, true, 0.2);
      expect(opcoes).toEqual({ duration: 0, ease: 'linear' });
      const finais = Object.fromEntries(
        Object.entries(preset.quadros).map(([prop, par]) => [prop, (par as readonly unknown[])[1]]),
      );
      expect(quadros).toEqual(finais);
    });
  }
});

describe('staggerDelay', () => {
  it('converte ms em segundos por item (chips 40 ms, frase 150 ms, etapas 200 ms)', () => {
    expect(staggerDelay(40)(0, 5)).toBeCloseTo(0);
    expect(staggerDelay(40)(3, 5)).toBeCloseTo(0.12);
    expect(staggerDelay(150)(2, 3)).toBeCloseTo(0.3);
    expect(staggerDelay(200)(3, 4)).toBeCloseTo(0.6);
  });

  it('com movimento reduzido não há cascata', () => {
    expect(staggerDelay(200, true)(3, 4)).toBe(0);
  });
});
