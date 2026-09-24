// Contexto do tema (F-09). Fica separado do `ThemeProvider.tsx` e do `useTheme.ts` por causa da
// regra `react-refresh/only-export-components`: o arquivo do provedor só exporta componente.
import { createContext } from 'react';
import type { Theme } from './constants';

/** Classe posta no `<html>` durante a troca de tema. O CSS que a usa é do DS-04 (D14). */
export const THEME_TRANSITION_CLASS = 'theme-transition';

/** Quanto tempo a classe `theme-transition` fica no `<html>` (doc de design §6 e §9). */
export const THEME_TRANSITION_MS = 300;

export interface ThemeContextValue {
  /** Tema em uso, sempre igual ao `data-theme` do `<html>`. */
  theme: Theme;
  /** Troca claro ↔ escuro. Conta como escolha manual (grava `ye-theme`). */
  toggleTheme: () => void;
  /** Define o tema. Conta como escolha manual (grava `ye-theme`). */
  setTheme: (theme: Theme) => void;
  /** `true` quando o tema veio de escolha manual (salva ou feita nesta visita). */
  isUserChoice: boolean;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);
