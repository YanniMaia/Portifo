// Hero — layout, texto e botões (S-03) + composição visual (S-04); doc de design §7.2, §4, §3.4,
// §10; DV-1; D13, D15, D22.
//
// - `Section` (DS-10) com o id da 1ª seção do registro (`inicio`, F-12), nomeada pelo H1.
// - Altura mínima `max(100svh, 640px)`; padding 152/96 (desktop), 148/88 (tablet), 128/64 (celular).
// - Grade: abaixo de 1024 px uma coluna (texto e depois o visual); a partir de 1024 px duas colunas
//   6/12 + 6/12 com 64 px entre elas. A coluna do visual recebe o `HeroVisual` (S-04: 520/420/320).
// - Fundo: `--color-bg` + os dois brilhos `--hero-glow-1` (640 px, canto superior direito) e
//   `--hero-glow-2` (480 px, canto inferior esquerdo), do DS-01 (escuro #4A1A33 / #2A1020).
// - Gancho do doc 04 §4.4 (A-19): prop `backdrop?: ReactNode`. Recebida, é renderizada ATRÁS do
//   conteúdo, num contêiner com `overflow: hidden` e `aria-hidden="true"`. Sem ela, nada no lugar.
// - Ganchos do doc 04 §4.4 (A-18), repassados ao `HeroVisual`: `monogramInteractive`,
//   `onMonogramActivate`, `showHint` e `burstLayer`. Na V1 (doc 09: A-18 ⏭ V2) o padrão AQUI é
//   monograma não clicável e sem a dica "Clique no YE"; o `HeroVisual` mantém os padrões `true`
//   do §4.4, e o A-18 passa os valores dele na V2.
// - Sem animação nem reveal (CC-6): o hero aparece pronto. Sem texto fixo (D5).
import { useId, type ReactNode } from 'react';
import { Container } from '@/components/Container';
import { Section } from '@/components/Section';
import { SECTION_IDS } from '@/content/sections';
import styles from './Hero.module.css';
import { HeroText } from './HeroText';
import { HeroVisual } from './HeroVisual';

/** Id do hero: a 1ª seção do registro (F-12), sem id escrito à mão. */
const ID_DO_HERO = SECTION_IDS[0];

/** V1 (doc 09): o monograma não é clicável e a dica não aparece até o A-18 (V2). */
const MONOGRAMA_INTERATIVO_NA_V1 = false;

export interface HeroProps {
  /** Camada decorativa de fundo (grade, partículas, código), passada pelo A-19 no `App.tsx`. */
  backdrop?: ReactNode;
  /** Monograma como botão (A-18). Padrão da V1: `false` (doc 09). */
  monogramInteractive?: boolean;
  /** Ativação do monograma (A-18). */
  onMonogramActivate?: () => void;
  /** Dica "Clique no YE" (A-18). Padrão da V1: `false` (doc 09). */
  showHint?: boolean;
  /** Camada da explosão sobre o cartão central (A-18). */
  burstLayer?: ReactNode;
}

export function Hero({
  backdrop,
  monogramInteractive = MONOGRAMA_INTERATIVO_NA_V1,
  onMonogramActivate,
  showHint = MONOGRAMA_INTERATIVO_NA_V1,
  burstLayer,
}: HeroProps) {
  const idTitulo = useId();
  const temBackdrop = backdrop !== undefined && backdrop !== null && backdrop !== false;

  return (
    <Section id={ID_DO_HERO} labelledBy={idTitulo} className={styles.hero}>
      {temBackdrop ? (
        <div className={styles.backdrop} aria-hidden="true">
          {backdrop}
        </div>
      ) : null}
      <Container className={styles.grade}>
        <HeroText idTitulo={idTitulo} />
        <div className={styles.visual}>
          <HeroVisual
            monogramInteractive={monogramInteractive}
            onMonogramActivate={onMonogramActivate}
            showHint={showHint}
            burstLayer={burstLayer}
          />
        </div>
      </Container>
    </Section>
  );
}
