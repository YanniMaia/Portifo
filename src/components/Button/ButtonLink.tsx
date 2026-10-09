// Link com visual de botão (DS-11; doc de design §7.2, §7.8, §7.11, §11; D11).
//
// - "Sem link, sem botão" (D11, §7.8): `href` indefinido, vazio ou placeholder (`isPlaceholder`,
//   F-15: qualquer string com `[` e `]`) → `null`, nada no DOM.
// - `external`: `target="_blank"`, `rel="noopener noreferrer"` e o aviso visualmente oculto
//   " (abre em nova aba)" / " (opens in a new tab)" (`dict.a11y.opensInNewTab`, §11).
// - `href` com `#`: navegação nativa; o offset de 80 px é o `scroll-padding-top` da F-13.
// - Links nunca ficam "desabilitados": sem destino, são removidos.
// - Sem texto fixo (D5): o rótulo chega por `children`.
import type { MouseEvent } from 'react';
import { useLanguage } from '@/i18n/useLanguage';
import { isPlaceholder } from '@/lib/placeholder';
import { classesDoBotao, type ButtonBaseProps } from './classes';
import { ConteudoDoBotao } from './ConteudoDoBotao';

export interface ButtonLinkProps extends ButtonBaseProps {
  href?: string;
  /** Abre em nova aba, com o aviso para leitores de tela. */
  external?: boolean;
  onClick?: (evento: MouseEvent<HTMLAnchorElement>) => void;
}

export function ButtonLink({
  href,
  external = false,
  variant,
  size = 'default',
  iconLeft,
  arrow = false,
  fullWidthOnMobile = false,
  onClick,
  className,
  'aria-label': ariaLabel,
  'data-state': estado,
  children,
}: ButtonLinkProps) {
  const { dict } = useLanguage();
  if (href === undefined || isPlaceholder(href)) return null;
  const novaAba = external ? ({ target: '_blank', rel: 'noopener noreferrer' } as const) : {};
  const aviso = external ? `(${dict.a11y.opensInNewTab})` : undefined;
  // Com `aria-label`, o aviso de nova aba entra no próprio rótulo (o `aria-label` esconde o miolo).
  const rotulo = ariaLabel && aviso ? `${ariaLabel} ${aviso}` : ariaLabel;
  return (
    <a
      href={href}
      className={classesDoBotao({ variant, size, fullWidthOnMobile, className })}
      data-variant={variant}
      data-size={size}
      data-state={estado}
      aria-label={rotulo}
      onClick={onClick}
      {...novaAba}
    >
      <ConteudoDoBotao iconLeft={iconLeft} arrow={arrow} avisoOculto={aviso}>
        {children}
      </ConteudoDoBotao>
    </a>
  );
}
