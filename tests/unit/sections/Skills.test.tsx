// Testes das Habilidades (S-09). Medidas e cores computadas ficam no diário S-09 (navegador).
// Aqui: id, H2 e subtítulo; 3 categorias na ordem do Anexo A.8, com ícone de 24 px e `data-stagger`;
// 12 chips com `data-stagger-item`, mono só em linguagens e ferramentas; "sem níveis" (nenhum
// progress/meter, "%", "avançado", "especialista", "expert", "advanced"); nenhuma tecnologia de IA;
// categoria sem chips some; nada focável; contrato do CSS.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { en } from '@/content/en';
import { pt } from '@/content/pt';
import { SECTION_IDS } from '@/content/sections';
import { LanguageContext, type LanguageContextValue } from '@/i18n/LanguageContext';
import type { Dictionary } from '@/i18n/types';
import { Skills } from '@/sections/Skills/Skills';
import { renderWithProviders } from '../support/render';

const ler = (arquivo: string) =>
  readFileSync(resolve(process.cwd(), arquivo), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

const secao = () => document.getElementById('habilidades') as HTMLElement;
const categorias = () => [...secao().querySelectorAll('article')] as HTMLElement[];
const GRUPOS = ['linguagens', 'ferramentas', 'conceitos'] as const;

function montarComDicionario(dict: Dictionary) {
  const valor: LanguageContextValue = {
    lang: 'pt',
    dict,
    setLang: () => undefined,
    toggleLang: () => undefined,
    isSugerido: () => false,
  };
  return render(
    <LanguageContext.Provider value={valor}>
      <Skills />
    </LanguageContext.Provider>,
  );
}

describe('Skills (S-09): estrutura e texto', () => {
  it('<section id="habilidades"> do registro, tom base, nomeada pelo H2, com eyebrow e subtítulo', () => {
    renderWithProviders(<Skills />);
    expect(SECTION_IDS).toContain('habilidades');
    const h2 = within(secao()).getByRole('heading', { level: 2, name: pt.habilidades.titulo });
    expect(secao()).toHaveAttribute('aria-labelledby', h2.id);
    expect(secao()).toHaveAttribute('data-tone', 'base');
    expect(within(secao()).getByText(pt.habilidades.eyebrow)).toHaveClass('t-eyebrow');
    expect(within(secao()).getByText(pt.habilidades.subtitulo)).toBeInTheDocument();
  });

  it('3 categorias na ordem (Linguagens, Ferramentas, Conceitos), cada uma com H3 e ícone de 24 px', () => {
    renderWithProviders(<Skills />);
    expect(categorias()).toHaveLength(3);
    const icones = ['code-xml', 'wrench', 'lightbulb'];
    GRUPOS.forEach((grupo, i) => {
      const cat = categorias()[i] as HTMLElement;
      const h3 = within(cat).getByRole('heading', { level: 3 });
      expect(h3).toHaveTextContent(pt.habilidades[grupo].titulo);
      const svg = h3.querySelector('svg') as SVGElement;
      expect(svg).toHaveAttribute('data-icon-size', '24');
      expect(svg).toHaveAttribute('aria-hidden', 'true');
      expect(svg.getAttribute('class')).toContain(`lucide-${icones[i] as string}`);
      expect(cat).toHaveAttribute('data-card', 'default');
      expect(cat).not.toHaveAttribute('data-interactive');
    });
  });

  it('12 chips, médios, na ordem do conteúdo; mono só em linguagens e ferramentas', () => {
    renderWithProviders(<Skills />);
    let total = 0;
    GRUPOS.forEach((grupo, i) => {
      const chips = within(categorias()[i] as HTMLElement).getAllByRole('listitem');
      expect(chips.map((c) => c.textContent)).toEqual([...pt.habilidades[grupo].chips]);
      for (const c of chips) {
        expect(c).toHaveAttribute('data-size', 'default');
        expect(c.className.includes('mono')).toBe(grupo !== 'conceitos');
      }
      total += chips.length;
    });
    expect(total).toBe(12);
  });

  it('EN troca todos os textos da seção', () => {
    renderWithProviders(<Skills />, { idioma: 'en' });
    expect(within(secao()).getByRole('heading', { level: 2 })).toHaveTextContent(
      en.habilidades.titulo,
    );
    expect(within(secao()).getByText(en.habilidades.subtitulo)).toBeInTheDocument();
    GRUPOS.forEach((grupo, i) => {
      expect(categorias()[i]).toHaveTextContent(en.habilidades[grupo].titulo);
      for (const chip of en.habilidades[grupo].chips) {
        expect(categorias()[i]).toHaveTextContent(chip);
      }
    });
  });
});

describe('Skills (S-09): sem níveis e sem IA', () => {
  it('nenhum progress/meter/progressbar e nenhum "%" ou nível renderizado (PT e EN)', () => {
    for (const idioma of ['pt', 'en'] as const) {
      const { unmount } = renderWithProviders(<Skills />, { idioma });
      expect(
        secao().querySelector('progress, meter, [role="progressbar"], [role="meter"]'),
      ).toBeNull();
      const texto = secao().textContent ?? '';
      expect(texto).not.toMatch(/%/);
      expect(texto).not.toMatch(/avançad|especialista|expert|advanced|intermedi|básico|basic/i);
      unmount();
    }
  });

  it('nenhuma tecnologia de IA nas habilidades (índice §3, P-IA-1)', () => {
    renderWithProviders(<Skills />);
    const texto = secao().textContent ?? '';
    expect(texto).not.toMatch(
      /\bIA\b|\bAI\b|Intelig[eê]ncia Artificial|Machine Learning|Aprendizado de M[aá]quina|TensorFlow|PyTorch|LLM|scikit/i,
    );
  });
});

describe('Skills (S-09): ganchos (04 §4.4) e ocultação', () => {
  it('cada cartão de categoria com data-stagger="chips" e cada chip com data-stagger-item', () => {
    renderWithProviders(<Skills />);
    const cascatas = [...secao().querySelectorAll('[data-stagger]')];
    expect(cascatas).toEqual(categorias());
    for (const c of cascatas) expect(c).toHaveAttribute('data-stagger', 'chips');
    const itens = [...secao().querySelectorAll('[data-stagger-item]')];
    expect(itens).toHaveLength(12);
    expect(itens).toEqual([...secao().querySelectorAll('li')]);
  });

  it('data-reveal no contêiner de conteúdo (A-02) e nenhum gancho fora do §4.4', () => {
    renderWithProviders(<Skills />);
    expect(secao().querySelectorAll('[data-reveal]')).toHaveLength(1);
    for (const attr of ['data-draw', 'data-countup', 'data-float', 'data-bg-slot']) {
      expect(secao().querySelector(`[${attr}]`)).toBeNull();
    }
  });

  it('categoria sem chips no conteúdo não é renderizada', () => {
    montarComDicionario({
      ...pt,
      habilidades: { ...pt.habilidades, ferramentas: { ...pt.habilidades.ferramentas, chips: [] } },
    });
    expect(categorias()).toHaveLength(2);
    expect(
      within(secao())
        .getAllByRole('heading', { level: 3 })
        .map((h) => h.textContent),
    ).toEqual([pt.habilidades.linguagens.titulo, pt.habilidades.conceitos.titulo]);
    expect(secao().querySelectorAll('[data-stagger-item]')).toHaveLength(8);
  });

  it('nada focável na seção (chips não são links)', async () => {
    renderWithProviders(
      <>
        <Skills />
        <button type="button">depois</button>
      </>,
    );
    expect(within(secao()).queryAllByRole('link')).toHaveLength(0);
    for (const li of secao().querySelectorAll('li')) expect(li).not.toHaveAttribute('tabindex');
    const usuario = userEvent.setup();
    await usuario.tab();
    expect(document.activeElement).toHaveTextContent('depois');
  });
});

describe('CSS e JSX das Habilidades (S-09)', () => {
  const css = ler('src/sections/Skills/Skills.module.css');
  const cartao = ler('src/sections/Skills/SkillCategory.module.css');

  it('grade: 1 coluna; tablet 2 + 1; desktop uma coluna por categoria; --card-gap', () => {
    expect(css).toMatch(
      /\.grade \{[^}]*grid-template-columns: minmax\(0, 1fr\);[^}]*gap: var\(--card-gap\);/,
    );
    expect(css).toMatch(
      /@media \(min-width: 640px\) and \(max-width: 1023px\) \{\s*\.grade \{\s*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);\s*\}\s*\.grade > :last-child:nth-child\(odd\) \{\s*grid-column: 1 \/ -1;/,
    );
    expect(css).toMatch(
      /@media \(min-width: 1024px\) \{\s*\.grade \{\s*grid-auto-columns: minmax\(0, 1fr\);\s*grid-auto-flow: column;/,
    );
  });

  it('título com ícone na cor de destaque a 12 px; chips 24 px abaixo', () => {
    expect(cartao).toMatch(/\.titulo \{[^}]*gap: var\(--space-3\);/);
    expect(cartao).toMatch(/\.icone \{[^}]*color: var\(--color-accent\);/);
    expect(cartao).toMatch(/\.chips \{\s*margin-top: var\(--space-6\);/);
  });

  it('sem hex, sem animação, sem transição, sem transform', () => {
    for (const texto of [css, cartao]) {
      expect(texto).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
      expect(texto).not.toMatch(/animation|@keyframes|transition|transform/);
    }
  });

  it('nenhum texto fixo no JSX (CC-1)', () => {
    for (const arquivo of ['Skills.tsx', 'SkillCategory.tsx']) {
      const tsx = ler(`src/sections/Skills/${arquivo}`).replace(/\/\/.*$/gm, '');
      expect(tsx).not.toMatch(/>\s*[A-Za-zÀ-ÿ0-9][^<{]*<\//);
      expect(tsx).not.toMatch(/Python|SQL|Linguagens|Ferramentas|Conceitos/);
    }
  });
});
