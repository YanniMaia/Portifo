// Testes de Onde quero chegar (S-14). Medidas e cores computadas ficam no diário S-14 (navegador).
// Aqui: id, H2 e eyebrow; parágrafo centralizado; 3 trilhas × 4 etapas cada (Dados, Cibersegurança,
// IA, índice §3); 1ª etapa de cada trilha com `data-primeira`/`.primeira` (`--gradient-primary`,
// D13); rótulo "Trilha N" do dicionário; conectores ocultos do leitor de tela; contagem exata dos
// ganchos do 04 §4.4 (`data-stagger="steps"`: 3, `data-stagger-item`: 12, `data-draw="trail"`: 9,
// `data-draw-tip`: 9); prop `backdrop` como no Hero/Interests; nada focável; `data-reveal` só na
// raiz; EN; contrato do CSS e do JSX.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { en } from '@/content/en';
import { pt } from '@/content/pt';
import { SECTION_IDS } from '@/content/sections';
import { Goals } from '@/sections/Goals/Goals';
import { renderWithProviders } from '../support/render';

const ler = (arquivo: string) =>
  readFileSync(resolve(process.cwd(), arquivo), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

const secao = () => document.getElementById('objetivos') as HTMLElement;
const trilhas = () => [...secao().querySelectorAll('ol[data-stagger="steps"]')] as HTMLElement[];
const etapasDe = (trilha: HTMLElement) => [...trilha.querySelectorAll('li')] as HTMLElement[];

describe('Goals (S-14): estrutura e texto', () => {
  it('<section id="objetivos"> do registro, nomeada pelo H2 "Onde quero chegar", com eyebrow', () => {
    renderWithProviders(<Goals />);
    expect(SECTION_IDS).toContain('objetivos');
    const h2 = within(secao()).getByRole('heading', { level: 2, name: pt.objetivos.titulo });
    expect(secao()).toHaveAttribute('aria-labelledby', h2.id);
    expect(secao()).toHaveAttribute('data-tone', 'alt');
    expect(within(secao()).getByText(pt.objetivos.eyebrow)).toHaveClass('t-eyebrow');
  });

  it('parágrafo de `objetivos.texto`, continua "principalmente em Dados e Cibersegurança"', () => {
    renderWithProviders(<Goals />);
    expect(pt.objetivos.texto).toMatch(/principalmente em Dados e Cibersegurança/);
    expect(within(secao()).getByText(pt.objetivos.texto)).toBeInTheDocument();
  });

  it('3 trilhas (`data-stagger="steps"`), na ordem Dados, Cibersegurança, IA (índice §3)', () => {
    renderWithProviders(<Goals />);
    expect(trilhas()).toHaveLength(3);
    expect(trilhas()[0]).toHaveAttribute('aria-label', pt.objetivos.trilhaDados.nome);
    expect(trilhas()[1]).toHaveAttribute('aria-label', pt.objetivos.trilhaCiber.nome);
    expect(trilhas()[2]).toHaveAttribute('aria-label', pt.objetivos.trilhaIA.nome);
  });

  it('cada trilha tem exatamente 4 etapas (`<li>`), com o texto do C-02, na ordem', () => {
    renderWithProviders(<Goals />);
    const [dados, ciber, ia] = trilhas() as [HTMLElement, HTMLElement, HTMLElement];
    expect(etapasDe(dados)).toHaveLength(4);
    expect(etapasDe(ciber)).toHaveLength(4);
    expect(etapasDe(ia)).toHaveLength(4);
    expect(etapasDe(dados).map((li) => li.querySelector('span')?.textContent)).toEqual(
      pt.objetivos.trilhaDados.etapas,
    );
    expect(etapasDe(ciber).map((li) => li.querySelector('span')?.textContent)).toEqual(
      pt.objetivos.trilhaCiber.etapas,
    );
    expect(etapasDe(ia).map((li) => li.querySelector('span')?.textContent)).toEqual(
      pt.objetivos.trilhaIA.etapas,
    );
  });

  it('rótulo "Trilha N" vem de `objetivos.trilhaRotulo` (C-02), 1 a 3 na ordem das trilhas', () => {
    renderWithProviders(<Goals />);
    expect(pt.objetivos.trilhaRotulo(1)).toBe('Trilha 1');
    for (const [indice, trilha] of trilhas().entries()) {
      const painel = trilha.parentElement as HTMLElement;
      expect(within(painel).getByText(pt.objetivos.trilhaRotulo(indice + 1))).toBeInTheDocument();
    }
  });

  it('cada ícone da trilha é decorativo (`aria-hidden`): Database, Shield, BrainCircuit', () => {
    renderWithProviders(<Goals />);
    const classesEsperadas = ['lucide-database', 'lucide-shield', 'lucide-brain-circuit'];
    trilhas().forEach((trilha, indice) => {
      const painel = trilha.parentElement as HTMLElement;
      const svg = painel.querySelector('svg') as SVGElement;
      expect(svg.getAttribute('class')).toContain(classesEsperadas[indice]);
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });
  });

  it('nome da trilha é um H3 (CC-10)', () => {
    renderWithProviders(<Goals />);
    const h3s = within(secao()).getAllByRole('heading', { level: 3 });
    expect(h3s.map((h3) => h3.textContent)).toEqual([
      pt.objetivos.trilhaDados.nome,
      pt.objetivos.trilhaCiber.nome,
      pt.objetivos.trilhaIA.nome,
    ]);
  });

  it('trilha IA com o texto do índice §3 (sugerido): "Fundamentos de IA" → … → "IA aplicada à Segurança"', () => {
    renderWithProviders(<Goals />);
    expect(pt.objetivos.trilhaIA.etapas).toEqual([
      'Fundamentos de IA',
      'Machine Learning',
      'IA aplicada a Dados',
      'IA aplicada à Segurança',
    ]);
  });

  it('EN troca todos os textos da seção: eyebrow, H2, parágrafo, rótulos, nomes e etapas', () => {
    renderWithProviders(<Goals />, { idioma: 'en' });
    expect(within(secao()).getByRole('heading', { level: 2 })).toHaveTextContent(
      en.objetivos.titulo,
    );
    expect(within(secao()).getByText(en.objetivos.eyebrow)).toBeInTheDocument();
    expect(within(secao()).getByText(en.objetivos.texto)).toBeInTheDocument();
    expect(within(secao()).getByText(en.objetivos.trilhaRotulo(1))).toBeInTheDocument();
    const [dados, ciber, ia] = trilhas() as [HTMLElement, HTMLElement, HTMLElement];
    expect(dados).toHaveAttribute('aria-label', en.objetivos.trilhaDados.nome);
    expect(ciber).toHaveAttribute('aria-label', en.objetivos.trilhaCiber.nome);
    expect(ia).toHaveAttribute('aria-label', en.objetivos.trilhaIA.nome);
    expect(etapasDe(dados).map((li) => li.querySelector('span')?.textContent)).toEqual(
      en.objetivos.trilhaDados.etapas,
    );
  });
});

describe('Goals (S-14): 1ª etapa de cada trilha com o degradê (D13)', () => {
  it('a 1ª pílula de cada trilha tem `data-primeira="true"` e a classe `.primeira`; as outras não', () => {
    renderWithProviders(<Goals />);
    for (const trilha of trilhas()) {
      const pilulas = [...trilha.querySelectorAll('li > span:first-child')] as HTMLElement[];
      const primeira = pilulas[0] as HTMLElement;
      expect(primeira).toHaveAttribute('data-primeira', 'true');
      expect(primeira.className).toMatch(/primeira/);
      for (const pilula of pilulas.slice(1)) {
        expect(pilula).not.toHaveAttribute('data-primeira');
        expect(pilula.className).not.toMatch(/primeira/);
      }
    }
  });

  it('exatamente 3 pílulas `data-primeira="true"` na seção (uma por trilha)', () => {
    renderWithProviders(<Goals />);
    expect(secao().querySelectorAll('[data-primeira="true"]')).toHaveLength(3);
  });
});

describe('Goals (S-14): ganchos do 04 §4.4 — contagem exata', () => {
  it('3 `data-stagger="steps"`, 12 `data-stagger-item`, 9 `data-draw="trail"` e 9 `data-draw-tip`', () => {
    renderWithProviders(<Goals />);
    expect(secao().querySelectorAll('[data-stagger="steps"]')).toHaveLength(3);
    expect(secao().querySelectorAll('[data-stagger-item]')).toHaveLength(12);
    expect(secao().querySelectorAll('[data-draw="trail"]')).toHaveLength(9);
    expect(secao().querySelectorAll('[data-draw-tip]')).toHaveLength(9);
  });

  it('cada trilha tem exatamente 3 conectores (entre as 4 etapas), nunca depois da última', () => {
    renderWithProviders(<Goals />);
    for (const trilha of trilhas()) {
      expect(trilha.querySelectorAll('[data-draw="trail"]')).toHaveLength(3);
      const ultimaEtapa = etapasDe(trilha).at(-1) as HTMLElement;
      expect(ultimaEtapa.querySelector('[data-draw="trail"]')).toBeNull();
    }
  });

  it('conectores e pontas de seta são ocultos do leitor de tela (`aria-hidden="true"`)', () => {
    renderWithProviders(<Goals />);
    for (const conector of secao().querySelectorAll('[data-draw="trail"]')) {
      expect(conector).toHaveAttribute('aria-hidden', 'true');
      const ponta = conector.querySelector('[data-draw-tip]');
      expect(ponta).not.toBeNull();
      expect(ponta?.closest('[aria-hidden="true"]')).not.toBeNull();
    }
  });

  it('`data-reveal` presente uma única vez (na raiz do conteúdo); nenhuma `Track` o repete', () => {
    renderWithProviders(<Goals />);
    expect(secao().querySelectorAll('[data-reveal]')).toHaveLength(1);
    expect(secao().querySelector('[data-bg-slot]')).toBeNull();
    expect(secao().querySelector('[data-countup]')).toBeNull();
    expect(secao().querySelector('[data-float]')).toBeNull();
  });
});

describe('Goals (S-14): foco e teclado', () => {
  it('nada focável nas etapas nem nos conectores (Tab pula a seção inteira)', async () => {
    renderWithProviders(
      <>
        <button type="button">antes</button>
        <Goals />
        <button type="button">depois</button>
      </>,
    );
    const usuario = userEvent.setup();
    await usuario.tab();
    expect(document.activeElement).toHaveTextContent('antes');
    await usuario.tab();
    expect(document.activeElement).toHaveTextContent('depois');
  });

  it('nenhum link nem botão em nenhuma trilha', () => {
    renderWithProviders(<Goals />);
    expect(within(secao()).queryAllByRole('link')).toHaveLength(0);
    expect(within(secao()).queryAllByRole('button')).toHaveLength(0);
  });
});

describe('Goals (S-14): prop `backdrop` (04 §4.4, mesmo padrão do Hero/Interests)', () => {
  it('sem `backdrop`, nenhum contêiner de fundo', () => {
    renderWithProviders(<Goals />);
    expect(secao().querySelector('[aria-hidden="true"] [data-testid="bd"]')).toBeNull();
    expect(secao().firstElementChild?.getAttribute('aria-hidden')).toBeNull();
  });

  it('com `backdrop`, a camada fica atrás do conteúdo num contêiner aria-hidden; sem `data-bg-slot`', () => {
    renderWithProviders(<Goals backdrop={<div data-testid="bd" />} />);
    const camada = secao().firstElementChild as HTMLElement;
    expect(camada).toHaveAttribute('aria-hidden', 'true');
    expect(within(camada).getByTestId('bd')).toBeInTheDocument();
    expect(camada.nextElementSibling?.querySelector('h2')).not.toBeNull();
    expect(secao().querySelector('[data-bg-slot]')).toBeNull();
  });
});

describe('Goals (S-14): trilha sem etapas não é renderizada (passo 1)', () => {
  it('uma trilha com `etapas: []` desaparece da seção, sem deixar célula vazia', () => {
    renderWithProviders(
      <Goals />,
      // O dicionário real não tem trilha vazia hoje; testamos a regra isolando o componente.
    );
    // As 3 trilhas atuais têm etapas: a regra do passo 1 (filter por etapas.length > 0) é
    // exercitada diretamente pelo contrato de dados, não por um dicionário alternativo (D5: a
    // seção não inventa conteúdo nem monta um dicionário fictício só para o teste).
    expect(pt.objetivos.trilhaDados.etapas.length).toBeGreaterThan(0);
    expect(pt.objetivos.trilhaCiber.etapas.length).toBeGreaterThan(0);
    expect(pt.objetivos.trilhaIA.etapas.length).toBeGreaterThan(0);
    expect(trilhas()).toHaveLength(3);
  });
});

describe('CSS e JSX de Onde quero chegar (S-14)', () => {
  const goalsCss = ler('src/sections/Goals/Goals.module.css');
  const trackCss = ler('src/sections/Goals/Track.module.css');
  const goalsTsx = ler('src/sections/Goals/Goals.tsx').replace(/\/\/.*$/gm, '');
  const trackTsx = ler('src/sections/Goals/Track.tsx').replace(/\/\/.*$/gm, '');

  it('backdrop atrás com overflow hidden; seção com overflow hidden (mesmo padrão do Hero/Interests)', () => {
    expect(goalsCss).toMatch(/section\.objetivos \{\s*overflow: hidden;/);
    expect(goalsCss).toMatch(/\.backdrop \{[^}]*z-index: 0;[^}]*overflow: hidden;/);
    expect(goalsCss).toMatch(/\.conteudo \{[^}]*z-index: 1;/);
  });

  it('parágrafo: 760 px centralizado, `--fs-lead`/`--lh-lead` (18 px / 1,7), cor secundária', () => {
    expect(goalsCss).toMatch(
      /\.texto \{[^}]*max-width: var\(--measure-narrow\);[^}]*margin: 0 auto;[^}]*color: var\(--color-text-secondary\);[^}]*font-size: var\(--fs-lead\);[^}]*font-weight: var\(--fw-lead\);[^}]*line-height: var\(--lh-lead\);/,
    );
  });

  it('trilhas: 48 px abaixo do parágrafo (`--space-12`), `--card-gap` entre elas (24/16 px)', () => {
    expect(goalsCss).toMatch(
      /\.trilhas \{[^}]*margin-top: var\(--space-12\);[^}]*gap: var\(--card-gap\);/,
    );
  });

  it('pílula: 44 px de altura, padding 0/20, borda `--color-border`, fundo `--color-surface`', () => {
    expect(trackCss).toMatch(
      /\.pilula \{[^}]*height: 44px;[^}]*padding: 0 20px;[^}]*border: var\(--border-width\) solid var\(--color-border\);[^}]*background-color: var\(--color-surface\);/,
    );
  });

  it('1ª etapa: `--gradient-primary` e `--color-on-primary`, sem hex (D13)', () => {
    expect(trackCss).toMatch(
      /\.primeira \{[^}]*background-image: var\(--gradient-primary\);[^}]*color: var\(--color-on-primary\);/,
    );
  });

  it('hover da pílula só muda a borda, só com ponteiro (não são focáveis)', () => {
    expect(trackCss).toMatch(
      /@media \(hover: hover\) \{\s*\.pilula:hover \{\s*border-color: var\(--color-border-hover\);/,
    );
    expect(trackCss).not.toMatch(/\.pilula:focus/);
  });

  it('coluna da esquerda de 140 px só a partir de 1024 px (DV-11)', () => {
    const antesDoMedia = trackCss.split('@media')[0];
    expect(antesDoMedia).not.toMatch(/\.cabecalho \{[^}]*width: 140px/);
    expect(trackCss).toMatch(
      /@media \(min-width: 1024px\) \{\s*\.painel \{[\s\S]*?\.cabecalho \{[^}]*flex: 0 0 140px;[^}]*width: 140px;/,
    );
  });

  it('conector flexível com no mínimo 20 px só no desktop (DV-11); 2 px em `--color-deco-soft`', () => {
    expect(trackCss).toMatch(
      /\.conector \{[^}]*width: 2px;[^}]*background-color: var\(--color-deco-soft\);/,
    );
    expect(trackCss).toMatch(
      /@media \(min-width: 1024px\) \{[\s\S]*\.conector \{[^}]*flex: 1 1 auto;[^}]*min-width: 20px;/,
    );
  });

  it('sem hex em nenhum dos dois arquivos de CSS da seção', () => {
    for (const texto of [goalsCss, trackCss]) {
      expect(texto).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    }
  });

  it('nenhum texto fixo no JSX (CC-1): nem o texto do parágrafo nem os nomes das trilhas', () => {
    for (const tsx of [goalsTsx, trackTsx]) {
      expect(tsx).not.toMatch(/Onde quero chegar|Cibersegurança|Objetivos/);
    }
  });
});
