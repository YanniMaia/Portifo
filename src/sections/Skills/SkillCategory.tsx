// Cartão de categoria das Habilidades (S-09; doc de design §7.7, §4; D17).
//
// - `Card` do DS-15 (`<article>`, padrão, NÃO interativo: o cartão não sobe; só os chips reagem ao
//   hover). Fundo de superfície, borda 1 px, raio 24, padding 32/28/24, sombra de repouso.
// - Título H3 com ícone de linha de 24 px na cor de destaque à esquerda, a 12 px (DS-06).
// - Chips médios (DS-12: 40 px, 15 px/500, pílula, fundo `--color-chip-bg`, 12 px entre eles), mono
//   em linguagens e ferramentas. Hover dos chips (fundo `--color-chip-bg-hover`, borda rosa, sobe
//   2 px) é do DS-12. Chips não são focáveis.
// - Ganchos do doc 04 §4.4 (A-03): o cartão com `data-stagger="chips"` e cada chip com
//   `data-stagger-item`. Sem animação própria (CC-6): os chips aparecem prontos.
// - Sem texto fixo (D5): título e chips chegam por props, vindos do dicionário.
import type { LucideIcon } from 'lucide-react';
import { Card } from '@/components/Card';
import { Chip, ChipList } from '@/components/Chip';
import { Icon } from '@/components/Icon';
import styles from './SkillCategory.module.css';

export interface SkillCategoryProps {
  icone: LucideIcon;
  titulo: string;
  chips: readonly string[];
  /** JetBrains Mono nos chips (linguagens e ferramentas, §7.7). */
  mono?: boolean;
}

export function SkillCategory({ icone, titulo, chips, mono = false }: SkillCategoryProps) {
  return (
    <Card as="article" className={styles.categoria} data-stagger="chips">
      <h3 className={`t-h3 ${styles.titulo}`}>
        <Icon icon={icone} size={24} className={styles.icone} />
        <span>{titulo}</span>
      </h3>
      <ChipList className={styles.chips}>
        {chips.map((chip) => (
          <Chip key={chip} mono={mono} data-stagger-item="">
            {chip}
          </Chip>
        ))}
      </ChipList>
    </Card>
  );
}
