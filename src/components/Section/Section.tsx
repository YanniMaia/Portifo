// Seção âncora com fundo alternado (DS-10; doc de design §2, §5, §7.4, §10; DV-10).
//
// - `id: SectionId`: só aceita ids do registro único da F-12 (`src/content/sections.ts`). Um id fora
//   do registro não compila, e este arquivo não tem nenhuma lista de ids escrita à mão.
// - `tone`: `base` (--color-bg), `alt` (--color-bg-alt) ou `tint` (--color-bg-tint, #FFEEF4 /
//   #1C0E16 pelo DV-10). O padrão é o `tone` do registro para aquele `id`.
// - `padding`: `default` → `--section-py` (112/88/64 px); `motto` → `--section-py-motto` (96/88/64 px,
//   R-DS-16), usado pela Frase de destaque (S-06).
// - O fundo ocupa a largura da janela; o conteúdo é limitado pelo `Container`, que o consumidor
//   coloca dentro.
// - Sem `scroll-margin-top`: o deslocamento de 80 px da rolagem é só do `scroll-padding-top` da
//   F-13 (D14).
import type { ReactNode } from 'react';
import { SECTIONS, type SectionId, type SectionTone } from '@/content/sections';
import styles from './Section.module.css';

export type SectionPadding = 'default' | 'motto';

export interface SectionProps {
  id: SectionId;
  tone?: SectionTone;
  /** Id do título (H2) que nomeia a seção (`aria-labelledby`). */
  labelledBy?: string;
  /**
   * Nome acessível direto (`aria-label`), só para seção sem título visível (a Faixa de destaques,
   * S-05/AMB-S-13). O texto vem do dicionário. Com `labelledBy`, este é ignorado.
   */
  label?: string;
  padding?: SectionPadding;
  /** Classe extra do consumidor, colocada no fim. */
  className?: string;
  children?: ReactNode;
}

const TOM_POR_ID = new Map<SectionId, SectionTone>(SECTIONS.map((s) => [s.id, s.tone]));

/** Tom de fundo do registro (F-12) para a seção `id`. */
function toneOf(id: SectionId): SectionTone {
  return TOM_POR_ID.get(id) ?? 'base';
}

export function Section({
  id,
  tone,
  labelledBy,
  label,
  padding = 'default',
  className,
  children,
}: SectionProps) {
  const tom = tone ?? toneOf(id);
  const classes = [styles.section, styles[tom], padding === 'motto' && styles.motto, className]
    .filter(Boolean)
    .join(' ');
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      aria-label={labelledBy ? undefined : label}
      className={classes}
      data-tone={tom}
    >
      {children}
    </section>
  );
}
