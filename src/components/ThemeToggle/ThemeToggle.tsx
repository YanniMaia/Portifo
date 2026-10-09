// Alternador de tema claro/escuro (DS-19; doc de design §5, §6, §9; D14).
//
// - `<button type="button">`: Enter e Espaço alternam pelo comportamento nativo; `toggleTheme` da
//   F-09 grava `ye-theme` (persiste ao recarregar) e cuida da transição de cores de 300 ms.
// - Nome acessível pelo dicionário (F-10): "Alternar para modo escuro" no claro e "Alternar para
//   modo claro" no escuro. Sem `aria-pressed`: o rótulo já muda.
// - Lua no claro, sol no escuro: os dois ícones ficam sobrepostos; o visível tem opacidade 1 e
//   rotação 0, o oculto opacidade 0 e −90°. A troca leva 250 ms (só `transform` e `opacity`).
//   Com movimento reduzido, só o fade (sem rotação).
// - Sem texto fixo (D5).
import { Moon, Sun } from 'lucide-react';
import { Icon } from '@/components/Icon';
import { useLanguage } from '@/i18n/useLanguage';
import { useTheme } from '@/theme/useTheme';
import styles from './ThemeToggle.module.css';

export interface ThemeToggleProps {
  /** Classe extra do consumidor, colocada no fim. */
  className?: string;
  /** Força o visual de um estado (styleguide/prints). */
  'data-state'?: 'hover' | 'focus';
}

export function ThemeToggle({ className, 'data-state': estado }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const { dict } = useLanguage();
  const rotulo = theme === 'light' ? dict.a11y.themeToDark : dict.a11y.themeToLight;
  const classes = [styles.toggle, className].filter(Boolean).join(' ');
  return (
    <button
      type="button"
      className={classes}
      aria-label={rotulo}
      data-theme-atual={theme}
      data-state={estado}
      onClick={toggleTheme}
    >
      <span className={styles.icon} data-icone="lua" data-visivel={theme === 'light'}>
        <Icon icon={Moon} size={20} />
      </span>
      <span className={styles.icon} data-icone="sol" data-visivel={theme === 'dark'}>
        <Icon icon={Sun} size={20} />
      </span>
    </button>
  );
}
