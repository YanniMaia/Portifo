// Testes do LanguageProvider e do useLanguage (F-10).
import { act, render, renderHook } from '@testing-library/react';
import { StrictMode, type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { en } from '@/content/en';
import { pt } from '@/content/pt';
import { SUGERIDOS } from '@/content/sugeridos';
import { LanguageProvider } from '@/i18n/LanguageProvider';
import type { Dictionary, DictionaryKey, Lang } from '@/i18n/types';
import { useLanguage } from '@/i18n/useLanguage';
import { LANG_STORAGE_KEY } from '@/theme/constants';

const html = document.documentElement;
const TITULO_ORIGINAL = document.title;

/** Faz o papel do script inline da F-08 e do `<title>` do index.html. */
function prepararDocumento(lang: 'pt-BR' | 'en'): void {
  html.lang = lang;
  document.title = pt.meta.title;
}

function wrapper({ children }: { children: ReactNode }) {
  return (
    <StrictMode>
      <LanguageProvider>{children}</LanguageProvider>
    </StrictMode>
  );
}

beforeEach(() => {
  localStorage.clear();
  prepararDocumento('pt-BR');
});

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
  html.lang = 'pt-BR';
  document.title = TITULO_ORIGINAL;
});

describe('estado inicial', () => {
  it('sem ye-lang (lang="pt-BR"): PT, dicionário pt', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    expect(result.current.lang).toBe('pt');
    expect(result.current.dict).toBe(pt);
    expect(document.title).toBe('Yanni Elyssa | Portfólio');
  });

  it('lang="en" já aplicado pelo script: o PRIMEIRO render já é EN (sem troca PT→EN)', () => {
    prepararDocumento('en');
    const renders: { lang: Lang; titulo: string }[] = [];
    function Sonda() {
      const { lang, dict } = useLanguage();
      renders.push({ lang, titulo: dict.meta.title });
      return null;
    }
    render(
      <StrictMode>
        <LanguageProvider>
          <Sonda />
        </LanguageProvider>
      </StrictMode>,
    );
    expect(renders.length).toBeGreaterThan(0);
    expect(renders.every((r) => r.lang === 'en' && r.titulo === en.meta.title)).toBe(true);
    // O <title> do index.html (PT) é alinhado ao EN na montagem; o lang do <html> fica como está.
    expect(document.title).toBe('Yanni Elyssa | Portfolio');
    expect(html.lang).toBe('en');
  });

  it('não segue o idioma do navegador (D6, §6)', () => {
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('en-US');
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['en-US', 'en']);
    const { result } = renderHook(() => useLanguage(), { wrapper });
    expect(result.current.lang).toBe('pt');
  });

  it('a montagem não grava ye-lang', () => {
    renderHook(() => useLanguage(), { wrapper });
    expect(localStorage.getItem(LANG_STORAGE_KEY)).toBeNull();
  });
});

describe('troca de idioma', () => {
  it('toggleLang → lang="en", título EN e ye-lang=en; de volta → pt-BR e título PT', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });

    act(() => result.current.toggleLang());
    expect(result.current.lang).toBe('en');
    expect(result.current.dict).toBe(en);
    expect(html.getAttribute('lang')).toBe('en');
    expect(document.title).toBe('Yanni Elyssa | Portfolio');
    expect(localStorage.getItem(LANG_STORAGE_KEY)).toBe('en');

    act(() => result.current.toggleLang());
    expect(result.current.lang).toBe('pt');
    expect(result.current.dict).toBe(pt);
    expect(html.getAttribute('lang')).toBe('pt-BR');
    expect(document.title).toBe('Yanni Elyssa | Portfólio');
    expect(localStorage.getItem(LANG_STORAGE_KEY)).toBe('pt');
  });

  it('setLang define o idioma pedido', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    act(() => result.current.setLang('en'));
    expect(result.current.lang).toBe('en');
    expect(html.lang).toBe('en');
    act(() => result.current.setLang('en'));
    expect(result.current.lang).toBe('en');
    act(() => result.current.setLang('pt'));
    expect(html.lang).toBe('pt-BR');
    expect(localStorage.getItem(LANG_STORAGE_KEY)).toBe('pt');
  });

  it('componentes leem por acesso tipado e re-renderizam no outro idioma', () => {
    function Menu() {
      const { dict } = useLanguage();
      return <nav>{dict.nav.sobre}</nav>;
    }
    let alternar: () => void = () => undefined;
    function Botao() {
      alternar = useLanguage().toggleLang;
      return null;
    }
    const { container } = render(
      <LanguageProvider>
        <Menu />
        <Botao />
      </LanguageProvider>,
    );
    expect(container.textContent).toBe(pt.nav.sobre);
    act(() => alternar());
    expect(container.textContent).toBe(en.nav.sobre);
  });

  it('com o storage lançando exceção, troca sem erro (a escolha vale só nesta visita)', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('bloqueado', 'SecurityError');
    });
    const { result } = renderHook(() => useLanguage(), { wrapper });
    expect(() => act(() => result.current.toggleLang())).not.toThrow();
    expect(result.current.lang).toBe('en');
    expect(html.lang).toBe('en');
  });
});

describe('isSugerido', () => {
  it('é true só para as chaves do registro SUGERIDOS', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    const todas: DictionaryKey[] = [
      'nav.sobre',
      'nav.interesses',
      'nav.habilidades',
      'nav.projetos',
      'nav.formacao',
      'nav.contato',
      'a11y.skipToContent',
      'a11y.opensInNewTab',
      'a11y.themeToDark',
      'a11y.themeToLight',
      'a11y.language',
      'a11y.languageNamePt',
      'a11y.languageNameEn',
      'meta.title',
    ];
    for (const chave of todas) {
      expect(result.current.isSugerido(chave), chave).toBe(SUGERIDOS.includes(chave));
    }
  });
});

describe('tipos', () => {
  it('en é um Dictionary e pt também encaixa em Dictionary', () => {
    const dicionarios: Dictionary[] = [pt, en];
    expect(dicionarios).toHaveLength(2);
  });

  it('useLanguage fora do provedor lança erro', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => renderHook(() => useLanguage())).toThrow(/LanguageProvider/);
  });
});
