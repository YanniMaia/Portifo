// Helper de contraste WCAG 2.x (DS-01). Reusado pelo Q-15, que repete as medições na página montada.
// Aceita `#rgb`, `#rrggbb`, `#rrggbbaa`, `rgb(r, g, b)` e `rgba(r, g, b, a)`. Cor com alfa é composta
// sobre o fundo antes do cálculo (o fundo precisa ser opaco).

export interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

/** Converte uma cor CSS (hex ou rgb/rgba) em canais 0–255 e alfa 0–1. */
export function parseColor(cor: string): Rgba {
  const s = cor.trim().toLowerCase();
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/.exec(s);
  if (hex?.[1]) {
    let h = hex[1];
    if (h.length === 3) h = [...h].map((c) => c + c).join('');
    const n = (i: number): number => parseInt(h.slice(i, i + 2), 16);
    return { r: n(0), g: n(2), b: n(4), a: h.length === 8 ? n(6) / 255 : 1 };
  }
  const fn = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/.exec(s);
  if (fn) {
    return {
      r: Number(fn[1]),
      g: Number(fn[2]),
      b: Number(fn[3]),
      a: fn[4] === undefined ? 1 : Number(fn[4]),
    };
  }
  throw new Error(`Cor não reconhecida: ${cor}`);
}

/** Compõe `frente` (com alfa) sobre `fundo` opaco. */
export function composite(frente: string, fundo: string): Rgba {
  const f = parseColor(frente);
  const b = parseColor(fundo);
  if (b.a !== 1) throw new Error(`O fundo precisa ser opaco: ${fundo}`);
  const mix = (x: number, y: number): number => x * f.a + y * (1 - f.a);
  return { r: mix(f.r, b.r), g: mix(f.g, b.g), b: mix(f.b, b.b), a: 1 };
}

function canal(v: number): number {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** Luminância relativa (WCAG 2.x) de uma cor opaca. */
export function relativeLuminance(cor: string | Rgba): number {
  const { r, g, b } = typeof cor === 'string' ? parseColor(cor) : cor;
  return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
}

/**
 * Razão de contraste entre texto e fundo (1 a 21). Se o texto tiver alfa, ele é composto sobre o
 * fundo primeiro.
 */
export function contrastRatio(texto: string, fundo: string): number {
  const t = composite(texto, fundo);
  const l1 = relativeLuminance(t);
  const l2 = relativeLuminance(fundo);
  const [claro, escuro] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (claro + 0.05) / (escuro + 0.05);
}

/** Matiz HSL (0–360) e saturação (0–1) de uma cor; saturação 0 = cinza (sem matiz). */
export function hueSaturation(cor: string): { hue: number; saturation: number } {
  const { r, g, b } = parseColor(cor);
  const [rn, gn, bn] = [r / 255, g / 255, b / 255];
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  if (d === 0) return { hue: 0, saturation: 0 };
  const l = (max + min) / 2;
  const saturation = d / (1 - Math.abs(2 * l - 1));
  let hue: number;
  if (max === rn) hue = 60 * (((gn - bn) / d) % 6);
  else if (max === gn) hue = 60 * ((bn - rn) / d + 2);
  else hue = 60 * ((rn - gn) / d + 4);
  if (hue < 0) hue += 360;
  return { hue, saturation };
}
