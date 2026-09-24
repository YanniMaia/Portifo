// Hook do idioma (F-10). API: `{ lang, dict, setLang, toggleLang, isSugerido }`.
import { useContext } from 'react';
import { LanguageContext, type LanguageContextValue } from './LanguageContext';

export function useLanguage(): LanguageContextValue {
  const valor = useContext(LanguageContext);
  if (!valor) {
    throw new Error('useLanguage precisa estar dentro de <LanguageProvider>.');
  }
  return valor;
}
