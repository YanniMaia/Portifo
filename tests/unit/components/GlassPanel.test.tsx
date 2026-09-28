// Testes do GlassPanel (DS-17). Cores, desfoque, bordas, raios e a sombra do cabeçalho computados
// no navegador são medidos no /__styleguide (diário DS-17). Aqui ficam o DOM e o contrato do CSS.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { GlassPanel } from '@/components/GlassPanel';

const ler = (arquivo: string) =>
  readFileSync(resolve(process.cwd(), arquivo), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

const el = (ui: ReactElement) => render(ui).container.firstElementChild as HTMLElement;

describe('GlassPanel (DOM)', () => {
  it('padrão: <div> vidro com raio card, sem data-scrolled', () => {
    const p = el(<GlassPanel>x</GlassPanel>);
    expect(p.tagName).toBe('DIV');
    expect(p.className.split(' ')).toEqual(['panel', 'glass', 'radiusCard']);
    expect(p).toHaveAttribute('data-glass', 'glass');
    expect(p).not.toHaveAttribute('data-scrolled');
  });

  it('header: sem raio por padrão, data-scrolled "false" → "true"', () => {
    const p = el(<GlassPanel variant="header" as="header" />);
    expect(p.tagName).toBe('HEADER');
    expect(p.className.split(' ')).toEqual(['panel', 'header']);
    expect(p).toHaveAttribute('data-scrolled', 'false');
    expect(el(<GlassPanel variant="header" scrolled />)).toHaveAttribute('data-scrolled', 'true');
  });

  it('menu, raio e padding explícitos, id e className', () => {
    const p = el(<GlassPanel variant="menu" radius="media" padding="lg" id="menu" className="x" />);
    expect(p.className.split(' ')).toEqual(['panel', 'menu', 'radiusMedia', 'paddingLg', 'x']);
    expect(p).toHaveAttribute('id', 'menu');
  });

  it('scrolled fora do header não gera atributo', () => {
    expect(el(<GlassPanel scrolled />)).not.toHaveAttribute('data-scrolled');
  });
});

describe('CSS (DS-17, só tokens)', () => {
  const css = ler('src/components/GlassPanel/GlassPanel.module.css');
  const regra = (sel: string) =>
    new RegExp(`(?:^|\\n)${sel.replace(/[.[\]'=:()]/g, '\\$&')}\\s*\\{([^}]*)\\}`).exec(css)?.[1] ??
    '';

  it('glass: --glass-bg, blur(--glass-blur) com prefixo, borda 1 px --glass-border', () => {
    const r = regra('.glass');
    expect(r).toContain('background-color: var(--glass-bg);');
    expect(r).toContain('backdrop-filter: blur(var(--glass-blur));');
    expect(r).toContain('-webkit-backdrop-filter: blur(var(--glass-blur));');
    expect(r).toContain('border: var(--border-width) solid var(--glass-border);');
  });

  it('header: --header-bg, blur 14, só borda inferior; sombra em camada por opacidade', () => {
    const r = regra('.header');
    expect(r).toContain('background-color: var(--header-bg);');
    expect(r).toContain('backdrop-filter: blur(var(--header-blur));');
    expect(r).toContain('border-bottom: var(--border-width) solid var(--header-border);');
    expect(r).not.toMatch(/(^|\s)border:/);
    const camada = regra('.header::after');
    expect(camada).toContain('box-shadow: var(--shadow-header);');
    expect(camada).toContain('opacity: 0;');
    expect(camada).toContain('transition: opacity var(--dur-base) var(--ease-out);');
    expect(regra(".header[data-scrolled='true']::after")).toContain('opacity: 1;');
  });

  it('nenhuma transição de box-shadow (R1)', () => {
    for (const m of css.matchAll(/transition:([^;]*);/g)) expect(m[1]).not.toMatch(/box-shadow/);
  });

  it('menu: --mobile-menu-bg + blur 14 (D)', () => {
    const r = regra('.menu');
    expect(r).toContain('background-color: var(--mobile-menu-bg);');
    expect(r).toContain('backdrop-filter: blur(var(--header-blur));');
  });

  it('fallback sem backdrop-filter → --glass-bg-fallback', () => {
    expect(css).toMatch(
      /@supports not \(\(backdrop-filter: blur\(1px\)\) or \(-webkit-backdrop-filter: blur\(1px\)\)\)\s*\{\s*\.glass\s*\{\s*background-color: var\(--glass-bg-fallback\);/,
    );
  });

  it('raios 20/24/32 por token', () => {
    expect(regra('.radiusMedia')).toContain('border-radius: var(--radius-media);');
    expect(regra('.radiusCard')).toContain('border-radius: var(--radius-card);');
    expect(regra('.radiusPanel')).toContain('border-radius: var(--radius-panel);');
  });

  it('nenhum hex', () => {
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });
});
