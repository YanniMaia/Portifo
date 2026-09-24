// Hook genérico de media query (F-12). Usado pelo cabeçalho (menu desktop × hambúrguer) e pelo DS.
import { useCallback, useSyncExternalStore } from 'react';

function consultar(query: string): MediaQueryList | null {
  try {
    return typeof window.matchMedia === 'function' ? window.matchMedia(query) : null;
  } catch {
    return null;
  }
}

/**
 * `true` enquanto a media query casa; atualiza quando ela muda (ex.: redimensionar a janela).
 * Sem `matchMedia` (ou com query inválida) devolve `false`. Não cria texto nem breakpoints:
 * as queries vêm dos tokens do DS-02.
 *
 * @example const desktop = useMediaQuery('(min-width: 1024px)');
 */
export function useMediaQuery(query: string): boolean {
  const assinar = useCallback(
    (avisar: () => void) => {
      const mql = consultar(query);
      if (!mql) return () => undefined;
      mql.addEventListener('change', avisar);
      return () => {
        mql.removeEventListener('change', avisar);
      };
    },
    [query],
  );
  const ler = useCallback(() => consultar(query)?.matches === true, [query]);
  return useSyncExternalStore(assinar, ler, () => false);
}
