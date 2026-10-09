// Render com os provedores do app (Q-01). Mesma árvore do src/main.tsx (F-14, A-01):
// StrictMode › ThemeProvider › LanguageProvider › MotionProvider › ui.
// Os provedores leem o estado inicial do <html> (como o script inline da F-08 deixa na página real),
// então o render aplica `data-theme` e `lang` ANTES de montar. O setup restaura os dois atributos
// depois de cada teste. Na V1 o site é só PT: `idioma` é opcional e o padrão é `'pt'`.
import { render, type RenderOptions, type RenderResult } from '@testing-library/react';
import { StrictMode, type ReactElement, type ReactNode } from 'react';
import { HTML_LANG } from '@/i18n/LanguageContext';
import { LanguageProvider } from '@/i18n/LanguageProvider';
import type { Lang } from '@/i18n/types';
import { MotionProvider } from '@/motion/MotionProvider';
import type { Theme } from '@/theme/constants';
import { ThemeProvider } from '@/theme/ThemeProvider';

export interface OpcoesRenderComProvedores extends Omit<RenderOptions, 'wrapper'> {
  /** Tema inicial (`data-theme` do <html>). Padrão: `'light'`. */
  tema?: Theme;
  /** Idioma inicial (`lang` do <html>). Padrão: `'pt'` (V1 só PT). */
  idioma?: Lang;
}

function Provedores({ children }: { children: ReactNode }) {
  return (
    <StrictMode>
      <ThemeProvider>
        <LanguageProvider>
          <MotionProvider>{children}</MotionProvider>
        </LanguageProvider>
      </ThemeProvider>
    </StrictMode>
  );
}

export function renderWithProviders(
  ui: ReactElement,
  { tema = 'light', idioma = 'pt', ...opcoes }: OpcoesRenderComProvedores = {},
): RenderResult {
  const html = document.documentElement;
  html.setAttribute('data-theme', tema);
  html.setAttribute('lang', HTML_LANG[idioma]);
  return render(ui, { ...opcoes, wrapper: Provedores });
}
