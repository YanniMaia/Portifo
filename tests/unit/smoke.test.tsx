// Teste de fumaça de unidade (F-04): o <App /> renderiza sem erro. Q-01 reaproveita este arquivo.
// Desde a F-14 o App usa o dicionário (SkipLink), então renderiza dentro do LanguageProvider.
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from '@/App';
import { LanguageProvider } from '@/i18n/LanguageProvider';

describe('smoke', () => {
  it('renderiza o App sem erro, com o <main id="conteudo">', () => {
    render(
      <LanguageProvider>
        <App />
      </LanguageProvider>,
    );
    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
    expect(main).toHaveAttribute('id', 'conteudo');
  });

  it('tem os mocks de matchMedia e IntersectionObserver do setup', () => {
    expect(window.matchMedia('(prefers-color-scheme: dark)').matches).toBe(false);
    const observer = new IntersectionObserver(() => undefined);
    expect(observer.takeRecords()).toEqual([]);
  });
});
