// Teste de contrato das seções com as regras de projeto (S-00; doc de design §7.3, §7.8, §11,
// §12.5, §14; D14). As regras de destaque, grade, botões e contagem têm um dono só: os seletores
// puros da C-06 em `src/content/selectors.ts`. Este arquivo garante duas coisas:
// 1. nenhum `.tsx` de `src/sections/` lê `publicado`, `linkGithub` ou `destaque` de uma ficha
//    (a regra fica num só lugar) e nenhum número de projetos é escrito à mão;
// 2. com as fichas reais de hoje (nenhuma `publicado: true`), os seletores devolvem o que as seções
//    vão mostrar: contagem 0, destaque = Gerenciador sem botões e os cards de estudo todos na grade,
//    sem botão GitHub (D14: cards de estudo não são ocultados).
// O link externo é o modo `external` do `ButtonLink` (DS-11); não existe `ExternalLink` próprio.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { pt } from '@/content/pt';
import { PROJECTS } from '@/content/projects';
import {
  botoesDoProjeto,
  contagemProjetosPublicados,
  itensDaFaixa,
  projetoEmDestaque,
  projetosDaGrade,
} from '@/content/selectors';

const raiz = process.cwd();
const PASTA_SECOES = resolve(raiz, 'src/sections');

/** Todos os arquivos com a extensão pedida dentro de `pasta` (recursivo). */
function arquivos(pasta: string, extensao: RegExp): string[] {
  if (!existsSync(pasta)) return [];
  return readdirSync(pasta).flatMap((nome) => {
    const caminho = join(pasta, nome);
    if (statSync(caminho).isDirectory()) return arquivos(caminho, extensao);
    return extensao.test(nome) ? [caminho] : [];
  });
}

/** Código sem comentários (`/* *\/` e `//`), para os comentários poderem citar as regras. */
function semComentarios(codigo: string): string {
  return codigo.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

/** Código sem comentários e sem literais de string (sobra o código e o texto JSX). */
function semStrings(codigo: string): string {
  return semComentarios(codigo)
    .replace(/'(?:\\.|[^'\\\n])*'/g, "''")
    .replace(/"(?:\\.|[^"\\\n])*"/g, '""')
    .replace(/`(?:\\.|[^`\\])*`/g, '``');
}

/**
 * Leitura de um campo de regra da ficha: `x.publicado`, `x?.linkGithub`, `x['destaque']` ou
 * desestruturação `{ publicado }` / `{ destaque: d }`. `destaques` (id da faixa) e `emDestaque`
 * (chave do dicionário) não casam.
 */
const LEITURA_DE_REGRA =
  /(\??\.\s*(publicado|linkGithub|destaque)\b(?!\s*\()|\[\s*['"`](publicado|linkGithub|destaque)['"`]\s*\]|[{,]\s*(publicado|linkGithub|destaque)\s*[,:}=])/;

const secoesTsx = arquivos(PASTA_SECOES, /\.tsx$/);
const secoesTs = arquivos(PASTA_SECOES, /\.tsx?$/);
const rel = (caminho: string) => relative(raiz, caminho).replace(/\\/g, '/');

describe('S-00 — nenhuma seção reimplementa as regras de projeto (D14)', () => {
  it('a varredura enxerga a pasta de seções', () => {
    expect(existsSync(PASTA_SECOES)).toBe(true);
  });

  it('nenhum .ts/.tsx de src/sections lê publicado, linkGithub ou destaque de uma ficha', () => {
    const infratores = secoesTs
      .map((arquivo) => ({
        arquivo: rel(arquivo),
        codigo: semComentarios(readFileSync(arquivo, 'utf8')),
      }))
      .filter(({ codigo }) => LEITURA_DE_REGRA.test(codigo))
      .map(({ arquivo, codigo }) => `${arquivo}: ${codigo.match(LEITURA_DE_REGRA)?.[0] ?? ''}`);
    expect(infratores).toEqual([]);
  });

  it('a palavra "publicado" não aparece no código dos .tsx de src/sections', () => {
    const comPalavra = secoesTsx
      .filter((arquivo) => /publicado/.test(semComentarios(readFileSync(arquivo, 'utf8'))))
      .map(rel);
    expect(comPalavra).toEqual([]);
  });

  it('não existe src/sections/shared/projectSelectors.ts nem outra cópia das regras', () => {
    expect(existsSync(resolve(PASTA_SECOES, 'shared/projectSelectors.ts'))).toBe(false);
    const nomes =
      /\bfunction\s+(githubHref|projetoHref|projetoEmDestaque|projetosDaGrade|botoesDoProjeto|contagemProjetosPublicados|itensDaFaixa)\b/;
    const copias = secoesTs.filter((a) => nomes.test(readFileSync(a, 'utf8'))).map(rel);
    expect(copias).toEqual([]);
  });

  it('nenhum número "5" fixo nos .tsx de src/sections (a contagem vem dos seletores)', () => {
    const comCinco = secoesTsx
      .filter((arquivo) => /(?<![\w.])5(?![\w.%])/.test(semStrings(readFileSync(arquivo, 'utf8'))))
      .map(rel);
    expect(comCinco).toEqual([]);
  });

  it('o autoteste da varredura acusa as leituras proibidas e aceita as permitidas', () => {
    const proibidas = [
      'p.publicado',
      'projeto?.linkGithub',
      'p.destaque ? a : b',
      "p['publicado']",
      'const { publicado } = p',
      'const { destaque: d, id } = p',
    ];
    for (const trecho of proibidas) expect(LEITURA_DE_REGRA.test(trecho), trecho).toBe(true);
    const permitidas = [
      'dict.destaques.aria',
      'dict.projetos.emDestaque',
      'projetoEmDestaque(PROJECTS)',
      "id: 'destaques'",
      'githubHref(p)',
    ];
    for (const trecho of permitidas) expect(LEITURA_DE_REGRA.test(trecho), trecho).toBe(false);
  });

  it('o autoteste do "5" fixo ignora comentários, strings e decimais', () => {
    const tem = (codigo: string) => /(?<![\w.])5(?![\w.%])/.test(semStrings(codigo));
    expect(tem('<p>5</p>')).toBe(true);
    expect(tem('const total = 5;')).toBe(true);
    expect(tem("// 5 projetos\nconst d = 'M5 0 L 5 5';\nconst o = 0.5;")).toBe(false);
  });
});

describe('S-00 — seletores da C-06 com as fichas atuais (nenhuma publicada)', () => {
  it('pré-condição: nenhuma ficha está publicada hoje', () => {
    expect(PROJECTS.some((p) => p.publicado)).toBe(false);
  });

  it('contagem de projetos publicados = 0', () => {
    expect(contagemProjetosPublicados(PROJECTS)).toBe(0);
  });

  it('destaque = Gerenciador de Estoque, sem botões', () => {
    const destaque = projetoEmDestaque(PROJECTS);
    expect(destaque?.id).toBe('gerenciador-de-estoque');
    expect(destaque ? botoesDoProjeto(destaque) : null).toEqual([]);
  });

  it('grade = os 4 projetos de estudo, todos visíveis e na ordem do array, sem botão GitHub', () => {
    const grade = projetosDaGrade(PROJECTS);
    const deEstudo = PROJECTS.filter((p) => p.id !== 'gerenciador-de-estoque');
    expect(grade.map((p) => p.id)).toEqual(deEstudo.map((p) => p.id));
    expect(grade).toHaveLength(4);
    for (const p of grade) {
      expect(
        botoesDoProjeto(p).filter((b) => b.tipo === 'github'),
        p.id,
      ).toEqual([]);
    }
  });

  it('faixa de destaques sem o item de projetos (contagem 0 → item omitido)', () => {
    const ids = itensDaFaixa(PROJECTS, pt).map((item) => item.id);
    expect(ids).toEqual(['areas', 'linguagens', 'formacao']);
  });
});
