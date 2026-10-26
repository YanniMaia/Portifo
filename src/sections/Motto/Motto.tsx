// Frase de destaque — "O que me move" (S-06; doc de design §7.4, §2, §3.5; DV-10, DV-16; D13, D22).
//
// - `Section` (DS-10) com o id `frase` do registro (F-12; tom `tint`: #FFEEF4 / #1C0E16) e
//   `padding="motto"` (96/88/64, AMB-S-24). `Container size="motto"` (900 px), conteúdo centralizado.
// - Eyebrow (DS-09) em `tone="tint"` (#A82560 / #FFB3D1), dentro de um `<h2>` que nomeia a seção
//   (H2 por seção, AMB-S-13).
// - Três linhas (pares `antes`/`depois` do C-02): `antes` + seta decorativa (`aria-hidden`, AMB-S-25)
//   + conectivo visualmente oculto (`frase.conectivo`) + `depois` em `GradientText` (DS-07).
//   O leitor de tela lê "Conhecimento em soluções.". A seta é um símbolo gráfico desenhado pelo
//   componente (doc 05 §A.5), igual em todos os idiomas; não é texto do dicionário.
// - Gancho do doc 04 §4.4 (A-03): o contêiner das linhas tem `data-stagger="motto"` e cada linha
//   `data-stagger-item`. Sem animação própria (CC-6): as linhas aparecem prontas.
// - Gancho do A-02 (pendência registrada em S-17/CHECKPOINTS.md, opção (b) do diário de A-02): o
//   mesmo contêiner também tem `data-reveal=""`, para a Frase participar do fade + 24 px de
//   entrada de seção igual às outras (ela não tinha o gancho antes). Convive sem conflito com o
//   `data-stagger` do A-03: o reveal anima o contêiner (`translateY`/`opacity`) e a cascata, mais
//   tarde, anima cada `<p data-stagger-item>` dentro dele.
// - Texto de apoio opcional (D11): sem valor, o parágrafo não existe.
// - Não interativo.
import { useId } from 'react';
import { Container } from '@/components/Container';
import { Eyebrow } from '@/components/Eyebrow';
import { GradientText } from '@/components/GradientText';
import { PlaceholderMark } from '@/components/PlaceholderMark';
import { Section } from '@/components/Section';
import type { SectionId } from '@/content/sections';
import { useLanguage } from '@/i18n/useLanguage';
import { resolveOptional } from '@/lib/placeholder';
import styles from './Motto.module.css';

/** Id do registro (F-12): um id fora de `SECTIONS` não compila. */
const ID_DA_FRASE = 'frase' satisfies SectionId;

/** Seta decorativa entre as duas palavras (símbolo gráfico, `aria-hidden`; doc 05 §A.5). */
const SETA = '→';

export function Motto() {
  const { dict } = useLanguage();
  const frase = dict.frase;
  const idTitulo = useId();
  const linhas = [frase.linha1, frase.linha2, frase.linha3];
  const apoio = resolveOptional(frase.apoio);

  return (
    <Section id={ID_DA_FRASE} labelledBy={idTitulo} padding="motto">
      <Container size="motto" className={styles.conteudo}>
        <h2 id={idTitulo} className={styles.titulo}>
          <Eyebrow as="span" tone="tint">
            {frase.eyebrow}
          </Eyebrow>
        </h2>
        <div className={styles.linhas} data-reveal="" data-stagger="motto">
          {linhas.map((linha) => (
            <p key={linha.antes} className={styles.linha} data-stagger-item="">
              {linha.antes}{' '}
              <span className={styles.seta} aria-hidden="true">
                {SETA}
              </span>{' '}
              <span className="visually-hidden">{frase.conectivo}</span>{' '}
              <GradientText>{linha.depois}</GradientText>
            </p>
          ))}
        </div>
        {apoio ? (
          <p className={styles.apoio}>
            <PlaceholderMark value={apoio} />
          </p>
        ) : null}
      </Container>
    </Section>
  );
}
