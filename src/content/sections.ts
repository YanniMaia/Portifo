// Registro ÚNICO das seções âncora do site (F-12, D14; doc de design §2 e §7.1).
// Nenhum outro arquivo declara ids de seção à mão: `Section` (DS-10), stubs (F-14), seções (S),
// animações (A-07/A-08) e testes importam `SECTIONS`, `SECTION_IDS` ou `NAV_ITEMS` daqui.
// Cabeçalho (§2 linha 1) e rodapé (§2 linha 12) não entram: não são `<section>` navegáveis.
// Sem texto de interface: os rótulos do menu são as chaves `nav.*` do dicionário (F-10).
import type { Dictionary, DictionaryKey } from '@/i18n/types';

/**
 * Fundo claro da seção (§2): `base` = branco (#FFFFFF, no hero com brilhos), `alt` = #FFF7FA,
 * `tint` = #FFEEF4 (escuro #1C0E16, DV-10). Os valores de cor são tokens do DS-01.
 */
export type SectionTone = 'base' | 'alt' | 'tint';

/** Item do menu (§7.1). É o nome de uma chave `nav.*` do dicionário: `'sobre' | ... | 'contato'`. */
export type NavTarget = keyof Dictionary['nav'];

/** Entrada do registro. `navTarget: null` = nenhum link do menu fica ativo nesta seção. */
export interface SectionDef {
  readonly id: string;
  readonly navTarget: NavTarget | null;
  readonly tone: SectionTone;
}

/** As 10 seções âncora, na ordem exata do §2 (linhas 2 a 11). Não mudar a ordem (00-INDICE §3). */
export const SECTIONS = [
  { id: 'inicio', navTarget: null, tone: 'base' }, // 2 · Hero (o logo volta aqui)
  { id: 'destaques', navTarget: null, tone: 'base' }, // 3 · Faixa de destaques
  { id: 'frase', navTarget: null, tone: 'tint' }, // 4 · Frase de destaque
  { id: 'sobre', navTarget: 'sobre', tone: 'base' }, // 5 · Sobre mim
  { id: 'interesses', navTarget: 'interesses', tone: 'alt' }, // 6 · Áreas de interesse
  { id: 'habilidades', navTarget: 'habilidades', tone: 'base' }, // 7 · Habilidades
  { id: 'projetos', navTarget: 'projetos', tone: 'alt' }, // 8 · Projetos
  { id: 'formacao', navTarget: 'formacao', tone: 'base' }, // 9 · Formação acadêmica
  { id: 'objetivos', navTarget: 'formacao', tone: 'alt' }, // 10 · Onde quero chegar ("Formação" continua ativo)
  { id: 'contato', navTarget: 'contato', tone: 'base' }, // 11 · Contato (+ painel em degradê)
] as const satisfies readonly SectionDef[];

type IdsDe<T extends readonly { readonly id: string }[]> = {
  readonly [K in keyof T]: T[K] extends { readonly id: infer I } ? I : never;
};

/**
 * Tupla dos 10 ids, na ordem do §2, derivada de `SECTIONS` (sem repetir a lista).
 * O `map` devolve `string[]` para o TS; a conversão para a tupla é segura porque o `map` preserva
 * ordem e tamanho (conferido em `tests/unit/content/sections.test.ts`).
 */
export const SECTION_IDS = SECTIONS.map((secao) => secao.id) as unknown as IdsDe<typeof SECTIONS>;

/** Id de âncora válido. Tipa a prop `id` da `Section` (DS-10); um id fora do registro não compila. */
export type SectionId = (typeof SECTION_IDS)[number];

/** Item do menu: âncora de destino e chave do rótulo no dicionário (`nav.*`, F-10). */
export interface NavItem {
  readonly id: NavTarget & SectionId;
  readonly labelKey: DictionaryKey & `nav.${NavTarget}`;
}

/**
 * Os 6 itens do menu (§7.1: Sobre, Interesses, Habilidades, Projetos, Formação, Contato),
 * derivados do registro: cada seção cujo `navTarget` é ela mesma vira um item, na ordem do §2.
 */
export const NAV_ITEMS: readonly NavItem[] = SECTIONS.flatMap((secao): NavItem[] =>
  secao.navTarget === secao.id ? [{ id: secao.navTarget, labelKey: `nav.${secao.navTarget}` }] : [],
);

const NAV_TARGET_POR_ID = new Map<SectionId, NavTarget | null>(
  SECTIONS.map((secao) => [secao.id, secao.navTarget]),
);

/** Item do menu que fica ativo quando a seção `id` está na faixa de leitura (`objetivos` → `formacao`). */
export function navTargetOf(id: SectionId): NavTarget | null {
  return NAV_TARGET_POR_ID.get(id) ?? null;
}
