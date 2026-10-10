// Página 404 estática (D-03). Lê `public/404.html` (o Vite copia o arquivo sem mudar para
// `dist/404.html`) e confere: textos = `erro404.*` de pt.ts (V1 só PT, doc 09), nenhum outro texto
// visível, script de tema idêntico ao do index.html (F-08), cores = tokens do DS-01 com contraste
// medido pelo helper da DS-01, caminhos com o BASE_PATH de src/site.config.ts, nenhum link externo e
// tamanho ≤ 10 KB. O e2e `tests/e2e/pagina-404.spec.ts` repete o essencial no build servido.
import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { pt } from '@/content/pt';
import { BASE_PATH } from '@/site.config';
import { contrastRatio } from '../support/contrast';

const raiz = process.cwd();
const ler = (relativo: string) => readFileSync(resolve(raiz, relativo), 'utf8');
const CAMINHO_404 = 'public/404.html';

const html404 = ler(CAMINHO_404);
const htmlIndex = ler('index.html');
const doc = new DOMParser().parseFromString(html404, 'text/html');

/** Conteúdo do primeiro `<script>` inline (sem `src`) de um HTML. */
function scriptInline(html: string): string {
  const m = /<script>([\s\S]*?)<\/script>/.exec(html);
  if (!m?.[1]) throw new Error('script inline não encontrado');
  return m[1];
}

/** Primeiro `<style>` do `<head>` (o crítico do F-08). */
function primeiroStyle(html: string): string {
  const m = /<style>([\s\S]*?)<\/style>/.exec(html);
  if (!m?.[1]) throw new Error('<style> não encontrado');
  return m[1];
}

/** Textos visíveis do body: nós de texto fora de script/style/template, sem espaços sobrando. */
function textosVisiveis(): string[] {
  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
  const textos: string[] = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const pai = n.parentElement?.tagName;
    if (pai === 'SCRIPT' || pai === 'STYLE' || pai === 'TEMPLATE') continue;
    const t = (n.textContent ?? '').replace(/\s+/g, ' ').trim();
    if (t) textos.push(t);
  }
  return textos;
}

/** Valor de `--<nome>` no primeiro bloco CSS com o seletor `seletor` que declara a variável. */
function variavel(css: string, seletor: string, nome: string): string {
  const re = new RegExp(`--${nome}:\\s*(#[0-9a-fA-F]{3,8})\\s*;`);
  for (let i = css.indexOf(`${seletor} {`); i >= 0; i = css.indexOf(`${seletor} {`, i + 1)) {
    const m = re.exec(css.slice(i, css.indexOf('}', i)));
    if (m?.[1]) return m[1].toLowerCase();
  }
  throw new Error(`--${nome} não encontrado em ${seletor}`);
}

const cssPagina = [...doc.querySelectorAll('style')].map((s) => s.textContent ?? '').join('\n');
const cssTokens = ler('src/styles/tokens/colors.css');
const cores = {
  claro: {
    bg: variavel(cssPagina, ':root', 'bg'),
    texto: variavel(cssPagina, ':root', 'texto'),
    link: variavel(cssPagina, ':root', 'link'),
  },
  escuro: {
    bg: variavel(cssPagina, "html[data-theme='dark']", 'bg'),
    texto: variavel(cssPagina, "html[data-theme='dark']", 'texto'),
    link: variavel(cssPagina, "html[data-theme='dark']", 'link'),
  },
};

describe('404.html: textos (Anexo A.15, só PT na V1)', () => {
  it('<title> e <h1> = erro404.titulo; link = erro404.voltar', () => {
    expect(doc.title).toBe(pt.erro404.titulo);
    const h1 = doc.querySelectorAll('h1');
    expect(h1).toHaveLength(1);
    expect(h1[0]?.textContent?.trim()).toBe(pt.erro404.titulo);
    const links = doc.querySelectorAll('a');
    expect(links).toHaveLength(1);
    expect(links[0]?.textContent?.trim()).toBe(pt.erro404.voltar);
  });

  it('nenhum outro texto visível além dos 2 textos de erro404', () => {
    expect(textosVisiveis()).toEqual([pt.erro404.titulo, pt.erro404.voltar]);
    // Imagens só decorativas (alt vazio): o monograma não acrescenta texto.
    for (const img of doc.querySelectorAll('img')) expect(img.getAttribute('alt')).toBe('');
  });

  it('html lang="pt-BR" e robots noindex', () => {
    expect(doc.documentElement.getAttribute('lang')).toBe('pt-BR');
    expect(doc.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe('noindex');
  });
});

describe('404.html: caminhos (BASE_PATH de src/site.config.ts)', () => {
  it('"Voltar ao início" aponta para BASE_PATH', () => {
    expect(doc.querySelector('a')?.getAttribute('href')).toBe(BASE_PATH);
  });

  it('favicon do C-09 com o prefixo BASE_PATH, e o arquivo existe em public/', () => {
    expect(doc.querySelector('link[rel="icon"]')?.getAttribute('href')).toBe(
      `${BASE_PATH}favicon.svg`,
    );
    expect(existsSync(resolve(raiz, 'public/favicon.svg'))).toBe(true);
  });

  it('nenhum link externo: todo href/src começa com BASE_PATH', () => {
    const refs = [...doc.querySelectorAll('[href], [src]')].map(
      (el) => el.getAttribute('href') ?? el.getAttribute('src') ?? '',
    );
    expect(refs.length).toBeGreaterThan(0);
    for (const ref of refs) expect(ref.startsWith(BASE_PATH), ref).toBe(true);
    expect(html404).not.toMatch(/https?:\/\//);
  });
});

describe('404.html: tema (F-08)', () => {
  it('o script de tema é idêntico ao do index.html', () => {
    expect(scriptInline(html404)).toBe(scriptInline(htmlIndex));
  });

  it('a meta theme-color, a meta color-scheme e o <style> crítico são os do index.html', () => {
    const meta = (html: string, nome: string) =>
      new RegExp(`<meta name="${nome}"[^>]*>`).exec(html)?.[0];
    expect(meta(html404, 'theme-color')).toBe(meta(htmlIndex, 'theme-color'));
    expect(meta(html404, 'color-scheme')).toBe(meta(htmlIndex, 'color-scheme'));
    expect(primeiroStyle(html404)).toBe(primeiroStyle(htmlIndex));
    // Script de tema antes de qualquer outro estilo da página.
    expect(html404.indexOf('<script>')).toBeLessThan(html404.lastIndexOf('<style>'));
  });
});

describe('404.html: cores (tokens do DS-01) e contraste', () => {
  it('as cores são as dos tokens --color-bg/--color-text/--color-link nos 2 temas', () => {
    for (const [tema, seletor] of [
      ['claro', "[data-theme='light']"],
      ['escuro', "[data-theme='dark']"],
    ] as const) {
      expect(cores[tema].bg).toBe(variavel(cssTokens, seletor, 'color-bg'));
      expect(cores[tema].texto).toBe(variavel(cssTokens, seletor, 'color-text'));
      expect(cores[tema].link).toBe(variavel(cssTokens, seletor, 'color-link'));
    }
  });

  it('claro: texto ≥ 7:1 e link ≥ 4,5:1 sobre o fundo', () => {
    expect(cores.claro).toEqual({ bg: '#ffffff', texto: '#2b1620', link: '#c93a77' });
    expect(contrastRatio(cores.claro.texto, cores.claro.bg)).toBeGreaterThanOrEqual(7);
    expect(contrastRatio(cores.claro.link, cores.claro.bg)).toBeGreaterThanOrEqual(4.5);
  });

  it('escuro: texto ≥ 7:1 e link ≥ 4,5:1 sobre o fundo', () => {
    expect(cores.escuro).toEqual({ bg: '#150a10', texto: '#fdf0f5', link: '#ffb3d1' });
    expect(contrastRatio(cores.escuro.texto, cores.escuro.bg)).toBeGreaterThanOrEqual(7);
    expect(contrastRatio(cores.escuro.link, cores.escuro.bg)).toBeGreaterThanOrEqual(4.5);
  });
});

describe('404.html: tamanho', () => {
  it('≤ 10 KB (o dist/404.html é cópia byte a byte de public/404.html)', () => {
    expect(statSync(resolve(raiz, CAMINHO_404)).size).toBeLessThanOrEqual(10 * 1024);
  });
});
