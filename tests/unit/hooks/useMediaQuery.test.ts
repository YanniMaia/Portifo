// useMediaQuery (F-12): valor inicial, atualização no evento `change` e limpeza.
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useMediaQuery } from '@/hooks/useMediaQuery';

function mockMatchMedia(inicial: boolean) {
  const ouvintes = new Set<() => void>();
  const estado = { matches: inicial };
  const mql = {
    get matches() {
      return estado.matches;
    },
    media: '',
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
    mql,
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
});

describe('useMediaQuery', () => {
  it('devolve o valor atual e acompanha o evento change', () => {
    const mm = mockMatchMedia(false);
    const { result } = renderHook(() => useMediaQuery('(min-width: 1024px)'));
    expect(mm.matchMedia).toHaveBeenCalledWith('(min-width: 1024px)');
    expect(result.current).toBe(false);
    mm.mudar(true);
    expect(result.current).toBe(true);
    mm.mudar(false);
    expect(result.current).toBe(false);
  });

  it('remove o ouvinte no unmount', () => {
    const mm = mockMatchMedia(true);
    const { result, unmount } = renderHook(() => useMediaQuery('(min-width: 1024px)'));
    expect(result.current).toBe(true);
    unmount();
    expect(mm.ouvintes.size).toBe(0);
  });

  it('sem matchMedia (ou query que lança erro) devolve false', () => {
    vi.spyOn(window, 'matchMedia').mockImplementation(() => {
      throw new Error('SyntaxError');
    });
    const { result } = renderHook(() => useMediaQuery('(((inválida'));
    expect(result.current).toBe(false);
  });
});
