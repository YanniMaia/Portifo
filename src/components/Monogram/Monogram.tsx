// Monograma "YE" (DS-18; doc de design §7.1, §7.2, §7.12, §11; R-DS-4; R-DS-7).
//
// - `size="sm"`: quadrado 36 × 36 px, raio 12 px, letras 14 px/800 (cabeçalho e rodapé).
//   `size="lg"`: círculo de 120 px, letras 44 px/800 (hero).
// - Fundo `--gradient-brand` (#E0518A → #A82560) e letras `--color-on-brand` (#FFFFFF), iguais
//   nos dois temas (marca, R-DS-4).
// - `initials` vem de `site.iniciais` (F-11); o componente não tem texto próprio (D5).
// - `as="span"` (padrão): decorativo, `aria-hidden`, ao lado do nome visível "Yanni Elyssa".
//   `as="button"`: exige `label` (nome acessível) e aceita `onClick`; o `sm` ganha área de toque de
//   44 × 44 px por uma camada invisível. Na V1 o monograma não é clicável (doc 09: sem a explosão
//   do A-18); o modo botão fica pronto para a V2.
// - Halo, bits e cadeados do hero são do doc 04, não daqui.
import type { MouseEventHandler } from 'react';
import styles from './Monogram.module.css';

export type MonogramSize = 'sm' | 'lg';

interface Comum {
  size: MonogramSize;
  /** Iniciais (de `site.iniciais`). */
  initials: string;
  /** Classe extra do consumidor, colocada no fim. */
  className?: string;
}

export interface MonogramSpanProps extends Comum {
  as?: 'span';
  label?: never;
  onClick?: never;
}

export interface MonogramButtonProps extends Comum {
  as: 'button';
  /** Nome acessível do botão (obrigatório). */
  label: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
}

export type MonogramProps = MonogramSpanProps | MonogramButtonProps;

export function Monogram(props: MonogramProps) {
  const { size, initials, className } = props;
  const classes = [styles.monogram, styles[size], className].filter(Boolean).join(' ');

  if (props.as === 'button') {
    return (
      <button
        type="button"
        className={`${classes} ${styles.button}`}
        aria-label={props.label}
        onClick={props.onClick}
        data-size={size}
      >
        <span aria-hidden="true">{initials}</span>
      </button>
    );
  }

  return (
    <span className={classes} aria-hidden="true" data-size={size}>
      {initials}
    </span>
  );
}
