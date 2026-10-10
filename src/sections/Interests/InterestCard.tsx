// Card de área de interesse (S-08; doc de design §7.6, §3.4; índice §3; DV-4, DV-14, DV-15; D17).
//
// - `Card` do DS-15 (`<article>`, interativo e com filete): fundo de superfície, borda 1 px, raio 24,
//   padding 32/28/24, sombra de repouso. O hover (sobe 6 px, borda #F286B0, sombra de hover, filete
//   de 3 px) e o `IconBox` virando degradê com ícone branco vêm do DS-15/DS-16, em 250 ms; com
//   movimento reduzido só a cor muda (DS-04).
// - Topo: `IconBox` (DS-16, 56 px, ícone 28 px) à esquerda e o selo (`Badge`, DS-13) no canto superior
//   direito. "Foco principal" = `filled`; "Em estudo" = `dashed` (DV-4). Sem selo, nada no lugar.
// - H3 16 px abaixo da caixa de ícone; descrição 16 px na cor secundária; chips pequenos (DS-12,
//   32 px/13 px, fundo `--color-chip-bg`) no fim do card **só se** a lista tiver itens.
// - O card não é link nem focável (os cards não têm destino, §7.6).
// - Sem texto fixo (D5): título, texto, chips e rótulo do selo chegam por props, vindos do dicionário.
import type { LucideIcon } from 'lucide-react';
import { Badge, type BadgeVariant } from '@/components/Badge';
import { Card } from '@/components/Card';
import { Chip, ChipList } from '@/components/Chip';
import { IconBox } from '@/components/IconBox';
import styles from './InterestCard.module.css';

export interface SeloDoInteresse {
  rotulo: string;
  variante: BadgeVariant;
}

export interface InterestCardProps {
  icone: LucideIcon;
  titulo: string;
  texto: string;
  chips: readonly string[];
  selo?: SeloDoInteresse;
}

export function InterestCard({ icone, titulo, texto, chips, selo }: InterestCardProps) {
  return (
    <Card as="article" interactive accentBar className={styles.card}>
      <div className={styles.topo}>
        <IconBox icon={icone} />
        {selo ? (
          <Badge variant={selo.variante} className={styles.selo}>
            {selo.rotulo}
          </Badge>
        ) : null}
      </div>
      <h3 className={`t-h3 ${styles.titulo}`}>{titulo}</h3>
      <p className={styles.texto}>{texto}</p>
      {chips.length > 0 ? (
        <ChipList gap="sm" className={styles.chips}>
          {chips.map((chip) => (
            <Chip key={chip} size="sm">
              {chip}
            </Chip>
          ))}
        </ChipList>
      ) : null}
    </Card>
  );
}
