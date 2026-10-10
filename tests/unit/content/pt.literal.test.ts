// C-02: o dicionário pt-BR é cópia literal do Anexo A (doc 05), que é cópia do documento de design.
// Fixture transcrito à mão do Anexo A; os textos de origem "doc" também são procurados no próprio
// documento de design (plano/referencia/documento-design-v1.1.txt), caractere por caractere.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PENDENCIA_POR_CHAVE } from '@/content/metadados';
import { pt } from '@/content/pt';
import { SUGERIDOS } from '@/content/sugeridos';
import { isPlaceholder } from '@/lib/placeholder';

type Origem =
  | 'doc'
  | 'eyebrow'
  | 'sugerido-ia'
  | 'sugerido-doc'
  | 'derivado'
  | 'novo-ui'
  | 'novo-a11y'
  | 'placeholder';

interface Entrada {
  pt?: string | string[];
  fn?: Record<string, string>;
  origem: Origem;
  doc?: string;
  pendencia?: string;
  original?: string;
}

const raiz = process.cwd();
const fixture = JSON.parse(
  readFileSync(resolve(raiz, 'tests/unit/content/fixtures/anexo-a.pt.json'), 'utf8'),
) as { chaves: Record<string, Entrada> };
const ESPERADO = fixture.chaves;
// `plano/` fica fora do git (R3): na CI o documento de design não existe e as conferências com ele
// são puladas. O fixture (versionado) continua sendo conferido sempre.
const CAMINHO_DOC = resolve(raiz, 'plano/referencia/documento-design-v1.1.txt');
const TEM_DOC = existsSync(CAMINHO_DOC);
let docCache: string | undefined;
function docDesign(): string {
  docCache ??= readFileSync(CAMINHO_DOC, 'utf8');
  return docCache;
}

const ORIGENS_SUGERIDAS: readonly Origem[] = ['sugerido-ia', 'sugerido-doc', 'derivado', 'novo-ui'];

function ehGrupo(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

function folhas(obj: Record<string, unknown>, prefixo = ''): [string, unknown][] {
  return Object.entries(obj).flatMap(([chave, valor]) => {
    const caminho = prefixo ? `${prefixo}.${chave}` : chave;
    return ehGrupo(valor) ? folhas(valor, caminho) : [[caminho, valor] as [string, unknown]];
  });
}

const FOLHAS = new Map(folhas(pt));

describe('pt.ts × Anexo A (C-02)', () => {
  it('tem exatamente as chaves do Anexo A (nem falta nem sobra)', () => {
    expect([...FOLHAS.keys()].sort()).toEqual(Object.keys(ESPERADO).sort());
  });

  it.each(Object.entries(ESPERADO))('%s é idêntico ao Anexo A', (chave, esperado) => {
    const valor = FOLHAS.get(chave);
    if (esperado.fn) {
      expect(typeof valor).toBe('function');
      const fn = valor as (n: number) => string;
      for (const [arg, resultado] of Object.entries(esperado.fn)) {
        expect(fn(Number(arg)), `${chave}(${arg})`).toBe(resultado);
      }
    } else {
      expect(valor).toEqual(esperado.pt);
    }
  });

  it.skipIf(!TEM_DOC)(
    'textos de origem "doc" existem literalmente no documento de design (local: precisa de plano/)',
    () => {
      const doc = docDesign();
      const faltando: string[] = [];
      for (const [chave, e] of Object.entries(ESPERADO)) {
        if (!['doc', 'sugerido-doc', 'eyebrow'].includes(e.origem)) continue;
        const procurar: string[] = e.doc
          ? [e.doc]
          : e.origem === 'eyebrow'
            ? [`“${String(e.pt).toUpperCase()}”`]
            : Array.isArray(e.pt)
              ? e.pt
              : [String(e.pt)];
        for (const trecho of procurar) {
          if (!doc.includes(trecho)) faltando.push(`${chave}: ${trecho}`);
        }
      }
      expect(faltando).toEqual([]);
    },
  );

  it.skipIf(!TEM_DOC)(
    'o texto original que a adaptação IA substituiu existe no doc (para reverter) (local: precisa de plano/)',
    () => {
      const doc = docDesign();
      for (const [chave, e] of Object.entries(ESPERADO)) {
        if (e.original && e.original.length > 1) {
          expect(doc.includes(e.original), chave).toBe(true);
        }
      }
    },
  );

  it('SUGERIDOS = chaves sugerido (IA/doc), derivado e novo (UI) do Anexo A', () => {
    const esperadas = Object.entries(ESPERADO)
      .filter(([, e]) => ORIGENS_SUGERIDAS.includes(e.origem))
      .map(([chave]) => chave)
      .sort();
    expect([...SUGERIDOS].sort()).toEqual(esperadas);
  });

  it('pendências: IA → P-IA-2; derivado/novo (UI)/sugerido (doc) → P-10; legenda da faixa → P-11', () => {
    const esperadas = Object.fromEntries(
      Object.entries(ESPERADO)
        .filter(([, e]) => e.pendencia)
        .map(([chave, e]) => [chave, e.pendencia]),
    );
    expect({ ...PENDENCIA_POR_CHAVE }).toEqual(esperadas);
    for (const [chave, e] of Object.entries(ESPERADO)) {
      if (e.origem === 'sugerido-ia') expect(e.pendencia, chave).toBe('P-IA-2');
      if (['derivado', 'sugerido-doc'].includes(e.origem)) expect(e.pendencia, chave).toBe('P-10');
    }
    expect(PENDENCIA_POR_CHAVE['destaques.projetos.legenda']).toBe('P-11');
  });

  it('placeholders são strings com colchetes (em dev) e a regra D23 os reconhece', () => {
    for (const [chave, e] of Object.entries(ESPERADO)) {
      if (e.origem !== 'placeholder' || Array.isArray(e.pt)) continue;
      const valor = FOLHAS.get(chave);
      expect(valor, chave).toBe(e.pt);
      expect(isPlaceholder(valor as string), chave).toBe(true);
    }
  });

  it('nenhuma chave com nome antigo (a11y.pularConteudo, a11y.novaAba, tema.*, idioma.*, seo.*)', () => {
    const antigas = [...FOLHAS.keys()].filter(
      (chave) =>
        chave === 'a11y.pularConteudo' ||
        chave === 'a11y.novaAba' ||
        /^(tema|idioma|seo)\./.test(chave),
    );
    expect(antigas).toEqual([]);
  });

  it('nenhuma chave é folha e grupo ao mesmo tempo (H5: rodape.socialTitulo + rodape.social.*)', () => {
    expect(typeof pt.rodape.socialTitulo).toBe('string');
    expect(ehGrupo(pt.rodape.social)).toBe(true);
  });
});

describe('varredura: nenhum texto do Anexo A fixo em src/components e src/sections', () => {
  function arquivos(pasta: string): string[] {
    let itens: string[];
    try {
      itens = readdirSync(pasta);
    } catch {
      return [];
    }
    return itens.flatMap((nome) => {
      const caminho = join(pasta, nome);
      if (statSync(caminho).isDirectory()) return arquivos(caminho);
      return /\.tsx?$/.test(nome) && !/\.demo\.tsx$/.test(nome) ? [caminho] : [];
    });
  }

  // Frases (com espaço) do Anexo A; palavras soltas como "Sobre" ou "GitHub" dariam falso positivo.
  const frases = [...FOLHAS.values()]
    .flatMap((v) => (typeof v === 'string' ? [v] : Array.isArray(v) ? (v as string[]) : []))
    .filter((v) => v.includes(' ') && !isPlaceholder(v));

  it('nenhuma frase aparece entre aspas ou como texto JSX', () => {
    const codigo = [
      ...arquivos(resolve(raiz, 'src/components')),
      ...arquivos(resolve(raiz, 'src/sections')),
    ];
    const achados: string[] = [];
    for (const arquivo of codigo) {
      // Comentários podem citar o texto do doc (documentação); só o código conta.
      const texto = readFileSync(arquivo, 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/(^|[^:])\/\/.*$/gm, '$1');
      for (const frase of frases) {
        for (const marca of [`'${frase}'`, `"${frase}"`, `\`${frase}\``, `>${frase}<`]) {
          if (texto.includes(marca)) achados.push(`${arquivo}: ${frase}`);
        }
      }
    }
    expect(achados).toEqual([]);
  });
});
