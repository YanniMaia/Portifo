// Q-05 — Testes da regra "botão sem link não renderiza" (D11) nos cards e no painel de projeto.
// As regras de destaque/grade/botões vêm de `src/content/selectors.ts` (C-06, dona única — D14):
// este arquivo só IMPORTA essas funções, nunca as reimplementa. Doc de design: §7.8 (Regra dos
// botões, Selo de honestidade), §12.5, §14, §16 (currículo); 00-INDICE D11, D14, D23, adaptação IA.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PROJECTS } from '@/content/projects';
import { pt } from '@/content/pt';
import {
  botoesDoProjeto,
  githubHref,
  mostrarCardIA,
  projetoEmDestaque,
  projetosDaGrade,
} from '@/content/selectors';
import { site } from '@/content/site';
import type { Project } from '@/content/types';
import { SHOW_AI_COMING_SOON_CARD } from '@/lib/flags';
import { FeaturedProject } from '@/sections/Projects/FeaturedProject';
import { ProjectCard } from '@/sections/Projects/ProjectCard';
import { Projects } from '@/sections/Projects/Projects';
import { renderWithProviders } from '../support/render';

const GERENCIADOR = 'gerenciador-de-estoque';
const VENDAS = 'analise-de-dados-vendas';
const BIBLIOTECA = 'banco-de-dados-biblioteca';
const LOGS = 'ciberseguranca-analisador-de-logs';
const ORGANIZADOR = 'python-organizador-de-arquivos';

const BASE = PROJECTS.find((p) => p.id === GERENCIADOR) as Project;

/** Cópia da ficha do Gerenciador sem links/publicação, só com os ajustes do cenário (grupo 1/2). */
function ficha(ajustes: Partial<Project>): Project {
  return {
    ...BASE,
    linkProjeto: undefined,
    linkGithub: undefined,
    publicado: false,
    destaque: false,
    placeholder: undefined,
    ...ajustes,
  };
}

/** Cópia das fichas reais com ajustes por id (grupo 3). */
function cenario(ajustes: Record<string, Partial<Project>>): Project[] {
  return PROJECTS.map((p) => ({ ...p, ...(ajustes[p.id] ?? {}) }));
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('Grupo 1 — sem link, sem botão; com link, o botão exato (D11)', () => {
  it('sem linkProjeto e sem linkGithub: nenhum botão no DOM (nem oculto por CSS)', () => {
    const p = ficha({ publicado: true });
    expect(botoesDoProjeto(p)).toEqual([]);
    const { container } = renderWithProviders(<ProjectCard projeto={p} />);
    expect(container.querySelectorAll('a, button')).toHaveLength(0);
  });

  it('só linkProjeto: existe "Ver projeto" com o href exato; "GitHub" não existe', () => {
    const p = ficha({ linkProjeto: 'https://exemplo.test/demo', publicado: true });
    const { container } = renderWithProviders(<FeaturedProject projeto={p} />);
    const links = within(container).getAllByRole('link');
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute('href', 'https://exemplo.test/demo');
    expect(within(container).queryByText(pt.projetos.botaoGithub)).toBeNull();
  });

  it('só linkGithub (publicado): existe "GitHub" com o href exato; "Ver projeto" não existe', () => {
    const p = ficha({ linkGithub: 'https://github.com/YanniMaia/teste', publicado: true });
    const { container } = renderWithProviders(<ProjectCard projeto={p} />);
    const links = within(container).getAllByRole('link');
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAttribute('href', 'https://github.com/YanniMaia/teste');
    expect(within(container).queryByText(pt.projetos.botaoVer)).toBeNull();
  });

  it('os dois links: os dois botões existem, na ordem "Ver projeto" → "GitHub", com href exatos', () => {
    const p = ficha({
      linkProjeto: 'https://exemplo.test/demo',
      linkGithub: 'https://github.com/YanniMaia/teste',
      publicado: true,
    });
    const { container } = renderWithProviders(<FeaturedProject projeto={p} />);
    const links = within(container).getAllByRole('link');
    expect(links.map((a) => a.getAttribute('href'))).toEqual([
      'https://exemplo.test/demo',
      'https://github.com/YanniMaia/teste',
    ]);
  });
});

describe('Grupo 2 — publicado: false: card visível, botão "GitHub" nunca aparece (D14)', () => {
  it('em desenvolvimento: nenhum projeto com publicado:false tem botão "GitHub" (dados reais)', () => {
    for (const p of PROJECTS) {
      expect(p.publicado, p.id).toBe(false); // dados de hoje, P-01
      expect(githubHref(p), p.id).toBeUndefined();
      expect(
        botoesDoProjeto(p).map((b) => b.tipo),
        p.id,
      ).not.toContain('github');
    }
  });

  it('em produção (import.meta.env.PROD simulado): mesma regra, mesmo resultado', async () => {
    vi.stubEnv('DEV', false);
    vi.stubEnv('PROD', true);
    vi.resetModules();
    const { PROJECTS: projetosProd } = await import('@/content/projects');
    const { githubHref: githubHrefProd, botoesDoProjeto: botoesProd } =
      await import('@/content/selectors');
    for (const p of projetosProd) {
      expect(p.publicado, p.id).toBe(false);
      expect(githubHrefProd(p), p.id).toBeUndefined();
      expect(
        botoesProd(p).map((b) => b.tipo),
        p.id,
      ).not.toContain('github');
    }
  });

  it('o card continua visível com publicado:false (D14): heading presente, sem nenhum botão', () => {
    const p = ficha({ linkGithub: 'https://github.com/YanniMaia/teste', publicado: false });
    const { container } = renderWithProviders(<ProjectCard projeto={p} />);
    expect(within(container).getByRole('heading', { level: 3 })).toHaveTextContent(p.nome);
    expect(container.querySelectorAll('a, button')).toHaveLength(0);
  });

  it('com os 4 projetos de estudo em publicado:false (dados reais): grade com os 4 cards + o card de IA, 0 botões', () => {
    renderWithProviders(<Projects />);
    const secao = document.getElementById('projetos') as HTMLElement;
    expect(secao.querySelectorAll('article[data-card="default"]')).toHaveLength(4);
    expect(secao.querySelector('article[data-card="dashed"]')).not.toBeNull();
    // Nenhum card (painel, grade ou IA) tem link/botão: só o "Ver todos no GitHub →", fora dos cards.
    expect(secao.querySelectorAll('article a, article button')).toHaveLength(0);
  });
});

describe('Grupo 3 — cascata de destaque (C-06): sempre 1, nunca repetido na grade', () => {
  it('(a) Gerenciador publicado e com link real: ele é o destaque; Vendas vai para a grade', () => {
    const lista = cenario({
      [GERENCIADOR]: { publicado: true, linkGithub: 'https://github.com/YanniMaia/ger-teste' },
      [VENDAS]: { publicado: true },
    });
    expect(projetoEmDestaque(lista)?.id).toBe(GERENCIADOR);
    const grade = projetosDaGrade(lista).map((p) => p.id);
    expect(grade).toContain(VENDAS);
    expect(grade).not.toContain(GERENCIADOR);
  });

  it('(b) senão, Vendas publicado: ele é o destaque; Gerenciador vai para a grade sem botões', () => {
    const lista = cenario({ [VENDAS]: { publicado: true } });
    expect(projetoEmDestaque(lista)?.id).toBe(VENDAS);
    const grade = projetosDaGrade(lista);
    const ids = grade.map((p) => p.id);
    expect(ids).toContain(GERENCIADOR);
    expect(ids).not.toContain(VENDAS);
    expect(botoesDoProjeto(grade.find((p) => p.id === GERENCIADOR) as Project)).toEqual([]);
  });

  it('(c) senão: o Gerenciador é o destaque, sem botões (dados de hoje)', () => {
    expect(projetoEmDestaque(PROJECTS)?.id).toBe(GERENCIADOR);
    expect(botoesDoProjeto(projetoEmDestaque(PROJECTS) as Project)).toEqual([]);
  });

  it('exatamente 1 destaque e nunca repetido na grade, em qualquer combinação de publicação', () => {
    const alvos = [GERENCIADOR, VENDAS, BIBLIOTECA, LOGS, ORGANIZADOR];
    for (let mascara = 0; mascara < 2 ** alvos.length; mascara += 1) {
      const publicados = new Set(alvos.filter((_, i) => (mascara >> i) & 1));
      const lista = PROJECTS.map((p) => ({ ...p, publicado: publicados.has(p.id) }));
      const destaque = projetoEmDestaque(lista);
      const grade = projetosDaGrade(lista);
      expect(destaque, `máscara ${mascara}`).toBeDefined();
      expect(grade.map((p) => p.id)).not.toContain(destaque?.id);
      expect(grade).toHaveLength(lista.length - 1);
    }
  });
});

describe('Grupo 4 — card "Projeto de IA — em breve": sem link, sem descrição, flag única', () => {
  it('nenhum <a> nem <button> dentro do card; nenhum parágrafo de descrição', () => {
    renderWithProviders(<Projects />);
    const cardIA = document.querySelector('article[data-card="dashed"]') as HTMLElement;
    expect(cardIA).not.toBeNull();
    expect(cardIA.querySelectorAll('a, button')).toHaveLength(0);
    expect(cardIA.querySelectorAll('p')).toHaveLength(0);
  });

  it('a flag SHOW_AI_COMING_SOON_CARD (F-15) controla a visibilidade; desligada, o card não existe', () => {
    expect(mostrarCardIA()).toBe(SHOW_AI_COMING_SOON_CARD);
    renderWithProviders(<Projects mostrarCardIA={false} />);
    expect(document.querySelector('article[data-card="dashed"]')).toBeNull();
  });
});

describe('Grupo 5 — botão "Baixar currículo" (§16): não existe (sem PDF configurado, C-04)', () => {
  // Os comentários de `site.ts` citam a pendência P-07 de propósito (regra de ouro); o que importa
  // aqui é o objeto exportado, não o comentário. Só o literal `export const site = {...}` é testado.
  const siteTs = readFileSync(resolve(process.cwd(), 'src/content/site.ts'), 'utf8');
  const objetoSite = siteTs.slice(
    siteTs.indexOf('export const site'),
    siteTs.indexOf('} as const'),
  );
  const ptTs = readFileSync(resolve(process.cwd(), 'src/content/pt.ts'), 'utf8');
  const enTs = readFileSync(resolve(process.cwd(), 'src/content/en.ts'), 'utf8');

  it('o objeto `site` não tem nenhum campo de currículo/CV nem link de PDF', () => {
    expect(objetoSite).not.toMatch(/curr[íi]culo/i);
    expect(objetoSite).not.toMatch(/\.pdf/i);
    expect(site).not.toHaveProperty('curriculo');
  });

  it('nenhum rótulo de "Baixar currículo" nos dicionários PT/EN', () => {
    expect(ptTs).not.toMatch(/curr[íi]culo/i);
    expect(enTs).not.toMatch(/\bresume\b|\bcv\b/i);
  });
});

describe('Grupo 7 — produção: nenhum href vazio, "#", "javascript:" ou com "[" no DOM (D11, D23)', () => {
  it('nenhum <a> de #projetos tem href inválido em produção (import.meta.env.PROD simulado)', async () => {
    vi.stubEnv('DEV', false);
    vi.stubEnv('PROD', true);
    vi.resetModules();
    const { Projects: ProjectsProd } = await import('@/sections/Projects/Projects');
    const { pt: ptProd } = await import('@/content/pt');
    const { LanguageContext: Ctx } = await import('@/i18n/LanguageContext');
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
    const secao = document.getElementById('projetos') as HTMLElement;
    const hrefs = [...secao.querySelectorAll('a')].map((a) => a.getAttribute('href'));
    // O "Ver todos no GitHub →" (C-06: sempre visível) garante que a lista não fica vazia.
    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) {
      expect(href).not.toBeNull();
      expect(href).not.toBe('');
      expect(href).not.toBe('#');
      expect(href?.toLowerCase().startsWith('javascript:')).toBe(false);
      expect(href).not.toContain('[');
      expect(href).not.toContain(']');
    }
  });
});
