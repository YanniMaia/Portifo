// Provedor do tema (F-09, D7, doc de design §6).
// - Estado inicial: o `data-theme` que o script inline do `index.html` (F-08) já aplicou. É a fonte
//   única; o provedor não recalcula o tema de outro jeito, então o primeiro render já sai certo.
// - Troca: `data-theme`, `style.colorScheme`, meta `theme-color` e `ye-theme` (via `writeStorage`).
// - Transição: classe `theme-transition` no `<html>` por 300 ms, nunca com movimento reduzido.
//   É o único mecanismo de transição de tema (D14); o CSS dela é do DS-04.
// - Sem escolha manual, segue `prefers-color-scheme`; depois de uma escolha manual, para de seguir.
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { readStorage, writeStorage } from '@/lib/storage';
import { THEME_COLOR, THEME_STORAGE_KEY, type Theme } from './constants';
import {
  THEME_TRANSITION_CLASS,
  THEME_TRANSITION_MS,
  ThemeContext,
  type ThemeContextValue,
} from './ThemeContext';

const CONSULTA_ESCURO = '(prefers-color-scheme: dark)';
const CONSULTA_MOVIMENTO_REDUZIDO = '(prefers-reduced-motion: reduce)';

function lerTemaDoAtributo(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
}

function haEscolhaSalva(): boolean {
  const salvo = readStorage(THEME_STORAGE_KEY);
  return salvo === 'light' || salvo === 'dark';
}

function consultar(query: string): MediaQueryList | null {
  try {
    return typeof window.matchMedia === 'function' ? window.matchMedia(query) : null;
  } catch {
    return null;
  }
}

function aplicarNoDocumento(tema: Theme): void {
  const html = document.documentElement;
  html.dataset.theme = tema;
  html.style.colorScheme = tema;
  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!meta) {
    // O index.html (F-08) sempre tem a meta; isto só cobre ambientes sem ela (ex.: testes).
    meta = document.createElement('meta');
    meta.name = 'theme-color';
    document.head.appendChild(meta);
  }
  meta.content = THEME_COLOR[tema];
}

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(lerTemaDoAtributo);
  const [isUserChoice, setIsUserChoice] = useState<boolean>(haEscolhaSalva);
  const temaAtual = useRef<Theme>(theme);
  const timerTransicao = useRef<number | undefined>(undefined);

  const trocar = useCallback((tema: Theme) => {
    const html = document.documentElement;
    if (consultar(CONSULTA_MOVIMENTO_REDUZIDO)?.matches !== true) {
      window.clearTimeout(timerTransicao.current);
      html.classList.add(THEME_TRANSITION_CLASS);
      timerTransicao.current = window.setTimeout(() => {
        html.classList.remove(THEME_TRANSITION_CLASS);
        timerTransicao.current = undefined;
      }, THEME_TRANSITION_MS);
    }
    aplicarNoDocumento(tema);
    temaAtual.current = tema;
    setThemeState(tema);
  }, []);

  const setTheme = useCallback(
    (tema: Theme) => {
      writeStorage(THEME_STORAGE_KEY, tema);
      setIsUserChoice(true);
      if (tema !== temaAtual.current) {
        trocar(tema);
      }
    },
    [trocar],
  );

  const toggleTheme = useCallback(() => {
    setTheme(temaAtual.current === 'dark' ? 'light' : 'dark');
  }, [setTheme]);

  // Segue o sistema só enquanto não houver escolha manual (doc §6 "Memória").
  useEffect(() => {
    if (isUserChoice) return;
    const mql = consultar(CONSULTA_ESCURO);
    if (!mql) return;
    const aoMudar = (evento: MediaQueryListEvent) => {
      const tema: Theme = evento.matches ? 'dark' : 'light';
      if (tema !== temaAtual.current) {
        trocar(tema);
      }
    };
    mql.addEventListener('change', aoMudar);
    return () => {
      mql.removeEventListener('change', aoMudar);
    };
  }, [isUserChoice, trocar]);

  // Ao desmontar, não deixa a classe de transição presa no <html>.
  useEffect(() => {
    return () => {
      if (timerTransicao.current !== undefined) {
        window.clearTimeout(timerTransicao.current);
        timerTransicao.current = undefined;
        document.documentElement.classList.remove(THEME_TRANSITION_CLASS);
      }
    };
  }, []);

  const valor = useMemo<ThemeContextValue>(
    () => ({ theme, toggleTheme, setTheme, isUserChoice }),
    [theme, toggleTheme, setTheme, isUserChoice],
  );

  return <ThemeContext value={valor}>{children}</ThemeContext>;
}
