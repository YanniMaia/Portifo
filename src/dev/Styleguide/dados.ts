// Funções puras do /__styleguide (DS-05): leitura dos arquivos de tokens como texto, tipo de medida
// de cada token, faixa da largura e lista de demos. Sem DOM: testadas em
// tests/unit/dev/styleguide-dados.test.ts. As listas de tokens NÃO são escritas à mão: saem dos
// próprios .css (DS-01..DS-03), então um token novo aparece sozinho no styleguide.
import type { ComponentType } from 'react';
import { DESKTOP_MIN, TABLET_MIN, WIDE_MIN } from '@/styles/breakpoints';

export interface TokenDeTema {
  nome: string;
  claro: string;
  escuro: string;
}

export interface TokenSimples {
  nome: string;
  valor: string;
}

/** Propriedade usada para ler o valor computado de um token (ou `valor` = a própria variável). */
export type Medida = 'background-color' | 'background-image' | 'box-shadow' | 'valor';

export type Faixa = 'celular' | 'tablet' | 'desktop' | 'grande';

export interface Demo {
  /** Âncora da demo (`/__styleguide#<id>`), em kebab-case: `ButtonLink` → `button-link`. */
  id: string;
  /** Nome do arquivo sem `.demo.tsx` (ex.: `Button`). */
  nome: string;
  /** Caminho do arquivo, como o `import.meta.glob` devolve. */
  caminho: string;
  Componente: ComponentType;
}

export function semComentarios(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

/** Espaços do valor colapsados (valores de várias linhas, como `radial-gradient(`, viram uma). */
export function normalizarValor(valor: string): string {
  return valor.replace(/\s+/g, ' ').replace(/\(\s+/g, '(').replace(/\s+\)/g, ')').trim();
}

function declaracoes(corpo: string): TokenSimples[] {
  return [...corpo.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map((m) => ({
    nome: m[1] as string,
    valor: normalizarValor(m[2] as string),
  }));
}

/**
 * Tokens de `colors.css` (DS-01): pares claro/escuro na ordem do bloco claro.
 * Bloco claro = `:root, [data-theme='light'] { … }`; escuro = `[data-theme='dark'] { … }`.
 */
export function lerTokensDeTema(css: string): TokenDeTema[] {
  const limpo = semComentarios(css);
  const claro = /:root,\s*\[data-theme=['"]light['"]\]\s*\{([^}]*)\}/.exec(limpo)?.[1];
  const escuro = /\[data-theme=['"]dark['"]\]\s*\{([^}]*)\}/.exec(limpo)?.[1];
  if (claro === undefined || escuro === undefined) return [];
  const mapaEscuro = new Map(declaracoes(escuro).map((t) => [t.nome, t.valor]));
  return declaracoes(claro).map(({ nome, valor }) => ({
    nome,
    claro: valor,
    escuro: mapaEscuro.get(nome) ?? '',
  }));
}

/**
 * Tokens do `:root` de base (sem media query) de um arquivo de tokens (DS-02, DS-03). O `:root`
 * dentro de `@media` fica indentado (Prettier), por isso a âncora `^` no início da linha.
 */
export function lerTokensDoRoot(css: string): TokenSimples[] {
  const corpo = /^:root\s*\{([^}]*)\}/m.exec(semComentarios(css))?.[1];
  return corpo === undefined ? [] : declaracoes(corpo);
}

/** Classes utilitárias `.t-*` declaradas no `typography.css` (DS-03), na ordem do arquivo. */
export function lerClassesUtilitarias(css: string): string[] {
  const nomes = [...semComentarios(css).matchAll(/^\.(t-[\w-]+)\s*\{/gm)].map(
    (m) => m[1] as string,
  );
  return [...new Set(nomes)];
}

/** Como ler o valor computado: cor → `background-color`; degradê → `background-image`; etc. */
export function medidaDoToken(nome: string, valor: string): Medida {
  if (/gradient\(/.test(valor)) return 'background-image';
  if (nome.startsWith('--shadow-')) return 'box-shadow';
  if (/^#[0-9a-f]{3,8}$/i.test(valor) || /^rgba?\(/i.test(valor)) return 'background-color';
  return 'valor';
}

/** Faixa do §4.3 (doc 02) para uma largura de janela. */
export function faixaDaLargura(largura: number): Faixa {
  if (largura >= WIDE_MIN) return 'grande';
  if (largura >= DESKTOP_MIN) return 'desktop';
  if (largura >= TABLET_MIN) return 'tablet';
  return 'celular';
}

/** `ButtonLink` → `button-link`; `Icon` → `icon`. */
export function paraKebab(nome: string): string {
  return nome
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();
}

/**
 * Lista de demos a partir do resultado de `import.meta.glob('/src/components/**\/*.demo.tsx')`.
 * Contrato de cada demo (DS-06..DS-21): o arquivo `<Nome>.demo.tsx` faz `export default` de um
 * componente sem props. Módulo sem `default` é ignorado. Ordem alfabética pelo nome.
 */
export function listarDemos(modulos: Record<string, { default?: ComponentType }>): Demo[] {
  const demos: Demo[] = [];
  for (const [caminho, modulo] of Object.entries(modulos)) {
    const nome = /([^/\\]+)\.demo\.tsx$/.exec(caminho)?.[1];
    if (!nome || !modulo.default) continue;
    demos.push({ id: paraKebab(nome), nome, caminho, Componente: modulo.default });
  }
  return demos.sort((a, b) => a.nome.localeCompare(b.nome));
}
