// C-05: fichas de projeto (src/content/projects.ts) conferidas com o doc 05 §5.1 / Anexo A.9 e com
// o próprio documento de design (§7.8, §12.1–12.5, §14).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vitest';
import type { ProjectIllustrationVariant } from '@/components/illustrations';
import { pt } from '@/content/pt';
import { PENDENCIA_POR_PROJETO } from '@/content/metadados';
import { CARD_IA, PROJECTS, VARIANTE_ILUSTRACAO } from '@/content/projects';
import { SUGERIDOS } from '@/content/sugeridos';
import type { Project } from '@/content/types';
import { validarFichas } from '@/content/validarFichas';

const raiz = process.cwd();
const docDesign = readFileSync(resolve(raiz, 'plano/referencia/documento-design-v1.1.txt'), 'utf8');

/** Trecho do doc de design entre o cabeçalho `inicio` e o próximo cabeçalho de seção. */
function secaoDoDoc(inicio: string): string {
  const linhas = docDesign.split(/\r?\n/);
  const i = linhas.findIndex((l) => l.startsWith(`[Heading2] ${inicio}`));
  if (i < 0) throw new Error(`Seção "${inicio}" não encontrada no doc de design.`);
  const fim = linhas.findIndex((l, j) => j > i && l.startsWith('[Heading'));
  return linhas.slice(i, fim < 0 ? undefined : fim).join('\n');
}

/** Valor de uma linha `| Rótulo | valor |` dentro de um trecho do doc. */
function valorDaLinha(trecho: string, rotulo: string): string {
  const linha = trecho.split('\n').find((l) => l.startsWith(`| ${rotulo} |`));
  if (!linha) throw new Error(`Linha "${rotulo}" não encontrada.`);
  return linha.split('|')[2]?.trim() ?? '';
}

function porId(id: string): Project {
  const p = PROJECTS.find((x) => x.id === id);
  if (!p) throw new Error(`Projeto "${id}" ausente.`);
  return p;
}

/** Tabela-fonte do doc 05 §5.1 (transcrita). Os testes de dev rodam com `SHOW_PLACEHOLDERS = true`. */
const TABELA_5_1 = [
  {
    id: 'gerenciador-de-estoque',
    nome: 'Gerenciador de Estoque',
    area: 'desenvolvimento',
    etiqueta: 'Python',
    tecnologias: ['Python', 'Git/GitHub'],
    projetoDeEstudo: false,
    linkGithub: 'https://github.com/YanniMaia/[repositório]',
    variante: 'estoque',
  },
  {
    id: 'banco-de-dados-biblioteca',
    nome: 'Banco de Dados da Biblioteca',
    area: 'banco-de-dados',
    etiqueta: 'Banco de Dados / SQL',
    tecnologias: ['SQL', 'SQLite', 'Python'],
    projetoDeEstudo: true,
    linkGithub: 'https://github.com/YanniMaia/banco-de-dados-biblioteca',
    variante: 'padrao',
  },
  {
    id: 'ciberseguranca-analisador-de-logs',
    nome: 'Analisador de Logs e Verificador de Senhas',
    area: 'ciberseguranca',
    etiqueta: 'Cibersegurança',
    tecnologias: ['Python'],
    projetoDeEstudo: true,
    linkGithub: 'https://github.com/YanniMaia/ciberseguranca-analisador-de-logs',
    variante: 'padrao',
  },
  {
    id: 'analise-de-dados-vendas',
    nome: 'Análise de Dados de Vendas',
    area: 'dados',
    etiqueta: 'Análise de Dados',
    tecnologias: ['Python', 'pandas', 'matplotlib'],
    projetoDeEstudo: true,
    linkGithub: 'https://github.com/YanniMaia/analise-de-dados-vendas',
    variante: 'padrao',
  },
  {
    id: 'python-organizador-de-arquivos',
    nome: 'Organizador de Arquivos',
    area: 'desenvolvimento',
    etiqueta: 'Python / Automação',
    tecnologias: ['Python'],
    projetoDeEstudo: true,
    linkGithub: 'https://github.com/YanniMaia/python-organizador-de-arquivos',
    variante: 'padrao',
  },
] as const;

/** Anexo A.9 (segunda tabela): descrições e etiquetas pt/en, transcritas. */
const ANEXO_A9: Record<string, { etiqueta: [string, string]; descricao: [string, string] }> = {
  'gerenciador-de-estoque': {
    etiqueta: ['Python', 'Python'],
    descricao: [
      'Projeto desenvolvido para praticar conceitos de programação e gerenciamento de informações, simulando operações relacionadas ao controle de estoque.',
      'Project developed to practice programming and information management concepts, simulating inventory control operations.',
    ],
  },
  'banco-de-dados-biblioteca': {
    etiqueta: ['Banco de Dados / SQL', 'Databases / SQL'],
    descricao: [
      'Modelagem de uma biblioteca em SQLite, com chaves, regras de qualidade, consultas com JOIN e dicionário de dados.',
      'Library data model in SQLite, with keys, quality rules, JOIN queries and a data dictionary.',
    ],
  },
  'ciberseguranca-analisador-de-logs': {
    etiqueta: ['Cibersegurança', 'Cybersecurity'],
    descricao: [
      'Detecta possível força bruta em logs de autenticação fictícios e avalia a força de senhas, com foco defensivo.',
      'Detects possible brute-force attacks in fictitious authentication logs and evaluates password strength, with a defensive focus.',
    ],
  },
  'analise-de-dados-vendas': {
    etiqueta: ['Análise de Dados', 'Data Analysis'],
    descricao: [
      'Verifica a qualidade, limpa e analisa um conjunto de vendas fictício, com resumo e gráficos.',
      'Checks the quality of, cleans and analyzes a fictitious sales dataset, with a summary and charts.',
    ],
  },
  'python-organizador-de-arquivos': {
    etiqueta: ['Python / Automação', 'Python / Automation'],
    descricao: [
      'Programa de linha de comando que organiza arquivos por tipo, com modo simulação e sem sobrescrever nada.',
      'Command-line program that organizes files by type, with a simulation mode and without overwriting anything.',
    ],
  },
};

/** Seção do doc de design de cada projeto de estudo (§12.1–12.4). */
const SECAO_12: Record<string, string> = {
  'banco-de-dados-biblioteca': '12.1 ',
  'ciberseguranca-analisador-de-logs': '12.2 ',
  'analise-de-dados-vendas': '12.3 ',
  'python-organizador-de-arquivos': '12.4 ',
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('projects.ts (C-05): dados idênticos à tabela §5.1', () => {
  it('5 projetos, na ordem da tabela (a ordem do array é a de exibição)', () => {
    expect(PROJECTS.map((p) => p.id)).toEqual(TABELA_5_1.map((l) => l.id));
  });

  it.each(TABELA_5_1)('$id: nome, área, etiqueta, chips, selo e linkGithub', (linha) => {
    const p = porId(linha.id);
    expect(p.nome).toBe(linha.nome);
    expect(p.area).toBe(linha.area);
    expect(p.etiqueta?.pt).toBe(linha.etiqueta);
    expect(p.tecnologias).toEqual(linha.tecnologias);
    expect(p.projetoDeEstudo).toBe(linha.projetoDeEstudo);
    expect(p.linkGithub).toBe(linha.linkGithub);
    expect(VARIANTE_ILUSTRACAO[linha.id]).toBe(linha.variante);
  });

  it.each(Object.entries(ANEXO_A9))(
    '%s: etiqueta e descrição pt/en iguais ao Anexo A.9',
    (id, a9) => {
      const p = porId(id);
      expect([p.etiqueta?.pt, p.etiqueta?.en]).toEqual(a9.etiqueta);
      expect([p.descricao.pt, p.descricao.en]).toEqual(a9.descricao);
    },
  );

  it('todos com publicado: false (P-01; a virada é da D-09, com confirmação da Yanni)', () => {
    for (const p of PROJECTS) expect(p.publicado, p.id).toBe(false);
  });

  it('só 1 com destaque: true, e é o Gerenciador de Estoque', () => {
    expect(PROJECTS.filter((p) => p.destaque).map((p) => p.id)).toEqual(['gerenciador-de-estoque']);
  });

  it('Gerenciador: placeholders PH-01/PH-02 em dev, sem imagem, placeholder: true', () => {
    const g = porId('gerenciador-de-estoque');
    expect(g.linkProjeto).toBe('[link da demonstração]');
    expect(g.linkGithub).toBe('https://github.com/YanniMaia/[repositório]');
    expect(g.imagem).toBeUndefined();
    expect(g.placeholder).toBe(true);
  });

  it('nenhuma ficha tem imagem ainda (C-07 ⛔ P-15; C-08 cobre) nem linkProjeto real', () => {
    for (const p of PROJECTS) {
      expect(p.imagem, p.id).toBeUndefined();
      if (p.id !== 'gerenciador-de-estoque') expect(p.linkProjeto, p.id).toBeUndefined();
    }
  });

  it('nenhum texto da ficha é sugerido (todos literais do doc)', () => {
    for (const p of PROJECTS) expect(p.sugerido, p.id).toBeUndefined();
  });

  it('nenhum link é "#" nem string vazia', () => {
    for (const p of PROJECTS) {
      for (const link of [p.linkProjeto, p.linkGithub]) {
        expect(link, p.id).not.toBe('#');
        expect(link, p.id).not.toBe('');
      }
    }
  });

  it('validarFichas(PROJECTS) sem erros (F-11)', () => {
    expect(validarFichas(PROJECTS)).toEqual([]);
  });
});

describe('projects.ts (C-05): conferência direta com o documento de design', () => {
  it('Gerenciador (§7.8): etiqueta, nome, descrição, chips e os dois placeholders dos botões', () => {
    const conteudo = valorDaLinha(secaoDoDoc('7.8 Projetos'), 'Conteúdo');
    const g = porId('gerenciador-de-estoque');
    expect(conteudo).toContain(`Etiqueta “${g.etiqueta?.pt ?? ''}”`);
    expect(conteudo).toContain(`H3 “${g.nome}”`);
    expect(conteudo).toContain(`Descrição: “${g.descricao.pt}”`);
    expect(conteudo).toContain(`Chips de tecnologia: ${g.tecnologias.join(', ')}Botões`);
    expect(conteudo).toContain(`Ver projeto (primário, ${g.linkProjeto ?? ''})`);
    expect(conteudo).toContain(`GitHub (secundário, ${g.linkGithub ?? ''})`);
  });

  it.each(Object.entries(SECAO_12))('%s (§%s): área, descrição e chips do doc', (id, secao) => {
    const trecho = secaoDoDoc(secao);
    const p = porId(id);
    expect(valorDaLinha(trecho, 'Repositório')).toBe(id);
    expect(valorDaLinha(trecho, 'Área no site')).toBe(p.etiqueta?.pt);
    expect(valorDaLinha(trecho, 'Descrição do card')).toBe(`“${p.descricao.pt}”`);
    expect(valorDaLinha(trecho, 'Tecnologias (chips)')).toBe(p.tecnologias.join(', '));
  });

  it('os 4 links do §12.5 são exatamente os linkGithub dos projetos de estudo', () => {
    const tabela = secaoDoDoc('12.5 ');
    const links = [...tabela.matchAll(/https:\/\/github\.com\/YanniMaia\/[\w-]+/g)].map(
      (m) => m[0],
    );
    const deEstudo = PROJECTS.filter((p) => p.projetoDeEstudo).map((p) => p.linkGithub);
    expect(deEstudo).toEqual(links);
    expect(links).toHaveLength(4);
    // O Gerenciador não tem link no §12.5: só o rótulo pendente.
    expect(tabela).toContain(
      '| Gerenciador de Estoque (o seu) | [colocar o link do seu repositório] |',
    );
  });

  it('nomes de projeto do §7.8/§12 (não traduzidos, §15)', () => {
    for (const p of PROJECTS) expect(docDesign, p.id).toContain(p.nome);
  });
});

describe('projects.ts (C-05): produção (SHOW_PLACEHOLDERS = false)', () => {
  async function carregarProducao() {
    vi.stubEnv('DEV', false);
    vi.stubEnv('PROD', true);
    vi.resetModules();
    return import('@/content/projects');
  }

  it('Gerenciador sem linkProjeto/linkGithub (undefined) e nenhum "[" ou "]" em nenhuma ficha', async () => {
    const { PROJECTS: emProducao } = await carregarProducao();
    const g = emProducao.find((p) => p.id === 'gerenciador-de-estoque');
    expect(g?.linkProjeto).toBeUndefined();
    expect(g?.linkGithub).toBeUndefined();
    const strings: string[] = [];
    JSON.stringify(emProducao, (_chave, valor: unknown) => {
      if (typeof valor === 'string') strings.push(valor);
      return valor;
    });
    expect(strings.length).toBeGreaterThan(20);
    expect(strings.filter((s) => s.includes('[') || s.includes(']'))).toEqual([]);
  });

  it('validarFichas sem erros também em produção', async () => {
    const { PROJECTS: emProducao } = await carregarProducao();
    expect(validarFichas(emProducao)).toEqual([]);
  });
});

describe('projects.ts (C-05): card de IA, metadados e extensibilidade', () => {
  it('CARD_IA só com o título (chave do dicionário) e o ícone BrainCircuit (DV-15)', () => {
    expect(CARD_IA).toEqual({ tituloChave: 'projetos.ia.titulo', icone: 'BrainCircuit' });
    expect(pt.projetos.ia.titulo).toBe('Projeto de IA — em breve');
    // Sem descrição, botão, tecnologias nem flag própria (a flag é SHOW_AI_COMING_SOON_CARD, F-15).
    for (const campo of [
      'descricao',
      'tecnologias',
      'linkGithub',
      'linkProjeto',
      'ativo',
      'visivel',
    ]) {
      expect(CARD_IA, campo).not.toHaveProperty(campo);
    }
    expect(SUGERIDOS).toContain('projetos.ia.titulo');
  });

  it('CARD_IA não é um Project nem está em PROJECTS', () => {
    expect(PROJECTS.some((p) => p.nome.includes('IA'))).toBe(false);
    expect(PROJECTS).toHaveLength(5);
  });

  it('VARIANTE_ILUSTRACAO cobre todos os projetos e usa o tipo da C-08', () => {
    expect(Object.keys(VARIANTE_ILUSTRACAO).sort()).toEqual(PROJECTS.map((p) => p.id).sort());
    expectTypeOf<
      (typeof VARIANTE_ILUSTRACAO)[string]
    >().toEqualTypeOf<ProjectIllustrationVariant>();
  });

  it('PENDENCIA_POR_PROJETO: uma entrada por projeto, com as pendências do checklist §7', () => {
    expect(PENDENCIA_POR_PROJETO).toEqual({
      'gerenciador-de-estoque': ['P-02', 'P-03', 'P-04', 'P-14'],
      'banco-de-dados-biblioteca': ['P-01'],
      'ciberseguranca-analisador-de-logs': ['P-01'],
      'analise-de-dados-vendas': ['P-01', 'P-15'],
      'python-organizador-de-arquivos': ['P-01'],
    });
  });

  it('um 6º projeto (dado falso, só no teste) é só mais um objeto válido', () => {
    const falso: Project = {
      id: 'projeto-ficticio-de-teste',
      nome: 'Projeto Fictício de Teste',
      area: 'dados',
      descricao: { pt: 'Texto de teste.', en: 'Test text.' },
      tecnologias: ['Python'],
      projetoDeEstudo: true,
      linkGithub: 'https://github.com/YanniMaia/projeto-ficticio-de-teste',
      publicado: false,
      destaque: false,
    };
    expect(validarFichas([...PROJECTS, falso])).toEqual([]);
  });
});

describe('varredura em src/ (C-05)', () => {
  function arquivos(dir: string): string[] {
    return readdirSync(dir).flatMap((nome) => {
      const caminho = join(dir, nome);
      return statSync(caminho).isDirectory() ? arquivos(caminho) : [caminho];
    });
  }
  const fontes = arquivos(resolve(raiz, 'src'))
    .filter((f) => /\.(ts|tsx)$/.test(f))
    .map((f) => ({ f, texto: readFileSync(f, 'utf8') }));

  it('nenhuma ocorrência de repoPublicado (D14)', () => {
    expect(fontes.filter(({ texto }) => texto.includes('repoPublicado')).map(({ f }) => f)).toEqual(
      [],
    );
  });

  it("nenhuma área com maiúscula (ex.: area: 'Dados')", () => {
    const maiuscula = /\barea\s*[:=]+\s*['"][A-ZÁÉÍÓÚÂÊÔÃÕÇ]/;
    expect(fontes.filter(({ texto }) => maiuscula.test(texto)).map(({ f }) => f)).toEqual([]);
  });
});
