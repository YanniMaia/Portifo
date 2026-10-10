// Testes das Áreas de interesse (S-08). Medidas e cores computadas ficam no diário S-08 (navegador).
// Aqui: id, H2 e subtítulo; ordem dos 4 cards (Dados, Cibersegurança, IA, Desenvolvimento); mapa
// fixo de ícone e selo (N-3); selo da IA tracejado (DV-4) e sem "Foco principal"; chips só quando a
// lista existe; cards não focáveis; prop `backdrop` (04 §4.4); `data-reveal`; contrato do CSS.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { en } from '@/content/en';
import { pt } from '@/content/pt';
import { SECTION_IDS } from '@/content/sections';
import { SUGERIDOS } from '@/content/sugeridos';
import { LanguageContext, type LanguageContextValue } from '@/i18n/LanguageContext';
import type { Dictionary } from '@/i18n/types';
import { Interests } from '@/sections/Interests/Interests';
import { renderWithProviders } from '../support/render';

const ler = (arquivo: string) =>
  readFileSync(resolve(process.cwd(), arquivo), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

const secao = () => document.getElementById('interesses') as HTMLElement;
const cards = () => [...secao().querySelectorAll('article')] as HTMLElement[];
const GRUPOS = ['dados', 'ciber', 'ia', 'dev'] as const;

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
      <Interests />
    </LanguageContext.Provider>,
  );
}

describe('Interests (S-08): estrutura e texto', () => {
  it('<section id="interesses"> do registro, tom alt, nomeada pelo H2, com eyebrow e subtítulo', () => {
    renderWithProviders(<Interests />);
    expect(SECTION_IDS).toContain('interesses');
    const h2 = within(secao()).getByRole('heading', { level: 2, name: pt.interesses.titulo });
    expect(secao()).toHaveAttribute('aria-labelledby', h2.id);
    expect(secao()).toHaveAttribute('data-tone', 'alt');
    expect(within(secao()).getByText(pt.interesses.eyebrow)).toHaveClass('t-eyebrow');
    expect(within(secao()).getByText(pt.interesses.subtitulo)).toBeInTheDocument();
  });

  it('4 cards na ordem Dados, Cibersegurança, IA, Desenvolvimento, cada um com H3 e texto', () => {
    renderWithProviders(<Interests />);
    expect(cards()).toHaveLength(4);
    GRUPOS.forEach((grupo, i) => {
      const card = cards()[i] as HTMLElement;
      expect(within(card).getByRole('heading', { level: 3 })).toHaveTextContent(
        pt.interesses[grupo].titulo,
      );
      expect(within(card).getByText(pt.interesses[grupo].texto)).toBeInTheDocument();
      expect(card).toHaveAttribute('data-card', 'default');
      expect(card).toHaveAttribute('data-interactive', 'true');
    });
  });

  it('texto da IA = o do índice §3, marcado como sugerido (R7)', () => {
    renderWithProviders(<Interests />);
    expect(cards()[2]).toHaveTextContent(pt.interesses.ia.texto);
    expect(SUGERIDOS).toContain('interesses.ia.texto');
    expect(SUGERIDOS).toContain('interesses.ia.titulo');
  });

  it('EN troca todos os textos da seção', () => {
    renderWithProviders(<Interests />, { idioma: 'en' });
    expect(within(secao()).getByRole('heading', { level: 2 })).toHaveTextContent(
      en.interesses.titulo,
    );
    expect(within(secao()).getByText(en.interesses.subtitulo)).toBeInTheDocument();
    GRUPOS.forEach((grupo, i) => {
      expect(cards()[i]).toHaveTextContent(en.interesses[grupo].titulo);
      expect(cards()[i]).toHaveTextContent(en.interesses[grupo].texto);
    });
    expect(within(secao()).getAllByText(en.interesses.seloFoco)).toHaveLength(2);
    expect(within(secao()).getByText(en.interesses.seloEstudo)).toBeInTheDocument();
  });
});

describe('Interests (S-08): ícones e selos do mapa fixo', () => {
  it('ícones: Database, ShieldLock, BrainCircuit (DV-15) e CodeXml, 28 px e decorativos', () => {
    renderWithProviders(<Interests />);
    const esperados = ['database', 'shield-lock', 'brain-circuit', 'code-xml'];
    cards().forEach((card, i) => {
      const svg = card.querySelector('svg') as SVGElement;
      expect(svg.getAttribute('class')).toContain(`lucide-${esperados[i] as string}`);
      expect(svg).toHaveAttribute('data-icon-size', '28');
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });
  });

  it('"Foco principal" só em Dados e Cibersegurança, preenchido', () => {
    renderWithProviders(<Interests />);
    const focos = within(secao()).getAllByText(pt.interesses.seloFoco);
    expect(focos).toHaveLength(2);
    expect(focos.map((s) => s.closest('article'))).toEqual([cards()[0], cards()[1]]);
    for (const selo of focos) expect(selo).toHaveAttribute('data-variant', 'filled');
  });

  it('IA: "Em estudo" na variante tracejada (DV-4) e nenhum "Foco principal"', () => {
    renderWithProviders(<Interests />);
    const ia = cards()[2] as HTMLElement;
    const selo = within(ia).getByText(pt.interesses.seloEstudo);
    expect(selo).toHaveAttribute('data-variant', 'dashed');
    expect(within(ia).queryByText(pt.interesses.seloFoco)).toBeNull();
  });

  it('Desenvolvimento sem selo', () => {
    renderWithProviders(<Interests />);
    const dev = cards()[3] as HTMLElement;
    expect(dev.querySelector('[data-variant]')).toBeNull();
  });
});

describe('Interests (S-08): chips e ocultação', () => {
  it('chips pequenos (32 px) só nos cards com lista; a IA (lista vazia) não tem bloco de chips', () => {
    renderWithProviders(<Interests />);
    GRUPOS.forEach((grupo, i) => {
      const card = cards()[i] as HTMLElement;
      const lista = pt.interesses[grupo].chips;
      if (lista.length === 0) {
        expect(card.querySelector('ul')).toBeNull();
        return;
      }
      const chips = within(card).getAllByRole('listitem');
      expect(chips.map((c) => c.textContent)).toEqual([...lista]);
      for (const c of chips) expect(c).toHaveAttribute('data-size', 'sm');
    });
    expect(pt.interesses.ia.chips).toHaveLength(0);
  });

  it('com todas as listas vazias, nenhum bloco de chips', () => {
    montarComDicionario({
      ...pt,
      interesses: {
        ...pt.interesses,
        dados: { ...pt.interesses.dados, chips: [] },
        ciber: { ...pt.interesses.ciber, chips: [] },
        dev: { ...pt.interesses.dev, chips: [] },
      },
    });
    expect(secao().querySelectorAll('ul')).toHaveLength(0);
    expect(cards()).toHaveLength(4);
  });

  it('nada focável na seção (os cards não são links; chips e selos não recebem foco)', async () => {
    renderWithProviders(
      <>
        <Interests />
        <button type="button">depois</button>
      </>,
    );
    expect(within(secao()).queryAllByRole('link')).toHaveLength(0);
    expect(within(secao()).queryAllByRole('button')).toHaveLength(0);
    const usuario = userEvent.setup();
    await usuario.tab();
    expect(document.activeElement).toHaveTextContent('depois');
  });
});

describe('Interests (S-08): ganchos (04 §4.4)', () => {
  it('sem `backdrop`, nenhum contêiner de fundo', () => {
    renderWithProviders(<Interests />);
    expect(secao().querySelector('[aria-hidden="true"] [data-testid="bd"]')).toBeNull();
    expect(secao().firstElementChild?.getAttribute('aria-hidden')).toBeNull();
  });

  it('com `backdrop`, a camada fica atrás dos cards num contêiner aria-hidden', () => {
    renderWithProviders(<Interests backdrop={<div data-testid="bd" />} />);
    const camada = secao().firstElementChild as HTMLElement;
    expect(camada).toHaveAttribute('aria-hidden', 'true');
    expect(within(camada).getByTestId('bd')).toBeInTheDocument();
    expect(camada.nextElementSibling?.querySelector('article')).not.toBeNull();
  });

  it('data-reveal no contêiner de conteúdo (A-02) e nenhum gancho fora do §4.4', () => {
    renderWithProviders(<Interests />);
    expect(secao().querySelectorAll('[data-reveal]')).toHaveLength(1);
    for (const attr of [
      'data-stagger',
      'data-stagger-item',
      'data-draw',
      'data-countup',
      'data-float',
      'data-bg-slot',
    ]) {
      expect(secao().querySelector(`[${attr}]`)).toBeNull();
    }
  });
});

describe('CSS e JSX das Áreas de interesse (S-08)', () => {
  const css = ler('src/sections/Interests/Interests.module.css');
  const cartao = ler('src/sections/Interests/InterestCard.module.css');

  it('grade: 1 coluna no celular e 2 × 2 a partir de 640 px, com --card-gap', () => {
    expect(css).toMatch(
      /\.grade \{[^}]*grid-template-columns: minmax\(0, 1fr\);[^}]*gap: var\(--card-gap\);/,
    );
    expect(css).toMatch(
      /@media \(min-width: 640px\) \{\s*\.grade \{\s*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/,
    );
  });

  it('backdrop atrás com overflow hidden; seção com overflow hidden', () => {
    expect(css).toMatch(/section\.interesses \{\s*overflow: hidden;/);
    expect(css).toMatch(/\.backdrop \{[^}]*z-index: 0;[^}]*overflow: hidden;/);
    expect(css).toMatch(/\.conteudo \{[^}]*z-index: 1;/);
  });

  it('card em coluna com altura total; descrição 16 px secundária; chips no fim', () => {
    expect(cartao).toMatch(/\.card \{[^}]*flex-direction: column;[^}]*height: 100%;/);
    expect(cartao).toMatch(/\.titulo \{\s*margin: var\(--space-4\) 0 0;/);
    expect(cartao).toMatch(
      /\.texto \{[^}]*color: var\(--color-text-secondary\);[^}]*font-size: 16px;/,
    );
    expect(cartao).toMatch(/\.chips \{\s*margin-top: auto;/);
  });

  it('sem hex, sem animação, sem transição', () => {
    for (const texto of [css, cartao]) {
      expect(texto).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
      expect(texto).not.toMatch(/animation|@keyframes|transition/);
    }
  });

  it('nenhum texto fixo no JSX (CC-1)', () => {
    for (const arquivo of ['Interests.tsx', 'InterestCard.tsx']) {
      const tsx = ler(`src/sections/Interests/${arquivo}`).replace(/\/\/.*$/gm, '');
      expect(tsx).not.toMatch(/>\s*[A-Za-zÀ-ÿ0-9][^<{]*<\//);
      expect(tsx).not.toMatch(/Foco principal|Em estudo|Cibersegurança|Inteligência/);
    }
  });
});
