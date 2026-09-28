// Testes do PulseDot (DS-08; D14). Os valores computados no navegador (caixa 8 × 8, cor
// rgb(224, 81, 138)/rgb(245, 143, 184), anel de 36 px no pico, `animation-name: none` com
// movimento reduzido) são medidos no /__styleguide (diário DS-08). Aqui ficam o DOM, o
// contrato do CSS Module e a unicidade do componente.
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PulseDot } from '@/components/PulseDot';

describe('PulseDot (DOM)', () => {
  it('padrão: um <span> vazio, decorativo, tamanho 8', () => {
    const { container } = render(<PulseDot />);
    expect(container.childNodes).toHaveLength(1);
    const ponto = container.firstElementChild as HTMLElement;
    expect(ponto.tagName).toBe('SPAN');
    expect(ponto).toHaveAttribute('aria-hidden', 'true');
    expect(ponto).toHaveAttribute('data-decor', 'pulse');
    expect(ponto).toHaveAttribute('data-size', '8');
    expect(ponto.className.split(' ')).toEqual(['dot', 'size8']);
    expect(ponto).toBeEmptyDOMElement();
    expect(ponto).not.toHaveAttribute('tabindex');
  });

  it('size={20}: classe size20, aria-hidden e data-decor mantidos, className extra no fim', () => {
    const { container } = render(<PulseDot size={20} className="extra" />);
    const ponto = container.firstElementChild as HTMLElement;
    expect(ponto.className.split(' ')).toEqual(['dot', 'size20', 'extra']);
    expect(ponto).toHaveAttribute('aria-hidden', 'true');
    expect(ponto).toHaveAttribute('data-decor', 'pulse');
    expect(ponto).toHaveAttribute('data-size', '20');
  });

  it('fica fora da árvore de acessibilidade (sem nome, sem papel)', () => {
    const { container } = render(<PulseDot />);
    const ponto = container.firstElementChild as HTMLElement;
    expect(ponto.textContent).toBe('');
    expect(ponto).not.toHaveAttribute('role');
    expect(ponto).not.toHaveAttribute('aria-label');
  });
});

describe('CSS Module (estilo do DS-08, só tokens)', () => {
  const cssBruto = readFileSync(
    resolve(process.cwd(), 'src/components/PulseDot/PulseDot.module.css'),
    'utf8',
  );
  const css = cssBruto.replace(/\/\*[\s\S]*?\*\//g, '');
  const regra = (seletor: string) => {
    const escapado = seletor.replace(/[.*+?^${}()|[\]\\:]/g, '\\$&');
    const m = new RegExp(`(?:^|\\n)\\s*${escapado}\\s*\\{([^}]*)\\}`).exec(css);
    return m?.[1] ?? '';
  };
  const keyframes = /@keyframes\s+pulse-ring\s*\{([\s\S]*?)\n\}/.exec(css)?.[1] ?? '';

  it('núcleo: círculo em --color-accent, sem eventos de ponteiro', () => {
    const dot = regra('.dot');
    expect(dot).toContain('border-radius: 50%;');
    expect(dot).toContain('background-color: var(--color-accent);');
    expect(dot).toContain('pointer-events: none;');
    expect(dot).not.toMatch(/animation/);
  });

  it('tamanhos 8 e 20 px', () => {
    expect(regra('.size8')).toContain('inline-size: 8px;');
    expect(regra('.size8')).toContain('block-size: 8px;');
    expect(regra('.size20')).toContain('inline-size: 20px;');
    expect(regra('.size20')).toContain('block-size: 20px;');
  });

  it('anel: mesma cor, invisível em repouso, pulse-ring com --dur-pulse, --ease-out, infinite', () => {
    const anel = regra('.dot::after');
    expect(anel).toContain('background-color: var(--color-accent);');
    expect(anel).toContain('opacity: 0;');
    expect(anel).toContain('animation: pulse-ring var(--dur-pulse) var(--ease-out) infinite;');
  });

  it('keyframes: scale(1) + opacidade 0,7 (canvas) → scale(1.8) + opacidade 0', () => {
    const de = /from\s*\{([^}]*)\}/.exec(keyframes)?.[1] ?? '';
    const ate = /to\s*\{([^}]*)\}/.exec(keyframes)?.[1] ?? '';
    expect(de).toContain('opacity: 0.7;');
    expect(de).toContain('transform: scale(1);');
    expect(ate).toContain('opacity: 0;');
    expect(ate).toContain('transform: scale(1.8);');
  });

  it('keyframes só animam transform e opacity (§11)', () => {
    const propriedades = [...keyframes.matchAll(/([a-z-]+)\s*:/g)].map((m) => m[1]);
    expect(propriedades.length).toBeGreaterThan(0);
    expect(new Set(propriedades)).toEqual(new Set(['opacity', 'transform']));
  });

  it('prefers-reduced-motion: anel desligado (display none, animation none)', () => {
    const bloco = /@media \(prefers-reduced-motion: reduce\)\s*\{([\s\S]*?)\n\}/.exec(css)?.[1];
    expect(bloco).toBeDefined();
    expect(bloco).toMatch(/\.dot::after\s*\{[^}]*display: none;[^}]*animation: none;/);
  });

  it('nenhum hex nas declarações do CSS Module', () => {
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });
});

describe('Dono único (D14)', () => {
  it('existe um só PulseDot.tsx em src/, o de src/components/PulseDot/', () => {
    const raiz = process.cwd();
    const src = resolve(raiz, 'src');
    const achados = readdirSync(src, { recursive: true, encoding: 'utf8' })
      .filter((f) => /(^|[\\/])PulseDot\.tsx$/.test(f))
      .map((f) => relative(raiz, join(src, f)).replaceAll('\\', '/'));
    expect(achados).toEqual(['src/components/PulseDot/PulseDot.tsx']);
  });
});
