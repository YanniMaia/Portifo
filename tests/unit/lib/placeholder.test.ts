import { afterEach, describe, expect, it, vi } from 'vitest';

// `SHOW_PLACEHOLDERS` é lido de `import.meta.env.DEV` quando `flags.ts` carrega.
// Para simular dev e produção: troca o env, limpa o cache de módulos e reimporta.
async function carregar(dev: boolean) {
  vi.stubEnv('DEV', dev);
  vi.stubEnv('PROD', !dev);
  vi.resetModules();
  const flags = await import('@/lib/flags');
  const placeholder = await import('@/lib/placeholder');
  return { ...flags, ...placeholder };
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('isPlaceholder (D23: contém "[" e "]")', () => {
  it.each([
    ['[link da demonstração]'],
    ['https://github.com/YanniMaia/[repositório]'], // PH-02: no meio da string
    ['[ano]'],
    ['Formada em [ano]'],
    ['texto ] com [ invertido'],
    [''],
  ])('%j é placeholder', async (v) => {
    const { isPlaceholder } = await carregar(true);
    expect(isPlaceholder(v)).toBe(true);
  });

  it('undefined e null são placeholder', async () => {
    const { isPlaceholder } = await carregar(true);
    expect(isPlaceholder(undefined)).toBe(true);
    expect(isPlaceholder(null)).toBe(true);
  });

  it.each([
    ['https://github.com/YanniMaia'],
    ['yannielyssa64@gmail.com'],
    ['Só [um colchete'],
    ['Só um colchete]'],
  ])('%j não é placeholder', async (v) => {
    const { isPlaceholder } = await carregar(true);
    expect(isPlaceholder(v)).toBe(false);
  });

  it('a regra não depende do modo (dev ou produção)', async () => {
    const prod = await carregar(false);
    expect(prod.isPlaceholder('https://github.com/YanniMaia/[repositório]')).toBe(true);
    expect(prod.isPlaceholder('https://github.com/YanniMaia')).toBe(false);
  });
});

describe('resolveOptional em dev (import.meta.env.DEV = true)', () => {
  it('SHOW_PLACEHOLDERS fica true', async () => {
    const { SHOW_PLACEHOLDERS } = await carregar(true);
    expect(SHOW_PLACEHOLDERS).toBe(true);
  });

  it('devolve o próprio texto do placeholder para ser marcado', async () => {
    const { resolveOptional } = await carregar(true);
    expect(resolveOptional('[ano]')).toBe('[ano]');
    expect(resolveOptional('https://github.com/YanniMaia/[repositório]')).toBe(
      'https://github.com/YanniMaia/[repositório]',
    );
  });

  it('valor real passa igual; vazio, null e undefined viram undefined', async () => {
    const { resolveOptional } = await carregar(true);
    expect(resolveOptional('https://github.com/YanniMaia')).toBe('https://github.com/YanniMaia');
    expect(resolveOptional('')).toBeUndefined();
    expect(resolveOptional(null)).toBeUndefined();
    expect(resolveOptional(undefined)).toBeUndefined();
  });
});

describe('resolveOptional em produção (import.meta.env.DEV = false)', () => {
  it('SHOW_PLACEHOLDERS fica false', async () => {
    const { SHOW_PLACEHOLDERS } = await carregar(false);
    expect(SHOW_PLACEHOLDERS).toBe(false);
  });

  it('placeholder vira undefined (elemento oculto, D11)', async () => {
    const { resolveOptional } = await carregar(false);
    expect(resolveOptional('[ano]')).toBeUndefined();
    expect(resolveOptional('https://github.com/YanniMaia/[repositório]')).toBeUndefined();
  });

  it('valor real passa igual; vazio, null e undefined viram undefined', async () => {
    const { resolveOptional } = await carregar(false);
    expect(resolveOptional('https://github.com/YanniMaia')).toBe('https://github.com/YanniMaia');
    expect(resolveOptional('')).toBeUndefined();
    expect(resolveOptional(null)).toBeUndefined();
    expect(resolveOptional(undefined)).toBeUndefined();
  });
});

describe('flags de produto', () => {
  it.each([true, false])('card de IA e botão PT/EN ligados (DEV=%s)', async (dev) => {
    const { SHOW_AI_COMING_SOON_CARD, SHOW_LANGUAGE_TOGGLE } = await carregar(dev);
    expect(SHOW_AI_COMING_SOON_CARD).toBe(true);
    expect(SHOW_LANGUAGE_TOGGLE).toBe(true);
  });
});
