// D-05: `encurtarSha` é a regra única usada por `vite.config.ts` (injeção do `<meta name="version">`)
// e por `tests/e2e/smoke-publico.spec.ts` (valor esperado do smoke). Aqui só a função pura.
import { describe, expect, it } from 'vitest';
import { encurtarSha } from '@/build/gitSha';

describe('encurtarSha', () => {
  it('corta um SHA completo (40 caracteres) para os 7 primeiros, em minúsculas', () => {
    expect(encurtarSha('ABCDEF0123456789abcdef0123456789abcdef01')).toBe('abcdef0');
  });

  it('aceita um SHA já curto (7 caracteres) e devolve igual (minúsculo)', () => {
    expect(encurtarSha('1A2B3C4')).toBe('1a2b3c4');
  });

  it('remove espaços nas pontas (git rev-parse costuma vir com \\n)', () => {
    expect(encurtarSha('  abcdef0123  \n')).toBe('abcdef0');
  });

  it('rejeita string vazia, curta demais ou com caracteres não hexadecimais', () => {
    expect(() => encurtarSha('')).toThrow();
    expect(() => encurtarSha('abc')).toThrow(); // menor que 7
    expect(() => encurtarSha('zzzzzzz')).toThrow(); // não hexadecimal
    expect(() => encurtarSha('abcdef0 e mais texto')).toThrow();
  });
});
