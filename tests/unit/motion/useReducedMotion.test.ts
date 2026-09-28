// useReducedMotion e MotionProvider (A-01; doc 04 §4.2 R4). Confere:
// (1) o hook consulta `(prefers-reduced-motion: reduce)` e muda de false → true → false sem
//     recarregar quando a preferência muda (matchMedia simulado com evento `change`);
// (2) o MotionProvider escreve `data-reduced-motion="true|false"` no <html> e acompanha a mudança;
// (3) o MotionProvider liga o observador de loops (visibilitychange → data-page-hidden) e desliga
//     tudo ao desmontar;
// (4) nenhum outro arquivo novo de src/ consulta a media query (fonte única no JS).
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { act, render, renderHook } from '@testing-library/react';
import { createElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MotionProvider } from '@/motion/MotionProvider';
import {
  ATRIBUTO_MOVIMENTO_REDUZIDO,
  CONSULTA_MOVIMENTO_REDUZIDO,
  useReducedMotion,
} from '@/motion/useReducedMotion';

function mockMatchMedia(inicial: boolean) {
  const ouvintes = new Set<() => void>();
  const estado = { matches: inicial };
  const mql = {
    get matches() {
      return estado.matches;
    },
    media: CONSULTA_MOVIMENTO_REDUZIDO,
    onchange: null,
    addEventListener: vi.fn((_: string, fn: () => void) => ouvintes.add(fn)),
    removeEventListener: vi.fn((_: string, fn: () => void) => ouvintes.delete(fn)),
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  };
  const matchMedia = vi.fn(() => mql as unknown as MediaQueryList);
  vi.spyOn(window, 'matchMedia').mockImplementation(matchMedia);
  return {
    ouvintes,
    matchMedia,
    mudar(valor: boolean) {
      estado.matches = valor;
      act(() => {
        for (const fn of ouvintes) fn();
      });
    },
  };
}

afterEach(() => {
  vi.restoreAllMocks();
  document.documentElement.removeAttribute(ATRIBUTO_MOVIMENTO_REDUZIDO);
});

describe('useReducedMotion', () => {
  it('consulta exatamente (prefers-reduced-motion: reduce)', () => {
    expect(CONSULTA_MOVIMENTO_REDUZIDO).toBe('(prefers-reduced-motion: reduce)');
    const mm = mockMatchMedia(false);
    renderHook(() => useReducedMotion());
    expect(mm.matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
  });

  it('muda de false para true (e volta) sem recarregar quando a preferência muda', () => {
    const mm = mockMatchMedia(false);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
    mm.mudar(true);
    expect(result.current).toBe(true);
    mm.mudar(false);
    expect(result.current).toBe(false);
  });

  it('começa em true quando a preferência já está ligada e solta o ouvinte ao desmontar', () => {
    const mm = mockMatchMedia(true);
    const { result, unmount } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
    expect(mm.ouvintes.size).toBe(1);
    unmount();
    expect(mm.ouvintes.size).toBe(0);
  });

  it('sem matchMedia utilizável devolve false', () => {
    vi.spyOn(window, 'matchMedia').mockImplementation(() => {
      throw new Error('indisponível');
    });
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
  });
});

describe('MotionProvider', () => {
  it('renderiza os filhos e escreve data-reduced-motion no <html>, acompanhando a mudança', () => {
    const mm = mockMatchMedia(false);
    const { getByText } = render(
      createElement(MotionProvider, null, createElement('p', null, 'conteúdo')),
    );
    expect(getByText('conteúdo')).toBeInTheDocument();
    const html = document.documentElement;
    expect(html.getAttribute(ATRIBUTO_MOVIMENTO_REDUZIDO)).toBe('false');
    mm.mudar(true);
    expect(html.getAttribute(ATRIBUTO_MOVIMENTO_REDUZIDO)).toBe('true');
    mm.mudar(false);
    expect(html.getAttribute(ATRIBUTO_MOVIMENTO_REDUZIDO)).toBe('false');
  });

  it('liga o observador de loops (aba oculta → data-page-hidden) e desliga ao desmontar', () => {
    mockMatchMedia(false);
    const html = document.documentElement;
    let estado: DocumentVisibilityState = 'visible';
    vi.spyOn(document, 'visibilityState', 'get').mockImplementation(() => estado);
    vi.spyOn(document, 'hidden', 'get').mockImplementation(() => estado === 'hidden');
    const { unmount } = render(createElement(MotionProvider, null, null));
    expect(html.hasAttribute('data-page-hidden')).toBe(false);
    estado = 'hidden';
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(html.hasAttribute('data-page-hidden')).toBe(true);
    unmount();
    expect(html.hasAttribute('data-page-hidden')).toBe(false);
  });
});

describe('fonte única da media query no JS (A-01)', () => {
  it('fora de src/motion/, só os donos anteriores (F-09, F-13) citam prefers-reduced-motion', () => {
    const SRC = resolve(process.cwd(), 'src');
    const achados = readdirSync(SRC, { recursive: true, encoding: 'utf8' })
      .filter((f) => /\.(ts|tsx)$/.test(f))
      .map((f) => ({
        caminho: relative(process.cwd(), join(SRC, f)).replaceAll('\\', '/'),
        texto: readFileSync(join(SRC, f), 'utf8'),
      }))
      .filter(({ texto }) => texto.includes('prefers-reduced-motion'))
      .map((a) => a.caminho)
      .sort();
    // ThemeProvider (F-09) e lib/scroll.ts (F-13) são anteriores ao A-01 e ficam com os donos (D14).
    expect(achados).toEqual([
      'src/lib/scroll.ts',
      'src/motion/useReducedMotion.ts',
      'src/theme/ThemeProvider.tsx',
    ]);
  });
});
