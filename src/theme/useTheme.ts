// Hook do tema (F-09). API: `{ theme, toggleTheme, setTheme, isUserChoice }`.
import { useContext } from 'react';
import { ThemeContext, type ThemeContextValue } from './ThemeContext';

export function useTheme(): ThemeContextValue {
  const valor = useContext(ThemeContext);
  if (!valor) {
    throw new Error('useTheme precisa estar dentro de <ThemeProvider>.');
  }
  return valor;
}
