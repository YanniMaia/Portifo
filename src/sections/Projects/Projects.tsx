// Projetos (S-10 cabeçalho + painel em destaque; S-11 grade; doc de design §7.8, §12, §14; D14).
//
// - `Section` (DS-10) com o id `projetos` do registro (F-12; tom `alt`: #FFF7FA / #1C0E16),
//   nomeada pelo H2 do `SectionHeader` (DS-14: eyebrow, H2 e subtítulo).
// - Painel: o projeto que `projetoEmDestaque` (C-06) devolver. A cascata (a) destaque com
//   repositório → (b) "Análise de Dados de Vendas" com repositório → (c) destaque sem botões é só
//   da C-06. Se a C-06 devolver vazio, o painel não é renderizado.
// - Grade (S-11): `projetosDaGrade` (C-06), todos os projetos exceto o do painel, na ordem do array.
//   Os cards de estudo aparecem sempre, publicados ou não (D14).
// - Gancho do A-02: `data-reveal` só no contêiner de conteúdo da seção (nota B-6 do relatório de
//   execução: nada de `data-reveal` na grade). Sem animação própria (CC-6).
// - Prop `projetos` (padrão: as fichas reais do C-05) só para os testes passarem fixtures.
import { useId } from 'react';
import { Container } from '@/components/Container';
import { Section } from '@/components/Section';
import { SectionHeader } from '@/components/SectionHeader';
import { PROJECTS } from '@/content/projects';
import type { SectionId } from '@/content/sections';
import { projetoEmDestaque, projetosDaGrade } from '@/content/selectors';
import type { Project } from '@/content/types';
import { useLanguage } from '@/i18n/useLanguage';
import { FeaturedProject } from './FeaturedProject';
import { ProjectGrid } from './ProjectGrid';
import styles from './Projects.module.css';

/** Id do registro (F-12): um id fora de `SECTIONS` não compila. */
const ID_DOS_PROJETOS = 'projetos' satisfies SectionId;

export interface ProjectsProps {
  /** Fichas de projeto (padrão: as reais do C-05). Os testes passam fixtures. */
  projetos?: readonly Project[];
}

export function Projects({ projetos = PROJECTS }: ProjectsProps) {
  const { dict } = useLanguage();
  const d = dict.projetos;
  const idTitulo = useId();
  const projetoDoPainel = projetoEmDestaque(projetos);

  return (
    <Section id={ID_DOS_PROJETOS} labelledBy={idTitulo}>
      <Container>
        <div data-reveal="" className={styles.conteudo}>
          <SectionHeader
            eyebrow={d.eyebrow}
            title={d.titulo}
            subtitle={d.subtitulo}
            id={idTitulo}
          />
          {projetoDoPainel ? <FeaturedProject projeto={projetoDoPainel} /> : null}
          <ProjectGrid projetos={projetosDaGrade(projetos)} />
        </div>
      </Container>
    </Section>
  );
}
