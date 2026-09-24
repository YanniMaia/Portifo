// localStorage seguro (F-08): nunca lança erro, mesmo com o storage indisponível.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { readStorage, writeStorage } from '@/lib/storage';

afterEach(() => {
  vi.restoreAllMocks();
  window.localStorage.clear();
});

describe('storage', () => {
  it('grava e lê normalmente', () => {
    expect(writeStorage('ye-teste', 'ok')).toBe(true);
    expect(readStorage('ye-teste')).toBe('ok');
    expect(readStorage('ye-inexistente')).toBeNull();
  });

  it('com o storage lançando exceção, não lança e devolve null/false', () => {
    const erro = new DOMException('bloqueado', 'SecurityError');
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw erro;
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw erro;
    });
    expect(readStorage('ye-theme')).toBeNull();
    expect(writeStorage('ye-theme', 'dark')).toBe(false);
  });
});
