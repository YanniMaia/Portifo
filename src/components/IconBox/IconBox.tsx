// Caixa de ícone de 56 px (DS-16; doc de design §5, §7.6, §7.10, §9).
//
// - Repouso: 56 × 56 px, raio 16 px, fundo `--color-fill-soft`, ícone `--color-accent`.
// - Ativo (`active`, ou dentro de um `Card interactive` em hover / `focus-within` / `data-state`
//   forçado): camada `::before` com o degradê (`--gradient-brand` no claro, `--gradient-primary` no
//   escuro) vai de opacidade 0 a 1, e o ícone passa a `--color-on-primary`, em 250 ms. O degradê
//   entra por opacidade porque `background-image` não interpola.
// - O ícone é decorativo por padrão; `label` é repassado ao `Icon` quando ele carrega sentido.
// - Não é interativo por si: sem foco, clique nem alvo de toque.
import type { LucideIcon } from 'lucide-react';
import { Icon } from '@/components/Icon';
import styles from './IconBox.module.css';

export type IconBoxIconSize = 24 | 28;

export interface IconBoxProps {
  icon: LucideIcon;
  /** 28 px nos cards de interesse (padrão, §7.6); 24 px onde o doc pede o tamanho base. */
  iconSize?: IconBoxIconSize;
  /** Força o estado com degradê. */
  active?: boolean;
  /** Nome acessível do ícone. Sem ele, o ícone é decorativo. */
  label?: string;
  /** Classe extra do consumidor, colocada no fim. */
  className?: string;
}

export function IconBox({ icon, iconSize = 28, active = false, label, className }: IconBoxProps) {
  const classes = [styles.box, active && styles.active, className].filter(Boolean).join(' ');
  return (
    <span className={classes} data-active={active ? 'true' : undefined}>
      <Icon icon={icon} size={iconSize} label={label} className={styles.icon} />
    </span>
  );
}
