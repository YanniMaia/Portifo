// API ÚNICA de placeholder do projeto (F-15, D11, D23). O componente visual é o
// `PlaceholderMark` (DS-21); não existe `Pendente<T>` nem outro `placeholder.ts`.
import { SHOW_PLACEHOLDERS } from '@/lib/flags';

/**
 * `true` quando o valor ainda não existe: `undefined`, `null`, string vazia ou
 * string que CONTÉM `[` e `]` em qualquer posição (D23, mesma regra do C-06).
 * Ex.: `'[ano]'` e `'https://github.com/YanniMaia/[repositório]'` (PH-02).
 */
export function isPlaceholder(v: string | null | undefined): boolean {
  if (v === undefined || v === null || v === '') return true;
  return v.includes('[') && v.includes(']');
}

/**
 * Valor pronto para exibir.
 * - Valor real → o próprio valor.
 * - Placeholder `[…]` → em dev, o próprio texto (para o `PlaceholderMark` marcar);
 *   em produção, `undefined` (o elemento deve ser ocultado, D11).
 * - `undefined`, `null` ou `''` → sempre `undefined` (não há texto para mostrar).
 */
export function resolveOptional(v: string | null | undefined): string | undefined {
  if (v === undefined || v === null || v === '') return undefined;
  if (!isPlaceholder(v)) return v;
  return SHOW_PLACEHOLDERS ? v : undefined;
}
