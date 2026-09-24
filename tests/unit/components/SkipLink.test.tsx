// Testes do SkipLink e do App shell (F-14). O navegador real (cores, foco no <main>, axe) fica no
// e2e `tests/e2e/shell.spec.ts`.
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode, type ReactElement } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import App from '@/App';
import { MAIN_CONTENT_ID, SkipLink } from '@/components/SkipLink';
import { en } from '@/content/en';
import { pt } from '@/content/pt';
import { SECTION_IDS } from '@/content/sections';
import { LanguageProvider } from '@/i18n/LanguageProvider';

const html = document.documentElement;

function renderizar(ui: ReactElement) {
  return render(
    <StrictMode>
      <LanguageProvider>{ui}</LanguageProvider>
    </StrictMode>,
  );
}

afterEach(() => {
  html.lang = 'pt-BR';
});

describe('SkipLink', () => {
  it('é um link para #conteudo com o texto do dicionário PT', () => {
    renderizar(<SkipLink />);
    const link = screen.getByRole('link', { name: pt.a11y.skipToContent });
    expect(link).toHaveAttribute('href', `#${MAIN_CONTENT_ID}`);
    expect(MAIN_CONTENT_ID).toBe('conteudo');
  });

  it('usa o texto EN quando o idioma é inglês', () => {
    html.lang = 'en';
    renderizar(<SkipLink />);
    expect(screen.getByRole('link', { name: en.a11y.skipToContent })).toBeInTheDocument();
  });

  it('usa a classe do CSS Module (oculto até receber foco, sem display:none)', () => {
    renderizar(<SkipLink />);
    const link = screen.getByRole('link');
    expect(link.className).toContain('skipLink');
    expect(link).not.toHaveStyle({ display: 'none' });
  });
});

describe('App shell', () => {
  it('o primeiro Tab foca o SkipLink', async () => {
    const usuario = userEvent.setup();
    renderizar(<App />);
    await usuario.tab();
    expect(document.activeElement).toBe(screen.getByRole('link', { name: pt.a11y.skipToContent }));
  });

  it('monta SkipLink → header → main#conteudo → footer, nesta ordem', () => {
    const { container } = renderizar(<App />);
    const filhos = Array.from(container.children).map((el) =>
      el.id ? `${el.tagName.toLowerCase()}#${el.id}` : el.tagName.toLowerCase(),
    );
    expect(filhos).toEqual(['a', 'header', 'main#conteudo', 'footer']);
    expect(screen.getByRole('main')).toHaveAttribute('tabindex', '-1');
  });

  it('tem uma <section> por entrada do registro, na ordem de SECTION_IDS', () => {
    renderizar(<App />);
    const secoes = Array.from(screen.getByRole('main').querySelectorAll(':scope > section'));
    expect(secoes.map((s) => s.id)).toEqual([...SECTION_IDS]);
  });

  it('não tem <h1> (o único H1 vem do Hero, doc 03)', () => {
    const { container } = renderizar(<App />);
    expect(container.querySelectorAll('h1')).toHaveLength(0);
  });

  it('stubs sem aria-labelledby (não há título para apontar)', () => {
    const { container } = renderizar(<App />);
    for (const secao of container.querySelectorAll('section')) {
      expect(secao).not.toHaveAttribute('aria-labelledby');
    }
  });
});
