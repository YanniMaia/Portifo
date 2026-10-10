// Testes do Header (S-01). Medidas, cores e o "cabe em 1024 px" são medidos no navegador (diário
// S-01). Aqui ficam os links do registro, o item ativo, o gancho `data-scrolled`, a rolagem do F-13,
// a ordem de foco com o SkipLink do F-14, a ausência do PT/EN (V1) e o contrato do CSS.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SkipLink } from '@/components/SkipLink';
import { en } from '@/content/en';
import { pt } from '@/content/pt';
import { NAV_ITEMS, SECTION_IDS, type NavTarget } from '@/content/sections';
import { LanguageProvider } from '@/i18n/LanguageProvider';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { Header } from '@/sections/Header/Header';

const estado = vi.hoisted(() => ({ ativo: null as NavTarget | null }));

vi.mock('@/hooks/useActiveSection', () => ({
  useActiveSection: () => estado.ativo,
}));

const rolagem = vi.hoisted(() => ({ scrollToSection: vi.fn(), scrollToTop: vi.fn() }));

vi.mock('@/lib/scroll', () => rolagem);

const ler = (arquivo: string) =>
  readFileSync(resolve(process.cwd(), arquivo), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

const html = document.documentElement;

function montar(lang = 'pt-BR', comSkip = false) {
  html.lang = lang;
  return render(
    <ThemeProvider>
      <LanguageProvider>
        {comSkip ? <SkipLink /> : null}
        <Header />
      </LanguageProvider>
    </ThemeProvider>,
  );
}

function rolarPara(y: number) {
  Object.defineProperty(window, 'scrollY', { configurable: true, value: y });
  act(() => {
    window.dispatchEvent(new Event('scroll'));
  });
}

beforeEach(() => {
  estado.ativo = null;
  rolagem.scrollToSection.mockClear();
  rolagem.scrollToTop.mockClear();
  rolarPara(0);
});

afterEach(() => {
  html.lang = 'pt-BR';
  html.dataset.theme = 'light';
  localStorage.clear();
});

describe('Header (S-01)', () => {
  it('um <header> (banner) com o <nav> rotulado pelo dicionário', () => {
    montar();
    const header = screen.getByRole('banner');
    expect(header.tagName).toBe('HEADER');
    expect(within(header).getByRole('navigation', { name: pt.menu.navAria })).toBeInTheDocument();
  });

  it('6 links com href e rótulo iguais ao registro (F-12) e ao dicionário (C-02)', () => {
    montar();
    const nav = screen.getByRole('navigation', { name: pt.menu.navAria });
    const links = within(nav).getAllByRole('link');
    expect(links).toHaveLength(NAV_ITEMS.length);
    expect(links.map((l) => l.getAttribute('href'))).toEqual(NAV_ITEMS.map((i) => `#${i.id}`));
    expect(links.map((l) => l.textContent)).toEqual(NAV_ITEMS.map((i) => pt.nav[i.id]));
  });

  it('EN troca os rótulos do menu, da logo e do <nav>', () => {
    montar('en');
    const nav = screen.getByRole('navigation', { name: en.menu.navAria });
    expect(
      within(nav)
        .getAllByRole('link')
        .map((l) => l.textContent),
    ).toEqual(NAV_ITEMS.map((i) => en.nav[i.id]));
    expect(screen.getByRole('link', { name: en.marca.aria })).toBeInTheDocument();
  });

  it('logo: link para a 1ª seção do registro, nome visível e monograma decorativo', () => {
    montar();
    const logo = screen.getByRole('link', { name: pt.marca.aria });
    expect(logo).toHaveAttribute('href', `#${SECTION_IDS[0]}`);
    expect(logo).toHaveTextContent(pt.marca.nome);
    expect(logo.querySelector('[aria-hidden="true"]')).toHaveTextContent('YE');
    expect(logo.querySelector('button')).toBeNull(); // V1: monograma não clicável
  });

  it('nenhum item ativo quando o hook devolve null (hero e faixa)', () => {
    montar();
    const nav = screen.getByRole('navigation');
    for (const link of within(nav).getAllByRole('link')) {
      expect(link).not.toHaveAttribute('aria-current');
      expect(link).not.toHaveAttribute('data-active');
    }
  });

  it.each(NAV_ITEMS.map((i) => i.id))(
    'item ativo "%s": aria-current="location" e data-active só nele',
    (id) => {
      estado.ativo = id;
      montar();
      const nav = screen.getByRole('navigation');
      const ativos = within(nav)
        .getAllByRole('link')
        .filter((l) => l.hasAttribute('aria-current'));
      expect(ativos).toHaveLength(1);
      expect(ativos[0]).toHaveAttribute('aria-current', 'location');
      expect(ativos[0]).toHaveAttribute('data-active', 'true');
      expect(ativos[0]).toHaveAttribute('href', `#${id}`);
    },
  );

  it('clique simples num link chama scrollToSection (F-13) e não segue o href nativo', () => {
    montar();
    const link = screen.getByRole('link', { name: pt.nav.projetos });
    const evento = fireEvent.click(link);
    expect(evento).toBe(false); // preventDefault
    expect(rolagem.scrollToSection).toHaveBeenCalledWith('projetos');
  });

  it('clique com Ctrl/⌘ segue o comportamento nativo (sem interceptar)', () => {
    montar();
    fireEvent.click(screen.getByRole('link', { name: pt.nav.sobre }), { ctrlKey: true });
    fireEvent.click(screen.getByRole('link', { name: pt.nav.sobre }), { metaKey: true });
    expect(rolagem.scrollToSection).not.toHaveBeenCalled();
  });

  it('clique na logo chama scrollToTop (F-13)', () => {
    montar();
    fireEvent.click(screen.getByRole('link', { name: pt.marca.aria }));
    expect(rolagem.scrollToTop).toHaveBeenCalledTimes(1);
  });

  it('data-scrolled no <header>: "false" até 8 px e "true" depois', () => {
    montar();
    const header = screen.getByRole('banner');
    expect(header).toHaveAttribute('data-scrolled', 'false');
    rolarPara(8);
    expect(header).toHaveAttribute('data-scrolled', 'false');
    rolarPara(9);
    expect(header).toHaveAttribute('data-scrolled', 'true');
    rolarPara(0);
    expect(header).toHaveAttribute('data-scrolled', 'false');
  });

  it('montado já rolado: data-scrolled="true" desde o início', () => {
    rolarPara(400);
    montar();
    expect(screen.getByRole('banner')).toHaveAttribute('data-scrolled', 'true');
  });

  it('o SkipLink do F-14 continua sendo o 1º focável; depois vêm logo, links e tema', async () => {
    const usuario = userEvent.setup();
    montar('pt-BR', true);
    await usuario.tab();
    expect(screen.getByRole('link', { name: pt.a11y.skipToContent })).toHaveFocus();
    await usuario.tab();
    expect(screen.getByRole('link', { name: pt.marca.aria })).toHaveFocus();
    for (const item of NAV_ITEMS) {
      await usuario.tab();
      expect(screen.getByRole('link', { name: pt.nav[item.id] })).toHaveFocus();
    }
    await usuario.tab();
    expect(screen.getByRole('button', { name: pt.a11y.themeToDark })).toHaveFocus();
  });

  it('V1: sem botão PT/EN (DS-20 ⏭ V2); só o botão de tema', () => {
    montar();
    const botoes = screen.getAllByRole('button');
    expect(botoes).toHaveLength(1);
    expect(botoes[0]).toHaveAccessibleName(pt.a11y.themeToDark);
    expect(screen.queryByText(/PT\s*\/\s*EN/)).toBeNull();
  });

  it('nenhum SkipLink criado pelo Header', () => {
    montar();
    expect(screen.queryByRole('link', { name: pt.a11y.skipToContent })).toBeNull();
  });

  it('nenhum texto fixo no JSX nem id de seção escrito à mão (D5, D14)', () => {
    const tsx = ler('src/sections/Header/Header.tsx').replace(/\/\/.*$/gm, '');
    expect(tsx).not.toMatch(/>\s*[A-Za-zÀ-ÿ0-9][^<{]*</);
    for (const id of SECTION_IDS) expect(tsx).not.toMatch(new RegExp(`['"\`#]${id}['"\`]`));
  });
});

describe('CSS do Header (S-01)', () => {
  const css = ler('src/sections/Header/Header.module.css');

  it('fixo, largura total, altura --header-height', () => {
    expect(css).toMatch(/header\.bar \{[^}]*position: fixed;/);
    expect(css).toMatch(/header\.bar \{[^}]*inset: 0 0 auto;/);
    expect(css).toMatch(/header\.bar \{[^}]*height: var\(--header-height\);/);
  });

  it('sem sombra e sem transição de box-shadow no módulo (a sombra é o ::after do GlassPanel)', () => {
    expect(css).not.toMatch(/box-shadow/);
    expect(css).not.toMatch(/transition/);
  });

  it('links 15 px/500, cor secundária, 32 px entre eles; ativo --color-link/600', () => {
    expect(css).toMatch(/\.lista \{[^}]*gap: var\(--space-8\);/);
    expect(css).toMatch(/\.link \{[^}]*color: var\(--color-text-secondary\);/);
    expect(css).toMatch(/\.link \{[^}]*font-size: var\(--fs-nav\);/);
    expect(css).toMatch(/\.link \{[^}]*font-weight: var\(--fw-nav\);/);
    expect(css).toMatch(
      /\.link\[aria-current='location'\] \{[^}]*color: var\(--color-link\);[^}]*font-weight: var\(--fw-nav-active\);/,
    );
  });

  it('sublinhado 2 px: scaleX(0) em repouso, scaleX(1) no hover e no ativo, a partir do centro', () => {
    expect(css).toMatch(/\.link::after \{[^}]*height: 2px;[^}]*transform: scaleX\(0\);/);
    expect(css).toMatch(/\.link::after \{[^}]*transform-origin: center;/);
    expect(css).toMatch(/\.link:hover::after \{\s*transform: scaleX\(1\);/);
    expect(css).toMatch(/\.link\[aria-current='location'\]::after \{\s*transform: scaleX\(1\);/);
  });

  it('nav some abaixo de 1024 px (display: none) e volta a partir de 1024 px', () => {
    expect(css).toMatch(/\.nav \{\s*display: none;\s*\}/);
    expect(css).toMatch(/@media \(min-width: 1024px\) \{\s*\.nav \{\s*display: block;/);
  });

  it('fallback sem backdrop-filter: --mobile-menu-bg (96%)', () => {
    expect(css).toMatch(
      /@supports not \(\(backdrop-filter: blur\(1px\)\) or \(-webkit-backdrop-filter: blur\(1px\)\)\) \{\s*header\.bar \{\s*background-color: var\(--mobile-menu-bg\);/,
    );
  });

  it('sem hex', () => {
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });
});
