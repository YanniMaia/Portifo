// Script anti-"piscada" do index.html (F-08). Garante que as chaves e as cores do script inline
// são as mesmas de src/theme/constants.ts e que o script decide tema e idioma como o doc §6 pede.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';
import { LANG_STORAGE_KEY, PAGE_BG, THEME_COLOR, THEME_STORAGE_KEY } from '@/theme/constants';

// O Vitest roda na raiz do projeto (no jsdom, `import.meta.url` não é `file:`).
const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');
const doc = new DOMParser().parseFromString(html, 'text/html');

const scriptsInline = [...doc.querySelectorAll('script')].filter(
  (s) => !s.hasAttribute('src') && !s.hasAttribute('type'),
);
const codigo = scriptsInline[0]?.textContent ?? '';
const css = doc.querySelector('head style')?.textContent ?? '';

describe('index.html: marcação do tema', () => {
  it('tem uma única meta theme-color, sem `media`, com a cor clara de constants.ts', () => {
    const metas = doc.querySelectorAll('meta[name="theme-color"]');
    expect(metas).toHaveLength(1);
    expect(metas[0]?.hasAttribute('media')).toBe(false);
    expect(metas[0]?.getAttribute('content')).toBe(THEME_COLOR.light);
    expect(doc.querySelector('meta[name="color-scheme"]')?.getAttribute('content')).toBe(
      'light dark',
    );
  });

  it('tem exatamente um script clássico inline, com no máximo 1 KB', () => {
    expect(scriptsInline).toHaveLength(1);
    expect(new TextEncoder().encode(codigo).length).toBeLessThanOrEqual(1024);
  });

  it('usa as mesmas chaves de storage e cores de theme-color de constants.ts', () => {
    expect(codigo).toContain(`'${THEME_STORAGE_KEY}'`);
    expect(codigo).toContain(`'${LANG_STORAGE_KEY}'`);
    expect(codigo).toContain(`'${THEME_COLOR.light}'`);
    expect(codigo).toContain(`'${THEME_COLOR.dark}'`);
  });

  it('o <style> crítico usa os fundos de PAGE_BG', () => {
    const normalizado = css.replace(/\s+/g, '').toLowerCase();
    expect(normalizado).toContain(`html{background:${PAGE_BG.light.toLowerCase()};}`);
    expect(normalizado).toContain(
      `html[data-theme='dark']{background:${PAGE_BG.dark.toLowerCase()};color-scheme:dark;}`,
    );
  });

  it('meta, <style> e script vêm antes de qualquer stylesheet e do script módulo', () => {
    const todos = [...doc.querySelectorAll('*')];
    const pos = (el: Element | null | undefined): number => (el ? todos.indexOf(el) : -1);
    const ultimoCritico = Math.max(
      pos(doc.querySelector('meta[name="theme-color"]')),
      pos(doc.querySelector('head style')),
      pos(scriptsInline[0]),
    );
    const posteriores = [
      ...doc.querySelectorAll('link[rel="stylesheet"], script[type="module"]'),
    ].map(pos);
    expect(posteriores.length).toBeGreaterThan(0);
    for (const p of posteriores) {
      expect(p).toBeGreaterThan(ultimoCritico);
    }
  });
});

interface Cenario {
  storage?: Record<string, string>;
  storageLanca?: boolean;
  prefereEscuro?: boolean;
}

/** Roda o script do index.html num documento limpo, com storage e matchMedia simulados. */
function rodarScript({ storage = {}, storageLanca = false, prefereEscuro = false }: Cenario) {
  const alvo = document.implementation.createHTMLDocument('teste');
  alvo.documentElement.setAttribute('lang', 'pt-BR');
  const meta = alvo.createElement('meta');
  meta.setAttribute('name', 'theme-color');
  meta.setAttribute('content', THEME_COLOR.light);
  alvo.head.append(meta);

  const localStorage = {
    getItem(chave: string): string | null {
      if (storageLanca) throw new DOMException('bloqueado', 'SecurityError');
      return storage[chave] ?? null;
    },
  };
  const matchMedia = (query: string) => ({
    matches: query === '(prefers-color-scheme: dark)' && prefereEscuro,
  });

  runInNewContext(codigo, { document: alvo, localStorage, matchMedia });

  return {
    tema: alvo.documentElement.getAttribute('data-theme'),
    lang: alvo.documentElement.getAttribute('lang'),
    cor: meta.getAttribute('content'),
  };
}

describe('index.html: comportamento do script', () => {
  it('storage vazio segue a preferência do aparelho', () => {
    expect(rodarScript({ prefereEscuro: true })).toEqual({
      tema: 'dark',
      lang: 'pt-BR',
      cor: THEME_COLOR.dark,
    });
    expect(rodarScript({ prefereEscuro: false })).toEqual({
      tema: 'light',
      lang: 'pt-BR',
      cor: THEME_COLOR.light,
    });
  });

  it('a escolha manual vence a preferência do aparelho', () => {
    expect(rodarScript({ storage: { [THEME_STORAGE_KEY]: 'dark' } }).tema).toBe('dark');
    expect(
      rodarScript({ storage: { [THEME_STORAGE_KEY]: 'light' }, prefereEscuro: true }).tema,
    ).toBe('light');
  });

  it('valor inválido no storage é ignorado', () => {
    expect(
      rodarScript({ storage: { [THEME_STORAGE_KEY]: 'roxo' }, prefereEscuro: true }).tema,
    ).toBe('dark');
  });

  it('idioma: `en` salvo vira lang="en"; qualquer outra coisa fica pt-BR', () => {
    expect(rodarScript({ storage: { [LANG_STORAGE_KEY]: 'en' } }).lang).toBe('en');
    expect(rodarScript({ storage: { [LANG_STORAGE_KEY]: 'fr' } }).lang).toBe('pt-BR');
  });

  it('storage que lança exceção não quebra e o tema segue o aparelho', () => {
    expect(() => rodarScript({ storageLanca: true, prefereEscuro: true })).not.toThrow();
    expect(rodarScript({ storageLanca: true, prefereEscuro: true })).toEqual({
      tema: 'dark',
      lang: 'pt-BR',
      cor: THEME_COLOR.dark,
    });
  });
});
