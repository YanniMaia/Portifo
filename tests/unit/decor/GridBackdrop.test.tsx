// Grade de linhas finas (A-12; doc de design §8 "Grade", §10; doc 04 §5). O DOM e o contrato do
// CSS Module ficam aqui. A cor computada nos dois temas e a máscara medida por pixel ficam no
// e2e `tests/e2e/decor-grid.spec.ts`.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { GridBackdrop } from '@/components/decor/GridBackdrop';

const CSS = readFileSync(
  resolve(process.cwd(), 'src/components/decor/GridBackdrop/GridBackdrop.module.css'),
  'utf8',
).replace(/\/\*[\s\S]*?\*\//g, '');

const corpo = (seletor: string): string => {
  const esc = seletor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Corpo com parênteses aninhados, até a chave que fecha a regra.
  return new RegExp(`${esc}\\s*\\{([\\s\\S]*?)\\n\\s*\\}`).exec(CSS)?.[1] ?? '';
};

describe('GridBackdrop (DOM)', () => {
  it('um <div> vazio, aria-hidden="true", data-decor="grid", sem foco nem papel', () => {
    const { container } = render(<GridBackdrop />);
    expect(container.childNodes).toHaveLength(1);
    const grade = container.firstElementChild as HTMLElement;
    expect(grade.tagName).toBe('DIV');
    expect(grade).toHaveAttribute('aria-hidden', 'true');
    expect(grade).toHaveAttribute('data-decor', 'grid');
    expect(grade).toBeEmptyDOMElement();
    expect(grade).not.toHaveAttribute('tabindex');
    expect(grade).not.toHaveAttribute('role');
    expect(grade.className.split(' ')).toEqual(['grid']);
  });

  it('padrão: centro 50% 50% e raio 480 px nas variáveis da máscara', () => {
    const { container } = render(<GridBackdrop />);
    const grade = container.firstElementChild as HTMLElement;
    expect(grade.style.getPropertyValue('--grid-center')).toBe('50% 50%');
    expect(grade.style.getPropertyValue('--grid-radius')).toBe('480px');
  });

  it('props center, radius, bleed e className', () => {
    const { container } = render(
      <GridBackdrop center="70% 40%" radius={360} bleed className="extra" />,
    );
    const grade = container.firstElementChild as HTMLElement;
    expect(grade.style.getPropertyValue('--grid-center')).toBe('70% 40%');
    expect(grade.style.getPropertyValue('--grid-radius')).toBe('360px');
    expect(grade.className.split(' ')).toEqual(['grid', 'bleed', 'extra']);
  });

  it('raio negativo vira 0', () => {
    const { container } = render(<GridBackdrop radius={-10} />);
    const grade = container.firstElementChild as HTMLElement;
    expect(grade.style.getPropertyValue('--grid-radius')).toBe('0px');
  });
});

describe('GridBackdrop (CSS Module)', () => {
  const grid = corpo('.grid');

  it('pointer-events: none, camada absoluta atrás do conteúdo', () => {
    expect(grid).toContain('pointer-events: none;');
    expect(grid).toContain('position: absolute;');
    expect(grid).toContain('inset: 0;');
    expect(grid).toContain('z-index: 0;');
  });

  it('linhas de 1 px em --deco-grid-line a cada 48 px (vertical e horizontal)', () => {
    expect(grid).toContain('linear-gradient(to right, var(--deco-grid-line) 1px, transparent 1px)');
    expect(grid).toContain(
      'linear-gradient(to bottom, var(--deco-grid-line) 1px, transparent 1px)',
    );
    expect(grid).toContain('background-size: 48px 48px;');
  });

  it('máscara radial pelo centro e pelo raio, opaca até 35% e transparente a 85%', () => {
    expect(grid).toMatch(
      /mask-image: radial-gradient\(\s*circle var\(--grid-radius, 480px\) at var\(--grid-center, 50% 50%\),\s*rgb\(0, 0, 0\) 0%,\s*rgb\(0, 0, 0\) 35%,\s*transparent 85%\s*\);/,
    );
  });

  it('bleed só a partir de 1440 px (§10)', () => {
    expect(CSS).toMatch(
      /@media \(min-width: 1440px\)\s*\{\s*\.bleed\s*\{\s*mask-image: radial-gradient\(\s*ellipse farthest-side at 50% 50%,/,
    );
  });

  it('estática: nenhuma animação nem transição; nenhum hex', () => {
    expect(CSS).not.toMatch(/animation|transition|@keyframes/);
    expect(CSS).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });
});
