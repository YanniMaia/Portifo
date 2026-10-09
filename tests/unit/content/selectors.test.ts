// C-06: regras de projeto (src/content/selectors.ts), dona única (D14).
// Os cenários trocam `publicado`/links em CÓPIAS das fichas reais. Links "reais" do Gerenciador
// usados aqui são dados falsos, só de teste (o repositório dele é a pendência P-02).
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { en } from '@/content/en';
import { PROJECTS } from '@/content/projects';
import { pt } from '@/content/pt';
import {
  botoesDoProjeto,
  contagemProjetosPublicados,
  githubHref,
  itensDaFaixa,
  mostrarCardIA,
  mostrarLinkGithubGeral,
  projetoEmDestaque,
  projetoHref,
  projetosDaGrade,
  varianteIlustracao,
} from '@/content/selectors';
import type { Project } from '@/content/types';
import { SHOW_AI_COMING_SOON_CARD } from '@/lib/flags';
import { isPlaceholder } from '@/lib/placeholder';

const GER = 'gerenciador-de-estoque';
const VENDAS = 'analise-de-dados-vendas';
const ESTUDO = [
  'banco-de-dados-biblioteca',
  'ciberseguranca-analisador-de-logs',
  VENDAS,
  'python-organizador-de-arquivos',
];
/** Link falso, só de teste, para simular a resposta da P-02. */
const LINK_TESTE_GER = 'https://github.com/YanniMaia/gerenciador-de-estoque-teste';

interface Opcoes {
  /** ids com `publicado: true`. */
  publicados?: readonly string[];
  /** Gerenciador com link real (falso, de teste) no lugar do placeholder PH-02. */
  gerenciadorComLink?: boolean;
}

/** Cópia das fichas reais com o cenário aplicado. */
function cenario({ publicados = [], gerenciadorComLink = false }: Opcoes = {}): Project[] {
  return PROJECTS.map((p) => {
    const copia: Project = { ...p, publicado: publicados.includes(p.id) };
    if (p.id === GER && gerenciadorComLink) copia.linkGithub = LINK_TESTE_GER;
    return copia;
  });
}

const ids = (lista: readonly Project[]) => lista.map((p) => p.id);
const tipos = (p: Project) => botoesDoProjeto(p).map((b) => b.tipo);

/** Invariantes que valem em QUALQUER cenário. */
function conferirInvariantes(lista: readonly Project[]) {
  const destaque = projetoEmDestaque(lista);
  const grade = projetosDaGrade(lista);
  expect(destaque).toBeDefined();
  // exatamente 1 destaque, nenhum repetido, nenhum card sumido (D14)
  expect(ids(grade)).not.toContain(destaque?.id);
  expect(new Set([destaque?.id, ...ids(grade)]).size).toBe(lista.length);
  expect(grade).toHaveLength(lista.length - 1);
  // grade na ordem do array
  expect(ids(grade)).toEqual(ids(lista).filter((id) => id !== destaque?.id));
  // contagem = nº de projetos com repositório publicado e link real
  const esperado = lista.filter(
    (p) => p.publicado && p.linkGithub !== undefined && !isPlaceholder(p.linkGithub),
  ).length;
  expect(contagemProjetosPublicados(lista)).toBe(esperado);
  // nenhum botão com link pendente
  for (const p of lista) {
    for (const b of botoesDoProjeto(p)) {
      expect(isPlaceholder(b.href), `${p.id} ${b.tipo}`).toBe(false);
      expect(b.href).not.toBe('#');
    }
  }
}

afterEach(() => {
  vi.doUnmock('@/lib/flags');
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('githubHref / projetoHref', () => {
  it('githubHref só com publicado: true e link real', () => {
    const [ger, bib] = cenario({ publicados: [GER, 'banco-de-dados-biblioteca'] });
    expect(githubHref(bib as Project)).toBe(
      'https://github.com/YanniMaia/banco-de-dados-biblioteca',
    );
    // publicado, mas o link é placeholder (PH-02) → sem botão
    expect(githubHref(ger as Project)).toBeUndefined();
    // link real, mas não publicado → sem botão
    expect(githubHref(PROJECTS[1] as Project)).toBeUndefined();
  });

  it('githubHref: link ausente ou vazio → undefined', () => {
    const base = PROJECTS[1] as Project;
    expect(githubHref({ ...base, publicado: true, linkGithub: undefined })).toBeUndefined();
    expect(githubHref({ ...base, publicado: true, linkGithub: '' })).toBeUndefined();
  });

  it('projetoHref: placeholder, ausente e vazio → undefined; link real → ele mesmo', () => {
    const ger = PROJECTS[0] as Project;
    expect(ger.linkProjeto).toBe('[link da demonstração]'); // dev
    expect(projetoHref(ger)).toBeUndefined();
    expect(projetoHref(PROJECTS[1] as Project)).toBeUndefined();
    expect(projetoHref({ ...ger, linkProjeto: '' })).toBeUndefined();
    expect(projetoHref({ ...ger, linkProjeto: 'https://exemplo.test/demo' })).toBe(
      'https://exemplo.test/demo',
    );
  });
});

describe('cenários (C-06 passo 3)', () => {
  it('nenhum publicado: destaque = Gerenciador sem botões; 4 cards de estudo sem "GitHub"; contagem 0; faixa com 3 itens', () => {
    const lista = cenario();
    conferirInvariantes(lista);
    const destaque = projetoEmDestaque(lista);
    expect(destaque?.id).toBe(GER);
    expect(botoesDoProjeto(destaque as Project)).toEqual([]);
    expect(ids(projetosDaGrade(lista))).toEqual(ESTUDO);
    for (const p of projetosDaGrade(lista)) expect(tipos(p), p.id).not.toContain('github');
    expect(contagemProjetosPublicados(lista)).toBe(0);
    const faixa = itensDaFaixa(lista, pt);
    expect(faixa.map((i) => i.id)).toEqual(['areas', 'linguagens', 'formacao']);
  });

  it('dados reais de hoje (PROJECTS) = cenário "nenhum publicado"', () => {
    conferirInvariantes(PROJECTS);
    expect(projetoEmDestaque(PROJECTS)?.id).toBe(GER);
    expect(contagemProjetosPublicados(PROJECTS)).toBe(0);
    expect(itensDaFaixa(PROJECTS, pt)).toHaveLength(3);
  });

  it('só os 4 de estudo: destaque = Vendas (caso b); Gerenciador na grade sem botão; contagem 4', () => {
    const lista = cenario({ publicados: ESTUDO });
    conferirInvariantes(lista);
    const destaque = projetoEmDestaque(lista) as Project;
    expect(destaque.id).toBe(VENDAS);
    expect(botoesDoProjeto(destaque)).toEqual([
      {
        tipo: 'github',
        href: 'https://github.com/YanniMaia/analise-de-dados-vendas',
        rotuloChave: 'projetos.botaoGithub',
      },
    ]);
    const grade = projetosDaGrade(lista);
    expect(ids(grade)).toEqual([GER, ...ESTUDO.filter((id) => id !== VENDAS)]);
    expect(botoesDoProjeto(grade[0] as Project)).toEqual([]);
    for (const p of grade.slice(1)) expect(tipos(p), p.id).toEqual(['github']);
    expect(contagemProjetosPublicados(lista)).toBe(4);
    const projetos = itensDaFaixa(lista, pt).find((i) => i.id === 'projetos');
    expect(projetos).toEqual({
      id: 'projetos',
      tipo: 'numero',
      valor: 4,
      legenda: 'projetos publicados no GitHub',
    });
  });

  it('só Vendas: destaque = Vendas com "GitHub"; Gerenciador na grade sem botão; contagem 1; legenda no singular', () => {
    const lista = cenario({ publicados: [VENDAS] });
    conferirInvariantes(lista);
    const destaque = projetoEmDestaque(lista) as Project;
    expect(destaque.id).toBe(VENDAS);
    expect(tipos(destaque)).toEqual(['github']);
    const grade = projetosDaGrade(lista);
    expect(ids(grade)[0]).toBe(GER);
    expect(botoesDoProjeto(grade[0] as Project)).toEqual([]);
    for (const p of grade.slice(1)) expect(tipos(p), p.id).toEqual([]);
    expect(contagemProjetosPublicados(lista)).toBe(1);
    const faixa = itensDaFaixa(lista, pt);
    expect(faixa).toHaveLength(4);
    expect(faixa.find((i) => i.id === 'projetos')?.legenda).toBe('projeto publicado no GitHub');
  });

  it('todos publicados (Gerenciador com link): destaque = Gerenciador (caso a); grade = 4 de estudo com "GitHub"; contagem 5', () => {
    const lista = cenario({ publicados: [GER, ...ESTUDO], gerenciadorComLink: true });
    conferirInvariantes(lista);
    const destaque = projetoEmDestaque(lista) as Project;
    expect(destaque.id).toBe(GER);
    // "Ver projeto" continua fora: o link de demonstração é placeholder (P-04).
    expect(botoesDoProjeto(destaque)).toEqual([
      { tipo: 'github', href: LINK_TESTE_GER, rotuloChave: 'projetos.botaoGithub' },
    ]);
    expect(ids(projetosDaGrade(lista))).toEqual(ESTUDO);
    for (const p of projetosDaGrade(lista)) expect(tipos(p), p.id).toEqual(['github']);
    expect(contagemProjetosPublicados(lista)).toBe(5);
    expect(itensDaFaixa(lista, pt).find((i) => i.id === 'projetos')).toMatchObject({
      valor: 5,
      legenda: 'projetos publicados no GitHub',
    });
  });

  it('Gerenciador com link e os outros não: destaque = Gerenciador; 4 cards visíveis sem botão; contagem 1', () => {
    const lista = cenario({ publicados: [GER], gerenciadorComLink: true });
    conferirInvariantes(lista);
    expect(projetoEmDestaque(lista)?.id).toBe(GER);
    expect(ids(projetosDaGrade(lista))).toEqual(ESTUDO);
    for (const p of projetosDaGrade(lista)) expect(botoesDoProjeto(p), p.id).toEqual([]);
    expect(contagemProjetosPublicados(lista)).toBe(1);
  });

  it('Gerenciador "publicado" mas com o placeholder PH-02: não conta e não fica com botão (caso c)', () => {
    const lista = cenario({ publicados: [GER] });
    conferirInvariantes(lista);
    const destaque = projetoEmDestaque(lista) as Project;
    expect(destaque.id).toBe(GER);
    expect(botoesDoProjeto(destaque)).toEqual([]);
    expect(contagemProjetosPublicados(lista)).toBe(0);
  });

  it('Gerenciador com demonstração e repositório reais: "Ver projeto" antes de "GitHub"', () => {
    const lista = cenario({ publicados: [GER], gerenciadorComLink: true }).map((p) =>
      p.id === GER ? { ...p, linkProjeto: 'https://exemplo.test/demo' } : p,
    );
    const destaque = projetoEmDestaque(lista) as Project;
    expect(botoesDoProjeto(destaque)).toEqual([
      { tipo: 'verProjeto', href: 'https://exemplo.test/demo', rotuloChave: 'projetos.botaoVer' },
      { tipo: 'github', href: LINK_TESTE_GER, rotuloChave: 'projetos.botaoGithub' },
    ]);
  });

  it('todas as combinações de publicação dos 5 projetos respeitam as invariantes', () => {
    const todos = [GER, ...ESTUDO];
    for (let mascara = 0; mascara < 2 ** todos.length; mascara += 1) {
      const publicados = todos.filter((_, i) => (mascara >> i) & 1);
      for (const gerenciadorComLink of [false, true]) {
        const lista = cenario({ publicados, gerenciadorComLink });
        conferirInvariantes(lista);
        const n = contagemProjetosPublicados(lista);
        expect(itensDaFaixa(lista, pt)).toHaveLength(n === 0 ? 3 : 4);
      }
    }
  });
});

describe('itensDaFaixa', () => {
  it('ordem do §7.3 e valores do dicionário (areas e linguagens numéricos; UniCEUB texto)', () => {
    const faixa = itensDaFaixa(cenario({ publicados: [VENDAS, 'banco-de-dados-biblioteca'] }), pt);
    expect(faixa).toEqual([
      {
        id: 'areas',
        tipo: 'numero',
        valor: 3,
        legenda: 'áreas de estudo: Dados, Cibersegurança e IA',
      },
      { id: 'linguagens', tipo: 'numero', valor: 2, legenda: 'linguagens em estudo: Python e SQL' },
      { id: 'projetos', tipo: 'numero', valor: 2, legenda: 'projetos publicados no GitHub' },
      {
        id: 'formacao',
        tipo: 'texto',
        valor: 'UniCEUB',
        legenda: 'Ciência da Computação, em andamento',
      },
    ]);
  });

  it('usa o dicionário recebido (EN)', () => {
    const faixa = itensDaFaixa(cenario({ publicados: [VENDAS] }), en);
    expect(faixa.find((i) => i.id === 'projetos')?.legenda).toBe('project published on GitHub');
    expect(faixa.find((i) => i.id === 'formacao')?.legenda).toBe(en.destaques.formacao.legenda);
  });
});

describe('extensibilidade e casos defensivos', () => {
  const falso: Project = {
    id: 'projeto-ficticio-de-teste',
    nome: 'Projeto Fictício de Teste',
    area: 'dados',
    descricao: { pt: 'Texto de teste.', en: 'Test text.' },
    tecnologias: ['Python'],
    projetoDeEstudo: true,
    linkGithub: 'https://github.com/YanniMaia/projeto-ficticio-de-teste',
    publicado: true,
    destaque: false,
  };

  it('um 6º projeto (só no teste) entra na grade e na contagem sem mexer em nada', () => {
    const lista = [...PROJECTS, falso];
    conferirInvariantes(lista);
    expect(ids(projetosDaGrade(lista)).at(-1)).toBe(falso.id);
    expect(contagemProjetosPublicados(lista)).toBe(1);
    expect(varianteIlustracao(falso)).toBe('padrao');
  });

  it('variante da ilustração: Gerenciador "estoque", demais "padrao"', () => {
    expect(PROJECTS.map(varianteIlustracao)).toEqual([
      'estoque',
      'padrao',
      'padrao',
      'padrao',
      'padrao',
    ]);
  });

  it('sem nenhum destaque marcado: o primeiro da lista; lista vazia: nada', () => {
    const semDestaque = PROJECTS.map((p) => ({ ...p, destaque: false }));
    expect(projetoEmDestaque(semDestaque)?.id).toBe(GER);
    expect(projetosDaGrade(semDestaque)).toHaveLength(4);
    expect(projetoEmDestaque([])).toBeUndefined();
    expect(projetosDaGrade([])).toEqual([]);
    expect(contagemProjetosPublicados([])).toBe(0);
  });
});

describe('produção (SHOW_PLACEHOLDERS = false)', () => {
  it('Gerenciador sem links (undefined): mesmas regras, nenhum botão', async () => {
    vi.stubEnv('DEV', false);
    vi.stubEnv('PROD', true);
    vi.resetModules();
    const projetos = await import('@/content/projects');
    const s = await import('@/content/selectors');
    const lista = projetos.PROJECTS;
    expect(s.projetoEmDestaque(lista)?.id).toBe(GER);
    expect(s.botoesDoProjeto(lista[0] as Project)).toEqual([]);
    expect(s.contagemProjetosPublicados(lista)).toBe(0);
    expect(s.projetosDaGrade(lista)).toHaveLength(4);
  });
});

describe('card de IA e link geral', () => {
  it('mostrarCardIA devolve a flag única da F-15', () => {
    expect(mostrarCardIA()).toBe(SHOW_AI_COMING_SOON_CARD);
  });

  it('mostrarCardIA segue a flag quando ela é desligada', async () => {
    vi.resetModules();
    vi.doMock('@/lib/flags', async (original) => ({
      ...(await original<typeof import('@/lib/flags')>()),
      SHOW_AI_COMING_SOON_CARD: false,
    }));
    const s = await import('@/content/selectors');
    expect(s.mostrarCardIA()).toBe(false);
  });

  it('o card de IA nunca conta na faixa (não é Project)', () => {
    expect(contagemProjetosPublicados(PROJECTS)).toBe(0);
    expect(itensDaFaixa(PROJECTS, pt).some((i) => i.id === 'projetos')).toBe(false);
  });

  it('"Ver todos no GitHub →" sempre visível', () => {
    expect(mostrarLinkGithubGeral()).toBe(true);
  });
});

describe('dona única (D14): varredura em src/', () => {
  const raiz = process.cwd();
  function arquivos(dir: string): string[] {
    return readdirSync(dir).flatMap((nome) => {
      const caminho = join(dir, nome);
      return statSync(caminho).isDirectory() ? arquivos(caminho) : [caminho];
    });
  }
  const fontes = arquivos(resolve(raiz, 'src'))
    .filter((f) => /\.(ts|tsx)$/.test(f))
    .map((f) => ({ f: f.replaceAll('\\', '/'), texto: readFileSync(f, 'utf8') }));

  it('não existe src/sections/shared/projectSelectors.ts', () => {
    expect(existsSync(resolve(raiz, 'src/sections/shared/projectSelectors.ts'))).toBe(false);
  });

  it('nenhum getFeaturedProject/isPublished/contarProjetosPublicados em src/', () => {
    const proibido = /\b(getFeaturedProject|isPublished|contarProjetosPublicados)\b/;
    expect(fontes.filter(({ texto }) => proibido.test(texto)).map(({ f }) => f)).toEqual([]);
  });

  it('as funções de regra só são definidas em src/content/selectors.ts', () => {
    const definicao =
      /(function|const)\s+(githubHref|projetoHref|projetoEmDestaque|projetosDaGrade|botoesDoProjeto|contagemProjetosPublicados|itensDaFaixa)\b/;
    expect(fontes.filter(({ texto }) => definicao.test(texto)).map(({ f }) => f)).toEqual([
      expect.stringMatching(/src\/content\/selectors\.ts$/),
    ]);
  });
});
