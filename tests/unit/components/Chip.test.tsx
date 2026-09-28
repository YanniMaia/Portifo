// Testes do Chip e da ChipList (DS-12). Alturas, cores, hover e distâncias computadas no navegador
// são medidas no /__styleguide (diário DS-12). Aqui ficam o DOM, o Tab e o contrato do CSS Module.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Chip, ChipList } from '@/components/Chip';

const ler = (arquivo: string) =>
  readFileSync(resolve(process.cwd(), arquivo), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

describe('Chip (DOM)', () => {
  it('fora de ChipList: <span class="chip"> tamanho default', () => {
    const { container } = render(<Chip>Python</Chip>);
    const el = container.firstElementChild as HTMLElement;
    expect(el.tagName).toBe('SPAN');
    expect(el.className).toBe('chip');
    expect(el).toHaveAttribute('data-size', 'default');
    expect(el).not.toHaveAttribute('data-state');
  });

  it('dentro de ChipList: <ul role="list"> com <li>', () => {
    render(
      <ChipList aria-label="Linguagens">
        <Chip mono>Python</Chip>
        <Chip size="sm">SQL</Chip>
      </ChipList>,
    );
    const lista = screen.getByRole('list', { name: 'Linguagens' });
    expect(lista.tagName).toBe('UL');
    expect(lista.className).toBe('list');
    const itens = screen.getAllByRole('listitem');
    expect(itens).toHaveLength(2);
    expect(itens[0]?.className.split(' ')).toEqual(['chip', 'mono']);
    expect(itens[1]?.className.split(' ')).toEqual(['chip', 'sm']);
  });

  it('ChipList gap="sm" e data-state="hover" no chip', () => {
    const { container } = render(
      <ChipList gap="sm">
        <Chip data-state="hover">Git</Chip>
      </ChipList>,
    );
    expect(container.querySelector('ul')?.className.split(' ')).toEqual(['list', 'listSm']);
    expect(container.querySelector('li')).toHaveAttribute('data-state', 'hover');
  });

  it('não entra na ordem de Tab', async () => {
    render(
      <>
        <button type="button">antes</button>
        <ChipList>
          <Chip>Python</Chip>
          <Chip>SQL</Chip>
        </ChipList>
        <button type="button">depois</button>
      </>,
    );
    const user = userEvent.setup();
    await user.tab();
    expect(screen.getByText('antes')).toHaveFocus();
    await user.tab();
    expect(screen.getByText('depois')).toHaveFocus();
    for (const li of screen.getAllByRole('listitem')) {
      expect(li).not.toHaveAttribute('tabindex');
    }
  });
});

describe('CSS (DS-12, só tokens)', () => {
  const css = ler('src/components/Chip/Chip.module.css');
  const regra = (sel: string) =>
    new RegExp(`(?:^|\\n)${sel.replace(/[.[\]'=]/g, '\\$&')}\\s*\\{([^}]*)\\}`).exec(css)?.[1] ??
    '';

  it('default: 40 px, padding 0 16 px, pílula, chip-bg, borda 1 px, 15 px/500', () => {
    const r = regra('.chip');
    expect(r).toContain('height: 40px;');
    expect(r).toContain('padding: 0 16px;');
    expect(r).toContain('border-radius: var(--radius-pill);');
    expect(r).toContain('background-color: var(--color-chip-bg);');
    expect(r).toContain('border: var(--border-width) solid var(--color-border);');
    expect(r).toContain('color: var(--color-text);');
    expect(r).toContain('font-size: var(--fs-chip-lg);');
    expect(r).toContain('font-weight: var(--fw-chip-lg);');
  });

  it('transição de 200 ms só em cor, borda e transform (sem box-shadow)', () => {
    const r = regra('.chip');
    expect(r).toMatch(/background-color var\(--dur-fast\) var\(--ease-out\)/);
    expect(r).toMatch(/border-color var\(--dur-fast\)/);
    expect(r).toMatch(/transform var\(--dur-fast\)/);
    expect(css).not.toMatch(/box-shadow/);
  });

  it('sm: 32 px, padding 0 12 px, 13 px; mono: --font-mono', () => {
    const r = regra('.sm');
    expect(r).toContain('height: 32px;');
    expect(r).toContain('padding: 0 12px;');
    expect(r).toContain('font-size: var(--fs-chip-sm);');
    expect(regra('.mono')).toContain('font-family: var(--font-mono);');
  });

  it('hover por @media (hover: hover) e por [data-state=hover], com o mesmo visual', () => {
    const esperado = [
      'border-color: var(--color-border-hover);',
      'background-color: var(--color-chip-bg-hover);',
      'transform: translateY(var(--lift-chip));',
    ];
    const forcado = regra(".chip[data-state='hover']");
    const media = /@media \(hover: hover\)\s*\{\s*\.chip:hover\s*\{([^}]*)\}/.exec(css)?.[1] ?? '';
    for (const d of esperado) {
      expect(forcado).toContain(d);
      expect(media).toContain(d);
    }
  });

  it('lista: flex, wrap, gap 12 px (--space-3) e 8 px no sm; sem marcadores', () => {
    const r = regra('.list');
    expect(r).toContain('display: flex;');
    expect(r).toContain('flex-wrap: wrap;');
    expect(r).toContain('gap: var(--space-3);');
    expect(r).toContain('list-style: none;');
    expect(regra('.listSm')).toContain('gap: var(--space-2);');
  });

  it('nenhum hex', () => {
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });
});
