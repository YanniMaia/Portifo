// Dicionários tipados (F-10): paridade PT×EN, forma das folhas, chaves de infraestrutura,
// registro SUGERIDOS e ausência de texto de interface em src/i18n/.
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { en } from '@/content/en';
import { pt } from '@/content/pt';
import { SUGERIDOS } from '@/content/sugeridos';
import type { DictionaryKey } from '@/i18n/types';

interface Folha {
  caminho: string;
  valor: unknown;
}

function ehGrupo(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

/** Percorre o dicionário e devolve todas as folhas (tudo que não é grupo) com o caminho. */
function folhas(obj: Record<string, unknown>, prefixo = ''): Folha[] {
  return Object.entries(obj).flatMap(([chave, valor]) => {
    const caminho = prefixo ? `${prefixo}.${chave}` : chave;
    return ehGrupo(valor) ? folhas(valor, caminho) : [{ caminho, valor }];
  });
}

/** Folhas fora da forma permitida: string, lista de strings ou função (doc 05 §4.1). */
function folhasInvalidas(obj: Record<string, unknown>): string[] {
  return folhas(obj)
    .filter(({ valor }) => {
      if (typeof valor === 'string' || typeof valor === 'function') return false;
      if (Array.isArray(valor)) return !valor.every((item) => typeof item === 'string');
      return true;
    })
    .map(({ caminho }) => caminho);
}

/**
 * Grupos com cara de objeto de metadado (`{ texto, sugerido }`), proibidos pela R7.
 * A marca é a chave `sugerido`: `texto` sozinho é nome legítimo de chave do Anexo A
 * (ex.: `sobre.texto`, `interesses.dados.texto`), incluído pela C-02.
 */
function gruposDeMetadado(obj: Record<string, unknown>, prefixo = ''): string[] {
  return Object.entries(obj).flatMap(([chave, valor]) => {
    if (!ehGrupo(valor)) return [];
    const caminho = prefixo ? `${prefixo}.${chave}` : chave;
    const proprio = 'sugerido' in valor ? [caminho] : [];
    return [...proprio, ...gruposDeMetadado(valor, caminho)];
  });
}

function chaves(obj: Record<string, unknown>): string[] {
  return folhas(obj)
    .map(({ caminho }) => caminho)
    .sort();
}

function valorEm(obj: Record<string, unknown>, caminho: string): unknown {
  return caminho
    .split('.')
    .reduce<unknown>((atual, parte) => (ehGrupo(atual) ? atual[parte] : undefined), obj);
}

// Anexo A.1, A.2 e A.14 do doc 05 (colunas pt-BR e EN).
const ESPERADO: Record<string, { pt: string; en: string }> = {
  'nav.sobre': { pt: 'Sobre', en: 'About' },
  'nav.interesses': { pt: 'Interesses', en: 'Interests' },
  'nav.habilidades': { pt: 'Habilidades', en: 'Skills' },
  'nav.projetos': { pt: 'Projetos', en: 'Projects' },
  'nav.formacao': { pt: 'Formação', en: 'Education' },
  'nav.contato': { pt: 'Contato', en: 'Contact' },
  'a11y.skipToContent': { pt: 'Pular para o conteúdo', en: 'Skip to content' },
  'a11y.opensInNewTab': { pt: 'abre em nova aba', en: 'opens in a new tab' },
  'a11y.themeToDark': { pt: 'Alternar para modo escuro', en: 'Switch to dark mode' },
  'a11y.themeToLight': { pt: 'Alternar para modo claro', en: 'Switch to light mode' },
  'a11y.language': { pt: 'Idioma', en: 'Language' },
  'a11y.languageNamePt': { pt: 'Português', en: 'Português' },
  'a11y.languageNameEn': { pt: 'English', en: 'English' },
  'meta.title': { pt: 'Yanni Elyssa | Portfólio', en: 'Yanni Elyssa | Portfolio' },
};

describe('dicionários pt/en', () => {
  it('têm exatamente as mesmas chaves (paridade PT×EN)', () => {
    expect(chaves(en)).toEqual(chaves(pt));
  });

  it('toda folha é string, lista de strings ou função, nos dois idiomas', () => {
    expect(folhasInvalidas(pt)).toEqual([]);
    expect(folhasInvalidas(en)).toEqual([]);
    expect(gruposDeMetadado(pt)).toEqual([]);
    expect(gruposDeMetadado(en)).toEqual([]);
  });

  it('a checagem de forma acusa objeto de metadado no lugar de uma folha', () => {
    const errado = { nav: { sobre: { texto: 'x', sugerido: true } }, lista: ['a', 1] };
    expect(folhasInvalidas(errado)).toEqual(['nav.sobre.sugerido', 'lista']);
    expect(gruposDeMetadado(errado)).toEqual(['nav.sobre']);
  });

  it('nenhuma string é vazia', () => {
    for (const dict of [pt, en]) {
      for (const { caminho, valor } of folhas(dict)) {
        if (typeof valor === 'string') expect(valor.trim(), caminho).not.toBe('');
      }
    }
  });

  it('as chaves de infraestrutura da F-10 (Anexo A.1, A.2, A.14) continuam presentes', () => {
    // A C-02 acrescenta as demais chaves do Anexo A; o conjunto completo é testado em
    // tests/unit/content/pt.literal.test.ts.
    expect(chaves(pt)).toEqual(expect.arrayContaining(Object.keys(ESPERADO)));
  });

  it('os textos PT e EN batem com o Anexo A', () => {
    for (const [caminho, textos] of Object.entries(ESPERADO)) {
      expect(valorEm(pt, caminho), caminho).toBe(textos.pt);
      expect(valorEm(en, caminho), caminho).toBe(textos.en);
    }
  });
});

describe('SUGERIDOS', () => {
  it('só aponta para chaves existentes (folhas de pt), sem repetição', () => {
    const existentes = new Set(chaves(pt));
    for (const chave of SUGERIDOS) {
      expect(existentes.has(chave), chave).toBe(true);
    }
    expect(new Set(SUGERIDOS).size).toBe(SUGERIDOS.length);
  });

  it('chave inexistente não compila', () => {
    // @ts-expect-error: 'nav.inexistente' não é caminho do dicionário.
    const invalida: DictionaryKey = 'nav.inexistente';
    // @ts-expect-error: grupo não é folha; só caminhos até folhas valem.
    const grupo: DictionaryKey = 'nav';
    const valida: DictionaryKey = 'meta.title';
    expect([invalida, grupo, valida]).toHaveLength(3);
  });
});

describe('src/i18n/ (só infraestrutura)', () => {
  const pasta = resolve(process.cwd(), 'src/i18n');
  const codigo = readdirSync(pasta)
    .filter((arquivo) => /\.tsx?$/.test(arquivo))
    .map((arquivo) => ({ arquivo, texto: readFileSync(join(pasta, arquivo), 'utf8') }));

  it('nenhum texto do dicionário aparece como literal nos arquivos de src/i18n/', () => {
    expect(codigo.length).toBeGreaterThan(0);
    const valores = [...folhas(pt), ...folhas(en)]
      .map(({ valor }) => valor)
      .filter((valor): valor is string => typeof valor === 'string');
    for (const { arquivo, texto } of codigo) {
      for (const valor of valores) {
        for (const aspas of ["'", '"', '`']) {
          expect(texto.includes(`${aspas}${valor}${aspas}`), `${arquivo}: ${valor}`).toBe(false);
        }
      }
    }
  });
});
