// Setup único dos testes de unidade (F-04, estendido no Q-01). Não existe outro setup nem outro config.
// Mocks controláveis em tests/unit/support/mocks.ts; render com provedores em tests/unit/support/render.tsx.
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach } from 'vitest';
import { instalarMocksPadrao } from './support/mocks';

// Estado do <html> antes de qualquer teste (o renderWithProviders muda `data-theme` e `lang`; o
// MotionProvider escreve `data-reduced-motion`).
const ATRIBUTOS_DO_HTML = ['data-theme', 'lang', 'data-reduced-motion'] as const;
const htmlInicial = ATRIBUTOS_DO_HTML.map(
  (nome) => [nome, document.documentElement.getAttribute(nome)] as const,
);

function restaurarAtributo(nome: string, valor: string | null): void {
  if (valor === null) document.documentElement.removeAttribute(nome);
  else document.documentElement.setAttribute(nome, valor);
}

// Instala já no carregamento (código no topo de um arquivo de teste também encontra os mocks) e
// reinstala antes de cada teste: todo teste começa no padrão (claro, sem movimento reduzido,
// IntersectionObserver parado, sem área de transferência, `window.scrollTo` espião zerado).
instalarMocksPadrao();
beforeEach(() => {
  instalarMocksPadrao();
});

afterEach(() => {
  // Desmonta o que foi renderizado (sem `globals: true` não é automático).
  cleanup();
  window.localStorage.clear();
  for (const [nome, valor] of htmlInicial) restaurarAtributo(nome, valor);
});
