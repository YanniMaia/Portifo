// Marcação visual de placeholder (DS-21; doc de design §1 e §16; D11, D23; F-15).
// ÚNICO componente visual de placeholder do projeto: o C-01 usa este e não cria outro.
// A regra "é placeholder?" vem da API única `isPlaceholder` (F-15), sem cópia local.
//
// - Valor real (sem `[` e `]`)  → o texto puro, sem nenhum elemento em volta.
// - Placeholder `[…]` em dev    → texto com contorno tracejado (inline ou bloco).
// - Placeholder `[…]` em produção → `null` (nenhum nó no DOM; D11: o elemento some).
// - `''`, `null`, `undefined`   → `null` nos dois modos (não há texto para marcar;
//                                  mesma regra do `resolveOptional`).
import { SHOW_PLACEHOLDERS } from '@/lib/flags';
import { isPlaceholder } from '@/lib/placeholder';
import styles from './PlaceholderMark.module.css';

export type PlaceholderMarkKind = 'inline' | 'block';

export interface PlaceholderMarkProps {
  /** Texto vindo de `src/content` (real ou `[…]`, regra D23). */
  value: string | null | undefined;
  /** `inline` (padrão) para trechos de texto; `block` para áreas (ex.: print do projeto). */
  kind?: PlaceholderMarkKind;
  /** Classe extra aplicada só à marcação (ex.: proporção de uma área `block`). */
  className?: string;
}

export function PlaceholderMark({ value, kind = 'inline', className }: PlaceholderMarkProps) {
  if (value === undefined || value === null || value === '') return null;
  if (!isPlaceholder(value)) return <>{value}</>;
  if (!SHOW_PLACEHOLDERS) return null;

  const classes = [styles.mark, kind === 'block' ? styles.block : styles.inline, className]
    .filter(Boolean)
    .join(' ');
  const Tag = kind === 'block' ? 'div' : 'span';

  return (
    // O `title` é texto da ferramenta de desenvolvimento (DS-21, passo 1): este ramo só existe
    // com SHOW_PLACEHOLDERS (import.meta.env.DEV) e sai do bundle de produção. Por isso fica
    // fora de src/content (D5) de propósito.
    <Tag className={classes} data-placeholder={kind} title="placeholder — preencher">
      {value}
    </Tag>
  );
}
