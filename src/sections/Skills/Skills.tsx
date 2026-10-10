// Habilidades (S-09; doc de design §7.7, §4; índice §3 (nenhuma tecnologia de IA); D17).
//
// - `Section` (DS-10) com o id `habilidades` do registro (F-12; tom `base`: #FFFFFF / #150A10),
//   nomeada pelo H2 do `SectionHeader` (DS-14: eyebrow, H2 e subtítulo).
// - Grade: celular empilhado (16 px), tablet 2 + 1 (o último ímpar em largura total), desktop uma
//   coluna igual por categoria (3 hoje), com `--card-gap` (16/24/24).
// - Mapa fixo de categoria → ícone → mono (§7.7): Linguagens `CodeXml` (o `Code2` do plano no
//   lucide 1.x) e mono; Ferramentas `Wrench` e mono; Conceitos `Lightbulb`, fonte de corpo.
//   Títulos e chips só das chaves `habilidades.*` (Anexo A.8). Sem barras, porcentagens nem níveis.
// - Categoria sem chips no conteúdo não é renderizada.
// - Ganchos do doc 04 §4.4: `data-reveal` no contêiner de conteúdo (A-02); `data-stagger="chips"`
//   em cada cartão e `data-stagger-item` em cada chip (A-03, no `SkillCategory`).
import { CodeXml, Lightbulb, Wrench, type LucideIcon } from 'lucide-react';
import { useId } from 'react';
import { Container } from '@/components/Container';
import { Section } from '@/components/Section';
import { SectionHeader } from '@/components/SectionHeader';
import type { SectionId } from '@/content/sections';
import { useLanguage } from '@/i18n/useLanguage';
import { SkillCategory } from './SkillCategory';
import styles from './Skills.module.css';

/** Id do registro (F-12): um id fora de `SECTIONS` não compila. */
const ID_DAS_HABILIDADES = 'habilidades' satisfies SectionId;

type GrupoDeHabilidade = 'linguagens' | 'ferramentas' | 'conceitos';

/** Mapa fixo do componente (§7.7), na ordem do Anexo A.8. */
const CATEGORIAS: readonly { grupo: GrupoDeHabilidade; icone: LucideIcon; mono: boolean }[] = [
  { grupo: 'linguagens', icone: CodeXml, mono: true },
  { grupo: 'ferramentas', icone: Wrench, mono: true },
  { grupo: 'conceitos', icone: Lightbulb, mono: false },
];

export function Skills() {
  const { dict } = useLanguage();
  const d = dict.habilidades;
  const idTitulo = useId();
  const visiveis = CATEGORIAS.filter(({ grupo }) => d[grupo].chips.length > 0);

  return (
    <Section id={ID_DAS_HABILIDADES} labelledBy={idTitulo}>
      <Container>
        <div data-reveal="">
          <SectionHeader
            eyebrow={d.eyebrow}
            title={d.titulo}
            subtitle={d.subtitulo}
            id={idTitulo}
          />
          {visiveis.length > 0 ? (
            <div className={styles.grade}>
              {visiveis.map(({ grupo, icone, mono }) => (
                <SkillCategory
                  key={grupo}
                  icone={icone}
                  titulo={d[grupo].titulo}
                  chips={d[grupo].chips}
                  mono={mono}
                />
              ))}
            </div>
          ) : null}
        </div>
      </Container>
    </Section>
  );
}
