// Regras de projeto do site — task C-06, implementação ÚNICA (D14).
// Destaque, grade, botões, contagem de publicados e itens da faixa de destaques.
// Funções puras sobre os dados de `./projects.ts` (C-05). O S-00 e as seções só consomem daqui;
// não existe `src/sections/shared/projectSelectors.ts`.
//
// Doc de design: §7.3 (Atenção: mostrar só o número real de projetos com link), §7.8 (Regra dos
// botões; "Se o destaque ainda não tiver link"; grade), §14 (Destaque), §17. Canvas: DV-5, DV-7, DV-13.
import type { Dictionary } from '@/i18n/types';
import { SHOW_AI_COMING_SOON_CARD } from '@/lib/flags';
import { isPlaceholder } from '@/lib/placeholder';
import { VARIANTE_ILUSTRACAO } from './projects';
import type { Project } from './types';

/** Projeto que ocupa o painel quando o destaque oficial não tem repositório publicado (§7.8). */
const ID_DESTAQUE_RESERVA = 'analise-de-dados-vendas';

/** Link real: existe e não é placeholder (D23: contém `[` e `]`; `''` também conta como ausente). */
function linkReal(link: string | undefined): string | undefined {
  return isPlaceholder(link) ? undefined : link;
}

/**
 * Destino do botão "GitHub": `linkGithub` **só** quando o repositório está publicado
 * (`publicado: true`, D14) e o link é real. Senão, `undefined` (o botão não existe, D11).
 */
export function githubHref(p: Project): string | undefined {
  return p.publicado ? linkReal(p.linkGithub) : undefined;
}

/** Destino do botão "Ver projeto": `linkProjeto` real, ou `undefined` (o botão não existe). */
export function projetoHref(p: Project): string | undefined {
  return linkReal(p.linkProjeto);
}

/**
 * Projeto do painel grande. Cascata (sempre 1 resultado com os dados reais):
 * (a) o projeto com `destaque: true`, se tiver `githubHref`;
 * (b) senão, "Análise de Dados de Vendas", se tiver `githubHref` (§7.8);
 * (c) senão, o projeto com `destaque: true`, sem botões.
 * Defensivo (não acontece com os dados atuais): sem nenhum `destaque: true`, usa o primeiro da
 * lista; lista vazia → `undefined`.
 */
export function projetoEmDestaque(lista: readonly Project[]): Project | undefined {
  const oficial = lista.find((p) => p.destaque);
  if (oficial && githubHref(oficial)) return oficial;

  const reserva = lista.find((p) => p.id === ID_DESTAQUE_RESERVA);
  if (reserva && githubHref(reserva)) return reserva;

  return oficial ?? lista[0];
}

/**
 * Cards da grade: todos os projetos, na ordem do array, exceto o do painel.
 * Os cards **nunca** são ocultados, publicados ou não (D14). Quando o Gerenciador sai do
 * destaque (caso b), ele entra aqui.
 */
export function projetosDaGrade(lista: readonly Project[]): Project[] {
  const destaque = projetoEmDestaque(lista);
  return lista.filter((p) => p.id !== destaque?.id);
}

/** Botão de um projeto, na ordem de exibição: "Ver projeto" (primário) e depois "GitHub". */
export interface BotaoProjeto {
  tipo: 'verProjeto' | 'github';
  href: string;
  /** Chave do rótulo no dicionário (C-02). */
  rotuloChave: 'projetos.botaoVer' | 'projetos.botaoGithub';
}

/** Só os botões com destino real. Sem link, o botão não existe (D11, §7.8). */
export function botoesDoProjeto(p: Project): BotaoProjeto[] {
  const botoes: BotaoProjeto[] = [];
  const ver = projetoHref(p);
  if (ver) botoes.push({ tipo: 'verProjeto', href: ver, rotuloChave: 'projetos.botaoVer' });
  const github = githubHref(p);
  if (github) botoes.push({ tipo: 'github', href: github, rotuloChave: 'projetos.botaoGithub' });
  return botoes;
}

/** Nº de projetos com repositório publicado (com `githubHref`). O card de IA nunca conta. */
export function contagemProjetosPublicados(lista: readonly Project[]): number {
  return lista.filter((p) => githubHref(p) !== undefined).length;
}

/** Item da faixa de destaques (§7.3). Os numéricos recebem o gancho de contagem (S-05, A-04). */
export type ItemFaixa =
  | { id: 'areas' | 'linguagens' | 'projetos'; tipo: 'numero'; valor: number; legenda: string }
  | { id: 'formacao'; tipo: 'texto'; valor: string; legenda: string };

/**
 * Itens da faixa, na ordem do §7.3: áreas, linguagens, projetos e formação.
 * O item de projetos usa `contagemProjetosPublicados` e a legenda única do DV-13
 * (`destaques.projetos.legenda(n)`). **Com 0 publicados, o item é omitido** (3 itens).
 */
export function itensDaFaixa(lista: readonly Project[], dict: Dictionary): ItemFaixa[] {
  const d = dict.destaques;
  const publicados = contagemProjetosPublicados(lista);
  const itens: ItemFaixa[] = [
    { id: 'areas', tipo: 'numero', valor: Number(d.areas.valor), legenda: d.areas.legenda },
    {
      id: 'linguagens',
      tipo: 'numero',
      valor: Number(d.linguagens.valor),
      legenda: d.linguagens.legenda,
    },
  ];
  if (publicados > 0) {
    itens.push({
      id: 'projetos',
      tipo: 'numero',
      valor: publicados,
      legenda: d.projetos.legenda(publicados),
    });
  }
  itens.push({
    id: 'formacao',
    tipo: 'texto',
    valor: d.formacao.valor,
    legenda: d.formacao.legenda,
  });
  return itens;
}

/** Card "Projeto de IA — em breve": visível só pela flag única da F-15. */
export function mostrarCardIA(): boolean {
  return SHOW_AI_COMING_SOON_CARD;
}

/** "Ver todos no GitHub →": sempre visível (o perfil existe, §7.8). */
export function mostrarLinkGithubGeral(): boolean {
  return true;
}

/**
 * Variante da ilustração da C-08 para um projeto sem `imagem` (`VARIANTE_ILUSTRACAO` da C-05).
 * Projeto novo sem entrada na tabela usa `'padrao'`.
 */
export function varianteIlustracao(p: Project): 'estoque' | 'padrao' {
  return VARIANTE_ILUSTRACAO[p.id] ?? 'padrao';
}
