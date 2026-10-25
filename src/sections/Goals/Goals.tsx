// Onde quero chegar: 3 trilhas, incluindo IA (S-14; doc de design §7.10, §3.4, §3.5, §10; índice §3
// (trilha IA, `sugerido`); `referencia/DESIGN.md` DV-11 (coluna de 140 px e conectores com ponta de
// seta); D13 (1ª etapa com `--gradient-primary`); D22 (ganchos do 04 §4.4).
//
// - `Section` (DS-10) com o id `objetivos` do registro (F-12; tom `alt`: #FFF7FA / #1C0E16),
//   nomeada pelo H2 do `SectionHeader` (DS-14: eyebrow "Objetivos" + H2 "Onde quero chegar").
// - Gancho do doc 04 §4.4 (A-19): prop `backdrop?: ReactNode`, renderizada ATRÁS do conteúdo, num
//   contêiner com `overflow: hidden` e `aria-hidden="true"` — mesmo padrão de `Hero.tsx` e
//   `Interests.tsx`. Sem a prop, nada é renderizado. Nenhum `data-bg-slot` no DOM.
// - Parágrafo centralizado (`objetivos.texto`), 760 px, 18 px/entrelinha 1,7, cor secundária.
// - 3 trilhas (`Track`), 48 px abaixo do parágrafo, `--card-gap` entre elas (24/24/16 px), na ordem
//   do índice §3: Dados → Cibersegurança → IA. Uma trilha sem etapas não é renderizada (hoje todas
//   têm pelo menos 1).
// - Gancho do A-02: `data-reveal` só na raiz do conteúdo (nenhuma `Track` o repete).
import { BrainCircuit, Database, Shield, type LucideIcon } from 'lucide-react';
import { useId, type ReactNode } from 'react';
import { Container } from '@/components/Container';
import { Section } from '@/components/Section';
import { SectionHeader } from '@/components/SectionHeader';
import type { SectionId } from '@/content/sections';
import { useLanguage } from '@/i18n/useLanguage';
import { Track } from './Track';
import styles from './Goals.module.css';

/** Id do registro (F-12): um id fora de `SECTIONS` não compila. */
const ID_DOS_OBJETIVOS = 'objetivos' satisfies SectionId;

/** Chaves das 3 trilhas no dicionário (C-02), nessa ordem (índice §3). */
type GrupoDeTrilha = 'trilhaDados' | 'trilhaCiber' | 'trilhaIA';

/** Mapa fixo do componente: ícone por trilha, na ordem do índice §3. */
const ICONE_POR_TRILHA: Record<GrupoDeTrilha, LucideIcon> = {
  trilhaDados: Database,
  trilhaCiber: Shield,
  trilhaIA: BrainCircuit,
};

const ORDEM_DAS_TRILHAS: readonly GrupoDeTrilha[] = ['trilhaDados', 'trilhaCiber', 'trilhaIA'];

export interface GoalsProps {
  /** Camada decorativa de fundo (marca-d'água), passada pelo A-19 no `App.tsx`. */
  backdrop?: ReactNode;
}

export function Goals({ backdrop }: GoalsProps) {
  const { dict } = useLanguage();
  const d = dict.objetivos;
  const idTitulo = useId();
  const temBackdrop = backdrop !== undefined && backdrop !== null && backdrop !== false;

  /** Só as trilhas com etapas (passo 1; hoje as 3 têm). A numeração ("Trilha N") segue a posição
   * entre as trilhas renderizadas, não a posição no mapa fixo. */
  const trilhas = ORDEM_DAS_TRILHAS.map((grupo) => ({ grupo, trilha: d[grupo] })).filter(
    ({ trilha }) => trilha.etapas.length > 0,
  );

  return (
    <Section id={ID_DOS_OBJETIVOS} labelledBy={idTitulo} className={styles.objetivos}>
      {temBackdrop ? (
        <div className={styles.backdrop} aria-hidden="true">
          {backdrop}
        </div>
      ) : null}
      <Container className={styles.conteudo}>
        <div data-reveal="">
          <SectionHeader eyebrow={d.eyebrow} title={d.titulo} id={idTitulo} align="center" />
          <p className={styles.texto}>{d.texto}</p>
          <div className={styles.trilhas}>
            {trilhas.map(({ grupo, trilha }, indice) => (
              <Track
                key={grupo}
                icone={ICONE_POR_TRILHA[grupo]}
                rotulo={d.trilhaRotulo(indice + 1)}
                nome={trilha.nome}
                etapas={trilha.etapas}
              />
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}
