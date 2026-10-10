// Sobre mim (S-07; doc de design §7.5, §7.7, §4, §5; doc 05 Anexo A.6; D11, D17).
//
// - `Section` (DS-10) com o id `sobre` do registro (F-12; tom `base`: #FFFFFF / #150A10), nomeada
//   pelo H2 do `SectionHeader` (DS-14: eyebrow "Sobre" + H2 "Sobre mim", à esquerda).
// - Grade: texto 7/12 e cartão 5/12 com 64 px entre eles (desktop); abaixo de 1024 px uma coluna,
//   texto primeiro e o cartão embaixo (40 px no celular, 48 no tablet; AMB-S-14).
// - Parágrafo `.t-body` (17/16/16, entrelinha 1,7, máx. 65 caracteres), cor secundária.
// - Chips (`ChipList` + `Chip` mono, tamanho padrão de 40 px, DS-12; fundo `--color-chip-bg`, D17)
//   24 px abaixo do texto. Lista vazia → o bloco some.
// - "Ver habilidades →" (`ButtonLink variant="text"`, DS-11) → `#habilidades`, 24 px abaixo dos
//   chips. O "→" já faz parte do texto do dicionário (Anexo A.6), por isso sem a prop `arrow`
//   (evita seta dupla). Clique simples usa a rolagem do F-13 (como no hero).
// - Cartão "Minha trajetória" (`JourneyCard`). Sem marcos, o cartão some e o texto ocupa 12/12.
// - Gancho do A-02: `data-reveal` no contêiner de conteúdo. Sem animação própria (CC-6).
import { useId, type MouseEvent } from 'react';
import { ButtonLink } from '@/components/Button';
import { Chip, ChipList } from '@/components/Chip';
import { Container } from '@/components/Container';
import { Section } from '@/components/Section';
import { SectionHeader } from '@/components/SectionHeader';
import type { SectionId } from '@/content/sections';
import { useLanguage } from '@/i18n/useLanguage';
import { scrollToSection } from '@/lib/scroll';
import { eCliqueSimples } from '../Header/navegacao';
import styles from './About.module.css';
import { JourneyCard } from './JourneyCard';

/** Id do registro (F-12): um id fora de `SECTIONS` não compila. */
const ID_DO_SOBRE = 'sobre' satisfies SectionId;
/** Destino do botão de texto (§7.5). */
const ALVO_HABILIDADES = 'habilidades' satisfies SectionId;

const irParaHabilidades = (evento: MouseEvent<HTMLAnchorElement>) => {
  if (!eCliqueSimples(evento)) return;
  evento.preventDefault();
  scrollToSection(ALVO_HABILIDADES);
};

export function About() {
  const { dict } = useLanguage();
  const sobre = dict.sobre;
  const idTitulo = useId();
  const idTrajetoria = useId();
  const temCartao = sobre.trajetoria.marcos.length > 0;

  return (
    <Section id={ID_DO_SOBRE} labelledBy={idTitulo}>
      <Container>
        <div data-reveal="">
          <SectionHeader eyebrow={sobre.eyebrow} title={sobre.titulo} id={idTitulo} />
          <div className={temCartao ? styles.grade : `${styles.grade} ${styles.semCartao}`}>
            <div className={styles.texto}>
              <p className={`t-body ${styles.paragrafo}`}>{sobre.texto}</p>
              {sobre.chips.length > 0 ? (
                <ChipList className={styles.chips}>
                  {sobre.chips.map((chip) => (
                    <Chip key={chip} mono>
                      {chip}
                    </Chip>
                  ))}
                </ChipList>
              ) : null}
              <div className={styles.acao}>
                <ButtonLink
                  variant="text"
                  href={`#${ALVO_HABILIDADES}`}
                  onClick={irParaHabilidades}
                >
                  {sobre.verHabilidades}
                </ButtonLink>
              </div>
            </div>
            {temCartao ? (
              <JourneyCard
                titulo={sobre.trajetoria.titulo}
                marcos={sobre.trajetoria.marcos}
                ano={sobre.trajetoria.ano}
                idTitulo={idTrajetoria}
              />
            ) : null}
          </div>
        </div>
      </Container>
    </Section>
  );
}
