// Cabeçalho de seção: eyebrow + H2 + subtítulo (DS-14; doc de design §4, §5, §7.6–§7.11, §11;
// F-13; D13).
//
// - Sem texto fixo (D5): `eyebrow`, `title` e `subtitle` chegam por props, vindos do dicionário.
// - `eyebrowTone` é repassado ao `Eyebrow` (DS-09): `tint` sobre fundo #FFEEF4 (D13, DV-16).
// - `<h2 id tabIndex={-1}>`: o `id` serve ao `aria-labelledby` da `Section` (DS-10), e o
//   `tabIndex={-1}` deixa o `scrollToSection` (F-13) mover o foco para o título. O foco programático
//   não mostra contorno (`:focus`); o `:focus-visible` mantém o contorno padrão de 3 px.
// - Espaços: eyebrow → H2 12 px (D), H2 → subtítulo 16 px (D) (R-DS-11) e bloco → conteúdo
//   `--section-head-gap` (56/48/40 px, §5).
// - `align="center"` para a Frase (§7.4) e o Contato (§7.11).
// - Sem `subtitle`, nenhum `<p>` vazio.
// - Não é interativo (o H2 só recebe foco programático): sem hover, ativo nem alvo de toque.
import { Eyebrow, type EyebrowTone } from '@/components/Eyebrow';
import styles from './SectionHeader.module.css';

export type SectionHeaderAlign = 'left' | 'center';

export interface SectionHeaderProps {
  eyebrow: string;
  /** Repassado ao `Eyebrow`: `tint` sobre #FFEEF4 (D13). */
  eyebrowTone?: EyebrowTone;
  title: string;
  subtitle?: string;
  /** Id do `<h2>`, usado pelo `aria-labelledby` da `Section`. */
  id: string;
  align?: SectionHeaderAlign;
  /** Classe extra do consumidor, colocada no fim. */
  className?: string;
}

export function SectionHeader({
  eyebrow,
  eyebrowTone = 'default',
  title,
  subtitle,
  id,
  align = 'left',
  className,
}: SectionHeaderProps) {
  const classes = [styles.header, align === 'center' && styles.center, className]
    .filter(Boolean)
    .join(' ');
  return (
    <header className={classes} data-align={align}>
      <Eyebrow tone={eyebrowTone}>{eyebrow}</Eyebrow>
      <h2 id={id} tabIndex={-1} className={`t-h2 ${styles.title}`}>
        {title}
      </h2>
      {subtitle ? <p className={`t-body ${styles.subtitle}`}>{subtitle}</p> : null}
    </header>
  );
}
