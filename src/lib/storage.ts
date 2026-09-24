// Acesso seguro ao localStorage (F-08). Em modo privado, com cookies bloqueados ou cota cheia,
// o navegador pode lançar exceção só de tocar no `localStorage`: aqui isso nunca vaza.

/** Lê `key` do `localStorage`. Devolve `null` se não existir ou se o storage estiver indisponível. */
export function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Grava `value` em `key`. Devolve `false` (sem lançar erro) se o storage estiver indisponível. */
export function writeStorage(key: string, value: string): boolean {
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}
