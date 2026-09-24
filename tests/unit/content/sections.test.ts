// Registro de seções (F-12). ÚNICO teste do projeto com a lista de ids escrita à mão: todos os
// outros importam `SECTION_IDS`/`SECTIONS`. Os `@ts-expect-error` são conferidos pelo
// `npm run typecheck` (tsconfig.test.json): se a linha abaixo deles compilar, o typecheck falha.
import { describe, expect, expectTypeOf, it } from 'vitest';
import { pt } from '@/content/pt';
import {
  NAV_ITEMS,
  navTargetOf,
  SECTION_IDS,
  SECTIONS,
  type NavTarget,
  type SectionId,
} from '@/content/sections';
import type { DictionaryKey } from '@/i18n/types';

// Doc de design §2, linhas 2 a 11 (cabeçalho e rodapé ficam fora).
const ORDEM_DO_DESIGN = [
  'inicio',
  'destaques',
  'frase',
  'sobre',
  'interesses',
  'habilidades',
  'projetos',
  'formacao',
  'objetivos',
  'contato',
] as const;

describe('registro de seções (§2)', () => {
  it('tem 10 entradas na ordem exata do §2', () => {
    expect(SECTIONS).toHaveLength(10);
    expect(SECTIONS.map((s) => s.id)).toEqual(ORDEM_DO_DESIGN);
    expect(SECTION_IDS).toEqual(ORDEM_DO_DESIGN);
  });

  it('ids são únicos e servem de âncora (minúsculas, sem acento nem espaço)', () => {
    expect(new Set(SECTION_IDS).size).toBe(SECTION_IDS.length);
    for (const id of SECTION_IDS) expect(id).toMatch(/^[a-z]+$/);
  });

  it('navTarget e tone de cada seção seguem a tabela da F-12', () => {
    expect(SECTIONS.map((s) => [s.id, s.navTarget, s.tone])).toEqual([
      ['inicio', null, 'base'],
      ['destaques', null, 'base'],
      ['frase', null, 'tint'],
      ['sobre', 'sobre', 'base'],
      ['interesses', 'interesses', 'alt'],
      ['habilidades', 'habilidades', 'base'],
      ['projetos', 'projetos', 'alt'],
      ['formacao', 'formacao', 'base'],
      ['objetivos', 'formacao', 'alt'],
      ['contato', 'contato', 'base'],
    ]);
  });

  it('navTargetOf devolve o item do menu, não o id bruto', () => {
    expect(navTargetOf('objetivos')).toBe('formacao');
    expect(navTargetOf('contato')).toBe('contato');
    expect(navTargetOf('inicio')).toBeNull();
    expect(navTargetOf('destaques')).toBeNull();
    expect(navTargetOf('frase')).toBeNull();
  });
});

describe('NAV_ITEMS (§7.1)', () => {
  it('são os 6 itens na ordem do menu, derivados do registro', () => {
    expect(NAV_ITEMS.map((item) => item.id)).toEqual(
      SECTIONS.filter((s) => s.navTarget === s.id).map((s) => s.id),
    );
    expect(NAV_ITEMS).toEqual([
      { id: 'sobre', labelKey: 'nav.sobre' },
      { id: 'interesses', labelKey: 'nav.interesses' },
      { id: 'habilidades', labelKey: 'nav.habilidades' },
      { id: 'projetos', labelKey: 'nav.projetos' },
      { id: 'formacao', labelKey: 'nav.formacao' },
      { id: 'contato', labelKey: 'nav.contato' },
    ]);
  });

  it('cada item aponta para uma seção do registro e para uma chave nav.* existente (F-10)', () => {
    for (const item of NAV_ITEMS) {
      expect(SECTION_IDS).toContain(item.id);
      const [grupo, chave] = item.labelKey.split('.');
      expect(grupo).toBe('nav');
      expect(Object.keys(pt.nav)).toContain(chave);
    }
    expect(NAV_ITEMS.map((item) => item.id)).toEqual(Object.keys(pt.nav));
  });

  it('todo navTarget do registro é um item do menu', () => {
    const itens = NAV_ITEMS.map((item) => item.id as string);
    for (const s of SECTIONS) if (s.navTarget !== null) expect(itens).toContain(s.navTarget);
  });
});

describe('tipos do registro', () => {
  it('SectionId é a união dos 10 ids e NavTarget são as chaves nav.*', () => {
    expectTypeOf<SectionId>().toEqualTypeOf<(typeof ORDEM_DO_DESIGN)[number]>();
    expectTypeOf<NavTarget>().toEqualTypeOf<keyof typeof pt.nav>();
    expectTypeOf<NavTarget>().toExtend<SectionId>();
    expectTypeOf<(typeof NAV_ITEMS)[number]['labelKey']>().toExtend<DictionaryKey>();
  });

  it('SectionId rejeita id fora do registro', () => {
    const valido: SectionId = 'objetivos';
    // @ts-expect-error 'faixa' não é id do registro (a Faixa de destaques usa `destaques`).
    const faixa: SectionId = 'faixa';
    // @ts-expect-error o cabeçalho não é seção do registro.
    const cabecalho: SectionId = 'cabecalho';
    expect([valido, faixa, cabecalho]).toHaveLength(3);
  });
});
