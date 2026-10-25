// Testes do Rodapé (S-16). Medidas, cores e os 24 px da linha final (DV-2) ficam no diário S-16
// (navegador). Aqui: 6 links rápidos do registro (F-12) com rolagem do F-13; ícones sociais com
// `aria-label`, destino e aviso de nova aba; "Voltar ao topo" chama `scrollToTop` e tem
// `href="#inicio"`; ordem "Feito por…" → "Voltar ao topo" no DOM; EN troca todos os textos; nenhum
// texto fixo no JSX (CC-1); 2026 vem do dicionário, nunca de `Date`.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fireEvent, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { en } from '@/content/en';
import { pt } from '@/content/pt';
import { NAV_ITEMS, SECTION_IDS } from '@/content/sections';
import { site } from '@/content/site';
import { Footer } from '@/sections/Footer/Footer';
import { renderWithProviders } from '../support/render';

const ler = (arquivo: string) =>
  readFileSync(resolve(process.cwd(), arquivo), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

const rodape = () => screen.getByRole('contentinfo');

const rolagem = vi.hoisted(() => ({ scrollToSection: vi.fn(), scrollToTop: vi.fn() }));
vi.mock('@/lib/scroll', () => rolagem);

afterEach(() => {
  rolagem.scrollToSection.mockClear();
  rolagem.scrollToTop.mockClear();
});

describe('Footer (S-16): estrutura', () => {
  it('um <footer> (contentinfo), fora do registro de seções (F-12)', () => {
    renderWithProviders(<Footer />);
    expect(rodape().tagName).toBe('FOOTER');
    expect(SECTION_IDS).not.toContain('rodape');
  });

  it('coluna 1: monograma decorativo "YE" + nome visível, sem ser um link', () => {
    renderWithProviders(<Footer />);
    const nome = within(rodape()).getByText(pt.marca.nome);
    expect(nome).toBeInTheDocument();
    expect(within(rodape()).getByText('YE')).toHaveAttribute('aria-hidden', 'true');
    expect(nome.closest('a')).toBeNull();
  });

  it('frase curta de `rodape.frase` na coluna 1', () => {
    renderWithProviders(<Footer />);
    expect(within(rodape()).getByText(pt.rodape.frase)).toBeInTheDocument();
  });

  it('título "Links rápidos" e "Social" com a classe `.t-eyebrow` (caixa alta permitida só nela)', () => {
    renderWithProviders(<Footer />);
    expect(within(rodape()).getByText(pt.rodape.linksRapidos)).toHaveClass('t-eyebrow');
    expect(within(rodape()).getByText(pt.rodape.socialTitulo)).toHaveClass('t-eyebrow');
  });
});

describe('Footer (S-16): 6 links rápidos (F-12)', () => {
  it('<nav> rotulado por `rodape.navAria` com os 6 `NAV_ITEMS`, href e rótulo corretos', () => {
    renderWithProviders(<Footer />);
    const nav = within(rodape()).getByRole('navigation', { name: pt.rodape.navAria });
    const links = within(nav).getAllByRole('link');
    expect(links).toHaveLength(NAV_ITEMS.length);
    expect(links.map((l) => l.getAttribute('href'))).toEqual(NAV_ITEMS.map((i) => `#${i.id}`));
    expect(links.map((l) => l.textContent)).toEqual(NAV_ITEMS.map((i) => pt.nav[i.id]));
  });

  it('clique simples num link chama `scrollToSection` (F-13) e não segue o href nativo', () => {
    renderWithProviders(<Footer />);
    const link = screen.getByRole('link', { name: pt.nav.projetos });
    const resultado = fireEvent.click(link);
    expect(resultado).toBe(false); // preventDefault
    expect(rolagem.scrollToSection).toHaveBeenCalledWith('projetos');
  });

  it('clique com Ctrl/⌘ segue o comportamento nativo (sem interceptar)', () => {
    renderWithProviders(<Footer />);
    fireEvent.click(screen.getByRole('link', { name: pt.nav.sobre }), { ctrlKey: true });
    fireEvent.click(screen.getByRole('link', { name: pt.nav.sobre }), { metaKey: true });
    expect(rolagem.scrollToSection).not.toHaveBeenCalled();
  });
});

describe('Footer (S-16): ícones sociais', () => {
  const svgDe = (link: HTMLElement) => link.querySelector('svg') as SVGElement;

  it('3 ícones com `aria-label` de `rodape.social.*Aria`, na ordem LinkedIn, GitHub, E-mail', () => {
    renderWithProviders(<Footer />);
    const linkedin = screen.getByRole('link', { name: new RegExp(pt.rodape.social.linkedinAria) });
    const github = screen.getByRole('link', { name: new RegExp(pt.rodape.social.githubAria) });
    const email = screen.getByRole('link', { name: pt.rodape.social.emailAria });
    expect(linkedin).toHaveAttribute('href', site.linkedin);
    expect(github).toHaveAttribute('href', site.github);
    expect(email).toHaveAttribute('href', site.mailto);
    expect(svgDe(linkedin).getAttribute('class')).toContain('linkedin');
    expect(svgDe(github).getAttribute('class')).toContain('github');
    expect(svgDe(email).getAttribute('class')).toContain('lucide-mail');
    for (const svg of [svgDe(linkedin), svgDe(github), svgDe(email)]) {
      expect(svg).toHaveAttribute('aria-hidden', 'true');
      expect(svg).toHaveAttribute('data-icon-size', '20');
    }
  });

  it('LinkedIn e GitHub abrem em nova aba (target/rel + aviso); E-mail não', () => {
    renderWithProviders(<Footer />);
    const linkedin = screen.getByRole('link', { name: new RegExp(pt.rodape.social.linkedinAria) });
    const github = screen.getByRole('link', { name: new RegExp(pt.rodape.social.githubAria) });
    const email = screen.getByRole('link', { name: pt.rodape.social.emailAria });
    for (const externo of [linkedin, github]) {
      expect(externo).toHaveAttribute('target', '_blank');
      expect(externo).toHaveAttribute('rel', 'noopener noreferrer');
      expect(externo).toHaveAccessibleName(new RegExp(pt.a11y.opensInNewTab));
    }
    expect(email).not.toHaveAttribute('target');
    expect(email).not.toHaveAccessibleName(new RegExp(pt.a11y.opensInNewTab));
  });

  it('URL/e-mail ausente ou placeholder (D11): o ícone correspondente não é renderizado', () => {
    const tsx = ler('src/sections/Footer/Footer.tsx');
    expect(tsx).toMatch(/isPlaceholder\(rede\.href\)/);
    expect(tsx).toMatch(/rede\.href === undefined/);
  });
});

describe('Footer (S-16): linha final (DV-2)', () => {
  it('© à esquerda (`rodape.copyright`) e, à direita, "Feito por…" antes de "Voltar ao topo"', () => {
    renderWithProviders(<Footer />);
    expect(within(rodape()).getByText(pt.rodape.copyright)).toBeInTheDocument();
    const feitoPor = within(rodape()).getByText(pt.rodape.feitoPor);
    const voltar = screen.getByRole('link', { name: pt.rodape.voltarTopo });
    expect(
      feitoPor.compareDocumentPosition(voltar) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('o ano "2026" vem de `rodape.copyright` (nunca de `new Date()`)', () => {
    expect(pt.rodape.copyright).toContain('2026');
    const tsx = ler('src/sections/Footer/Footer.tsx').replace(/\/\/.*$/gm, '');
    expect(tsx).not.toMatch(/new Date\(/);
  });

  it('"Voltar ao topo": href="#inicio" e clique simples chama `scrollToTop` (F-13)', () => {
    renderWithProviders(<Footer />);
    const voltar = screen.getByRole('link', { name: pt.rodape.voltarTopo });
    expect(voltar).toHaveAttribute('href', `#${SECTION_IDS[0]}`);
    expect(voltar).toHaveAttribute('href', '#inicio');
    const resultado = fireEvent.click(voltar);
    expect(resultado).toBe(false); // preventDefault
    expect(rolagem.scrollToTop).toHaveBeenCalledTimes(1);
  });

  it('clique com Ctrl em "Voltar ao topo" segue o comportamento nativo (sem interceptar)', () => {
    renderWithProviders(<Footer />);
    const voltar = screen.getByRole('link', { name: pt.rodape.voltarTopo });
    fireEvent.click(voltar, { ctrlKey: true });
    expect(rolagem.scrollToTop).not.toHaveBeenCalled();
  });
});

describe('Footer (S-16): EN troca todos os textos', () => {
  it('EN troca marca, frase, títulos, links, social e linha final', () => {
    renderWithProviders(<Footer />, { idioma: 'en' });
    expect(within(rodape()).getByText(en.marca.nome)).toBeInTheDocument();
    expect(within(rodape()).getByText(en.rodape.frase)).toBeInTheDocument();
    expect(within(rodape()).getByText(en.rodape.linksRapidos)).toBeInTheDocument();
    expect(within(rodape()).getByText(en.rodape.socialTitulo)).toBeInTheDocument();
    const nav = within(rodape()).getByRole('navigation', { name: en.rodape.navAria });
    expect(
      within(nav)
        .getAllByRole('link')
        .map((l) => l.textContent),
    ).toEqual(NAV_ITEMS.map((i) => en.nav[i.id]));
    expect(
      screen.getByRole('link', { name: new RegExp(en.rodape.social.linkedinAria) }),
    ).toBeInTheDocument();
    expect(within(rodape()).getByText(en.rodape.copyright)).toBeInTheDocument();
    expect(within(rodape()).getByText(en.rodape.feitoPor)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: en.rodape.voltarTopo })).toBeInTheDocument();
  });
});

describe('Footer (S-16): CSS e JSX', () => {
  const tsx = ler('src/sections/Footer/Footer.tsx').replace(/\/\/.*$/gm, '');
  const css = ler('src/sections/Footer/Footer.module.css');

  it('nenhum texto fixo no JSX (CC-1)', () => {
    expect(tsx).not.toMatch(/>\s*[A-Za-zÀ-ÿ0-9][^<{]*</);
  });

  it('nenhum id de seção escrito à mão fora do destino do "Voltar ao topo" (D14)', () => {
    for (const id of SECTION_IDS.slice(1)) {
      expect(tsx).not.toMatch(new RegExp(`['"\`#]${id}['"\`]`));
    }
  });

  it('sem hex no CSS do rodapé (CC-2)', () => {
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });

  it('padding 64 px em cima / 32 px embaixo e borda superior 1 px do modo', () => {
    expect(css).toMatch(/\.rodape \{[^}]*padding-top: var\(--space-16\);/);
    expect(css).toMatch(/\.rodape \{[^}]*padding-bottom: var\(--space-8\);/);
    expect(css).toMatch(
      /\.rodape \{[^}]*border-top: var\(--border-width\) solid var\(--color-border\);/,
    );
  });

  it('desktop (≥ 1024 px): 3 colunas; tablet (640–1023 px): 2 colunas com a 1ª em largura total', () => {
    expect(css).toMatch(
      /@media \(min-width: 1024px\) \{\s*\.colunas \{\s*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\);/,
    );
    expect(css).toMatch(
      /@media \(min-width: 640px\) and \(max-width: 1023px\) \{\s*\.colunas \{\s*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/,
    );
    expect(css).toMatch(/\.marca \{\s*grid-column: 1 \/ -1;/);
  });

  it('celular: 1 coluna, 32 px entre elas (`--space-8`)', () => {
    expect(css).toMatch(
      /\.colunas \{[^}]*grid-template-columns: minmax\(0, 1fr\);[^}]*gap: var\(--space-8\);/,
    );
  });

  it('ícones sociais: círculo 44 × 44 (`--touch-min`), borda `--color-border`, hover `--color-fill-soft`', () => {
    expect(css).toMatch(
      /\.socialLink \{[^}]*width: var\(--touch-min\);[^}]*height: var\(--touch-min\);[^}]*border: var\(--border-width\) solid var\(--color-border\);[^}]*border-radius: 50%;/,
    );
    expect(css).toMatch(/\.socialLink:hover \{\s*background-color: var\(--color-fill-soft\);/);
  });

  it('linha final: divisória 1 px, 32 px acima/abaixo; 24 px entre "Feito por…" e "Voltar ao topo" (`--space-6`)', () => {
    expect(css).toMatch(
      /\.final \{[^}]*margin-top: var\(--space-8\);[^}]*padding-top: var\(--space-8\);[^}]*border-top: var\(--border-width\) solid var\(--color-border\);/,
    );
    expect(css).toMatch(/\.acoesFinais \{[^}]*gap: var\(--space-6\);/);
  });

  it('celular: linha final empilhada e alinhada à esquerda', () => {
    expect(css).toMatch(
      /@media \(max-width: 639px\) \{\s*\.final \{\s*flex-direction: column;\s*align-items: flex-start;/,
    );
  });
});
