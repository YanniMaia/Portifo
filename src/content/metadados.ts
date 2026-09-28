// Metadados de origem e pendência do conteúdo (C-01; doc 05 §4.4).
// Ficam FORA do dicionário: `pt.ts`/`en.ts` só têm strings, listas e funções (doc 05 §4.1).
// Tudo tipado por `KeyPath<Dictionary>`: chave inexistente não compila.
//
// - `PENDENCIA_POR_CHAVE`: chave do dicionário → pendência da Yanni (checklist do doc 05 §7).
//   Toda chave de `SUGERIDOS` precisa ter uma entrada aqui (teste em tests/unit/content).
// - `PENDENCIA_POR_PROJETO`: `id` do projeto (`projects.ts`, C-05) → pendências.
// - `TRADUCAO_EN`: chave → `'nova' | 'nova-IA'` (tradução EN que o §15 não traz; revisão P-12).
//   Chave ausente = tradução do §15 ou texto que não se traduz.
//
// Quem preenche: C-02 (`PENDENCIA_POR_CHAVE` e, na V1, `TRADUCAO_EN` junto com as chaves novas do
// `en.ts`), C-03 (revisão de `TRADUCAO_EN`, V2) e C-05 (`PENDENCIA_POR_PROJETO`).
import type { Dictionary, KeyPath } from '@/i18n/types';

/** IDs das pendências do checklist da Yanni (doc 05 §7). */
export type PendenciaId =
  | 'P-01'
  | 'P-02'
  | 'P-03'
  | 'P-04'
  | 'P-05'
  | 'P-06'
  | 'P-07'
  | 'P-08'
  | 'P-09'
  | 'P-10'
  | 'P-11'
  | 'P-12'
  | 'P-13'
  | 'P-14'
  | 'P-15'
  | 'P-IA-1'
  | 'P-IA-2'
  | 'P-IA-3';

/** Origem de uma tradução EN que não vem do §15 (doc 05 §4.5). */
export type OrigemTraducaoEn = 'nova' | 'nova-IA';

export type ChaveDicionario = KeyPath<Dictionary>;

/** Chave do dicionário → pendência que a Yanni precisa responder. */
export const PENDENCIA_POR_CHAVE: Readonly<Partial<Record<ChaveDicionario, PendenciaId>>> = {
  // Textos sugeridos pela adaptação IA (00-INDICE §3).
  'hero.pilula': 'P-IA-2',
  'hero.subtitulo': 'P-IA-2',
  'destaques.areas.valor': 'P-IA-2',
  'destaques.areas.legenda': 'P-IA-2',
  'interesses.seloEstudo': 'P-IA-2',
  'interesses.ia.titulo': 'P-IA-2',
  'interesses.ia.texto': 'P-IA-2',
  'projetos.ia.titulo': 'P-IA-2',
  'objetivos.trilhaIA.nome': 'P-IA-2',
  'objetivos.trilhaIA.etapas': 'P-IA-2',
  'meta.description': 'P-IA-2',
  // Textos sugeridos pelo próprio doc, derivados e novos de interface.
  'sobre.trajetoria.marcos': 'P-10',
  'contato.disponibilidade': 'P-10',
  'interesses.dados.chips': 'P-10',
  'interesses.ciber.chips': 'P-10',
  'interesses.dev.chips': 'P-10',
  'projetos.emDestaque': 'P-10',
  'objetivos.trilhaRotulo': 'P-10',
  'erro404.titulo': 'P-10',
  'erro404.voltar': 'P-10',
  // Legenda do número de projetos na faixa (DV-13).
  'destaques.projetos.legenda': 'P-11',
  // Placeholders (doc 05 §6) e lista pendente.
  'sobre.trajetoria.ano': 'P-05',
  'formacao.anoInicio': 'P-05',
  'formacao.previsao': 'P-05',
  'projetos.legendaReserva': 'P-03',
  'interesses.ia.chips': 'P-IA-1',
};

/** `id` do projeto (C-05) → pendências da ficha. */
export const PENDENCIA_POR_PROJETO: Readonly<Record<string, readonly PendenciaId[]>> = {};

/** Chave do dicionário → origem da tradução EN (para a revisão P-12). */
export const TRADUCAO_EN: Readonly<Partial<Record<ChaveDicionario, OrigemTraducaoEn>>> = {
  // Traduções novas criadas pela F-10 (pendência B-1 do diário F-10).
  'a11y.skipToContent': 'nova',
  'a11y.opensInNewTab': 'nova',
  'a11y.themeToDark': 'nova',
  'a11y.themeToLight': 'nova',
  'a11y.language': 'nova',
  'meta.title': 'nova',
  // Chaves novas da C-02 (coluna EN do Anexo A; revisão fina na C-03, V2).
  'menu.abrir': 'nova',
  'menu.fechar': 'nova',
  'menu.navAria': 'nova',
  'marca.aria': 'nova',
  'hero.pilula': 'nova-IA',
  'hero.subtitulo': 'nova-IA',
  'hero.dicaMonograma': 'nova',
  'hero.monogramaAria': 'nova',
  'destaques.aria': 'nova',
  'destaques.areas.legenda': 'nova-IA',
  'destaques.linguagens.legenda': 'nova',
  'destaques.projetos.legenda': 'nova',
  'destaques.formacao.legenda': 'nova',
  'frase.eyebrow': 'nova',
  'frase.conectivo': 'nova',
  'frase.apoio': 'nova',
  'sobre.eyebrow': 'nova',
  'sobre.verHabilidades': 'nova',
  'sobre.trajetoria.titulo': 'nova',
  'sobre.trajetoria.marcos': 'nova',
  'interesses.eyebrow': 'nova',
  'interesses.subtitulo': 'nova',
  'interesses.seloFoco': 'nova',
  'interesses.seloEstudo': 'nova-IA',
  'interesses.dados.titulo': 'nova',
  'interesses.dados.texto': 'nova',
  'interesses.dados.chips': 'nova',
  'interesses.ciber.titulo': 'nova',
  'interesses.ciber.texto': 'nova',
  'interesses.ciber.chips': 'nova',
  'interesses.ia.titulo': 'nova-IA',
  'interesses.ia.texto': 'nova-IA',
  'interesses.dev.titulo': 'nova',
  'interesses.dev.texto': 'nova',
  'interesses.dev.chips': 'nova',
  'habilidades.eyebrow': 'nova',
  'habilidades.linguagens.titulo': 'nova',
  'habilidades.ferramentas.titulo': 'nova',
  'habilidades.conceitos.titulo': 'nova',
  'habilidades.conceitos.chips': 'nova',
  'projetos.eyebrow': 'nova',
  'projetos.subtitulo': 'nova',
  'projetos.emDestaque': 'nova',
  'projetos.botaoVer': 'nova',
  'projetos.verTodos': 'nova',
  'projetos.ia.titulo': 'nova-IA',
  'projetos.alt.estoque': 'nova',
  'projetos.alt.padrao': 'nova',
  'formacao.eyebrow': 'nova',
  'formacao.curso': 'nova',
  'formacao.futuro': 'nova',
  'objetivos.eyebrow': 'nova',
  'objetivos.trilhaRotulo': 'nova',
  'objetivos.trilhaDados.nome': 'nova',
  'objetivos.trilhaDados.etapas': 'nova',
  'objetivos.trilhaCiber.nome': 'nova',
  'objetivos.trilhaCiber.etapas': 'nova',
  'objetivos.trilhaIA.nome': 'nova-IA',
  'objetivos.trilhaIA.etapas': 'nova-IA',
  'contato.eyebrow': 'nova',
  'contato.botaoEmail': 'nova',
  'contato.copiar': 'nova',
  'contato.copiado': 'nova',
  'contato.copiarAria': 'nova',
  'contato.copiadoAnuncio': 'nova',
  'rodape.frase': 'nova',
  'rodape.linksRapidos': 'nova',
  'rodape.navAria': 'nova',
  'rodape.socialTitulo': 'nova',
  'rodape.social.linkedinAria': 'nova',
  'rodape.social.githubAria': 'nova',
  'rodape.social.emailAria': 'nova',
  'rodape.copyright': 'nova',
  'rodape.voltarTopo': 'nova',
  'meta.description': 'nova-IA',
  'meta.ogAlt': 'nova',
  'erro404.titulo': 'nova',
  'erro404.voltar': 'nova',
};
