// Hero — layout, texto e botões (S-03; doc de design §7.2, §4, §3.4, §10; DV-1; D13, D15, D22).
//
// - `Section` (DS-10) com o id da 1ª seção do registro (`inicio`, F-12), nomeada pelo H1.
// - Altura mínima `max(100svh, 640px)`; padding 152/96 (desktop), 148/88 (tablet), 128/64 (celular).
// - Grade: abaixo de 1024 px uma coluna (texto e depois o visual); a partir de 1024 px duas colunas
//   6/12 + 6/12 com 64 px entre elas. A coluna do visual fica reservada (520/420/320 px de altura)
//   para a composição do S-04.
// - Fundo: `--color-bg` + os dois brilhos `--hero-glow-1` (640 px, canto superior direito) e
//   `--hero-glow-2` (480 px, canto inferior esquerdo), do DS-01 (escuro #4A1A33 / #2A1020).
// - Gancho do doc 04 §4.4 (A-19): prop `backdrop?: ReactNode`. Recebida, é renderizada ATRÁS do
//   conteúdo, num contêiner com `overflow: hidden` e `aria-hidden="true"`. Sem ela, nada no lugar.
// - Sem animação nem reveal (CC-6): o hero aparece pronto. Sem texto fixo (D5).
import { useId, type ReactNode } from 'react';
import { Container } from '@/components/Container';
import { Section } from '@/components/Section';
import { SECTION_IDS } from '@/content/sections';
import styles from './Hero.module.css';
import { HeroText } from './HeroText';

/** Id do hero: a 1ª seção do registro (F-12), sem id escrito à mão. */
const ID_DO_HERO = SECTION_IDS[0];

export interface HeroProps {
  /** Camada decorativa de fundo (grade, partículas, código), passada pelo A-19 no `App.tsx`. */
  backdrop?: ReactNode;
}

export function Hero({ backdrop }: HeroProps) {
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
        {/* Coluna do visual: reservada para o HeroVisual do S-04. */}
        <div className={styles.visual} />
      </Container>
    </Section>
  );
}
