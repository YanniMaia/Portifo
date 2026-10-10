// Áreas de interesse (S-08; doc de design §7.6, §3.4, §8; índice §3; DV-3, DV-4, DV-14, DV-15; D17).
//
// - `Section` (DS-10) com o id `interesses` do registro (F-12; tom `alt`: #FFF7FA / #1C0E16),
//   nomeada pelo H2 do `SectionHeader` (DS-14: eyebrow, H2 e subtítulo).
// - Grade (DV-3): 2 × 2 no desktop e no tablet com 24 px; 1 coluna no celular com 16 px
//   (`--card-gap`). Cards da mesma linha com a mesma altura.
// - Mapa fixo (N-3; Anexo A.7 não tem ícone nem selo): ordem → grupo de chaves → ícone → selo.
//   Dados → `Database` → "Foco principal"; Cibersegurança → `ShieldLock` (escudo com cadeado, §7.6)
//   → "Foco principal"; IA → `BrainCircuit` (DV-15) → "Em estudo" tracejado (DV-4);
//   Desenvolvimento → `CodeXml` (colchetes de código) → sem selo. Textos só das chaves
//   `interesses.*` (D5).
// - Gancho do doc 04 §4.4 (A-19): prop `backdrop?: ReactNode`, renderizada ATRÁS dos cards num
//   contêiner com `overflow: hidden` e `aria-hidden="true"`. Sem a prop, nada no lugar.
// - Gancho do A-02: `data-reveal` no contêiner de conteúdo. Sem animação própria (CC-6).
import { BrainCircuit, CodeXml, Database, ShieldLock, type LucideIcon } from 'lucide-react';
import { useId, type ReactNode } from 'react';
import { Container } from '@/components/Container';
import { Section } from '@/components/Section';
import { SectionHeader } from '@/components/SectionHeader';
import type { SectionId } from '@/content/sections';
import type { Dictionary } from '@/i18n/types';
import { useLanguage } from '@/i18n/useLanguage';
import { InterestCard, type SeloDoInteresse } from './InterestCard';
import styles from './Interests.module.css';

/** Id do registro (F-12): um id fora de `SECTIONS` não compila. */
const ID_DOS_INTERESSES = 'interesses' satisfies SectionId;

type GrupoDeInteresse = 'dados' | 'ciber' | 'ia' | 'dev';
type TipoDeSelo = 'foco' | 'estudo';

interface ItemDoMapa {
  grupo: GrupoDeInteresse;
  icone: LucideIcon;
  selo?: TipoDeSelo;
}

/** Mapa fixo do componente (passo 4; N-3), na ordem do Anexo A.7 e do índice §3. */
const CARDS_DE_INTERESSE: readonly ItemDoMapa[] = [
  { grupo: 'dados', icone: Database, selo: 'foco' },
  { grupo: 'ciber', icone: ShieldLock, selo: 'foco' },
  { grupo: 'ia', icone: BrainCircuit, selo: 'estudo' },
  { grupo: 'dev', icone: CodeXml },
];

function seloDo(tipo: TipoDeSelo | undefined, d: Dictionary['interesses']) {
  if (tipo === 'foco') return { rotulo: d.seloFoco, variante: 'filled' } satisfies SeloDoInteresse;
  if (tipo === 'estudo') {
    return { rotulo: d.seloEstudo, variante: 'dashed' } satisfies SeloDoInteresse;
  }
  return undefined;
}

export interface InterestsProps {
  /** Camada decorativa de fundo (marca-d'água), passada pelo A-19 no `App.tsx`. */
  backdrop?: ReactNode;
}

export function Interests({ backdrop }: InterestsProps) {
  const { dict } = useLanguage();
  const d = dict.interesses;
  const idTitulo = useId();
  const temBackdrop = backdrop !== undefined && backdrop !== null && backdrop !== false;

  return (
    <Section id={ID_DOS_INTERESSES} labelledBy={idTitulo} className={styles.interesses}>
      {temBackdrop ? (
        <div className={styles.backdrop} aria-hidden="true">
          {backdrop}
        </div>
      ) : null}
      <Container className={styles.conteudo}>
        <div data-reveal="">
          <SectionHeader
            eyebrow={d.eyebrow}
            title={d.titulo}
            subtitle={d.subtitulo}
            id={idTitulo}
          />
          <div className={styles.grade}>
            {CARDS_DE_INTERESSE.map(({ grupo, icone, selo }) => (
              <InterestCard
                key={grupo}
                icone={icone}
                titulo={d[grupo].titulo}
                texto={d[grupo].texto}
                chips={d[grupo].chips}
                selo={seloDo(selo, d)}
              />
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}
