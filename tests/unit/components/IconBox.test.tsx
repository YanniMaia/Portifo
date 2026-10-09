// Testes do IconBox (DS-16). Medidas, cores e o degradê nos 2 temas, com hover real do Card, são
// medidos no /__styleguide (diário DS-16). Aqui ficam o DOM, a acessibilidade do ícone e o contrato
// do CSS.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { Database } from 'lucide-react';
import { describe, expect, it } from 'vitest';
import { IconBox } from '@/components/IconBox';

const ler = (arquivo: string) =>
  readFileSync(resolve(process.cwd(), arquivo), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

const el = (ui: ReactElement) => render(ui).container.firstElementChild as HTMLElement;

describe('IconBox (DOM)', () => {
  it('padrão: <span class="box"> com ícone de 28 px decorativo', () => {
    const caixa = el(<IconBox icon={Database} />);
    expect(caixa.tagName).toBe('SPAN');
    expect(caixa.className).toBe('box');
    expect(caixa).not.toHaveAttribute('data-active');
    const svg = caixa.querySelector('svg');
    expect(svg).toHaveAttribute('width', '28');
    expect(svg).toHaveAttribute('height', '28');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg?.getAttribute('stroke')).toBe('currentColor');
  });

  it('iconSize 24, active e className na ordem', () => {
    const caixa = el(<IconBox icon={Database} iconSize={24} active className="x" />);
    expect(caixa.className.split(' ')).toEqual(['box', 'active', 'x']);
    expect(caixa).toHaveAttribute('data-active', 'true');
    expect(caixa.querySelector('svg')).toHaveAttribute('width', '24');
  });

  it('label: o ícone ganha role="img" e nome acessível', () => {
    const caixa = el(<IconBox icon={Database} label="Dados" />);
    const svg = caixa.querySelector('svg');
    expect(svg).toHaveAttribute('role', 'img');
    expect(svg).toHaveAttribute('aria-label', 'Dados');
  });

  it('não é interativo: sem tabindex nem papel na caixa', () => {
    const caixa = el(<IconBox icon={Database} />);
    expect(caixa).not.toHaveAttribute('tabindex');
    expect(caixa).not.toHaveAttribute('role');
  });

  it('nenhum texto fixo no componente (D5)', () => {
    const tsx = ler('src/components/IconBox/IconBox.tsx').replace(/\/\/.*$/gm, '');
    expect(tsx).not.toMatch(/>\s*[A-Za-zÀ-ÿ0-9][^<{]*</);
  });
});

describe('CSS (DS-16, só tokens)', () => {
  const css = ler('src/components/IconBox/IconBox.module.css');
  const bloco = (sel: string) => {
    const i = css.indexOf(`${sel} {`);
    return i < 0 ? '' : css.slice(i, css.indexOf('}', i));
  };

  it('repouso: 56 px, raio 16 px, fill-soft, ícone accent', () => {
    const r = bloco('.box');
    expect(r).toContain('width: var(--icon-box-size);');
    expect(r).toContain('height: var(--icon-box-size);');
    expect(r).toContain('border-radius: var(--radius-icon-box);');
    expect(r).toContain('background-color: var(--color-fill-soft);');
    expect(r).toContain('color: var(--color-accent);');
  });

  it('camada: --gradient-brand no claro e --gradient-primary no escuro, opacidade 0', () => {
    const r = bloco('.box::before');
    expect(r).toContain('background-image: var(--gradient-brand);');
    expect(r).toContain('opacity: 0;');
    expect(bloco("[data-theme='dark'] .box::before")).toContain(
      'background-image: var(--gradient-primary);',
    );
  });

  it('ativo: active, focus-within e data-state do Card, e hover dentro de @media (hover: hover)', () => {
    expect(css).toMatch(
      /\.active,\s*\[data-interactive='true'\]:focus-within \.box,\s*\[data-interactive='true'\]\[data-state='hover'\] \.box \{\s*color: var\(--color-on-primary\);/,
    );
    expect(css).toMatch(/\.active::before,[\s\S]*?\{\s*opacity: 1;/);
    expect(css).toMatch(/@media \(hover: hover\) \{\s*\[data-interactive='true'\]:hover \.box \{/);
  });

  it('transições de 250 ms só em color e opacity; sem hex', () => {
    const transicoes = css.match(/transition:[^;]*;/g) ?? [];
    expect(transicoes).toEqual([
      'transition: color var(--dur-base) var(--ease-out);',
      'transition: opacity var(--dur-base) var(--ease-out);',
    ]);
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });
});
