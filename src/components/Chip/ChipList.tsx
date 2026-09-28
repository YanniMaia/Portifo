// Lista de chips (DS-12; doc de design §7.7): `<ul role="list">` em flex com quebra de linha e
// 12 px entre os chips, na horizontal e na vertical. `gap="sm"` = 8 px (D), para chips pequenos.
// O `role="list"` explícito mantém a semântica de lista no Safari com `list-style: none`.
import type { ReactNode } from 'react';
import { DentroDeChipList } from './contexto';
import styles from './Chip.module.css';

export type ChipListGap = 'default' | 'sm';

export interface ChipListProps {
  gap?: ChipListGap;
  /** Nome acessível opcional da lista (ex.: nome da categoria). */
  'aria-label'?: string;
  className?: string;
  children: ReactNode;
}

export function ChipList({
  gap = 'default',
  'aria-label': rotulo,
  className,
  children,
}: ChipListProps) {
  const classes = [styles.list, gap === 'sm' && styles.listSm, className].filter(Boolean).join(' ');
  return (
    // eslint-disable-next-line jsx-a11y/no-redundant-roles -- Safari tira o papel de lista com list-style: none
    <ul role="list" className={classes} aria-label={rotulo}>
      <DentroDeChipList.Provider value>{children}</DentroDeChipList.Provider>
    </ul>
  );
}
