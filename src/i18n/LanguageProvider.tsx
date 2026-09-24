// Provedor do idioma (F-10, D6, doc de design §15 e §11).
// - Estado inicial: o `<html lang>` que o script inline do `index.html` (F-08) já aplicou a partir
//   de `ye-lang`. É a fonte única; o provedor não recalcula, então o primeiro render já sai no
//   idioma certo. PT é o padrão e o idioma do navegador não é seguido (§6).
// - Troca: `<html lang>` (`pt-BR`/`en`), `document.title` (`dict.meta.title`) e `ye-lang` (via
//   `writeStorage`). As escritas no DOM acontecem no próprio manipulador da troca.
// Só infraestrutura: os textos vêm de `src/content/pt.ts` e `src/content/en.ts`.
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { en } from '@/content/en';
import { pt } from '@/content/pt';
import { SUGERIDOS } from '@/content/sugeridos';
import { writeStorage } from '@/lib/storage';
import { LANG_STORAGE_KEY } from '@/theme/constants';
import { HTML_LANG, LanguageContext, type LanguageContextValue } from './LanguageContext';
import type { Dictionary, DictionaryKey, Lang } from './types';

const DICIONARIOS: Record<Lang, Dictionary> = { pt, en };

function lerIdiomaDoAtributo(): Lang {
  const atributo = document.documentElement.lang.toLowerCase();
  return atributo === 'en' || atributo.startsWith('en-') ? 'en' : 'pt';
}

function isSugerido(chave: DictionaryKey): boolean {
  return SUGERIDOS.includes(chave);
}

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [lang, setLangState] = useState<Lang>(lerIdiomaDoAtributo);
  const idiomaAtual = useRef<Lang>(lang);

  const setLang = useCallback((novo: Lang) => {
    document.documentElement.lang = HTML_LANG[novo];
    document.title = DICIONARIOS[novo].meta.title;
    writeStorage(LANG_STORAGE_KEY, novo);
    idiomaAtual.current = novo;
    setLangState(novo);
  }, []);

  const toggleLang = useCallback(() => {
    setLang(idiomaAtual.current === 'en' ? 'pt' : 'en');
  }, [setLang]);

  // Na montagem, o `<title>` do index.html está em PT; com `ye-lang=en`, alinha ao dicionário.
  // Só mexe no `document.title` (o `<html lang>` já veio certo do script da F-08).
  useEffect(() => {
    const titulo = DICIONARIOS[idiomaAtual.current].meta.title;
    if (document.title !== titulo) {
      document.title = titulo;
    }
  }, []);

  const valor = useMemo<LanguageContextValue>(
    () => ({ lang, dict: DICIONARIOS[lang], setLang, toggleLang, isSugerido }),
    [lang, setLang, toggleLang],
  );

  return <LanguageContext value={valor}>{children}</LanguageContext>;
}
