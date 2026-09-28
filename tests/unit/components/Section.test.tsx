// Testes da Section (DS-10). Fundos, espaço vertical e scroll-margin-top computados nas 3 larguras
// e nos 2 temas são medidos no navegador (diário DS-10). Aqui ficam o DOM, o tom padrão lido do
// registro da F-12, a tipagem do `id` e o contrato do CSS Module.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Section } from '@/components/Section';
import { SECTIONS, SECTION_IDS } from '@/content/sections';

const ler = (arquivo: string) =>
  readFileSync(resolve(process.cwd(), arquivo), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

describe('Section (DOM)', () => {
  it('renderiza <section id aria-labelledby> com os filhos', () => {
    const { container } = render(
      <Section id="sobre" labelledBy="sobre-titulo">
        <h2 id="sobre-titulo">t</h2>
      </Section>,
    );
    const el = container.querySelector('section') as HTMLElement;
    expect(el).toHaveAttribute('id', 'sobre');
    expect(el).toHaveAttribute('aria-labelledby', 'sobre-titulo');
    expect(el.className.split(' ')).toEqual(['section', 'base']);
  });

  it.each(SECTIONS.map((s) => [s.id, s.tone] as const))(
    'tom padrão de #%s = "%s" (lido de SECTIONS)',
    (id, tone) => {
      const { container } = render(<Section id={id} />);
      const el = container.querySelector('section') as HTMLElement;
      expect(el).toHaveAttribute('data-tone', tone);
      expect(el.classList.contains(tone)).toBe(true);
    },
  );

  it('fundos do §2: base/alt/tint nos ids certos', () => {
    const porTom = (t: string) =>
      SECTIONS.filter((s) => s.tone === t)
        .map((s) => s.id)
        .sort();
    expect(porTom('base')).toEqual(
      ['contato', 'destaques', 'formacao', 'habilidades', 'inicio', 'sobre'].sort(),
    );
    expect(porTom('alt')).toEqual(['interesses', 'objetivos', 'projetos'].sort());
    expect(porTom('tint')).toEqual(['frase']);
  });

  it('tone explícito vence o registro; padding="motto" acrescenta a classe', () => {
    const { container } = render(<Section id="frase" tone="alt" padding="motto" className="x" />);
    const el = container.querySelector('section') as HTMLElement;
    expect(el.className.split(' ')).toEqual(['section', 'alt', 'motto', 'x']);
  });

  it('sem labelledBy, não põe aria-labelledby', () => {
    const { container } = render(<Section id="inicio" />);
    expect(container.querySelector('section')).not.toHaveAttribute('aria-labelledby');
  });

  it('id fora do registro não compila (prop tipada com SectionId)', () => {
    // @ts-expect-error: 'inexistente' não está em SECTION_IDS (F-12).
    const elemento = <Section id="inexistente" />;
    expect(elemento).toBeTruthy();
    expect(SECTION_IDS).toHaveLength(10);
  });
});

describe('Código e CSS (DS-10)', () => {
  const tsx = ler('src/components/Section/Section.tsx');
  const css = ler('src/components/Section/Section.module.css');

  it('o componente não tem lista de ids escrita à mão', () => {
    const semComentarioDeLinha = tsx.replace(/^\s*\/\/.*$/gm, '');
    for (const id of SECTION_IDS) {
      expect(semComentarioDeLinha).not.toContain(`'${id}'`);
      expect(semComentarioDeLinha).not.toContain(`"${id}"`);
    }
    expect(tsx).toContain("from '@/content/sections'");
  });

  it('padding-block por token, relative, overflow-x: clip e sem scroll-margin', () => {
    expect(css).toMatch(
      /\.section\s*\{[^}]*position: relative;[^}]*padding-block: var\(--section-py\);[^}]*overflow-x: clip;/,
    );
    expect(css).toMatch(/\.motto\s*\{[^}]*padding-block: var\(--section-py-motto\);/);
    expect(css).not.toMatch(/scroll-margin/);
  });

  it('fundos por token: base/alt/tint', () => {
    expect(css).toMatch(/\.base\s*\{[^}]*background-color: var\(--color-bg\);/);
    expect(css).toMatch(/\.alt\s*\{[^}]*background-color: var\(--color-bg-alt\);/);
    expect(css).toMatch(/\.tint\s*\{[^}]*background-color: var\(--color-bg-tint\);/);
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });
});
