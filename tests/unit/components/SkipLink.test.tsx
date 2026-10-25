// Testes do SkipLink (F-14). O navegador real (cores, foco no <main>, axe) fica no e2e
// `tests/e2e/shell.spec.ts`. Os testes do "App shell" (ordem SkipLink → header → main → footer,
// seções do registro, H1 único) viviam aqui enquanto o App usava os stubs da F-14; o S-17 os move
// para `tests/unit/app/App.test.tsx`, que já renderiza o App real (Header/Footer reais, que
// precisam do ThemeProvider/MotionProvider — não só o LanguageProvider que bastava para os stubs).
import { render, screen } from '@testing-library/react';
import { StrictMode, type ReactElement } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { MAIN_CONTENT_ID, SkipLink } from '@/components/SkipLink';
import { en } from '@/content/en';
import { pt } from '@/content/pt';
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
