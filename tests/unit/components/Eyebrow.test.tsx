// Testes do Eyebrow (DS-09). Os valores computados no navegador (13/13/12 px, peso 700,
// letter-spacing 1,56 px e as cores nos 2 temas) são medidos no /__styleguide (diário DS-09).
// Aqui ficam o DOM, o contrato do CSS Module, os tokens de origem e os contrastes.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Eyebrow } from '@/components/Eyebrow';
import { contrastRatio } from '../support/contrast';

const ler = (arquivo: string) =>
  readFileSync(resolve(process.cwd(), arquivo), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

describe('Eyebrow (DOM)', () => {
  it('padrão: <p> com .t-eyebrow, tom default e o texto em caixa normal', () => {
    const { container } = render(<Eyebrow>O que me move</Eyebrow>);
    const el = container.firstElementChild as HTMLElement;
    expect(el.tagName).toBe('P');
    expect(el.className.split(' ')).toEqual(['t-eyebrow', 'eyebrow']);
    expect(el).toHaveAttribute('data-tone', 'default');
    expect(el.textContent).toBe('O que me move');
  });

  it('tone="tint": acrescenta a classe tint', () => {
    const { container } = render(<Eyebrow tone="tint">Contato</Eyebrow>);
    const el = container.firstElementChild as HTMLElement;
    expect(el.className.split(' ')).toEqual(['t-eyebrow', 'eyebrow', 'tint']);
    expect(el).toHaveAttribute('data-tone', 'tint');
  });

  it('as="span" e className extra no fim', () => {
    const { container } = render(
      <Eyebrow as="span" className="extra">
        Sobre
      </Eyebrow>,
    );
    const el = container.firstElementChild as HTMLElement;
    expect(el.tagName).toBe('SPAN');
    expect(el.className.split(' ').at(-1)).toBe('extra');
  });

  it('não é interativo (sem tabindex nem papel)', () => {
    const { container } = render(<Eyebrow>x</Eyebrow>);
    const el = container.firstElementChild as HTMLElement;
    expect(el).not.toHaveAttribute('tabindex');
    expect(el).not.toHaveAttribute('role');
  });
});

describe('CSS (DS-09, só tokens)', () => {
  const css = ler('src/components/Eyebrow/Eyebrow.module.css');
  const tipografia = ler('src/styles/typography.css');
  const tokens = ler('src/styles/tokens/typography.css');

  it('default → --color-eyebrow; tint → --color-eyebrow-on-tint (2 classes, não depende da ordem)', () => {
    expect(css).toMatch(/\.eyebrow\.eyebrow\s*\{[^}]*color: var\(--color-eyebrow\);/);
    expect(css).toMatch(/\.eyebrow\.tint\s*\{[^}]*color: var\(--color-eyebrow-on-tint\);/);
  });

  it('sem margem própria e sem hex', () => {
    expect(css).toMatch(/\.eyebrow\s*\{[^}]*margin: 0;/);
    expect(css).not.toMatch(/margin-(top|bottom|block)/);
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });

  it('.t-eyebrow: display, caixa alta, --fs/--fw/--ls-eyebrow', () => {
    const regra = /\.t-eyebrow\s*\{([^}]*)\}/.exec(tipografia)?.[1] ?? '';
    expect(regra).toContain('font-family: var(--font-display);');
    expect(regra).toContain('font-size: var(--fs-eyebrow);');
    expect(regra).toContain('font-weight: var(--fw-eyebrow);');
    expect(regra).toContain('letter-spacing: var(--ls-eyebrow);');
    expect(regra).toContain('text-transform: uppercase;');
  });

  it('tokens: 12 px no celular, 13 px a partir de 640 px, peso 700, +0,12em (13 × 0,12 = 1,56 px)', () => {
    expect(tokens).toMatch(/:root\s*\{[^}]*--fs-eyebrow: 12px;/);
    expect(tokens).toMatch(/min-width: 640px\)\s*\{\s*:root\s*\{[^}]*--fs-eyebrow: 13px;/);
    expect(tokens).toContain('--fw-eyebrow: 700;');
    expect(tokens).toContain('--ls-eyebrow: 0.12em;');
    expect(13 * 0.12).toBeCloseTo(1.56, 5);
  });
});

describe('Contrastes (critério 4 da DS-09)', () => {
  it.each([
    ['#C93A77', '#FFF7FA', 'default claro sobre rosa névoa'],
    ['#C93A77', '#FFFFFF', 'default claro sobre branco'],
    ['#FFB3D1', '#150A10', 'default escuro sobre ameixa noite'],
    ['#FFB3D1', '#1C0E16', 'default/tint escuro sobre ameixa profunda'],
    ['#A82560', '#FFEEF4', 'tint claro sobre rosa clarinho'],
  ])('%s sobre %s ≥ 4,5:1 (%s)', (texto, fundo) => {
    expect(contrastRatio(texto, fundo)).toBeGreaterThanOrEqual(4.5);
  });

  it('#C93A77 sobre #FFEEF4 reprova: por isso o tom tint é obrigatório ali (D13)', () => {
    expect(contrastRatio('#C93A77', '#FFEEF4')).toBeLessThan(4.5);
  });
});
