// Prova de controle dos mocks do Q-01 (tests/unit/support/mocks.ts) e da limpeza do setup.
// Alguns casos vêm em PARES em sequência (o 1º suja, o 2º confere que o setup limpou): o Vitest roda
// os testes de um arquivo em ordem, um de cada vez.
import { describe, expect, it, vi } from 'vitest';
import {
  dispararEntrada,
  mockClipboard,
  mockMatchMedia,
  observadoresAtivos,
  scrollToEspiao,
} from './mocks';

describe('mockMatchMedia', () => {
  it('padrão do setup: sistema claro e sem movimento reduzido', () => {
    expect(window.matchMedia('(prefers-color-scheme: dark)').matches).toBe(false);
    expect(window.matchMedia('(prefers-color-scheme: light)').matches).toBe(true);
    expect(window.matchMedia('(prefers-reduced-motion: reduce)').matches).toBe(false);
    expect(window.matchMedia('(prefers-reduced-motion: no-preference)').matches).toBe(true);
  });

  it('{ colorScheme: "dark" } faz (prefers-color-scheme: dark) casar', () => {
    mockMatchMedia({ colorScheme: 'dark' });
    expect(window.matchMedia('(prefers-color-scheme: dark)').matches).toBe(true);
    expect(window.matchMedia('(prefers-color-scheme: light)').matches).toBe(false);
    expect(window.matchMedia('(prefers-reduced-motion: reduce)').matches).toBe(false);
  });

  it('{ reducedMotion: true } faz (prefers-reduced-motion: reduce) casar', () => {
    mockMatchMedia({ reducedMotion: true });
    expect(window.matchMedia('(prefers-reduced-motion: reduce)').matches).toBe(true);
    expect(window.matchMedia('(prefers-reduced-motion: no-preference)').matches).toBe(false);
    expect(window.matchMedia('(prefers-color-scheme: dark)').matches).toBe(false);
  });

  it('query fora das preferências do sistema não casa', () => {
    mockMatchMedia({ colorScheme: 'dark', reducedMotion: true });
    expect(window.matchMedia('(min-width: 1024px)').matches).toBe(false);
  });

  it('definir() dispara change só nas listas cujo resultado mudou (3 formas de ouvir)', () => {
    const controle = mockMatchMedia();
    const escuro = window.matchMedia('(prefers-color-scheme: dark)');
    const reduzido = window.matchMedia('(prefers-reduced-motion: reduce)');
    const viaEvento = vi.fn();
    const viaLegado = vi.fn();
    const viaOnchange = vi.fn();
    const deMovimento = vi.fn();
    escuro.addEventListener('change', viaEvento);
    escuro.addListener(viaLegado);
    escuro.onchange = viaOnchange;
    reduzido.addEventListener('change', deMovimento);

    controle.definir({ colorScheme: 'dark' });
    expect(escuro.matches).toBe(true);
    expect(viaEvento).toHaveBeenCalledTimes(1);
    expect(viaEvento).toHaveBeenCalledWith(expect.objectContaining({ matches: true }));
    expect(viaLegado).toHaveBeenCalledTimes(1);
    expect(viaOnchange).toHaveBeenCalledTimes(1);
    expect(deMovimento).not.toHaveBeenCalled();
    expect(controle.atual).toEqual({ colorScheme: 'dark', reducedMotion: false });

    // Mesmo valor: nada dispara.
    controle.definir({ colorScheme: 'dark' });
    expect(viaEvento).toHaveBeenCalledTimes(1);

    // Ouvinte removido não é chamado.
    escuro.removeEventListener('change', viaEvento);
    controle.definir({ colorScheme: 'light' });
    expect(escuro.matches).toBe(false);
    expect(viaEvento).toHaveBeenCalledTimes(1);
    expect(viaLegado).toHaveBeenCalledTimes(2);
    expect(viaLegado).toHaveBeenLastCalledWith(expect.objectContaining({ matches: false }));
  });
});

describe('IntersectionObserver controlável', () => {
  it('dispararEntrada(elemento) chama o callback de quem observa o elemento', () => {
    const el = document.createElement('div');
    const callback = vi.fn();
    const obs = new IntersectionObserver(callback);
    obs.observe(el);

    expect(dispararEntrada(el)).toBe(1);
    expect(callback).toHaveBeenCalledTimes(1);
    const [[entradas, observador]] = callback.mock.calls as [
      [IntersectionObserverEntry[], unknown],
    ];
    expect(observador).toBe(obs);
    expect(entradas).toHaveLength(1);
    expect(entradas[0]).toMatchObject({ target: el, isIntersecting: true, intersectionRatio: 1 });

    dispararEntrada(el, { isIntersecting: false });
    expect(callback).toHaveBeenLastCalledWith(
      [expect.objectContaining({ target: el, isIntersecting: false, intersectionRatio: 0 })],
      obs,
    );
  });

  it('não chama para elemento não observado, depois de unobserve nem depois de disconnect', () => {
    const a = document.createElement('div');
    const b = document.createElement('div');
    const callback = vi.fn();
    const obs = new IntersectionObserver(callback, { threshold: [0, 0.5] });
    expect(obs.thresholds).toEqual([0, 0.5]);
    obs.observe(a);

    expect(dispararEntrada(b)).toBe(0);
    obs.unobserve(a);
    expect(dispararEntrada(a)).toBe(0);
    obs.observe(a);
    obs.disconnect();
    expect(dispararEntrada(a)).toBe(0);
    expect(callback).not.toHaveBeenCalled();
    expect(observadoresAtivos()).not.toContain(obs);
  });

  it('par 1/2: deixa um observador vivo', () => {
    new IntersectionObserver(() => undefined).observe(document.body);
    expect(observadoresAtivos()).toHaveLength(1);
  });

  it('par 2/2: o setup esqueceu os observadores do teste anterior', () => {
    expect(observadoresAtivos()).toHaveLength(0);
    expect(dispararEntrada(document.body)).toBe(0);
  });
});

describe('mockClipboard', () => {
  it('padrão do setup: sem área de transferência (como o jsdom)', () => {
    expect(navigator.clipboard).toBeUndefined();
  });

  it("'sucesso': writeText resolve e registra o texto", async () => {
    const { writeText } = mockClipboard('sucesso');
    await expect(navigator.clipboard.writeText('texto')).resolves.toBeUndefined();
    expect(writeText).toHaveBeenCalledWith('texto');
  });

  it("'negado': writeText rejeita com NotAllowedError", async () => {
    const { writeText } = mockClipboard('negado');
    await expect(navigator.clipboard.writeText('texto')).rejects.toMatchObject({
      name: 'NotAllowedError',
    });
    expect(writeText).toHaveBeenCalledTimes(1);
  });

  it("'ausente': navigator.clipboard é undefined", () => {
    mockClipboard('sucesso');
    const { writeText } = mockClipboard('ausente');
    expect(writeText).toBeUndefined();
    expect(navigator.clipboard).toBeUndefined();
  });
});

describe('localStorage limpo no afterEach', () => {
  it('par 1/2: grava uma chave', () => {
    localStorage.setItem('ye-theme', 'dark');
    expect(localStorage.getItem('ye-theme')).toBe('dark');
  });

  it('par 2/2: a chave do teste anterior sumiu', () => {
    expect(localStorage.getItem('ye-theme')).toBeNull();
    expect(localStorage).toHaveLength(0);
  });
});

describe('window.scrollTo espionável', () => {
  it('par 1/2: registra as chamadas', () => {
    window.scrollTo({ top: 120, behavior: 'smooth' });
    const espiao = scrollToEspiao();
    expect(Reflect.get(window, 'scrollTo')).toBe(espiao);
    expect(vi.isMockFunction(espiao)).toBe(true);
    expect(espiao).toHaveBeenCalledWith({ top: 120, behavior: 'smooth' });
  });

  it('par 2/2: espião novo a cada teste', () => {
    const espiao = scrollToEspiao();
    expect(Reflect.get(window, 'scrollTo')).toBe(espiao);
    expect(espiao).not.toHaveBeenCalled();
  });
});

describe('<html> restaurado no afterEach', () => {
  it('par 1/2: muda data-theme e lang', () => {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.setAttribute('lang', 'en');
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
  });

  it('par 2/2: voltaram ao estado inicial', () => {
    expect(document.documentElement).not.toHaveAttribute('data-theme', 'dark');
    expect(document.documentElement).not.toHaveAttribute('lang', 'en');
  });
});
