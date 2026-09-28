// Testes do Card (DS-15). Raio, padding, sombras, hover, filete e :focus-within computados no
// navegador são medidos no /__styleguide (diário DS-15). Aqui ficam o DOM e o contrato do CSS.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Card } from '@/components/Card';

const ler = (arquivo: string) =>
  readFileSync(resolve(process.cwd(), arquivo), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

const el = (ui: ReactElement) => render(ui).container.firstElementChild as HTMLElement;

describe('Card (DOM)', () => {
  it('padrão: <div class="card" data-card="default">, sem data-interactive', () => {
    const c = el(<Card>x</Card>);
    expect(c.tagName).toBe('DIV');
    expect(c.className).toBe('card');
    expect(c).toHaveAttribute('data-card', 'default');
    expect(c).not.toHaveAttribute('data-interactive');
    expect(c).not.toHaveAttribute('onclick');
    expect(c).not.toHaveAttribute('tabindex');
  });

  it('as="article" e as="li"', () => {
    expect(el(<Card as="article" />).tagName).toBe('ARTICLE');
    expect(el(<Card as="li" />).tagName).toBe('LI');
  });

  it('interactive + accentBar + data-state', () => {
    const c = el(<Card interactive accentBar data-state="hover" className="x" />);
    expect(c.className.split(' ')).toEqual(['card', 'interactive', 'accentBar', 'x']);
    expect(c).toHaveAttribute('data-interactive', 'true');
    expect(c).toHaveAttribute('data-state', 'hover');
  });

  it('accentBar sem interactive não cria o filete (ele só aparece no hover)', () => {
    expect(el(<Card accentBar />).className).toBe('card');
  });

  it('panel usa padding de painel por padrão; padding explícito vence', () => {
    expect(el(<Card variant="panel" />).className.split(' ')).toEqual([
      'card',
      'panel',
      'paddingPanel',
    ]);
    expect(el(<Card variant="panel" padding="default" />).className.split(' ')).toEqual([
      'card',
      'panel',
    ]);
    expect(el(<Card padding="compact" />).className.split(' ')).toEqual(['card', 'paddingCompact']);
  });

  it('dashed nunca é interativo nem tem filete', () => {
    const c = el(<Card variant="dashed" interactive accentBar data-state="hover" />);
    expect(c.className.split(' ')).toEqual(['card', 'dashed']);
    expect(c).not.toHaveAttribute('data-interactive');
    expect(c).not.toHaveAttribute('data-state');
  });
});

describe('CSS (DS-15, só tokens)', () => {
  const css = ler('src/components/Card/Card.module.css');
  const regra = (sel: string) =>
    new RegExp(`(?:^|\\n)${sel.replace(/[.[\]'=:()]/g, '\\$&')}\\s*\\{([^}]*)\\}`).exec(css)?.[1] ??
    '';

  it('base: superfície, borda 1 px, raio 24, --card-padding, sombra, relative/isolate, sem overflow', () => {
    const r = regra('.card');
    expect(r).toContain('background-color: var(--color-surface);');
    expect(r).toContain('border: var(--border-width) solid var(--color-border);');
    expect(r).toContain('border-radius: var(--radius-card);');
    expect(r).toContain('padding: var(--card-padding);');
    expect(r).toContain('box-shadow: var(--shadow-card);');
    expect(r).toContain('position: relative;');
    expect(r).toContain('isolation: isolate;');
    expect(css).not.toMatch(/overflow:\s*hidden/);
  });

  it('nenhuma transição de box-shadow ou background (R1)', () => {
    for (const m of css.matchAll(/transition:([^;]*);/g)) {
      expect(m[1]).not.toMatch(/box-shadow|background/);
    }
    expect(css).not.toMatch(/transition-property/);
  });

  it('camada ::before: sombra de hover, opacidade 0, z-index -1, raio herdado', () => {
    const r = regra('.interactive::before');
    expect(r).toContain('box-shadow: var(--shadow-card-hover);');
    expect(r).toContain('opacity: 0;');
    expect(r).toContain('z-index: -1;');
    expect(r).toContain('border-radius: inherit;');
    expect(r).toContain('transition: opacity var(--dur-base) var(--ease-out);');
  });

  it('filete ::after: 3 px, recuo 24 px, --gradient-primary, opacidade 0', () => {
    const r = regra('.accentBar::after');
    expect(r).toContain('height: 3px;');
    expect(r).toContain('left: 24px;');
    expect(r).toContain('right: 24px;');
    expect(r).toContain('border-radius: 3px;');
    expect(r).toContain('background-image: var(--gradient-primary);');
    expect(r).toContain('opacity: 0;');
  });

  it('hover (ponteiro), :focus-within e data-state levantam o card e trocam a borda', () => {
    expect(css).toMatch(
      /\.interactive:focus-within,\s*\.interactive\[data-state='hover'\]\s*\{[^}]*border-color: var\(--color-border-hover\);[^}]*transform: translateY\(var\(--card-lift\)\);/,
    );
    expect(css).toMatch(
      /@media \(hover: hover\)\s*\{\s*\.interactive:hover\s*\{[^}]*transform: translateY\(var\(--card-lift\)\);/,
    );
    expect(regra('.card')).toContain('--card-lift: var(--lift-card);');
    expect(regra('.panel')).toContain('--card-lift: var(--lift-panel);');
  });

  it('panel raio 32; dashed 1,5 px tracejado --color-deco, sem sombra e transparente', () => {
    expect(regra('.panel')).toContain('border-radius: var(--radius-panel);');
    const d = regra('.dashed');
    expect(d).toContain('border: var(--border-width-strong) dashed var(--color-deco);');
    expect(d).toContain('box-shadow: none;');
    expect(d).toContain('background-color: transparent;');
  });

  it('padding compact 28 / panel 40 a partir de 640 px; 24 px no celular', () => {
    expect(css).toMatch(/\.paddingCompact,\s*\.paddingPanel\s*\{[^}]*padding: var\(--space-6\);/);
    expect(css).toMatch(/min-width: 640px\)\s*\{[^@]*\.paddingCompact\s*\{\s*padding: 28px;/);
    expect(css).toMatch(/min-width: 640px\)\s*\{[^@]*\.paddingPanel\s*\{\s*padding: 40px;/);
  });

  it('nenhum hex', () => {
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });
});
