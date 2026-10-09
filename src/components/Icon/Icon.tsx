// Ícone de linha (DS-06; doc de design §5, §6, §7.2, §7.11, §11; D3; DV-15).
// Único caminho para ícones no projeto: sempre `lucide-react`, traço de 1,75 px e `currentColor`.
//
// - `size`: 20 (tema, botões de contato), 24 (padrão), 28 (cards de interesse) ou 32 (cartões
//   flutuantes do hero). Marcas-d'água de 120–200 px (§8) NÃO usam este componente (doc 04).
// - Traço: `strokeWidth={1.75}` + `absoluteStrokeWidth`. O lucide recalcula o atributo para o
//   traço ficar 1,75 px na tela em qualquer tamanho (em 28 px o atributo vale 1,75 × 24 / 28 = 1,5).
//   É o mesmo valor do token `--icon-stroke` (shape.css); o atributo SVG não aceita `var()`.
// - Sem `label`: decorativo, `aria-hidden="true"` e `focusable="false"` (§11).
//   Com `label`: `role="img"` e `aria-label` (o texto vem do dicionário, D5).
import type { LucideIcon } from 'lucide-react';

export type IconSize = 20 | 24 | 28 | 32;

/** Traço dos ícones de linha em px na tela (§5, D3). Igual ao token `--icon-stroke`. */
export const ICON_STROKE = 1.75;

export interface IconProps {
  /** Componente do `lucide-react` (ou criado com `createLucideIcon`, ver `marcas.ts`). */
  icon: LucideIcon;
  /** Tamanho em px (padrão 24). */
  size?: IconSize;
  /** Nome acessível. Sem ele, o ícone é decorativo. */
  label?: string;
  /** Classe extra do consumidor. */
  className?: string;
}

export function Icon({ icon: Svg, size = 24, label, className }: IconProps) {
  const a11y = label
    ? ({ role: 'img', 'aria-label': label } as const)
    : ({ 'aria-hidden': true, focusable: 'false' } as const);
  return (
    <Svg
      size={size}
      strokeWidth={ICON_STROKE}
      // `absoluteStrokeWidth` está marcado como obsoleto no lucide-react 1.x (em favor de
      // `nonScalingStroke`), mas é o que o DS-06 pede e mantém o atributo proporcional ao tamanho.
      absoluteStrokeWidth
      color="currentColor"
      className={className}
      data-icon-size={size}
      {...a11y}
    />
  );
}
