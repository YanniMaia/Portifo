// Testes da grade de projetos de estudo (S-11). Medidas e cores computadas ficam no diário S-11
// (navegador). Aqui: o projeto do painel não aparece na grade; ordem = `projetos.ts`; os 4 cards de
// estudo aparecem sem botão com os dados atuais (D14); selo "Projeto de estudo" (D17) em todos os de
// dados fictícios; imagem/ilustração com `role="img"` + `alt`; descrição inteira no DOM (corte em
// 3 linhas só no CSS); botão "GitHub" compacto e externo quando a C-06 devolve; EN; contrato do CSS.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { en } from '@/content/en';
import { PROJECTS } from '@/content/projects';
import { pt } from '@/content/pt';
import { botoesDoProjeto, projetoEmDestaque, projetosDaGrade } from '@/content/selectors';
import type { Project } from '@/content/types';
import { Projects } from '@/sections/Projects/Projects';
import { renderWithProviders } from '../support/render';

const ler = (arquivo: string) =>
  readFileSync(resolve(process.cwd(), arquivo), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

const secao = () => document.getElementById('projetos') as HTMLElement;
const painel = () => secao().querySelector('[data-card="panel"]') as HTMLElement;
const cards = () => [...secao().querySelectorAll('article[data-card="default"]')] as HTMLElement[];
const nomeDo = (card: HTMLElement) =>
  within(card).getByRole('heading', { level: 3 }).textContent ?? '';

const GERENCIADOR = 'gerenciador-de-estoque';
const ANALISE = 'analise-de-dados-vendas';

function fichas(ajustes: Record<string, Partial<Project>>): Project[] {
  return PROJECTS.map((p) => ({ ...p, ...(ajustes[p.id] ?? {}) }));
}

describe('ProjectGrid (S-11): conteúdo com os dados atuais (nada publicado)', () => {
  it('4 cards de estudo, na ordem do projects.ts, sem o projeto do painel', () => {
    renderWithProviders(<Projects />);
    const esperados = projetosDaGrade(PROJECTS);
    expect(cards()).toHaveLength(4);
    expect(cards().map(nomeDo)).toEqual(esperados.map((p) => p.nome));
    expect(esperados.map((p) => p.id)).toEqual(
      PROJECTS.filter((p) => p.id !== GERENCIADOR).map((p) => p.id),
    );
    const doPainel = projetoEmDestaque(PROJECTS) as Project;
    expect(cards().map(nomeDo)).not.toContain(doPainel.nome);
    expect(within(painel()).getByRole('heading', { level: 3 })).toHaveTextContent(doPainel.nome);
  });

  it('cards não publicados aparecem e nenhum tem botão (D14)', () => {
    renderWithProviders(<Projects />);
    for (const card of cards()) {
      expect(within(card).queryAllByRole('link')).toHaveLength(0);
      expect(within(card).queryAllByRole('button')).toHaveLength(0);
    }
  });

  it('selo "Projeto de estudo" preenchido em todos os projetos de dados fictícios, com etiqueta', () => {
    renderWithProviders(<Projects />);
    const grade = projetosDaGrade(PROJECTS);
    cards().forEach((card, i) => {
      const p = grade[i] as Project;
      expect(p.projetoDeEstudo).toBe(true);
      const selo = within(card).getByText(pt.projetos.seloEstudo);
      expect(selo).toHaveAttribute('data-variant', 'filled');
      expect(selo).toHaveAttribute('data-size', 'sm');
      expect(within(card).getByText(p.etiqueta?.pt as string)).toHaveAttribute(
        'data-variant',
        'filled',
      );
    });
  });

  it('ilustração da C-08 (padrão) com role="img" e alt em cada card, sem aria-hidden', () => {
    renderWithProviders(<Projects />);
    for (const card of cards()) {
      const img = within(card).getByRole('img');
      expect(img).toHaveAccessibleName(pt.projetos.alt.padrao);
      expect(img.closest('[aria-hidden="true"]')).toBeNull();
      expect(card.querySelector('[data-placeholder]')).toBeNull();
    }
  });

  it('descrição inteira no DOM (o corte em 3 linhas é só visual) e chips pequenos e mono', () => {
    renderWithProviders(<Projects />);
    const grade = projetosDaGrade(PROJECTS);
    cards().forEach((card, i) => {
      const p = grade[i] as Project;
      const desc = within(card).getByText(p.descricao.pt);
      expect(desc.tagName).toBe('P');
      expect(desc.className).toMatch(/descricao/);
      expect(desc).not.toHaveAttribute('aria-hidden');
      const chips = within(card).getAllByRole('listitem');
      expect(chips.map((c) => c.textContent)).toEqual(p.tecnologias);
      for (const c of chips) expect(c).toHaveAttribute('data-size', 'sm');
    });
  });

  it('cards são article interativos com filete (hover do DS-15), não focáveis por si', () => {
    renderWithProviders(<Projects />);
    for (const card of cards()) {
      expect(card).toHaveAttribute('data-interactive', 'true');
      expect(card).not.toHaveAttribute('tabindex');
      expect(card.className).toMatch(/accentBar/);
    }
  });
});

describe('ProjectGrid (S-11): fallback e botões', () => {
  it('fallback (Análise no painel): o Gerenciador entra na grade e a Análise sai', () => {
    const lista = fichas({ [ANALISE]: { publicado: true } });
    renderWithProviders(<Projects projetos={lista} />);
    const nomes = cards().map(nomeDo);
    const nomeAnalise = (PROJECTS.find((p) => p.id === ANALISE) as Project).nome;
    const nomeGerenciador = (PROJECTS.find((p) => p.id === GERENCIADOR) as Project).nome;
    expect(nomes).toHaveLength(4);
    expect(nomes[0]).toBe(nomeGerenciador);
    expect(nomes).not.toContain(nomeAnalise);
    // O Gerenciador não é projeto de estudo (P-14): sem o selo.
    const gerenciador = cards()[0] as HTMLElement;
    expect(within(gerenciador).queryByText(pt.projetos.seloEstudo)).toBeNull();
    expect(within(gerenciador).getByRole('img')).toHaveAccessibleName(pt.projetos.alt.estoque);
  });

  it('card publicado: só o botão "GitHub" da C-06, compacto (44 px), externo, com ícone', () => {
    const BIBLIOTECA = 'banco-de-dados-biblioteca';
    const lista = fichas({ [BIBLIOTECA]: { publicado: true } });
    renderWithProviders(<Projects projetos={lista} />);
    const card = cards()[0] as HTMLElement;
    const esperado = botoesDoProjeto(lista.find((p) => p.id === BIBLIOTECA) as Project);
    const links = within(card).getAllByRole('link');
    expect(links.map((a) => a.getAttribute('href'))).toEqual(esperado.map((b) => b.href));
    const github = links[0] as HTMLElement;
    expect(github).toHaveAttribute('data-size', 'compact');
    expect(github).toHaveAttribute('data-variant', 'secondary');
    expect(github).toHaveAttribute('target', '_blank');
    expect(github).toHaveAttribute('rel', 'noopener noreferrer');
    expect(github).toHaveAccessibleName(`${pt.projetos.botaoGithub} (${pt.a11y.opensInNewTab})`);
    expect(github.querySelector('svg.lucide-github')).not.toBeNull();
    // Os outros 3 continuam visíveis e sem botão.
    for (const outro of cards().slice(1)) {
      expect(within(outro).queryAllByRole('link')).toHaveLength(0);
    }
  });

  it('lista com só o projeto do painel: a grade não existe', () => {
    renderWithProviders(<Projects projetos={PROJECTS.filter((p) => p.id === GERENCIADOR)} />);
    expect(cards()).toHaveLength(0);
    expect(painel()).not.toBeNull();
  });
});

describe('ProjectGrid (S-11): idioma e ganchos', () => {
  it('EN: "Study project", etiquetas e descrições em inglês', () => {
    renderWithProviders(<Projects />, { idioma: 'en' });
    const grade = projetosDaGrade(PROJECTS);
    expect(en.projetos.seloEstudo).toBe('Study project');
    cards().forEach((card, i) => {
      const p = grade[i] as Project;
      expect(within(card).getByText(en.projetos.seloEstudo)).toBeInTheDocument();
      expect(within(card).getByText(p.etiqueta?.en as string)).toBeInTheDocument();
      expect(within(card).getByText(p.descricao.en)).toBeInTheDocument();
      expect(within(card).getByRole('img')).toHaveAccessibleName(en.projetos.alt.padrao);
    });
  });

  it('nenhum data-reveal na grade (B-6): o único fica na raiz de Projetos', () => {
    renderWithProviders(<Projects />);
    const grade = (cards()[0] as HTMLElement).parentElement as HTMLElement;
    expect(grade.hasAttribute('data-reveal')).toBe(false);
    expect(grade.querySelector('[data-reveal]')).toBeNull();
    expect(secao().querySelectorAll('[data-reveal]')).toHaveLength(1);
  });
});

describe('CSS e JSX da grade (S-11)', () => {
  const grade = ler('src/sections/Projects/ProjectGrid.module.css');
  const card = ler('src/sections/Projects/ProjectCard.module.css');

  it('3/2/1 colunas com --card-gap; 40 px abaixo do painel e 48 no desktop', () => {
    expect(grade).toMatch(
      /\.grade \{[^}]*grid-template-columns: minmax\(0, 1fr\);[^}]*margin-top: 40px;\s*gap: var\(--card-gap\);/,
    );
    expect(grade).toMatch(
      /@media \(min-width: 640px\) \{\s*\.grade \{\s*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/,
    );
    expect(grade).toMatch(
      /@media \(min-width: 1024px\) \{\s*\.grade \{\s*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\);\s*margin-top: var\(--space-12\);/,
    );
  });

  it('card em coluna com altura total; descrição em 3 linhas; botões na base', () => {
    expect(card).toMatch(/\.card \{[^}]*flex-direction: column;[^}]*height: 100%;/);
    expect(card).toMatch(/-webkit-line-clamp: 3;\s*line-clamp: 3;/);
    expect(card).toMatch(/\.descricao \{[^}]*overflow: hidden;/);
    expect(card).toMatch(/\.botoes \{\s*margin-top: auto;/);
  });

  it('sem hex, sem animação, sem transição, sem transform', () => {
    for (const texto of [grade, card]) {
      expect(texto).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
      expect(texto).not.toMatch(/animation|@keyframes|transition|transform/);
    }
  });

  it('nenhum texto fixo no JSX (CC-1)', () => {
    for (const arquivo of ['ProjectGrid.tsx', 'ProjectCard.tsx']) {
      const tsx = ler(`src/sections/Projects/${arquivo}`).replace(/\/\/.*$/gm, '');
      expect(tsx).not.toMatch(/>\s*[A-Za-zÀ-ÿ0-9][^<{]*<\//);
      expect(tsx).not.toMatch(/Projeto de estudo|GitHub|Biblioteca|Python/);
    }
  });
});
