// Fichas de projeto (doc de design §7.8, §12.1–12.5, §14) — task C-05. SÓ DADOS.
// As regras de exibição (destaque, grade, botões, contagem da faixa) ficam em `./selectors.ts`
// (C-06, dona única — D14). Textos copiados do Anexo A.9 do doc 05 (pt = literal do doc de design).
//
// - A ordem do array é a ordem de exibição (não há campo `ordem`).
// - `publicado: false` em todos até a Yanni confirmar cada repositório (P-01; a virada é da D-09).
//   Os links do §12.5 já ficam gravados, mas só viram botão com `publicado: true` (C-06).
// - Placeholders (doc 05 §4.3, D11): o rótulo `[…]` só existe em desenvolvimento. Em produção o
//   campo fica `undefined` (link ausente; o botão não existe) e o rótulo sai do bundle (`postbuild`,
//   C-01). Nunca `'#'` nem string vazia.
// - As traduções EN das etiquetas e descrições são "nova" (Anexo A.9) e entram na revisão P-12.
// - Novo projeto = um objeto novo no array (§14). Sem imagem, usa a ilustração padrão (C-08).
import { SHOW_PLACEHOLDERS } from '@/lib/flags';
import type { ChaveDicionario } from './metadados';
import type { Project } from './types';

export const PROJECTS: readonly Project[] = [
  {
    // §7.8 (painel em destaque).
    id: 'gerenciador-de-estoque',
    nome: 'Gerenciador de Estoque',
    area: 'desenvolvimento',
    etiqueta: { pt: 'Python', en: 'Python' },
    descricao: {
      pt: 'Projeto desenvolvido para praticar conceitos de programação e gerenciamento de informações, simulando operações relacionadas ao controle de estoque.',
      en: 'Project developed to practice programming and information management concepts, simulating inventory control operations.',
    },
    tecnologias: ['Python', 'Git/GitHub'],
    // Sem `imagem`: variante "estoque" da C-08 com a legenda de reserva PH-03 (P-03).
    projetoDeEstudo: false, // até a resposta da P-14 (o painel de destaque não tem selo no §7.8)
    linkProjeto: SHOW_PLACEHOLDERS ? '[link da demonstração]' : undefined, // PH-01 (P-04)
    linkGithub: SHOW_PLACEHOLDERS ? 'https://github.com/YanniMaia/[repositório]' : undefined, // PH-02 (P-02)
    publicado: false,
    destaque: true,
    placeholder: true,
  },
  {
    // §12.1.
    id: 'banco-de-dados-biblioteca',
    nome: 'Banco de Dados da Biblioteca',
    area: 'banco-de-dados',
    etiqueta: { pt: 'Banco de Dados / SQL', en: 'Databases / SQL' },
    descricao: {
      pt: 'Modelagem de uma biblioteca em SQLite, com chaves, regras de qualidade, consultas com JOIN e dicionário de dados.',
      en: 'Library data model in SQLite, with keys, quality rules, JOIN queries and a data dictionary.',
    },
    tecnologias: ['SQL', 'SQLite', 'Python'],
    projetoDeEstudo: true,
    linkGithub: 'https://github.com/YanniMaia/banco-de-dados-biblioteca', // §12.5
    publicado: false, // P-01
    destaque: false,
  },
  {
    // §12.2.
    id: 'ciberseguranca-analisador-de-logs',
    nome: 'Analisador de Logs e Verificador de Senhas',
    area: 'ciberseguranca',
    etiqueta: { pt: 'Cibersegurança', en: 'Cybersecurity' },
    descricao: {
      pt: 'Detecta possível força bruta em logs de autenticação fictícios e avalia a força de senhas, com foco defensivo.',
      en: 'Detects possible brute-force attacks in fictitious authentication logs and evaluates password strength, with a defensive focus.',
    },
    tecnologias: ['Python'],
    projetoDeEstudo: true,
    linkGithub: 'https://github.com/YanniMaia/ciberseguranca-analisador-de-logs', // §12.5
    publicado: false, // P-01
    destaque: false,
  },
  {
    // §12.3. A imagem `receita_por_mes` é da C-07 (⛔ P-15); até lá, variante "padrao" da C-08.
    id: 'analise-de-dados-vendas',
    nome: 'Análise de Dados de Vendas',
    area: 'dados',
    etiqueta: { pt: 'Análise de Dados', en: 'Data Analysis' },
    descricao: {
      pt: 'Verifica a qualidade, limpa e analisa um conjunto de vendas fictício, com resumo e gráficos.',
      en: 'Checks the quality of, cleans and analyzes a fictitious sales dataset, with a summary and charts.',
    },
    tecnologias: ['Python', 'pandas', 'matplotlib'],
    projetoDeEstudo: true,
    linkGithub: 'https://github.com/YanniMaia/analise-de-dados-vendas', // §12.5
    publicado: false, // P-01
    destaque: false,
  },
  {
    // §12.4.
    id: 'python-organizador-de-arquivos',
    nome: 'Organizador de Arquivos',
    area: 'desenvolvimento',
    etiqueta: { pt: 'Python / Automação', en: 'Python / Automation' },
    descricao: {
      pt: 'Programa de linha de comando que organiza arquivos por tipo, com modo simulação e sem sobrescrever nada.',
      en: 'Command-line program that organizes files by type, with a simulation mode and without overwriting anything.',
    },
    tecnologias: ['Python'],
    projetoDeEstudo: true,
    linkGithub: 'https://github.com/YanniMaia/python-organizador-de-arquivos', // §12.5
    publicado: false, // P-01
    destaque: false,
  },
];

/**
 * Variante da ilustração da C-08 por `id` de projeto (usada enquanto não há `imagem`).
 * Projeto que não estiver aqui usa `'padrao'` (o seletor `varianteIlustracao` da C-06 garante).
 */
export const VARIANTE_ILUSTRACAO: Readonly<Record<string, 'estoque' | 'padrao'>> = {
  'gerenciador-de-estoque': 'estoque',
  'banco-de-dados-biblioteca': 'padrao',
  'ciberseguranca-analisador-de-logs': 'padrao',
  'analise-de-dados-vendas': 'padrao',
  'python-organizador-de-arquivos': 'padrao',
};

/**
 * Card "Projeto de IA — em breve" (00-INDICE §3; DV-5, DV-15). NÃO é um `Project`: sem descrição,
 * botão nem tecnologias, e nunca conta na faixa. Sem campo de liga/desliga: a visibilidade é só a
 * flag `SHOW_AI_COMING_SOON_CARD` (F-15). O título é sugerido (P-IA-2) e o projeto real é a P-IA-3.
 */
export const CARD_IA = {
  tituloChave: 'projetos.ia.titulo',
  icone: 'BrainCircuit',
} as const satisfies { tituloChave: ChaveDicionario; icone: string };
