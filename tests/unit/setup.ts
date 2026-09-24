// Setup único dos testes de unidade (F-04). O Q-01 estende este arquivo e cria tests/unit/support/
// (mocks controláveis, render com provedores), sem criar outro setup nem outro config.
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Desmonta o que foi renderizado entre um teste e outro (sem `globals: true` não é automático).
afterEach(() => {
  cleanup();
});

// jsdom não implementa matchMedia. Mock mínimo: nenhuma media query casa.
if (typeof window.matchMedia !== 'function') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string): MediaQueryList => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }),
  });
}

// jsdom não implementa IntersectionObserver. Mock mínimo: nunca dispara o callback.
class IntersectionObserverMock implements IntersectionObserver {
  readonly root: Element | Document | null = null;
  readonly rootMargin: string = '0px';
  readonly thresholds: ReadonlyArray<number> = [0];
  readonly scrollMargin: string = '0px';
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

if (typeof window.IntersectionObserver !== 'function') {
  Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: IntersectionObserverMock,
  });
  Object.defineProperty(globalThis, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: IntersectionObserverMock,
  });
}
