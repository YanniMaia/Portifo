// Card "Projeto de IA — em breve" (S-12; 00-INDICE §3; doc de design §7.8, §7.9; DV-5, DV-15; D21).
//
// - Último item da grade de projetos, do mesmo tamanho dos cards de estudo (altura da linha).
// - `Card variant="dashed"` do DS-15 (D21): fundo transparente, borda 1,5 px tracejada
//   `--color-deco`, sem sombra, raio 24. É a mesma variante do marco futuro da Formação (S-13).
//   Nenhum estilo de borda próprio aqui.
// - Conteúdo centralizado: `IconBox` (DS-16) com `BrainCircuit` (DV-15) e o título H3 em cor
//   secundária. SEM descrição, botão, chips ou selo "Projeto de estudo" (regra de ouro: o projeto
//   real ainda não existe, P-IA-3).
// - Não é interativo: sem hover de elevação (o `dashed` nunca é interativo) e nada focável.
// - Conteúdo do C-05 (`CARD_IA`): o título sai da chave `projetos.ia.titulo` (sugerido, P-IA-2) e o
//   ícone, do nome `BrainCircuit`. Quem decide se o card existe é a flag do F-15, via `mostrarCardIA`
//   (C-06), lida em `Projects.tsx`.
import { BrainCircuit, type LucideIcon } from 'lucide-react';
import { Card } from '@/components/Card';
import { IconBox } from '@/components/IconBox';
import { CARD_IA } from '@/content/projects';
import type { Dictionary } from '@/i18n/types';
import { useLanguage } from '@/i18n/useLanguage';
import styles from './AiComingSoonCard.module.css';

/** Ícone de cada nome usado no `CARD_IA` (C-05). */
const ICONE: Record<(typeof CARD_IA)['icone'], LucideIcon> = {
  BrainCircuit,
};

/** Texto de cada chave usada no `CARD_IA` (C-05), no dicionário atual. */
const TITULO: Record<(typeof CARD_IA)['tituloChave'], (d: Dictionary) => string> = {
  'projetos.ia.titulo': (d) => d.projetos.ia.titulo,
};

export function AiComingSoonCard() {
  const { dict } = useLanguage();
  return (
    <Card as="article" variant="dashed" padding="compact" className={styles.card}>
      <IconBox icon={ICONE[CARD_IA.icone]} />
      <h3 className={`t-h3 ${styles.titulo}`}>{TITULO[CARD_IA.tituloChave](dict)}</h3>
    </Card>
  );
}
