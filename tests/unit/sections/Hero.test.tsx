// Testes do Hero (S-03). Medidas, cores e a quebra do H1 por largura são medidos no navegador (diário
// S-03). Aqui: H1 único com o nome em degradê, pílula com IA e PulseDot, botões e destinos, ordem de
// foco, rolagem do F-13, troca de idioma, ocultação do subtítulo/assinatura, a prop `backdrop`
// (gancho do doc 04 §4.4) e o contrato do CSS.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { en } from '@/content/en';
import { pt } from '@/content/pt';
import { SECTION_IDS } from '@/content/sections';
import { LanguageContext, type LanguageContextValue } from '@/i18n/LanguageContext';
import type { Dictionary } from '@/i18n/types';
import { Hero } from '@/sections/Hero/Hero';
import { renderWithProviders } from '../support/render';

const rolagem = vi.hoisted(() => ({ scrollToSection: vi.fn(), scrollToTop: vi.fn() }));

vi.mock('@/lib/scroll', () => rolagem);

const ler = (arquivo: string) =>
  readFileSync(resolve(process.cwd(), arquivo), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

const secao = () => document.getElementById(SECTION_IDS[0]) as HTMLElement;

beforeEach(() => {
  rolagem.scrollToSection.mockClear();
});

/** Render com um dicionário alterado (para os casos de conteúdo ausente). */
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
      <Hero />
    </LanguageContext.Provider>,
  );
}

describe('Hero (S-03): estrutura e textos', () => {
  it('é a <section> da 1ª entrada do registro (#inicio), nomeada pelo H1', () => {
    renderWithProviders(<Hero />);
    const s = secao();
    expect(s.tagName).toBe('SECTION');
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(s).toHaveAttribute('aria-labelledby', h1.id);
    expect(
      screen.getByRole('region', { name: `${pt.hero.tituloLinha1} ${pt.hero.tituloNome}` }),
    ).toBe(s);
  });

  it('um único H1 "Olá, eu sou Yanni Elyssa.", com o nome no GradientText e tabIndex -1 (F-13)', () => {
    renderWithProviders(<Hero />);
    const titulos = screen.getAllByRole('heading', { level: 1 });
    expect(titulos).toHaveLength(1);
    const h1 = titulos[0] as HTMLElement;
    expect(h1).toHaveTextContent(`${pt.hero.tituloLinha1} ${pt.hero.tituloNome}`);
    expect(h1).toHaveAttribute('tabindex', '-1');
    expect(h1).toHaveClass('t-h1');
    const partes = h1.querySelectorAll(':scope > span');
    expect(partes).toHaveLength(2);
    expect(partes[0]).toHaveTextContent(pt.hero.tituloLinha1);
    expect(partes[1]).toHaveTextContent(pt.hero.tituloNome);
    expect(screen.queryAllByRole('heading', { level: 2 })).toHaveLength(0);
  });

  it('pílula "Dados · Cibersegurança · IA" (Badge lg, mono) com o PulseDot e sem foco', () => {
    renderWithProviders(<Hero />);
    const pilula = screen.getByText(pt.hero.pilula);
    expect(pt.hero.pilula).toMatch(/\bIA\b/);
    expect(pilula).toHaveAttribute('data-size', 'lg');
    expect(pilula.querySelector('[aria-hidden="true"]')).not.toBeNull(); // PulseDot decorativo
    expect(pilula).not.toHaveAttribute('tabindex');
    expect(pilula.closest('a, button')).toBeNull();
  });

  it('subtítulo e frase de assinatura do dicionário', () => {
    renderWithProviders(<Hero />);
    expect(screen.getByText(pt.hero.subtitulo).tagName).toBe('P');
    expect(screen.getByText(pt.hero.subtitulo)).toHaveClass('t-hero-sub');
    expect(screen.getByText(pt.hero.assinatura).tagName).toBe('P');
  });

  it('EN troca todos os textos (H1 "Hi, I’m Yanni Elyssa.", pílula, subtítulo, assinatura, botões)', () => {
    renderWithProviders(<Hero />, { idioma: 'en' });
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      `${en.hero.tituloLinha1} ${en.hero.tituloNome}`,
    );
    expect(screen.getByText(en.hero.pilula)).toBeInTheDocument();
    expect(screen.getByText(en.hero.subtitulo)).toBeInTheDocument();
    expect(screen.getByText(en.hero.assinatura)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: en.hero.botaoProjetos })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: en.hero.botaoContato })).toBeInTheDocument();
    expect(screen.queryByText(pt.hero.tituloLinha1)).toBeNull();
  });
});

describe('Hero (S-03): botões', () => {
  it('"Ver meus projetos" (primário, com seta) → #projetos; "Entre em contato" (secundário) → #contato', () => {
    renderWithProviders(<Hero />);
    const projetos = screen.getByRole('link', { name: pt.hero.botaoProjetos });
    const contato = screen.getByRole('link', { name: pt.hero.botaoContato });
    expect(projetos).toHaveAttribute('href', '#projetos');
    expect(projetos).toHaveAttribute('data-variant', 'primary');
    expect(projetos.querySelectorAll('svg')).toHaveLength(1); // ArrowRight
    expect(contato).toHaveAttribute('href', '#contato');
    expect(contato).toHaveAttribute('data-variant', 'secondary');
    expect(projetos).not.toHaveAttribute('target');
    expect(contato).not.toHaveAttribute('target');
  });

  it('ordem de Tab: botão 1 → botão 2 (a pílula e os textos não são focáveis)', async () => {
    const usuario = userEvent.setup();
    renderWithProviders(<Hero />);
    await usuario.tab();
    expect(screen.getByRole('link', { name: pt.hero.botaoProjetos })).toHaveFocus();
    await usuario.tab();
    expect(screen.getByRole('link', { name: pt.hero.botaoContato })).toHaveFocus();
  });

  it('clique simples usa a rolagem do F-13; com Ctrl segue o href nativo', () => {
    renderWithProviders(<Hero />);
    const projetos = screen.getByRole('link', { name: pt.hero.botaoProjetos });
    expect(fireEvent.click(projetos)).toBe(false);
    expect(rolagem.scrollToSection).toHaveBeenCalledWith('projetos');
    fireEvent.click(screen.getByRole('link', { name: pt.hero.botaoContato }));
    expect(rolagem.scrollToSection).toHaveBeenLastCalledWith('contato');
    rolagem.scrollToSection.mockClear();
    fireEvent.click(projetos, { ctrlKey: true });
    expect(rolagem.scrollToSection).not.toHaveBeenCalled();
  });
});

describe('Hero (S-03): ocultação (D11)', () => {
  it('sem subtítulo no conteúdo, o parágrafo não existe', () => {
    montarComDicionario({ ...pt, hero: { ...pt.hero, subtitulo: '' } });
    expect(document.querySelector('.t-hero-sub')).toBeNull();
    expect(screen.getByText(pt.hero.assinatura)).toBeInTheDocument();
  });

  it('sem frase de assinatura no conteúdo, o parágrafo não existe', () => {
    montarComDicionario({ ...pt, hero: { ...pt.hero, assinatura: '' } });
    const texto = screen.getByRole('heading', { level: 1 }).parentElement as HTMLElement;
    expect(texto.querySelectorAll('p')).toHaveLength(1); // só o subtítulo
    expect(screen.getByText(pt.hero.subtitulo)).toBeInTheDocument();
  });

  it('placeholder "[…]" no subtítulo: marcado só em dev (DS-21); some em produção', () => {
    montarComDicionario({ ...pt, hero: { ...pt.hero, subtitulo: '[subtítulo]' } });
    const marca = document.querySelector('[data-placeholder]');
    if (import.meta.env.DEV) expect(marca).toHaveTextContent('[subtítulo]');
    else expect(document.querySelector('.t-hero-sub')).toBeNull();
  });
});

describe('Hero (S-03): prop backdrop (gancho do doc 04 §4.4, A-19)', () => {
  it('sem a prop, o contêiner do fundo não existe', () => {
    renderWithProviders(<Hero />);
    const s = secao();
    expect(s.querySelector(':scope > [aria-hidden="true"]')).toBeNull();
    expect(s.children).toHaveLength(1); // só o contêiner de conteúdo
  });

  it('com a prop, o elemento aparece ATRÁS do conteúdo, dentro do contêiner aria-hidden', () => {
    renderWithProviders(<Hero backdrop={<div data-testid="bd" />} />);
    const s = secao();
    const bd = screen.getByTestId('bd');
    const camada = bd.parentElement as HTMLElement;
    expect(camada.parentElement).toBe(s);
    expect(camada).toHaveAttribute('aria-hidden', 'true');
    expect(s.firstElementChild).toBe(camada); // antes do conteúdo no DOM
    expect(within(camada).queryAllByRole('link')).toHaveLength(0);
    expect(s.querySelector('[data-bg-slot]')).toBeNull();
  });

  it('CSS: camada do fundo com overflow hidden atrás do conteúdo (z-index 0 × 1); seção com overflow hidden', () => {
    const css = ler('src/sections/Hero/Hero.module.css');
    expect(css).toMatch(
      /\.backdrop \{[^}]*position: absolute;[^}]*z-index: 0;[^}]*inset: 0;[^}]*overflow: hidden;/,
    );
    expect(css).toMatch(/\.grade \{[^}]*position: relative;[^}]*z-index: 1;/);
    expect(css).toMatch(/section\.hero \{[^}]*overflow: hidden;/);
  });
});

describe('CSS do Hero (S-03)', () => {
  const css = ler('src/sections/Hero/Hero.module.css');

  it('altura mínima max(100svh, 640px) e padding 128/64 → 148/88 → 152/96', () => {
    expect(css).toMatch(/section\.hero \{[^}]*min-height: max\(100svh, 640px\);/);
    expect(css).toMatch(
      /section\.hero \{[^}]*padding-block: calc\(var\(--header-height\) \+ var\(--space-16\)\) var\(--section-py\);/,
    );
    expect(css).toMatch(
      /@media \(min-width: 640px\) \{\s*section\.hero \{\s*padding-top: calc\(var\(--header-height\) \+ 80px\);/,
    );
    expect(css).toMatch(
      /@media \(min-width: 1024px\) \{\s*section\.hero \{\s*padding-bottom: var\(--space-24\);/,
    );
  });

  it('fundo com os dois brilhos do DS-01', () => {
    expect(css).toMatch(/background-image: var\(--hero-glow-1\), var\(--hero-glow-2\);/);
  });

  it('desktop: 2 colunas iguais com 64 px; nome em bloco (quebra só no desktop)', () => {
    expect(css).toMatch(/\.grade \{[^}]*grid-template-columns: minmax\(0, 1fr\);/);
    expect(css).toMatch(
      /@media \(min-width: 1024px\) \{[\s\S]*\.grade \{\s*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);\s*gap: var\(--space-16\);/,
    );
    expect(css).toMatch(/@media \(min-width: 1024px\) \{[\s\S]*\.nome \{\s*display: block;/);
    expect(css).not.toMatch(/^\.nome \{/m);
  });

  it('espaços: pílula → H1 24, H1 → subtítulo 24, → assinatura 20, → botões 40; botões com --button-gap', () => {
    expect(css).toMatch(/\.pilula \{\s*margin-bottom: var\(--space-6\);/);
    expect(css).toMatch(
      /\.subtitulo \{\s*margin-top: var\(--space-6\);[^}]*color: var\(--color-text-secondary\);/,
    );
    expect(css).toMatch(/\.assinatura \{\s*margin-top: 20px;/);
    expect(css).toMatch(/\.botoes \{[^}]*margin-top: 40px;[^}]*gap: var\(--button-gap\);/);
  });

  it('assinatura 16 px itálico, cor #A82560/#FFB3D1 e barra de 3 px --color-accent com recuo de 16', () => {
    expect(css).toMatch(/\.assinatura \{[^}]*padding-inline-start: var\(--space-4\);/);
    expect(css).toMatch(
      /\.assinatura \{[^}]*border-inline-start: 3px solid var\(--color-accent\);/,
    );
    expect(css).toMatch(/\.assinatura \{[^}]*color: var\(--color-text-pink-on-tint\);/);
    expect(css).toMatch(
      /\.assinatura \{[^}]*font-size: var\(--fs-signature\);[^}]*font-style: italic;/,
    );
  });

  it('celular: botões empilhados; a partir de 640 px em linha', () => {
    expect(css).toMatch(/\.botoes \{[^}]*flex-direction: column;/);
    expect(css).toMatch(/@media \(min-width: 640px\) \{[\s\S]*\.botoes \{\s*flex-flow: row wrap;/);
    const tsx = ler('src/sections/Hero/HeroText.tsx');
    expect(tsx.match(/fullWidthOnMobile/g)).toHaveLength(2);
  });

  it('sem animação, sem transição e sem hex', () => {
    expect(css).not.toMatch(/transition|animation|@keyframes/);
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });

  it('nenhum texto fixo no JSX nem data-reveal/data-bg-slot (CC-1, CC-6)', () => {
    for (const arquivo of ['Hero.tsx', 'HeroText.tsx']) {
      const tsx = ler(`src/sections/Hero/${arquivo}`)
        .replace(/\/\/.*$/gm, '')
        .replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
      expect(tsx).not.toMatch(/>\s*[A-Za-zÀ-ÿ0-9][^<{]*<\//);
      expect(tsx).not.toMatch(/data-reveal|data-bg-slot/);
    }
  });
});
