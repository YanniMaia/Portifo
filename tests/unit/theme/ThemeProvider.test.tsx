// Testes do ThemeProvider e do useTheme (F-09). O Q-02 estende (hook + botão do DS-19).
import { act, render, renderHook } from '@testing-library/react';
import { StrictMode, type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { THEME_COLOR, THEME_STORAGE_KEY, type Theme } from '@/theme/constants';
import { THEME_TRANSITION_CLASS, THEME_TRANSITION_MS } from '@/theme/ThemeContext';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { useTheme } from '@/theme/useTheme';

// --- matchMedia controlável (o mock do setup não casa nada e não dispara eventos) ---------------
type Ouvinte = (evento: MediaQueryListEvent) => void;

interface MidiaFalsa {
  escuro: boolean;
  movimentoReduzido: boolean;
  ouvintes: Map<string, Set<Ouvinte>>;
}

const midia: MidiaFalsa = { escuro: false, movimentoReduzido: false, ouvintes: new Map() };
const descritorOriginal = Object.getOwnPropertyDescriptor(window, 'matchMedia');

function casa(query: string): boolean {
  if (query.includes('prefers-color-scheme: dark')) return midia.escuro;
  if (query.includes('prefers-reduced-motion: reduce')) return midia.movimentoReduzido;
  return false;
}

function matchMediaFalso(query: string): MediaQueryList {
  const ouvintesDaQuery = midia.ouvintes.get(query) ?? new Set<Ouvinte>();
  midia.ouvintes.set(query, ouvintesDaQuery);
  return {
    get matches() {
      return casa(query);
    },
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: (_tipo: string, ouvinte: Ouvinte) => {
      ouvintesDaQuery.add(ouvinte);
    },
    removeEventListener: (_tipo: string, ouvinte: Ouvinte) => {
      ouvintesDaQuery.delete(ouvinte);
    },
    dispatchEvent: () => false,
  } as unknown as MediaQueryList;
}

/** Simula o aparelho trocando entre claro e escuro. */
function mudarSistema(escuro: boolean): void {
  midia.escuro = escuro;
  const query = '(prefers-color-scheme: dark)';
  for (const ouvinte of midia.ouvintes.get(query) ?? []) {
    ouvinte({ matches: escuro, media: query } as MediaQueryListEvent);
  }
}

function ouvintesDoSistema(): number {
  return midia.ouvintes.get('(prefers-color-scheme: dark)')?.size ?? 0;
}

// --- helpers -----------------------------------------------------------------------------------
const html = document.documentElement;

function metaThemeColor(): string | null {
  return document.querySelector('meta[name="theme-color"]')?.getAttribute('content') ?? null;
}

/** Faz o papel do script inline da F-08: aplica o atributo e a meta antes do React. */
function prepararDocumento(tema: Theme): void {
  html.setAttribute('data-theme', tema);
  const meta = document.createElement('meta');
  meta.name = 'theme-color';
  meta.content = THEME_COLOR[tema];
  document.head.appendChild(meta);
}

function wrapper({ children }: { children: ReactNode }) {
  return (
    <StrictMode>
      <ThemeProvider>{children}</ThemeProvider>
    </StrictMode>
  );
}

function montar() {
  return renderHook(() => useTheme(), { wrapper });
}

beforeEach(() => {
  midia.escuro = false;
  midia.movimentoReduzido = false;
  midia.ouvintes = new Map();
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: matchMediaFalso,
  });
  window.localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  if (descritorOriginal) Object.defineProperty(window, 'matchMedia', descritorOriginal);
  html.removeAttribute('data-theme');
  html.removeAttribute('style');
  html.removeAttribute('class');
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.remove());
  window.localStorage.clear();
});

describe('ThemeProvider / useTheme: estado inicial', () => {
  it.each<Theme>(['light', 'dark'])(
    'o primeiro render já usa o data-theme aplicado pelo script (%s)',
    (tema) => {
      prepararDocumento(tema);
      // O aparelho diz o contrário: o provedor não pode recalcular por conta própria.
      midia.escuro = tema === 'light';
      const vistos: Theme[] = [];
      function Espiao() {
        vistos.push(useTheme().theme);
        return null;
      }
      render(
        <ThemeProvider>
          <Espiao />
        </ThemeProvider>,
      );
      expect(vistos[0]).toBe(html.dataset.theme);
      expect(new Set(vistos)).toEqual(new Set([tema]));
      expect(html.classList.contains(THEME_TRANSITION_CLASS)).toBe(false);
    },
  );

  it.each<Theme>(['light', 'dark'])(
    'aplica style.colorScheme na montagem, sem troca, mesmo com o sistema no oposto (%s)',
    (tema) => {
      // Cenário do achado V-04 #1: escolha salva vence o aparelho no modo contrário.
      window.localStorage.setItem(THEME_STORAGE_KEY, tema);
      midia.escuro = tema === 'light';
      prepararDocumento(tema);
      expect(html.style.colorScheme).toBe('');

      const { result } = montar();
      expect(result.current.theme).toBe(tema);
      expect(html.style.colorScheme).toBe(tema);
      expect(html.classList.contains(THEME_TRANSITION_CLASS)).toBe(false);
    },
  );

  it('sem escolha salva, isUserChoice é false; com escolha salva, é true', () => {
    prepararDocumento('light');
    expect(montar().result.current.isUserChoice).toBe(false);

    window.localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    html.setAttribute('data-theme', 'dark');
    const { result } = montar();
    expect(result.current.isUserChoice).toBe(true);
    expect(result.current.theme).toBe('dark');
  });

  it('valor inválido salvo não conta como escolha manual', () => {
    prepararDocumento('light');
    window.localStorage.setItem(THEME_STORAGE_KEY, 'roxo');
    expect(montar().result.current.isUserChoice).toBe(false);
  });

  it('useTheme fora do provedor lança erro claro', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => renderHook(() => useTheme())).toThrow(/ThemeProvider/);
  });
});

describe('ThemeProvider / useTheme: troca manual', () => {
  it('toggleTheme alterna light → dark → light e o ye-theme acompanha', () => {
    prepararDocumento('light');
    const { result } = montar();

    act(() => result.current.toggleTheme());
    expect(result.current.theme).toBe('dark');
    expect(html.dataset.theme).toBe('dark');
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(result.current.isUserChoice).toBe(true);

    act(() => result.current.toggleTheme());
    expect(result.current.theme).toBe('light');
    expect(html.dataset.theme).toBe('light');
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
  });

  it('meta theme-color e color-scheme seguem o tema (#150A10 no escuro, #FFF7FA no claro)', () => {
    prepararDocumento('light');
    const { result } = montar();

    act(() => result.current.toggleTheme());
    expect(metaThemeColor()).toBe('#150A10');
    expect(html.style.colorScheme).toBe('dark');

    act(() => result.current.toggleTheme());
    expect(metaThemeColor()).toBe('#FFF7FA');
    expect(html.style.colorScheme).toBe('light');
    expect(document.querySelectorAll('meta[name="theme-color"]')).toHaveLength(1);
  });

  it('setTheme define o tema direto e grava a escolha', () => {
    prepararDocumento('light');
    const { result } = montar();

    act(() => result.current.setTheme('dark'));
    expect(html.dataset.theme).toBe('dark');
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');

    // Repetir o mesmo tema não troca nada, mas continua sendo escolha manual.
    act(() => result.current.setTheme('dark'));
    expect(result.current.theme).toBe('dark');
    expect(result.current.isUserChoice).toBe(true);
  });

  it('com storage indisponível, troca o tema sem lançar erro', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('bloqueado', 'SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('bloqueado', 'SecurityError');
    });
    prepararDocumento('light');
    const { result } = montar();
    expect(result.current.isUserChoice).toBe(false);

    expect(() => act(() => result.current.toggleTheme())).not.toThrow();
    expect(result.current.theme).toBe('dark');
    expect(html.dataset.theme).toBe('dark');
    expect(metaThemeColor()).toBe('#150A10');
    // Na visita atual a escolha vale: o sistema não passa por cima dela.
    expect(result.current.isUserChoice).toBe(true);
    act(() => mudarSistema(false));
    expect(result.current.theme).toBe('dark');
  });
});

describe('ThemeProvider / useTheme: transição de 300 ms', () => {
  it('a classe theme-transition fica no <html> por 300 ms após o toggle e depois some', () => {
    vi.useFakeTimers();
    prepararDocumento('light');
    const { result } = montar();

    act(() => result.current.toggleTheme());
    expect(html.classList.contains(THEME_TRANSITION_CLASS)).toBe(true);
    expect(THEME_TRANSITION_MS).toBe(300);

    act(() => {
      vi.advanceTimersByTime(THEME_TRANSITION_MS - 1);
    });
    expect(html.classList.contains(THEME_TRANSITION_CLASS)).toBe(true);
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(html.classList.contains(THEME_TRANSITION_CLASS)).toBe(false);
  });

  it('dois toggles seguidos reiniciam a contagem (a classe não sai no meio da segunda troca)', () => {
    vi.useFakeTimers();
    prepararDocumento('light');
    const { result } = montar();

    act(() => result.current.toggleTheme());
    act(() => {
      vi.advanceTimersByTime(200);
    });
    act(() => result.current.toggleTheme());
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(html.classList.contains(THEME_TRANSITION_CLASS)).toBe(true);
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(html.classList.contains(THEME_TRANSITION_CLASS)).toBe(false);
  });

  it('com prefers-reduced-motion: reduce, a classe nunca aparece', () => {
    vi.useFakeTimers();
    midia.movimentoReduzido = true;
    prepararDocumento('light');
    const { result } = montar();
    const observador = new MutationObserver(() => undefined);
    observador.observe(html, { attributes: true, attributeFilter: ['class'] });

    act(() => result.current.toggleTheme());
    act(() => {
      vi.advanceTimersByTime(THEME_TRANSITION_MS * 2);
    });
    const mudancasDeClasse = observador.takeRecords();
    observador.disconnect();

    expect(html.dataset.theme).toBe('dark');
    expect(mudancasDeClasse).toHaveLength(0);
    expect(html.classList.contains(THEME_TRANSITION_CLASS)).toBe(false);
  });

  it('desmontar no meio da transição não deixa a classe presa', () => {
    vi.useFakeTimers();
    prepararDocumento('light');
    const { result, unmount } = montar();
    act(() => result.current.toggleTheme());
    unmount();
    expect(html.classList.contains(THEME_TRANSITION_CLASS)).toBe(false);
  });
});

describe('ThemeProvider / useTheme: preferência do sistema', () => {
  it('sem escolha manual, segue a mudança do matchMedia (sem gravar ye-theme)', () => {
    vi.useFakeTimers();
    prepararDocumento('light');
    const { result } = montar();

    act(() => mudarSistema(true));
    expect(result.current.theme).toBe('dark');
    expect(html.dataset.theme).toBe('dark');
    expect(metaThemeColor()).toBe('#150A10');
    expect(html.classList.contains(THEME_TRANSITION_CLASS)).toBe(true);
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
    expect(result.current.isUserChoice).toBe(false);

    act(() => mudarSistema(false));
    expect(result.current.theme).toBe('light');
    expect(metaThemeColor()).toBe('#FFF7FA');
  });

  it('depois de uma escolha manual, para de seguir o sistema', () => {
    prepararDocumento('light');
    const { result } = montar();
    expect(ouvintesDoSistema()).toBe(1);

    act(() => result.current.setTheme('light'));
    expect(ouvintesDoSistema()).toBe(0);
    act(() => mudarSistema(true));
    expect(result.current.theme).toBe('light');
    expect(html.dataset.theme).toBe('light');
  });

  it('com escolha salva de visita anterior, não segue o sistema', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'light');
    prepararDocumento('light');
    const { result } = montar();

    expect(ouvintesDoSistema()).toBe(0);
    act(() => mudarSistema(true));
    expect(result.current.theme).toBe('light');
  });

  it('sem matchMedia no ambiente, monta e troca sem erro', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: undefined,
    });
    prepararDocumento('dark');
    const { result } = montar();
    act(() => result.current.toggleTheme());
    expect(html.dataset.theme).toBe('light');
  });
});
