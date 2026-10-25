// Teste de fumaça de unidade (F-04, estendido no Q-01): o <App /> renderiza sem erro.
// Desde o S-17 o App monta as seções reais (Header com ThemeToggle, Footer, etc.), então precisa
// de TODOS os provedores do main.tsx (tema, idioma, motion) — não só o LanguageProvider da F-14.
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from '@/App';
import { pt } from '@/content/pt';
import type { Theme } from '@/theme/constants';
import { renderWithProviders } from './support/render';

describe('smoke', () => {
  it('renderiza o App sem erro, com o <main id="conteudo">', () => {
    renderWithProviders(<App />);
    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
    expect(main).toHaveAttribute('id', 'conteudo');
  });

  it('tem os mocks padrão do setup (sistema claro, IntersectionObserver parado)', () => {
    expect(window.matchMedia('(prefers-color-scheme: dark)').matches).toBe(false);
    expect(window.matchMedia('(prefers-reduced-motion: reduce)').matches).toBe(false);
    const observer = new IntersectionObserver(() => undefined);
    expect(observer.takeRecords()).toEqual([]);
  });

  it.each<Theme>(['light', 'dark'])(
    'renderWithProviders(<App />) no tema %s: provedores do main.tsx, tema e idioma aplicados',
    (tema) => {
      renderWithProviders(<App />, { tema });

      const main = screen.getByRole('main');
      expect(main).toHaveAttribute('id', 'conteudo');
      // ThemeProvider montado com o tema pedido (ele grava `color-scheme` na montagem).
      const html = document.documentElement;
      expect(html).toHaveAttribute('data-theme', tema);
      expect(html.style.colorScheme).toBe(tema);
      // MotionProvider montado (escreve `data-reduced-motion` antes da pintura).
      expect(html).toHaveAttribute('data-reduced-motion', 'false');
      // LanguageProvider em PT: o SkipLink usa o texto do dicionário e o título é o PT.
      expect(html).toHaveAttribute('lang', 'pt-BR');
      expect(screen.getByRole('link', { name: pt.a11y.skipToContent })).toBeInTheDocument();
      expect(document.title).toBe(pt.meta.title);
    },
  );
});
