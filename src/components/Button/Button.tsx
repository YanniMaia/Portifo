// Botão de ação (DS-11; doc de design §3.4, §4, §5, §7.2, §7.5, §7.11, §9, §14; DV-1; D13).
//
// - `<button type="button">`: Enter e Espaço ativam pelo comportamento nativo.
// - Variantes `primary`, `secondary` e `text`; tamanhos `default` (52/52/48 px) e `compact` (44 px).
// - `disabled` (D): `aria-disabled="true"`, opacidade 0,5, sem hover nem lift, e o clique é ignorado.
//   O botão continua focável (uso previsto: "Copiar" enquanto copia, sem o foco sumir).
// - Sem texto fixo (D5): o rótulo chega por `children`.
import type { MouseEvent } from 'react';
import { classesDoBotao, type ButtonBaseProps } from './classes';
import { ConteudoDoBotao } from './ConteudoDoBotao';

export interface ButtonProps extends ButtonBaseProps {
  onClick?: (evento: MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
}

export function Button({
  variant,
  size = 'default',
  iconLeft,
  arrow = false,
  fullWidthOnMobile = false,
  disabled = false,
  onClick,
  className,
  'aria-label': ariaLabel,
  'data-state': estado,
  children,
}: ButtonProps) {
  const aoClicar = (evento: MouseEvent<HTMLButtonElement>) => {
    if (disabled) {
      evento.preventDefault();
      return;
    }
    onClick?.(evento);
  };
  return (
    <button
      type="button"
      className={classesDoBotao({ variant, size, fullWidthOnMobile, className })}
      data-variant={variant}
      data-size={size}
      data-state={estado}
      aria-disabled={disabled ? true : undefined}
      aria-label={ariaLabel}
      onClick={aoClicar}
    >
      <ConteudoDoBotao iconLeft={iconLeft} arrow={arrow}>
        {children}
      </ConteudoDoBotao>
    </button>
  );
}
