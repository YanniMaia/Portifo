// Tipos da i18n (F-10, D6, doc 05 §4.1). Só infraestrutura: nenhum texto de interface aqui.
// `src/content/pt.ts` é a fonte das chaves; `Dictionary` é a versão "alargada" de `typeof pt`.
import type { pt } from '@/content/pt';
import type { Locale } from '@/content/types';

/** Idioma do site (D6): `'pt' | 'en'`, PT é o padrão. Alias do `Locale` da F-11 (fonte única). */
export type Lang = Locale;

/**
 * Função de interpolação do dicionário, ex. `(n: number) => ...`. Sempre devolve `string`.
 * Os parâmetros são `never[]` para aceitar qualquer assinatura na checagem de forma.
 */
export type DictionaryFn = (...args: never[]) => string;

/** Valor folha permitido: string, lista de strings ou função que devolve string (doc 05 §4.1). */
export type DictionaryLeaf = string | readonly string[] | DictionaryFn;

/**
 * Forma de um grupo do dicionário. Um objeto de metadado como `{ texto, sugerido: true }` não
 * encaixa (booleano não é folha permitida): o `satisfies DictionaryShape` de `pt.ts` acusa erro.
 * O registro de "sugerido" é `src/content/sugeridos.ts` (R7), nunca um campo dentro do dicionário.
 */
export interface DictionaryShape {
  readonly [chave: string]: DictionaryLeaf | DictionaryShape;
}

/** Alarga literais para `string`, mantém funções (com retorno `string`) e percorre os grupos. */
export type Widen<T> = T extends string
  ? string
  : T extends (...args: infer A) => string
    ? (...args: A) => string
    : T extends readonly string[]
      ? readonly string[]
      : T extends object
        ? { readonly [K in keyof T]: Widen<T[K]> }
        : never;

/** Tipo de todo dicionário (`pt`, `en`). Faltar ou sobrar chave em `en.ts` é erro de compilação. */
export type Dictionary = Widen<typeof pt>;

/** União dos caminhos até as folhas, ex. `'nav.sobre' | 'a11y.skipToContent' | ...`. */
export type KeyPath<T> = {
  [K in keyof T & string]: T[K] extends DictionaryLeaf ? K : `${K}.${KeyPath<T[K]>}`;
}[keyof T & string];

/** Chave de texto do dicionário do site. */
export type DictionaryKey = KeyPath<Dictionary>;
