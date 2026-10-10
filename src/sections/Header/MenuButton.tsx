// Botão hambúrguer do menu do celular e do tablet (S-02; doc de design §7.1, §10, §11).
//
// - 44 × 44 px, três linhas de 20 × 2 px que viram um X com `data-open="true"` (gancho do doc 04
//   §4.4, lido pelo A-07). A troca aqui é imediata; a transição de 250 ms é do A-07.
// - `aria-expanded`, `aria-controls` (id do painel) e `aria-label` "Abrir menu" / "Fechar menu"
//   (`menu.abrir` / `menu.fechar`, C-02). As linhas são decorativas (`aria-hidden`).
// - Sem texto fixo (D5). O estado mora no `Header`; este componente só desenha e avisa o clique.
import type { Ref } from 'react';
import { useLanguage } from '@/i18n/useLanguage';
import styles from './MenuButton.module.css';

export interface MenuButtonProps {
  /** Menu aberto: o botão vira X e o rótulo passa a "Fechar menu". */
  aberto: boolean;
  /** Id do painel controlado (`aria-controls`). */
  controla: string;
  onClick: () => void;
  ref?: Ref<HTMLButtonElement>;
}

export function MenuButton({ aberto, controla, onClick, ref }: MenuButtonProps) {
  const { dict } = useLanguage();
  return (
    <button
      ref={ref}
      type="button"
      className={styles.botao}
      aria-expanded={aberto}
      aria-controls={controla}
      aria-label={aberto ? dict.menu.fechar : dict.menu.abrir}
      data-open={String(aberto)}
      onClick={onClick}
    >
      <span className={styles.linhas} aria-hidden="true">
        <span className={styles.linha} />
        <span className={styles.linha} />
        <span className={styles.linha} />
      </span>
    </button>
  );
}
