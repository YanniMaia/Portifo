// Testes do fechamento de Projetos (S-12). Medidas e cores computadas ficam no diário S-12
// (navegador). Aqui: card "Projeto de IA — em breve" como último item da grade, na variante
// tracejada do DS-15, sem descrição, botão, chips, selo ou link; flag desligada remove o card sem
// deixar célula vazia; link final "Ver todos no GitHub →" externo para o perfil do C-04; EN; CSS.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { en } from '@/content/en';
import { CARD_IA, PROJECTS } from '@/content/projects';
import { pt } from '@/content/pt';
import { mostrarCardIA, mostrarLinkGithubGeral, projetosDaGrade } from '@/content/selectors';
import { site } from '@/content/site';
import { SUGERIDOS } from '@/content/sugeridos';
import { SHOW_AI_COMING_SOON_CARD } from '@/lib/flags';
import { Projects } from '@/sections/Projects/Projects';
import { renderWithProviders } from '../support/render';

const ler = (arquivo: string) =>
  readFileSync(resolve(process.cwd(), arquivo), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

const secao = () => document.getElementById('projetos') as HTMLElement;
const estudo = () => [...secao().querySelectorAll('article[data-card="default"]')] as HTMLElement[];
const cardIA = () => secao().querySelector('article[data-card="dashed"]');
const grade = () => (estudo()[0] as HTMLElement).parentElement as HTMLElement;
const linkFinal = () =>
  within(secao()).queryByRole('link', { name: new RegExp(escapar(pt.projetos.verTodos)) });

function escapar(texto: string): string {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

describe('Projects (S-12): card "Projeto de IA — em breve"', () => {
  it('a flag única (F-15) está ligada e a C-06 a repassa', () => {
    expect(SHOW_AI_COMING_SOON_CARD).toBe(true);
    expect(mostrarCardIA()).toBe(true);
  });

  it('é o último filho da grade (5º item com os dados atuais), depois dos 4 cards de estudo', () => {
    renderWithProviders(<Projects />);
    const ia = cardIA() as HTMLElement;
    expect(ia).not.toBeNull();
    expect(estudo()).toHaveLength(projetosDaGrade(PROJECTS).length);
    expect(grade().children).toHaveLength(estudo().length + 1);
    expect(grade().lastElementChild).toBe(ia);
  });

  it('Card variant="dashed" do DS-15, não interativo, com IconBox BrainCircuit e H3 do C-02', () => {
    renderWithProviders(<Projects />);
    const ia = cardIA() as HTMLElement;
    expect(ia).not.toHaveAttribute('data-interactive');
    const h3 = within(ia).getByRole('heading', { level: 3 });
    expect(h3).toHaveTextContent(pt.projetos.ia.titulo);
    expect(CARD_IA.tituloChave).toBe('projetos.ia.titulo');
    const svg = ia.querySelector('svg') as SVGElement;
    expect(svg.getAttribute('class')).toContain('lucide-brain-circuit');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });

  it('título sugerido (R7) e nada inventado: sem descrição, chips, selo, imagem, botão ou link', () => {
    renderWithProviders(<Projects />);
    expect(SUGERIDOS).toContain('projetos.ia.titulo');
    const ia = cardIA() as HTMLElement;
    expect(ia.querySelectorAll('p, ul, li, img, [role="img"], [data-variant]')).toHaveLength(0);
    expect(within(ia).queryAllByRole('link')).toHaveLength(0);
    expect(within(ia).queryAllByRole('button')).toHaveLength(0);
    expect(ia).not.toHaveTextContent(pt.projetos.seloEstudo);
    expect(ia.textContent).toBe(pt.projetos.ia.titulo);
  });

  it('nada focável no card (Tab passa direto)', async () => {
    renderWithProviders(
      <>
        <Projects mostrarLinkGithub={false} />
        <button type="button">depois</button>
      </>,
    );
    const usuario = userEvent.setup();
    await usuario.tab();
    expect(document.activeElement).toHaveTextContent('depois');
  });

  it('flag desligada: o card some e nº de filhos da grade = nº de cards de estudo', () => {
    renderWithProviders(<Projects mostrarCardIA={false} />);
    expect(cardIA()).toBeNull();
    expect(grade().children).toHaveLength(estudo().length);
    expect(grade().lastElementChild).toBe(estudo().at(-1));
  });

  it('EN troca o título do card', () => {
    renderWithProviders(<Projects />, { idioma: 'en' });
    expect(within(cardIA() as HTMLElement).getByRole('heading', { level: 3 })).toHaveTextContent(
      en.projetos.ia.titulo,
    );
  });
});

describe('Projects (S-12): link final "Ver todos no GitHub →"', () => {
  it('sempre visível pela C-06; aponta para o perfil do C-04 em nova aba, com aviso', () => {
    expect(mostrarLinkGithubGeral()).toBe(true);
    renderWithProviders(<Projects />);
    const link = linkFinal() as HTMLElement;
    expect(link).toHaveAttribute('href', site.github);
    expect(site.github).toBe('https://github.com/YanniMaia');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(link).toHaveAccessibleName(`${pt.projetos.verTodos} (${pt.a11y.opensInNewTab})`);
    expect(link).toHaveAttribute('data-variant', 'text');
  });

  it('fica depois da grade, fora dela, e é o último elemento do conteúdo', () => {
    renderWithProviders(<Projects />);
    const link = linkFinal() as HTMLElement;
    expect(grade().contains(link)).toBe(false);
    const bloco = link.parentElement as HTMLElement;
    expect(bloco.previousElementSibling).toBe(grade());
    expect(bloco.nextElementSibling).toBeNull();
  });

  it('é alcançável por Tab', async () => {
    renderWithProviders(<Projects />);
    const usuario = userEvent.setup();
    await usuario.tab();
    expect(document.activeElement).toBe(linkFinal());
  });

  it('sem a decisão da C-06, o link não existe', () => {
    renderWithProviders(<Projects mostrarLinkGithub={false} />);
    expect(linkFinal()).toBeNull();
  });

  it('EN troca o rótulo e o aviso', () => {
    renderWithProviders(<Projects />, { idioma: 'en' });
    const link = within(secao()).getByRole('link', {
      name: `${en.projetos.verTodos} (${en.a11y.opensInNewTab})`,
    });
    expect(link).toHaveAttribute('href', site.github);
  });
});

describe('CSS e JSX do fechamento de Projetos (S-12)', () => {
  const cardCss = ler('src/sections/Projects/AiComingSoonCard.module.css');
  const secaoCss = ler('src/sections/Projects/Projects.module.css');

  it('card de IA sem nenhuma regra de borda própria (vem do Card dashed); altura total, centralizado', () => {
    expect(cardCss).not.toMatch(/border/);
    expect(cardCss).not.toMatch(/box-shadow|background/);
    expect(cardCss).toMatch(/\.card \{[^}]*align-items: center;[^}]*justify-content: center;/);
    expect(cardCss).toMatch(/\.card \{[^}]*height: 100%;/);
    expect(cardCss).toMatch(/\.titulo \{[^}]*color: var\(--color-text-secondary\);/);
  });

  it('link final centralizado 40 px abaixo da grade', () => {
    expect(secaoCss).toMatch(/\.linkFinal \{[^}]*justify-content: center;[^}]*margin-top: 40px;/);
  });

  it('sem hex, sem animação, sem transição, sem transform', () => {
    for (const texto of [cardCss, secaoCss]) {
      expect(texto).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
      expect(texto).not.toMatch(/animation|@keyframes|transition|transform/);
    }
  });

  it('nenhum texto fixo no JSX (CC-1)', () => {
    for (const arquivo of ['AiComingSoonCard.tsx', 'Projects.tsx', 'ProjectGrid.tsx']) {
      const tsx = ler(`src/sections/Projects/${arquivo}`).replace(/\/\/.*$/gm, '');
      expect(tsx).not.toMatch(/>\s*[A-Za-zÀ-ÿ0-9][^<{]*<\//);
      expect(tsx).not.toMatch(/em breve|Ver todos|github\.com/);
    }
  });
});
