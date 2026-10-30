// Q-05 — Ficha de projeto (`src/content/projects.ts`, C-05): grupo 6 e parte do grupo 7 do passo
// 06 (Q-05). Exatamente 1 projeto com `destaque: true`; os 4 de estudo com `projetoDeEstudo: true`;
// os 4 links do GitHub EXATAMENTE os do §12.5; descrições e chips iguais ao conteúdo real
// (§12.1–12.4). Prova de mutação do critério de aceite (trocar 1 letra de um link): registrada e
// revertida — ver `plano/checkpoints/Q-05.md`. Doc de design: §12.5, §14; 00-INDICE D11, D14, D23.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PROJECTS } from '@/content/projects';
import type { Project } from '@/content/types';

const porId = (id: string): Project => PROJECTS.find((p) => p.id === id) as Project;

const ESTUDO_IDS = [
  'banco-de-dados-biblioteca',
  'ciberseguranca-analisador-de-logs',
  'analise-de-dados-vendas',
  'python-organizador-de-arquivos',
];

/** Os 4 links do §12.5 do doc 05, na ordem dos projetos de estudo em `PROJECTS`. */
const LINKS_12_5 = [
  'https://github.com/YanniMaia/banco-de-dados-biblioteca',
  'https://github.com/YanniMaia/ciberseguranca-analisador-de-logs',
  'https://github.com/YanniMaia/analise-de-dados-vendas',
  'https://github.com/YanniMaia/python-organizador-de-arquivos',
];

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('Grupo 6 — dados de projects.ts (C-05)', () => {
  it('exatamente 1 projeto com destaque:true, e é o Gerenciador de Estoque', () => {
    const destaques = PROJECTS.filter((p) => p.destaque);
    expect(destaques).toHaveLength(1);
    expect(destaques[0]?.id).toBe('gerenciador-de-estoque');
  });

  it('exatamente 4 projetos com projetoDeEstudo:true, e são os 4 do §12', () => {
    const estudo = PROJECTS.filter((p) => p.projetoDeEstudo);
    expect(estudo).toHaveLength(4);
    expect(estudo.map((p) => p.id).sort()).toEqual([...ESTUDO_IDS].sort());
  });

  it('os 4 links do GitHub são EXATAMENTE os do §12.5 do doc 05', () => {
    expect(ESTUDO_IDS.map((id) => porId(id).linkGithub)).toEqual(LINKS_12_5);
  });

  it('nenhum link do GitHub é compartilhado entre dois projetos', () => {
    const links = PROJECTS.map((p) => p.linkGithub).filter((l): l is string => l !== undefined);
    expect(new Set(links).size).toBe(links.length);
  });

  it('descrições (pt) dos 4 projetos de estudo batem com o conteúdo real (§12.1–12.4)', () => {
    expect(porId('banco-de-dados-biblioteca').descricao.pt).toBe(
      'Modelagem de uma biblioteca em SQLite, com chaves, regras de qualidade, consultas com JOIN e dicionário de dados.',
    );
    expect(porId('ciberseguranca-analisador-de-logs').descricao.pt).toBe(
      'Detecta possível força bruta em logs de autenticação fictícios e avalia a força de senhas, com foco defensivo.',
    );
    expect(porId('analise-de-dados-vendas').descricao.pt).toBe(
      'Verifica a qualidade, limpa e analisa um conjunto de vendas fictício, com resumo e gráficos.',
    );
    expect(porId('python-organizador-de-arquivos').descricao.pt).toBe(
      'Programa de linha de comando que organiza arquivos por tipo, com modo simulação e sem sobrescrever nada.',
    );
  });

  it('chips de tecnologia dos 4 projetos de estudo batem com o conteúdo real (§12.1–12.4)', () => {
    expect(porId('banco-de-dados-biblioteca').tecnologias).toEqual(['SQL', 'SQLite', 'Python']);
    expect(porId('ciberseguranca-analisador-de-logs').tecnologias).toEqual(['Python']);
    expect(porId('analise-de-dados-vendas').tecnologias).toEqual([
      'Python',
      'pandas',
      'matplotlib',
    ]);
    expect(porId('python-organizador-de-arquivos').tecnologias).toEqual(['Python']);
  });

  it('etiquetas (pt) dos 4 projetos de estudo batem com o conteúdo real (§12.1–12.4)', () => {
    expect(porId('banco-de-dados-biblioteca').etiqueta?.pt).toBe('Banco de Dados / SQL');
    expect(porId('ciberseguranca-analisador-de-logs').etiqueta?.pt).toBe('Cibersegurança');
    expect(porId('analise-de-dados-vendas').etiqueta?.pt).toBe('Análise de Dados');
    expect(porId('python-organizador-de-arquivos').etiqueta?.pt).toBe('Python / Automação');
  });
});

describe('Grupo 7 — produção: nenhum href vazio, "#", "javascript:" ou com "[" (D11, D23)', () => {
  it('nenhum linkGithub/linkProjeto em PROJECTS (dev) é vazio, "#" ou "javascript:"', () => {
    for (const p of PROJECTS) {
      for (const link of [p.linkGithub, p.linkProjeto]) {
        if (link === undefined) continue;
        expect(link, p.id).not.toBe('');
        expect(link, p.id).not.toBe('#');
        expect(link.toLowerCase(), p.id).not.toMatch(/^javascript:/);
      }
    }
  });

  it('em produção (import.meta.env.PROD simulado): nenhum link chega com "[" "]", vazio, "#" ou "javascript:"', async () => {
    vi.stubEnv('DEV', false);
    vi.stubEnv('PROD', true);
    vi.resetModules();
    const { PROJECTS: prod } = await import('@/content/projects');
    for (const p of prod) {
      for (const link of [p.linkGithub, p.linkProjeto]) {
        if (link === undefined) continue;
        expect(link, p.id).not.toContain('[');
        expect(link, p.id).not.toContain(']');
        expect(link, p.id).not.toBe('');
        expect(link, p.id).not.toBe('#');
        expect(link.toLowerCase(), p.id).not.toMatch(/^javascript:/);
      }
    }
  });
});
