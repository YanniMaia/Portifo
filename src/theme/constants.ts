// Constantes de tema e idioma (F-08). O script inline do `index.html` repete estes valores
// (ele roda antes do bundle); o teste `tests/unit/theme/theme-script.test.ts` garante que batem.

/** Chave do `localStorage` com a escolha manual de tema (`'light'` | `'dark'`). */
export const THEME_STORAGE_KEY = 'ye-theme';

/** Chave do `localStorage` com a escolha de idioma (`'pt'` | `'en'`). */
export const LANG_STORAGE_KEY = 'ye-lang';

export type Theme = 'light' | 'dark';

/** Cor da barra do navegador (`meta[name="theme-color"]`), doc de design §6. */
export const THEME_COLOR = { light: '#FFF7FA', dark: '#150A10' } as const satisfies Record<
  Theme,
  string
>;

/** Fundo da página antes do CSS carregar (`<style>` crítico do `index.html`), §3.2/§3.3. */
export const PAGE_BG = { light: '#FFFFFF', dark: '#150A10' } as const satisfies Record<
  Theme,
  string
>;
