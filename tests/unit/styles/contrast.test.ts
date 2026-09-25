// Contrastes WCAG dos pares da DS-01 (doc 02, critérios da DS-01; doc de design §3.5 e §11).
// Os pares usam os fundos reais onde o texto aparece (RS-3): #FFEEF4, #1C0E16 e os dois extremos
// dos degradês primários. O Q-15 repete as medições na página montada.
import { describe, expect, it } from 'vitest';
import { contrastRatio, hueSaturation, parseColor, relativeLuminance } from '../support/contrast';

interface Par {
  texto: string;
  fundo: string;
  minimo: number;
  uso: string;
}

const PARES: Par[] = [
  // ---------- Claro ----------
  { texto: '#2B1620', fundo: '#FFFFFF', minimo: 7, uso: 'texto principal sobre branco' },
  { texto: '#2B1620', fundo: '#FFF7FA', minimo: 7, uso: 'texto principal sobre rosa névoa' },
  { texto: '#6E4B5C', fundo: '#FFFFFF', minimo: 7, uso: 'texto secundário (§3.2 "cerca de 7:1")' },
  { texto: '#8C6A7A', fundo: '#FFFFFF', minimo: 4.5, uso: 'dica e legendas, ≥ 14 px (D13, DV-17)' },
  { texto: '#C93A77', fundo: '#FFFFFF', minimo: 4.5, uso: 'link e texto rosa pequeno (doc: 4,8)' },
  { texto: '#C93A77', fundo: '#FFF7FA', minimo: 4.5, uso: 'eyebrow padrão sobre rosa névoa' },
  { texto: '#A82560', fundo: '#FFEEF4', minimo: 4.5, uso: 'eyebrow tint e selos (D13)' },
  { texto: '#A82560', fundo: '#FFFFFF', minimo: 4.5, uso: 'selo "Em estudo" sobre card (DV-4)' },
  { texto: '#FFFFFF', fundo: '#C93A77', minimo: 4.5, uso: 'botão primário, início do degradê' },
  { texto: '#FFFFFF', fundo: '#A82560', minimo: 4.5, uso: 'botão primário e 1ª etapa, fim (D13)' },
  { texto: '#E0518A', fundo: '#FFFFFF', minimo: 3, uso: 'contorno de foco (§11, não texto)' },
  // ---------- Escuro ----------
  { texto: '#FDF0F5', fundo: '#150A10', minimo: 7, uso: 'texto principal sobre ameixa noite' },
  { texto: '#D8B4C4', fundo: '#251320', minimo: 4.5, uso: 'texto secundário sobre card' },
  { texto: '#A98496', fundo: '#251320', minimo: 4.5, uso: 'legendas sobre card' },
  { texto: '#A98496', fundo: '#150A10', minimo: 4.5, uso: 'dica "Clique no YE" no escuro' },
  { texto: '#FFB3D1', fundo: '#150A10', minimo: 4.5, uso: 'links e eyebrow no escuro' },
  { texto: '#FFB3D1', fundo: '#1C0E16', minimo: 4.5, uso: 'eyebrow tint sobre a Frase (DV-10)' },
  { texto: '#2A0A1A', fundo: '#F58FB8', minimo: 4.5, uso: 'botão primário escuro, início' },
  { texto: '#2A0A1A', fundo: '#F06CA3', minimo: 4.5, uso: 'botão primário escuro, fim do degradê' },
  { texto: '#F58FB8', fundo: '#150A10', minimo: 3, uso: 'contorno de foco escuro (§11)' },
];

const fmt = (n: number): string => n.toFixed(2).replace('.', ',');

describe('helper de contraste', () => {
  it('preto × branco = 21:1 e branco × branco = 1:1', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
    expect(contrastRatio('#FFFFFF', '#FFFFFF')).toBeCloseTo(1, 5);
  });

  it('é simétrico e aceita #rgb, rgb() e rgba()', () => {
    expect(contrastRatio('#C93A77', '#FFFFFF')).toBeCloseTo(contrastRatio('#FFFFFF', '#C93A77'));
    expect(parseColor('#fff')).toEqual({ r: 255, g: 255, b: 255, a: 1 });
    expect(parseColor('rgb(21, 10, 16)')).toEqual({ r: 21, g: 10, b: 16, a: 1 });
    expect(parseColor('rgba(245, 143, 184, 0.6)').a).toBeCloseTo(0.6);
    expect(relativeLuminance('#FFFFFF')).toBeCloseTo(1);
  });

  it('compõe texto com alfa sobre o fundo (alfa 0 = contraste 1)', () => {
    expect(contrastRatio('rgba(0, 0, 0, 0)', '#FFFFFF')).toBeCloseTo(1);
  });

  it('calcula matiz: rosa ~330°, azul 240°, cinza sem saturação', () => {
    expect(hueSaturation('#C93A77').hue).toBeGreaterThan(300);
    expect(hueSaturation('#0000FF').hue).toBeCloseTo(240);
    expect(hueSaturation('#808080').saturation).toBe(0);
  });
});

describe('contrastes da DS-01', () => {
  it.each(PARES)('$texto sobre $fundo ≥ $minimo:1 ($uso)', ({ texto, fundo, minimo }) => {
    const razao = contrastRatio(texto, fundo);
    console.info(`[DS-01] ${texto}/${fundo} = ${fmt(razao)}:1 (mín. ${fmt(minimo)})`);
    expect(razao).toBeGreaterThanOrEqual(minimo);
  });

  it('par registrado, não reprovado (DV-1, D13): borda #F286B0 sobre branco ≈ 2,4:1', () => {
    const razao = contrastRatio('#F286B0', '#FFFFFF');
    console.info(`[DS-01] #F286B0/#FFFFFF = ${fmt(razao)}:1 (registrado; DV-1, D13)`);
    expect(razao).toBeCloseTo(2.4, 1);
  });

  it('#C93A77 sobre #FFEEF4 reprova (≈ 4,3:1; o plano cita 4,39): por isso existe --color-eyebrow-on-tint (D13)', () => {
    const razao = contrastRatio('#C93A77', '#FFEEF4');
    console.info(`[DS-01] #C93A77/#FFEEF4 = ${fmt(razao)}:1 (reprova; D13)`);
    expect(razao).toBeLessThan(4.5);
  });
});
