// Faixa de destaques (S-05; doc de design §7.3, §17; índice §3 (item com IA); DV-13; D14, D19, D22).
//
// - `Section` (DS-10) com o id `destaques` do registro (F-12) e `aria-label` = `destaques.aria`
//   (C-02), sem H2 visível (AMB-S-13). Sobe 48 px sobre o hero (`margin-top: -48px` + `z-index`).
// - Cartão de vidro (`GlassPanel`, DS-17), raio 24, padding 32/28/24 (`--card-padding`).
// - Itens = exatamente o que `itensDaFaixa` (C-06) devolve, na ordem. Com 0 projetos com
//   repositório, o C-06 omite o item de projetos e a grade se ajusta (só CSS). A seção não conta nada.
// - Valor 36 px/800 em degradê (`GradientText`, DS-07); legenda 14 px, cor secundária, 8 px abaixo.
// - Gancho do doc 04 §4.4 (A-04): valor numérico = `<span aria-hidden="true" data-countup="{n}">{n}</span>`
//   + o mesmo `{n}` em `.visually-hidden` (DS-04). O texto ("UniCEUB") não recebe o gancho.
// - Gancho do A-02: `data-reveal` no contêiner de conteúdo. Sem animação própria (CC-6).
// - Não interativo: nada focável, sem hover.
import { Container } from '@/components/Container';
import { GlassPanel } from '@/components/GlassPanel';
import { GradientText } from '@/components/GradientText';
import { Section } from '@/components/Section';
import { PROJECTS } from '@/content/projects';
import type { SectionId } from '@/content/sections';
import { itensDaFaixa, type ItemFaixa } from '@/content/selectors';
import type { Project } from '@/content/types';
import { useLanguage } from '@/i18n/useLanguage';
import styles from './Highlights.module.css';

/** Id do registro (F-12): um id fora de `SECTIONS` não compila. */
const ID_DA_FAIXA = 'destaques' satisfies SectionId;

export interface HighlightsProps {
  /** Fichas de projeto (padrão: as reais do C-05). Os testes passam fixtures. */
  projetos?: readonly Project[];
}

function Valor({ item }: { item: ItemFaixa }) {
  if (item.tipo === 'texto') {
    return <GradientText className={styles.valor}>{item.valor}</GradientText>;
  }
  return (
    <GradientText className={styles.valor}>
      <span aria-hidden="true" data-countup={item.valor}>
        {item.valor}
      </span>
      <span className="visually-hidden">{item.valor}</span>
    </GradientText>
  );
}

export function Highlights({ projetos = PROJECTS }: HighlightsProps) {
  const { dict } = useLanguage();
  const itens = itensDaFaixa(projetos, dict);

  return (
    <Section id={ID_DA_FAIXA} label={dict.destaques.aria} className={styles.highlights}>
      <Container>
        <div data-reveal="">
          <GlassPanel as="ul" className={styles.painel}>
            {itens.map((item) => (
              <li key={item.id} className={styles.item} data-item={item.id}>
                <Valor item={item} />
                <span className={styles.legenda}>{item.legenda}</span>
              </li>
            ))}
          </GlassPanel>
        </div>
      </Container>
    </Section>
  );
}
