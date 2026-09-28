// Mini gráficos ilustrativos (A-17; doc de design §8 "Gráficos"; doc 04 §5 e §7). Confere:
// - nenhum <text>, número ou eixo nos SVGs (ilustração, não dado real);
// - decorativos (aria-hidden, focusable=false, data-decor="chart") e aninháveis (x, y, w, h);
// - cores só pelos tokens `--deco-chart-1/2` (nenhum hex, nenhum fill/stroke fixo no SVG);
// - animação opcional só com transform scaleY, uma vez, 600 ms (`--dur-enter`), ease-out, e
//   desligada com movimento reduzido (media query e atributo do MotionProvider).
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BARRAS, MiniBarChart, MiniLineChart } from '@/components/decor/MiniCharts';

const CSS = readFileSync(
  resolve(process.cwd(), 'src/components/decor/MiniCharts/MiniCharts.module.css'),
  'utf8',
).replace(/\/\*[\s\S]*?\*\//g, '');

const GRAFICOS = [
  ['MiniBarChart', () => render(<MiniBarChart />)],
  ['MiniBarChart animado', () => render(<MiniBarChart animar />)],
  ['MiniLineChart', () => render(<MiniLineChart />)],
] as const;

describe.each(GRAFICOS)('%s', (_nome, montar) => {
  it('nenhum <text>, número, título ou eixo', () => {
    const { container } = montar();
    const svg = container.querySelector('svg') as SVGSVGElement;
    expect(svg.querySelector('text, tspan, title, desc, foreignObject')).toBeNull();
    // Eixo seria uma <line> (ou traço) de ponta a ponta; os gráficos não usam <line>.
    expect(svg.querySelector('line')).toBeNull();
    expect(svg.textContent).toBe('');
    expect(container.textContent ?? '').not.toMatch(/\d/);
  });

  it('decorativo: aria-hidden, focusable=false, data-decor="chart", escala pelo viewBox', () => {
    const { container } = montar();
    const svg = container.querySelector('svg') as SVGSVGElement;
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('focusable', 'false');
    expect(svg).toHaveAttribute('data-decor', 'chart');
    expect(svg).toHaveAttribute('viewBox', '0 0 120 80');
    expect(svg).not.toHaveAttribute('role');
    expect(svg).not.toHaveAttribute('tabindex');
  });

  it('nenhuma cor fixa no SVG: fill/stroke vêm só das classes com tokens', () => {
    const { container } = montar();
    for (const el of container.querySelectorAll('svg *')) {
      expect(el.getAttribute('fill')).toBeNull();
      expect(el.getAttribute('stroke')).toBeNull();
    }
  });
});

describe('MiniBarChart', () => {
  it('5 barras de cantos arredondados, alturas fixas, a 4ª em destaque', () => {
    const { container } = render(<MiniBarChart />);
    const barras = [...container.querySelectorAll('rect')];
    expect(barras).toHaveLength(BARRAS.length);
    expect(barras.map((b) => b.getAttribute('class'))).toEqual([
      'barra',
      'barra',
      'barra',
      'barraDestaque',
      'barra',
    ]);
    for (const [i, b] of barras.entries()) {
      expect(b).toHaveAttribute('rx', '3');
      expect(Number(b.getAttribute('y')) + Number(b.getAttribute('height'))).toBe(80);
      expect(b.style.getPropertyValue('--bar-delay')).toBe(`${i * 60}ms`);
    }
  });

  it('animar é opcional: sem a prop, nenhuma classe de animação', () => {
    const sem = render(<MiniBarChart />).container.querySelector('svg');
    expect(sem?.getAttribute('class')).toBe('grafico');
    const com = render(<MiniBarChart animar className="extra" />).container.querySelector('svg');
    expect(com?.getAttribute('class')).toBe('grafico animado extra');
  });

  it('aninhável: x, y, width e height repassados ao <svg>', () => {
    const { container } = render(<MiniBarChart x={10} y={20} width={120} height={80} />);
    const svg = container.querySelector('svg') as SVGSVGElement;
    expect(svg).toHaveAttribute('x', '10');
    expect(svg).toHaveAttribute('y', '20');
    expect(svg).toHaveAttribute('width', '120');
    expect(svg).toHaveAttribute('height', '80');
  });
});

describe('MiniLineChart', () => {
  it('área, linha e um ponto no fim', () => {
    const { container } = render(<MiniLineChart />);
    const [area, linha] = [...container.querySelectorAll('path')];
    expect(area).toHaveAttribute('class', 'area');
    expect(linha).toHaveAttribute('class', 'linha');
    expect(linha?.getAttribute('d')).toMatch(/^M4 62 L26 50/);
    expect(area?.getAttribute('d')).toMatch(/Z$/);
    expect(container.querySelectorAll('circle')).toHaveLength(1);
  });
});

describe('MiniCharts (CSS Module)', () => {
  const keyframes = /@keyframes\s+crescer-barra\s*\{([\s\S]*?)\n\}/.exec(CSS)?.[1] ?? '';

  it('cores só pelos tokens --deco-chart-1/2; nenhum hex', () => {
    expect(CSS).toMatch(/\.barra\s*\{\s*fill: var\(--deco-chart-1\);/);
    expect(CSS).toMatch(/\.barraDestaque\s*\{\s*fill: var\(--deco-chart-2\);/);
    expect(CSS).toMatch(/\.linha\s*\{[^}]*stroke: var\(--deco-chart-2\);/);
    expect(CSS).toMatch(/\.area\s*\{[^}]*fill: var\(--deco-chart-1\);/);
    const cores = [...CSS.matchAll(/(?:fill|stroke):\s*([^;]+);/g)].map((m) => m[1]?.trim());
    for (const c of cores)
      expect(['var(--deco-chart-1)', 'var(--deco-chart-2)', 'none']).toContain(c);
    expect(CSS).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });

  it('animação opcional: só transform scaleY 0 → 1, uma vez, --dur-enter e --ease-out, da base', () => {
    const props = new Set([...keyframes.matchAll(/([a-z-]+)\s*:/g)].map((m) => m[1]));
    expect(props).toEqual(new Set(['transform']));
    expect(keyframes).toMatch(/from\s*\{\s*transform: scaleY\(0\);/);
    expect(keyframes).toMatch(/to\s*\{\s*transform: scaleY\(1\);/);
    expect(CSS).toContain(
      'animation: crescer-barra var(--dur-enter) var(--ease-out) var(--bar-delay, 0ms) 1 both;',
    );
    expect(CSS).toContain('transform-box: fill-box;');
    expect(CSS).toContain('transform-origin: center bottom;');
    // A animação só existe sob .animado (opt-in).
    expect(CSS).not.toMatch(/(?:^|\n)\.barra\s*\{[^}]*animation/);
  });

  it('movimento reduzido: sem animação (media query e html[data-reduced-motion])', () => {
    expect(CSS).toMatch(
      /@media \(prefers-reduced-motion: reduce\)\s*\{\s*\.animado \.barra,\s*\.animado \.barraDestaque\s*\{\s*animation: none;/,
    );
    expect(CSS).toMatch(
      /html\[data-reduced-motion='true'\] \.animado \.barra,\s*html\[data-reduced-motion='true'\] \.animado \.barraDestaque\s*\{\s*animation: none;/,
    );
  });
});
