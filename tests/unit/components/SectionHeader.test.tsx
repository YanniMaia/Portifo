// Testes do SectionHeader (DS-14). Tamanhos do H2, cores e o espaço até o conteúdo (56/48/40 px)
// nos 2 temas são medidos no /__styleguide (diário DS-14). Aqui ficam o DOM, o contrato do CSS e a
// integração com o `scrollToSection` (F-13).
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Section } from '@/components/Section';
import { SectionHeader } from '@/components/SectionHeader';
import { scrollToSection } from '@/lib/scroll';

const ler = (arquivo: string) =>
  readFileSync(resolve(process.cwd(), arquivo), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

describe('SectionHeader (DOM)', () => {
  it('<header> com Eyebrow → <h2 id tabindex=-1> → <p> subtítulo, nessa ordem', () => {
    const { container } = render(
      <SectionHeader id="t-titulo" eyebrow="Interesses" title="Áreas" subtitle="Sub" />,
    );
    const header = container.firstElementChild as HTMLElement;
    expect(header.tagName).toBe('HEADER');
    expect(header.className).toBe('header');
    expect(header).toHaveAttribute('data-align', 'left');
    const [eyebrow, h2, p] = Array.from(header.children) as HTMLElement[];
    expect(eyebrow?.tagName).toBe('P');
    expect(eyebrow).toHaveAttribute('data-tone', 'default');
    expect(eyebrow?.textContent).toBe('Interesses');
    expect(h2?.tagName).toBe('H2');
    expect(h2).toHaveAttribute('id', 't-titulo');
    expect(h2).toHaveAttribute('tabindex', '-1');
    expect(h2?.className.split(' ')).toEqual(['t-h2', 'title']);
    expect(h2?.textContent).toBe('Áreas');
    expect(p?.tagName).toBe('P');
    expect(p?.className.split(' ')).toEqual(['t-body', 'subtitle']);
    expect(p?.textContent).toBe('Sub');
  });

  it('sem subtitle (ou vazio): nenhum <p> de subtítulo', () => {
    for (const subtitle of [undefined, '']) {
      const { container, unmount } = render(
        <SectionHeader id="t" eyebrow="Sobre" title="Sobre mim" subtitle={subtitle} />,
      );
      const header = container.firstElementChild as HTMLElement;
      expect(header.children).toHaveLength(2);
      expect(header.querySelector('.subtitle')).toBeNull();
      unmount();
    }
  });

  it('eyebrowTone="tint" chega ao Eyebrow; align="center" põe a classe e o data-align', () => {
    const { container } = render(
      <SectionHeader
        id="t"
        eyebrow="Contato"
        eyebrowTone="tint"
        title="Vamos conversar?"
        align="center"
        className="extra"
      />,
    );
    const header = container.firstElementChild as HTMLElement;
    expect(header.className.split(' ')).toEqual(['header', 'center', 'extra']);
    expect(header).toHaveAttribute('data-align', 'center');
    expect(header.firstElementChild).toHaveAttribute('data-tone', 'tint');
  });

  it('nenhum texto fixo no componente (D5)', () => {
    const tsx = ler('src/components/SectionHeader/SectionHeader.tsx').replace(/\/\/.*$/gm, '');
    expect(tsx).not.toMatch(/>\s*[A-Za-zÀ-ÿ0-9][^<{]*</);
  });
});

describe('Integração com a Section e o scrollToSection (F-13)', () => {
  const scrollIntoView = vi.fn();

  beforeEach(() => {
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
      configurable: true,
      writable: true,
      value: scrollIntoView,
    });
    window.history.replaceState(null, '', '/Portifolio/');
  });

  afterEach(() => {
    scrollIntoView.mockClear();
  });

  it('aria-labelledby da Section aponta para o H2, e scrollToSection foca o H2', () => {
    const { getByRole } = render(
      <Section id="interesses" labelledBy="interesses-titulo">
        <SectionHeader id="interesses-titulo" eyebrow="Interesses" title="Áreas de interesse" />
      </Section>,
    );
    const regiao = getByRole('region', { name: 'Áreas de interesse' });
    const h2 = getByRole('heading', { level: 2, name: 'Áreas de interesse' });
    expect(regiao).toHaveAttribute('id', 'interesses');

    scrollToSection('interesses');
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(h2);
  });
});

describe('CSS (DS-14, só tokens)', () => {
  const css = ler('src/components/SectionHeader/SectionHeader.module.css');
  const regra = (sel: string) =>
    new RegExp(`(?:^|\\n)${sel.replace(/[.:]/g, '\\$&')}\\s*\\{([^}]*)\\}`).exec(css)?.[1] ?? '';

  it('bloco → conteúdo = --section-head-gap; coluna alinhada à esquerda', () => {
    const r = regra('.header');
    expect(r).toContain('margin: 0 0 var(--section-head-gap);');
    expect(r).toContain('flex-direction: column;');
    expect(r).toContain('align-items: flex-start;');
  });

  it('center: itens e texto centralizados', () => {
    const r = regra('.center');
    expect(r).toContain('align-items: center;');
    expect(r).toContain('text-align: center;');
  });

  it('eyebrow → H2 12 px (--space-3) e H2 → subtítulo 16 px (--space-4) (R-DS-11)', () => {
    expect(regra('.title')).toContain('margin: var(--space-3) 0 0;');
    expect(regra('.subtitle')).toContain('margin: var(--space-4) 0 0;');
  });

  it('cores: H2 --color-text, subtítulo --color-text-secondary', () => {
    expect(regra('.title')).toContain('color: var(--color-text);');
    expect(regra('.subtitle')).toContain('color: var(--color-text-secondary);');
  });

  it('foco programático sem contorno; :focus-visible com o contorno padrão', () => {
    expect(regra('.title:focus')).toContain('outline: none;');
    const fv = regra('.title:focus-visible');
    expect(fv).toContain('outline: var(--focus-width) solid var(--color-focus);');
    expect(fv).toContain('outline-offset: var(--focus-offset);');
    // A regra do :focus-visible vem depois e vence a do :focus (mesma especificidade).
    expect(css.indexOf('.title:focus-visible')).toBeGreaterThan(css.indexOf('.title:focus {'));
  });

  it('sem hex', () => {
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });
});
