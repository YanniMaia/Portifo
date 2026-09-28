// Testes do Monogram (DS-18). Tamanhos, raios, fonte, cor e degradê computados nos 2 temas são
// medidos no /__styleguide (diário DS-18). Aqui ficam o DOM, o teclado, o contrato do CSS, o token
// de texto sobre o degradê e os contrastes registrados (R-DS-7).
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Monogram } from '@/components/Monogram';
import { site } from '@/content/site';
import { contrastRatio } from '../support/contrast';

const ler = (arquivo: string) =>
  readFileSync(resolve(process.cwd(), arquivo), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

describe('Monogram (DOM)', () => {
  it('span decorativo: aria-hidden, iniciais de site.ts, classe do tamanho', () => {
    const { container } = render(<Monogram size="sm" initials={site.iniciais} />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.tagName).toBe('SPAN');
    expect(el).toHaveAttribute('aria-hidden', 'true');
    expect(el.className.split(' ')).toEqual(['monogram', 'sm']);
    expect(el.textContent).toBe('YE');
  });

  it('lg com className extra', () => {
    const { container } = render(<Monogram size="lg" initials="YE" className="x" />);
    expect((container.firstElementChild as HTMLElement).className.split(' ')).toEqual([
      'monogram',
      'lg',
      'x',
    ]);
  });

  it('button: nome acessível = label; Enter e Espaço disparam onClick', async () => {
    const onClick = vi.fn();
    render(<Monogram as="button" size="lg" initials="YE" label="Rótulo" onClick={onClick} />);
    const botao = screen.getByRole('button', { name: 'Rótulo' });
    expect(botao).toHaveAttribute('type', 'button');
    expect(botao.className.split(' ')).toEqual(['monogram', 'lg', 'button']);
    const user = userEvent.setup();
    await user.tab();
    expect(botao).toHaveFocus();
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it('button sem label não compila', () => {
    // @ts-expect-error: `label` é obrigatório com as="button".
    const elemento = <Monogram as="button" size="sm" initials="YE" />;
    expect(elemento).toBeTruthy();
  });
});

describe('CSS (DS-18, só tokens de cor)', () => {
  const css = ler('src/components/Monogram/Monogram.module.css');
  const regra = (sel: string) =>
    new RegExp(`(?:^|\\n)${sel.replace(/[.:]/g, '\\$&')}\\s*\\{([^}]*)\\}`).exec(css)?.[1] ?? '';

  it('degradê de marca, letras --color-on-brand, display 800', () => {
    const r = regra('.monogram');
    expect(r).toContain('background-image: var(--gradient-brand);');
    expect(r).toContain('color: var(--color-on-brand);');
    expect(r).toContain('font-family: var(--font-display);');
    expect(r).toContain('font-weight: 800;');
  });

  it('sm 36 px, raio 12, 14 px; lg 120 px, círculo, 44 px', () => {
    const sm = regra('.sm');
    expect(sm).toContain('width: 36px;');
    expect(sm).toContain('height: 36px;');
    expect(sm).toContain('border-radius: var(--radius-monogram-sm);');
    expect(sm).toContain('font-size: 14px;');
    const lg = regra('.lg');
    expect(lg).toContain('width: 120px;');
    expect(lg).toContain('height: 120px;');
    expect(lg).toContain('border-radius: 50%;');
    expect(lg).toContain('font-size: 44px;');
  });

  it('botão sm: camada de toque de 44 px (--touch-min)', () => {
    expect(regra('.button.sm::before')).toContain('inset: calc((var(--touch-min) - 36px) / -2);');
  });

  it('nenhum hex', () => {
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });
});

describe('Token e contrastes (pendência DS-01 V-03 #5; R-DS-7)', () => {
  const cores = ler('src/styles/tokens/colors.css').toLowerCase();

  it('--color-on-brand = #FFFFFF nos 2 temas; --gradient-brand igual nos 2 temas', () => {
    expect([...cores.matchAll(/--color-on-brand:\s*([^;]+);/g)].map((m) => m[1])).toEqual([
      '#ffffff',
      '#ffffff',
    ]);
    expect([...cores.matchAll(/--gradient-brand:\s*([^;]+);/g)].map((m) => m[1])).toEqual([
      'linear-gradient(135deg, #e0518a, #a82560)',
      'linear-gradient(135deg, #e0518a, #a82560)',
    ]);
  });

  it('branco/#A82560 ≥ 4,5:1; branco/#E0518A ≈ 3,7:1 (logotipo, R-DS-7)', () => {
    const fim = contrastRatio('#FFFFFF', '#A82560');
    const inicio = contrastRatio('#FFFFFF', '#E0518A');
    console.info(
      `[DS-18] #FFFFFF/#A82560 = ${fim.toFixed(2)}:1; #FFFFFF/#E0518A = ${inicio.toFixed(2)}:1`,
    );
    expect(fim).toBeGreaterThanOrEqual(4.5);
    expect(inicio).toBeGreaterThan(3.5);
    expect(inicio).toBeLessThan(4.5);
  });

  it('com --color-on-primary do escuro (#2A0A1A) daria menos de 3:1 no fim do degradê', () => {
    expect(contrastRatio('#2A0A1A', '#A82560')).toBeLessThan(3);
  });
});
