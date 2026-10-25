// Formação acadêmica (S-13; doc de design §7.9, §3.4, §16; doc 05 Anexo A.10; D11, D14, D17, D21).
//
// - `Section` (DS-10) com o id `formacao` do registro (F-12; tom `base`: #FFFFFF / #150A10),
//   nomeada pelo H2 do `SectionHeader` (DS-14: eyebrow "Formação" + H2 "Formação Acadêmica").
// - Coluna centralizada de até 760 px (`Container size="narrow"`), com a linha do tempo em `<ol>`.
// - Linha vertical de 2 px em degradê (`--gradient-timeline`: #F286B0 → #F7B7D0 sumindo; escuro
//   #F58FB8 → #3B2030), decorativa (`aria-hidden`), 28 px à esquerda dos cartões (desktop e tablet)
//   e a 16 px da borda esquerda no celular. Gancho do A-05: `data-draw="y"` num elemento INTERNO; o
//   invólucro posiciona a linha (README do A-01: nada de `transform` de layout no elemento do gancho).
//   Sem o A-05 a linha aparece inteira.
// - Marco principal (`TimelineItem variant="principal"`): nó com o `PulseDot` de 20 px (DS-08);
//   cartão com `IconBox` + `GraduationCap`, H3 do curso, instituição 18 px (#A82560 / #FFB3D1) e o
//   selo "Formação em andamento" (`Badge` preenchido com `PulseDot` de 8 px, D17). Datas: só se
//   existirem; hoje são placeholders (`[ano de início]`, `[previsão de conclusão]`, PH-05/PH-06),
//   marcados pelo `PlaceholderMark` em DEV e ausentes em produção (D11). Sem porcentagem.
// - Cursos e certificações: o Anexo A.10 ainda não tem a lista (hoje nenhum item). Quando existir,
//   cada item vira um `TimelineItem variant="comum"` entre o principal e o futuro.
// - Marco futuro (`variant="futuro"`): nó vazado tracejado + `Card variant="dashed"` com o texto do
//   doc em cor secundária.
// - Gancho do A-02: `data-reveal` no contêiner de conteúdo. Sem animação própria (CC-6).
import { GraduationCap } from 'lucide-react';
import { useId } from 'react';
import { Badge } from '@/components/Badge';
import { Container } from '@/components/Container';
import { IconBox } from '@/components/IconBox';
import { PlaceholderMark } from '@/components/PlaceholderMark';
import { Section } from '@/components/Section';
import { SectionHeader } from '@/components/SectionHeader';
import type { SectionId } from '@/content/sections';
import { useLanguage } from '@/i18n/useLanguage';
import { resolveOptional } from '@/lib/placeholder';
import styles from './Education.module.css';
import { TimelineItem } from './TimelineItem';

/** Id do registro (F-12): um id fora de `SECTIONS` não compila. */
const ID_DA_FORMACAO = 'formacao' satisfies SectionId;

/** Separador entre início e previsão (símbolo gráfico, `aria-hidden`; não é texto do dicionário,
 * mesmo caso do "→" da Frase de destaque, doc 05 §A.5). */
const SEPARADOR_DE_DATAS = '–';

export function Education() {
  const { dict } = useLanguage();
  const d = dict.formacao;
  const idTitulo = useId();
  const inicio = resolveOptional(d.anoInicio);
  const previsao = resolveOptional(d.previsao);
  const temDatas = inicio !== undefined || previsao !== undefined;

  return (
    <Section id={ID_DA_FORMACAO} labelledBy={idTitulo}>
      <Container size="narrow">
        <div data-reveal="">
          <SectionHeader eyebrow={d.eyebrow} title={d.titulo} id={idTitulo} />
          <div className={styles.linhaDoTempo}>
            <span className={styles.trilho} aria-hidden="true">
              <span className={styles.linha} data-draw="y" />
            </span>
            <ol className={styles.lista}>
              <TimelineItem variant="principal">
                <IconBox icon={GraduationCap} />
                <h3 className={`t-h3 ${styles.curso}`}>{d.curso}</h3>
                <p className={styles.instituicao}>{d.instituicao}</p>
                <div className={styles.rodapeDoCartao}>
                  <Badge dot>{d.selo}</Badge>
                  {temDatas ? (
                    <p className={styles.datas}>
                      <PlaceholderMark value={inicio} />
                      {inicio !== undefined && previsao !== undefined ? (
                        <span aria-hidden="true"> {SEPARADOR_DE_DATAS} </span>
                      ) : null}
                      <PlaceholderMark value={previsao} />
                    </p>
                  ) : null}
                </div>
              </TimelineItem>
              <TimelineItem variant="futuro">
                <p className={`t-body ${styles.futuro}`}>{d.futuro}</p>
              </TimelineItem>
            </ol>
          </div>
        </div>
      </Container>
    </Section>
  );
}
