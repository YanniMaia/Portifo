// Contexto do idioma (F-10). Fica separado do `LanguageProvider.tsx` e do `useLanguage.ts` por causa
// da regra `react-refresh/only-export-components` (mesma solução do `src/theme/ThemeContext.ts`).
import { createContext } from 'react';
import type { Dictionary, DictionaryKey, Lang } from './types';

/** Valor do atributo `<html lang>` para cada idioma (códigos BCP 47, não são texto de interface). */
export const HTML_LANG = { pt: 'pt-BR', en: 'en' } as const satisfies Record<Lang, string>;

export interface LanguageContextValue {
  /** Idioma em uso. */
  lang: Lang;
  /** Dicionário do idioma em uso. Leia por acesso tipado: `dict.nav.sobre`. */
  dict: Dictionary;
  /** Define o idioma: atualiza `<html lang>`, `document.title` e grava `ye-lang`. */
  setLang: (lang: Lang) => void;
  /** Troca PT ↔ EN (mesmos efeitos do `setLang`). */
  toggleLang: () => void;
  /** `true` se a chave está no registro `SUGERIDOS` (texto aguardando a Yanni). */
  isSugerido: (chave: DictionaryKey) => boolean;
}

export const LanguageContext = createContext<LanguageContextValue | null>(null);
