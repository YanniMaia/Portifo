// Contato: botões (E-mail, LinkedIn, GitHub), disponibilidade e "Copiar e-mail" (S-15; doc de
// design §7.11, §3.4, §3.5, §8, §11; referencia/DESIGN.md DV-16; D13, D21; D22 (04 §4.4)).
//
// - `Section` (DS-10) com o id `contato` do registro (F-12; tom `base`: branco/#150A10).
// - Painel centralizado (`Container size="contact"`, 1000 px), raio 32, padding 64/48/40 px
//   (desktop/tablet/celular), degradê `--gradient-contact` (já pronto em DS-01) e borda 1 px
//   `--color-border`.
// - Gancho do doc 04 §4.4 (A-19): prop `backdrop?: ReactNode`, renderizada ATRÁS do conteúdo DO
//   PAINEL (a task pede a grade, os 2 brilhos dos cantos e os nós dentro do painel em degradê, não
//   da seção inteira), num contêiner com `overflow: hidden` e `aria-hidden="true"`. Sem a prop,
//   nada é renderizado. Nenhum `data-bg-slot` no DOM.
// - `Eyebrow tone="tint"` (DV-16/D13): o eyebrow fica sobre o topo #FFEEF4 do degradê.
// - Parágrafo próprio (não o `subtitle` do `SectionHeader`, que não garante os 640 px centralizados
//   do §7.11).
// - Disponibilidade (`PulseDot` de 8 px + texto) só se `contato.disponibilidade` existir e não for
//   placeholder (`resolveOptional`, mesmo padrão do S-13/`Education`).
// - Botões (`ButtonLink`, DS-11), na ordem E-mail (primário, `mailto:`) → LinkedIn → GitHub
//   (secundários, `external`): a ordem do DOM é a ordem visual e a de foco (D21). Cada um só
//   existe se a URL/e-mail existir — o próprio `ButtonLink` decide (D11), sem lógica extra aqui.
// - `CopyEmail` 24 px abaixo dos botões.
// - Gancho do A-02: `data-reveal` só na raiz do conteúdo do painel (o `.backdrop` não o repete).
import { Mail } from 'lucide-react';
import { useId, type ReactNode } from 'react';
import { ButtonLink } from '@/components/Button';
import { Container } from '@/components/Container';
import { Github, Linkedin } from '@/components/Icon';
import { PlaceholderMark } from '@/components/PlaceholderMark';
import { PulseDot } from '@/components/PulseDot';
import { Section } from '@/components/Section';
import { SectionHeader } from '@/components/SectionHeader';
import type { SectionId } from '@/content/sections';
import { site } from '@/content/site';
import { useLanguage } from '@/i18n/useLanguage';
import { resolveOptional } from '@/lib/placeholder';
import { CopyEmail } from './CopyEmail';
import styles from './Contact.module.css';

/** Id do registro (F-12): um id fora de `SECTIONS` não compila. */
const ID_DO_CONTATO = 'contato' satisfies SectionId;

export interface ContactProps {
  /** Camada decorativa de fundo do painel (grade, brilhos, nós), passada pelo A-19 no `App.tsx`. */
  backdrop?: ReactNode;
}

export function Contact({ backdrop }: ContactProps) {
  const { dict } = useLanguage();
  const d = dict.contato;
  const idTitulo = useId();
  const temBackdrop = backdrop !== undefined && backdrop !== null && backdrop !== false;
  const disponibilidade = resolveOptional(d.disponibilidade);

  return (
    <Section id={ID_DO_CONTATO} labelledBy={idTitulo}>
      <Container size="contact">
        <div className={styles.painel}>
          {temBackdrop ? (
            <div className={styles.backdrop} aria-hidden="true">
              {backdrop}
            </div>
          ) : null}
          <div className={styles.conteudo} data-reveal="">
            <SectionHeader
              eyebrow={d.eyebrow}
              eyebrowTone="tint"
              title={d.titulo}
              id={idTitulo}
              align="center"
            />
            <p className={styles.texto}>{d.texto}</p>
            {disponibilidade !== undefined ? (
              <p className={styles.disponibilidade}>
                <PulseDot size={8} />
                <PlaceholderMark value={disponibilidade} />
              </p>
            ) : null}
            <div className={styles.botoes}>
              <ButtonLink variant="primary" href={site.mailto} iconLeft={Mail} fullWidthOnMobile>
                {d.botaoEmail}
              </ButtonLink>
              <ButtonLink
                variant="secondary"
                href={site.linkedin}
                external
                iconLeft={Linkedin}
                fullWidthOnMobile
              >
                {d.botaoLinkedin}
              </ButtonLink>
              <ButtonLink
                variant="secondary"
                href={site.github}
                external
                iconLeft={Github}
                fullWidthOnMobile
              >
                {d.botaoGithub}
              </ButtonLink>
            </div>
            <CopyEmail className={styles.copiarEmail} />
          </div>
        </div>
      </Container>
    </Section>
  );
}
