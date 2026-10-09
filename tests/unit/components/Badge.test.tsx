// Testes do Badge (DS-13). Alturas, cores e fontes computadas nos 2 temas são medidas no
// /__styleguide (diário DS-13). Aqui ficam o DOM, o contrato do CSS e os contrastes do texto.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Badge } from '@/components/Badge';
import { composite, contrastRatio } from '../support/contrast';

const ler = (arquivo: string) =>
  readFileSync(resolve(process.cwd(), arquivo), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

const el = (ui: ReactElement) => render(ui).container.firstElementChild as HTMLElement;

describe('Badge (DOM)', () => {
  it('padrão: <span> filled sm, texto do children, sem ponto', () => {
    const b = el(<Badge>Rótulo</Badge>);
    expect(b.tagName).toBe('SPAN');
    expect(b.className).toBe('badge');
    expect(b).toHaveAttribute('data-variant', 'filled');
    expect(b).toHaveAttribute('data-size', 'sm');
    expect(b.textContent).toBe('Rótulo');
    expect(b.querySelector('[data-decor="pulse"]')).toBeNull();
  });

  it('dashed, lg, mono e className na ordem', () => {
    const b = el(
      <Badge variant="dashed" size="lg" mono className="x">
        a
      </Badge>,
    );
    expect(b.className.split(' ')).toEqual(['badge', 'dashed', 'lg', 'mono', 'x']);
  });

  it('dot: PulseDot de 8 px à esquerda, aria-hidden; o texto continua acessível', () => {
    const b = el(<Badge dot>Formação</Badge>);
    const ponto = b.firstElementChild as HTMLElement;
    expect(ponto).toHaveAttribute('data-decor', 'pulse');
    expect(ponto).toHaveAttribute('data-size', '8');
    expect(ponto).toHaveAttribute('aria-hidden', 'true');
    expect(b.textContent).toBe('Formação');
  });

  it('não é interativo: sem tabindex nem papel', () => {
    const b = el(<Badge>a</Badge>);
    expect(b).not.toHaveAttribute('tabindex');
    expect(b).not.toHaveAttribute('role');
  });

  it('nenhum texto fixo no componente (D5)', () => {
    const tsx = ler('src/components/Badge/Badge.tsx').replace(/\/\/.*$/gm, '');
    expect(tsx).not.toMatch(/>\s*[A-Za-zÀ-ÿ0-9][^<{]*</);
  });
});

describe('CSS (DS-13, só tokens de cor)', () => {
  const css = ler('src/components/Badge/Badge.module.css');
  const regra = (sel: string) =>
    new RegExp(`(?:^|\\n)${sel.replace(/[.]/g, '\\$&')}\\s*\\{([^}]*)\\}`).exec(css)?.[1] ?? '';

  it('sm filled: 26 px, padding 0 12 px, pílula, 12 px/600, fill-soft, pink-on-tint, sem borda', () => {
    const r = regra('.badge');
    expect(r).toContain('height: 26px;');
    expect(r).toContain('padding: 0 12px;');
    expect(r).toContain('gap: 6px;');
    expect(r).toContain('border: 0;');
    expect(r).toContain('border-radius: var(--radius-pill);');
    expect(r).toContain('background-color: var(--color-fill-soft);');
    expect(r).toContain('color: var(--color-text-pink-on-tint);');
    expect(r).toContain('font-size: var(--fs-badge);');
    expect(r).toContain('font-weight: var(--fw-badge);');
    expect(r).toContain('box-sizing: border-box;');
  });

  it('dashed: transparente, 1 px tracejado --color-deco', () => {
    const r = regra('.dashed');
    expect(r).toContain('border: var(--border-width) dashed var(--color-deco);');
    expect(r).toContain('background-color: transparent;');
  });

  it('lg: 36 px, padding 0 16 px, borda 1 px --color-border, 13 px, gap 10 px', () => {
    const r = regra('.lg');
    expect(r).toContain('height: 36px;');
    expect(r).toContain('padding: 0 var(--space-4);');
    expect(r).toContain('gap: 10px;');
    expect(r).toContain('border: var(--border-width) solid var(--color-border);');
    expect(r).toContain('font-size: var(--fs-pill-hero);');
  });

  it('mono: JetBrains Mono em 500 (peso carregado, D4)', () => {
    const r = regra('.mono');
    expect(r).toContain('font-family: var(--font-mono);');
    expect(r).toContain('font-weight: var(--fw-pill-hero);');
  });

  it('sem animação, transição nem hex', () => {
    expect(css).not.toMatch(/transition|animation/);
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });
});

describe('Contraste do texto ≥ 4,5:1 (12 px) em todas as variantes, nos 2 temas', () => {
  const rgb = (c: { r: number; g: number; b: number }) =>
    `rgb(${Math.round(c.r)}, ${Math.round(c.g)}, ${Math.round(c.b)})`;
  const PREENCHIDO_ESCURO = 'rgba(245, 143, 184, 0.12)';

  it.each([
    ['filled claro #A82560 / #FFEEF4', '#A82560', '#FFEEF4'],
    ['dashed claro #A82560 / #FFFFFF', '#A82560', '#FFFFFF'],
    ['dashed claro #A82560 / #FFF7FA', '#A82560', '#FFF7FA'],
    ['dashed claro #A82560 / #FFEEF4', '#A82560', '#FFEEF4'],
    ['dashed escuro #FFB3D1 / #150A10', '#FFB3D1', '#150A10'],
    ['dashed escuro #FFB3D1 / #1C0E16', '#FFB3D1', '#1C0E16'],
    ['dashed escuro #FFB3D1 / #251320', '#FFB3D1', '#251320'],
    ['filled escuro sobre #150A10', '#FFB3D1', rgb(composite(PREENCHIDO_ESCURO, '#150A10'))],
    ['filled escuro sobre #1C0E16', '#FFB3D1', rgb(composite(PREENCHIDO_ESCURO, '#1C0E16'))],
    ['filled escuro sobre #251320', '#FFB3D1', rgb(composite(PREENCHIDO_ESCURO, '#251320'))],
  ])('%s', (_nome, texto, fundo) => {
    const razao = contrastRatio(texto, fundo);
    console.info(`[DS-13] ${_nome} = ${razao.toFixed(2)}:1`);
    expect(razao).toBeGreaterThanOrEqual(4.5);
  });
});
