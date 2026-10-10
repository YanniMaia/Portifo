// Testes do cabeçalho de Projetos e do painel em destaque (S-10). Medidas e cores computadas ficam
// no diário S-10 (navegador). Aqui: id, H2 e subtítulo; as 3 situações da cascata da C-06 com
// fixtures; botões = exatamente os de `botoesDoProjeto` (nenhum sem destino, todos externos);
// selos (etiqueta + "Em destaque" preenchidos, "Projeto de estudo" só se a ficha pedir); imagem da
// ficha ou ilustração da C-08 com `role="img"` + `alt`; legenda de reserva só em DEV; EN; ganchos.
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { en } from '@/content/en';
import { PROJECTS } from '@/content/projects';
import { pt } from '@/content/pt';
import { SECTION_IDS } from '@/content/sections';
import { botoesDoProjeto, projetoEmDestaque } from '@/content/selectors';
import type { Project } from '@/content/types';
import { isPlaceholder } from '@/lib/placeholder';
import { Projects } from '@/sections/Projects/Projects';
import { renderWithProviders } from '../support/render';

const ler = (arquivo: string) =>
  readFileSync(resolve(process.cwd(), arquivo), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

const secao = () => document.getElementById('projetos') as HTMLElement;
const painel = () => secao().querySelector('[data-card="panel"]') as HTMLElement;

const GERENCIADOR = 'gerenciador-de-estoque';
const ANALISE = 'analise-de-dados-vendas';

/** Cópia das fichas reais com ajustes por id (só para os testes). */
function fichas(ajustes: Record<string, Partial<Project>>): Project[] {
  return PROJECTS.map((p) => ({ ...p, ...(ajustes[p.id] ?? {}) }));
}

const ficha = (id: string) => PROJECTS.find((p) => p.id === id) as Project;

describe('Projects (S-10): cabeçalho', () => {
  it('<section id="projetos"> do registro, tom alt, nomeada pelo H2, com eyebrow e subtítulo', () => {
    renderWithProviders(<Projects />);
    expect(SECTION_IDS).toContain('projetos');
    const h2 = within(secao()).getByRole('heading', { level: 2, name: pt.projetos.titulo });
    expect(secao()).toHaveAttribute('aria-labelledby', h2.id);
    expect(secao()).toHaveAttribute('data-tone', 'alt');
    expect(within(secao()).getByText(pt.projetos.eyebrow, { selector: '.t-eyebrow' })).toBeTruthy();
    expect(within(secao()).getByText(pt.projetos.subtitulo)).toBeInTheDocument();
  });
});

describe('FeaturedProject (S-10): regra de fallback da C-06 (3 situações)', () => {
  it('(c) dados atuais (nada publicado): Gerenciador de Estoque, sem nenhum botão', () => {
    renderWithProviders(<Projects />);
    expect(projetoEmDestaque(PROJECTS)?.id).toBe(GERENCIADOR);
    const p = painel();
    expect(within(p).getByRole('heading', { level: 3 })).toHaveTextContent(ficha(GERENCIADOR).nome);
    expect(within(p).queryAllByRole('link')).toHaveLength(0);
    expect(within(p).queryAllByRole('button')).toHaveLength(0);
    expect(p.querySelector('[data-size="normal"]')).toBeNull();
  });

  it('(b) Gerenciador sem repositório e Análise publicada: o painel mostra a Análise', () => {
    const lista = fichas({ [ANALISE]: { publicado: true } });
    renderWithProviders(<Projects projetos={lista} />);
    const p = painel();
    expect(within(p).getByRole('heading', { level: 3 })).toHaveTextContent(ficha(ANALISE).nome);
    const links = within(p).getAllByRole('link');
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute('href', ficha(ANALISE).linkGithub);
    expect(links[0]).toHaveAccessibleName(`${pt.projetos.botaoGithub} (${pt.a11y.opensInNewTab})`);
  });

  it('(a) Gerenciador com repositório real e demo: Gerenciador com "Ver projeto" e "GitHub"', () => {
    const lista = fichas({
      [GERENCIADOR]: {
        publicado: true,
        linkGithub: 'https://github.com/YanniMaia/gerenciador-teste',
        linkProjeto: 'https://exemplo.dev/demo',
      },
      [ANALISE]: { publicado: true },
    });
    renderWithProviders(<Projects projetos={lista} />);
    const p = painel();
    expect(within(p).getByRole('heading', { level: 3 })).toHaveTextContent(ficha(GERENCIADOR).nome);
    const [ver, github] = within(p).getAllByRole('link') as [HTMLElement, HTMLElement];
    expect(ver).toHaveAttribute('href', 'https://exemplo.dev/demo');
    expect(ver).toHaveAttribute('data-variant', 'primary');
    expect(ver).toHaveTextContent(pt.projetos.botaoVer);
    expect(github).toHaveAttribute('href', 'https://github.com/YanniMaia/gerenciador-teste');
    expect(github).toHaveAttribute('data-variant', 'secondary');
    expect(github.querySelector('svg.lucide-github')).toHaveAttribute('data-icon-size', '20');
  });

  it('botões = exatamente os de botoesDoProjeto; todos externos, com destino real', () => {
    const lista = fichas({
      [GERENCIADOR]: { publicado: true, linkGithub: 'https://github.com/YanniMaia/x' },
    });
    renderWithProviders(<Projects projetos={lista} />);
    const destaque = projetoEmDestaque(lista) as Project;
    const esperados = botoesDoProjeto(destaque);
    const links = within(painel()).getAllByRole('link');
    expect(links.map((a) => a.getAttribute('href'))).toEqual(esperados.map((b) => b.href));
    for (const a of links) {
      const href = a.getAttribute('href') ?? '';
      expect(href).not.toBe('');
      expect(isPlaceholder(href)).toBe(false);
      expect(a).toHaveAttribute('target', '_blank');
      expect(a).toHaveAttribute('rel', 'noopener noreferrer');
      expect(a.querySelector('.visually-hidden')).toHaveTextContent(pt.a11y.opensInNewTab);
    }
    // O `linkProjeto` do Gerenciador é placeholder em DEV: o "Ver projeto" não existe.
    expect(within(painel()).queryByText(pt.projetos.botaoVer)).toBeNull();
  });

  it('lista vazia: o painel não é renderizado', () => {
    renderWithProviders(<Projects projetos={[]} />);
    expect(secao().querySelector('[data-card="panel"]')).toBeNull();
    expect(within(secao()).getByRole('heading', { level: 2 })).toBeInTheDocument();
  });
});

describe('FeaturedProject (S-10): conteúdo e selos (DV-7, D17, D20)', () => {
  it('etiqueta + "Em destaque", preenchidos; sem "Projeto de estudo" no Gerenciador', () => {
    renderWithProviders(<Projects />);
    const p = painel();
    const etiqueta = within(p).getByText(ficha(GERENCIADOR).etiqueta?.pt as string, {
      selector: '[data-variant]',
    });
    const destaque = within(p).getByText(pt.projetos.emDestaque);
    for (const selo of [etiqueta, destaque]) {
      expect(selo).toHaveAttribute('data-variant', 'filled');
      expect(selo).toHaveAttribute('data-size', 'sm');
    }
    expect(within(p).queryByText(pt.projetos.seloEstudo)).toBeNull();
  });

  it('"Projeto de estudo" aparece quando a ficha pede (Análise no painel)', () => {
    renderWithProviders(<Projects projetos={fichas({ [ANALISE]: { publicado: true } })} />);
    expect(within(painel()).getByText(pt.projetos.seloEstudo)).toHaveAttribute(
      'data-variant',
      'filled',
    );
  });

  it('H3 com o nome, descrição da ficha e chips de tecnologia pequenos e mono', () => {
    renderWithProviders(<Projects />);
    const p = painel();
    const g = ficha(GERENCIADOR);
    expect(within(p).getByRole('heading', { level: 3 })).toHaveTextContent(g.nome);
    expect(within(p).getByText(g.descricao.pt)).toHaveClass('t-body');
    const chips = within(p).getAllByRole('listitem');
    expect(chips.map((c) => c.textContent)).toEqual(g.tecnologias);
    for (const c of chips) {
      expect(c).toHaveAttribute('data-size', 'sm');
      expect(c.className).toMatch(/mono/);
    }
  });

  it('EN troca rótulos e descrição; nomes de tecnologia iguais', () => {
    renderWithProviders(<Projects />, { idioma: 'en' });
    const p = painel();
    const g = ficha(GERENCIADOR);
    expect(within(p).getByText(en.projetos.emDestaque)).toBeInTheDocument();
    expect(
      within(p).getByText(g.etiqueta?.en as string, { selector: '[data-variant]' }),
    ).toBeInTheDocument();
    expect(within(p).getByText(g.descricao.en)).toBeInTheDocument();
    expect(within(p).getByRole('img')).toHaveAccessibleName(en.projetos.alt.estoque);
    expect(
      within(p)
        .getAllByRole('listitem')
        .map((c) => c.textContent),
    ).toEqual(g.tecnologias);
    expect(within(secao()).getByRole('heading', { level: 2 })).toHaveTextContent(
      en.projetos.titulo,
    );
  });
});

describe('FeaturedProject (S-10): imagem', () => {
  it('sem imagem: ilustração da C-08 (estoque) com role="img" e alt, sem aria-hidden', () => {
    renderWithProviders(<Projects />);
    const img = within(painel()).getByRole('img');
    expect(img).toHaveAccessibleName(pt.projetos.alt.estoque);
    expect(img.closest('[aria-hidden="true"]')).toBeNull();
    expect(painel().querySelector('[data-ilustracao="estoque"]')).not.toBeNull();
  });

  it('em DEV, a legenda de reserva aparece só no Gerenciador (variante estoque)', () => {
    renderWithProviders(<Projects />);
    expect(pt.projetos.legendaReserva).toBe('[substituir por print do projeto]');
    expect(within(painel()).getByText(pt.projetos.legendaReserva)).toHaveAttribute(
      'data-placeholder',
      'block',
    );
  });

  it('Análise no painel: ilustração padrão, alt padrão e nenhuma legenda', () => {
    renderWithProviders(<Projects projetos={fichas({ [ANALISE]: { publicado: true } })} />);
    expect(within(painel()).getByRole('img')).toHaveAccessibleName(pt.projetos.alt.padrao);
    expect(painel().querySelector('[data-placeholder]')).toBeNull();
  });

  it('com imagem na ficha: <img> 4:3 com o alt da ficha e o caminho com a base do Vite', () => {
    const lista = fichas({
      [GERENCIADOR]: {
        imagem: {
          src: 'projetos/gerenciador-de-estoque/tela.png',
          alt: { pt: 'Tela do gerenciador', en: 'Inventory manager screen' },
        },
      },
    });
    renderWithProviders(<Projects projetos={lista} />);
    const img = within(painel()).getByRole('img', { name: 'Tela do gerenciador' });
    expect(img.tagName).toBe('IMG');
    expect(img.getAttribute('src')).toBe(
      `${import.meta.env.BASE_URL}projetos/gerenciador-de-estoque/tela.png`,
    );
    expect(painel().querySelector('[data-ilustracao]')).toBeNull();
    expect(painel().querySelector('[data-placeholder]')).toBeNull();
  });
});

describe('FeaturedProject (S-10): produção (DEV=false)', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it(
    'nenhum [link …] nem "[substituir por print do projeto]" no DOM',
    { timeout: 20000 },
    async () => {
      vi.stubEnv('DEV', false);
      vi.stubEnv('PROD', true);
      vi.resetModules();
      const { Projects: ProjectsProd } = await import('@/sections/Projects/Projects');
      const { pt: ptProd } = await import('@/content/pt');
      const { LanguageContext: Ctx } = await import('@/i18n/LanguageContext');
      expect(ptProd.projetos.legendaReserva).toBe('');
      render(
        <Ctx.Provider
          value={{
            lang: 'pt',
            dict: ptProd,
            setLang: () => undefined,
            toggleLang: () => undefined,
            isSugerido: () => false,
          }}
        >
          <ProjectsProd />
        </Ctx.Provider>,
      );
      expect(document.body.textContent).not.toMatch(/\[[^\]]*\]/);
      expect(document.querySelector('[data-placeholder]')).toBeNull();
      expect(document.querySelectorAll('#projetos [data-card="panel"] a')).toHaveLength(0);
    },
  );
});

describe('FeaturedProject (S-10): ganchos e contrato', () => {
  it('data-reveal só no contêiner de conteúdo da seção; nenhum gancho fora do §4.4', () => {
    renderWithProviders(<Projects />);
    expect(secao().querySelectorAll('[data-reveal]')).toHaveLength(1);
    expect(painel().closest('[data-reveal]')).not.toBeNull();
    expect(painel()).not.toHaveAttribute('data-reveal');
    for (const attr of [
      'data-stagger',
      'data-draw',
      'data-countup',
      'data-float',
      'data-bg-slot',
    ]) {
      expect(secao().querySelector(`[${attr}]`)).toBeNull();
    }
  });

  it('painel = Card panel interativo, em <article>', () => {
    renderWithProviders(<Projects />);
    expect(painel().tagName).toBe('ARTICLE');
    expect(painel()).toHaveAttribute('data-interactive', 'true');
  });

  it('nenhum ProjectIllustration criado em src/sections (C-08 é a dona)', () => {
    expect(
      existsSync(resolve(process.cwd(), 'src/sections/Projects/ProjectIllustration.tsx')),
    ).toBe(false);
    expect(ler('src/sections/Projects/ProjectMedia.tsx')).toMatch(
      /from '@\/components\/illustrations'/,
    );
  });
});

describe('CSS e JSX do painel em destaque (S-10)', () => {
  const painelCss = ler('src/sections/Projects/FeaturedProject.module.css');
  const midia = ler('src/sections/Projects/ProjectMedia.module.css');
  const links = ler('src/sections/Projects/ProjectLinks.module.css');

  it('desktop 5fr/7fr com 48 px; tablet padding 32; H3 com o token do DV-7', () => {
    expect(painelCss).toMatch(
      /@media \(min-width: 1024px\) \{\s*\.painel \{\s*grid-template-columns: minmax\(0, 5fr\) minmax\(0, 7fr\);[^}]*gap: var\(--space-12\);/,
    );
    expect(painelCss).toMatch(
      /@media \(min-width: 640px\) and \(max-width: 1023px\) \{\s*article\.painel \{\s*padding: var\(--space-8\);/,
    );
    expect(painelCss).toMatch(
      /\.titulo \{[^}]*font-size: var\(--fs-featured-title\);\s*font-weight: var\(--fw-featured-title\);/,
    );
  });

  it('imagem: quadro com raio --radius-media e overflow hidden; 4:3; zoom 3% sem movimento reduzido', () => {
    expect(midia).toMatch(
      /\.quadro \{[^}]*overflow: hidden;\s*border-radius: var\(--radius-media\);/,
    );
    expect(midia).toMatch(/\.imagem \{[^}]*aspect-ratio: 4 \/ 3;\s*object-fit: cover;/);
    expect(midia).toMatch(/--zoom-midia: 1\.03;/);
    expect(midia).toMatch(
      /@media \(prefers-reduced-motion: reduce\) \{\s*\.quadro \{\s*--zoom-midia: 1;/,
    );
    expect(midia).toMatch(/html\[data-reduced-motion='true'\] \.quadro \{\s*--zoom-midia: 1;/);
  });

  it('botões empilhados no celular e lado a lado a partir de 640 px, com --button-gap', () => {
    expect(links).toMatch(/\.links \{[^}]*flex-direction: column;[^}]*gap: var\(--button-gap\);/);
    expect(links).toMatch(/@media \(min-width: 640px\) \{\s*\.links \{\s*flex-flow: row wrap;/);
  });

  it('sem hex; sem animação; a única transição é a do zoom (transform)', () => {
    for (const texto of [painelCss, midia, links]) {
      expect(texto).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
      expect(texto).not.toMatch(/animation|@keyframes/);
    }
    expect(painelCss).not.toMatch(/transition/);
    expect(links).not.toMatch(/transition/);
    expect(midia.match(/transition:[^;]*;/g)).toEqual([
      'transition: transform var(--dur-base) var(--ease-out);',
    ]);
  });

  it('nenhum texto fixo no JSX (CC-1)', () => {
    for (const arquivo of [
      'Projects.tsx',
      'FeaturedProject.tsx',
      'ProjectLinks.tsx',
      'ProjectMedia.tsx',
    ]) {
      const tsx = ler(`src/sections/Projects/${arquivo}`).replace(/\/\/.*$/gm, '');
      expect(tsx).not.toMatch(/>\s*[A-Za-zÀ-ÿ0-9][^<{]*<\//);
      expect(tsx).not.toMatch(/Em destaque|Ver projeto|Gerenciador|Projeto de estudo|\[substituir/);
    }
  });
});
