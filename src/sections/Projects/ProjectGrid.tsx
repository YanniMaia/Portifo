// Grade de projetos de estudo (S-11; doc de design §7.8 "Projetos de estudo (grade)", §14; DV-5;
// D14).
//
// - Recebe a lista pronta de `projetosDaGrade` (C-06): todos os projetos, na ordem do array, exceto
//   o do painel. Os cards aparecem sempre, publicados ou não (D14); a grade não filtra nada.
// - 3 colunas no desktop (quebra de linha com mais projetos, DV-5), 2 no tablet e 1 no celular,
//   com `--card-gap` (24/24/16). 48 px abaixo do painel no desktop e 40 px no tablet e no celular.
// - Sem `data-reveal` aqui: o gancho do A-02 fica só na raiz de Projetos (nota B-6).
// - Lista vazia → a grade não existe.
import type { Project } from '@/content/types';
import { ProjectCard } from './ProjectCard';
import styles from './ProjectGrid.module.css';

export interface ProjectGridProps {
  projetos: readonly Project[];
}

export function ProjectGrid({ projetos }: ProjectGridProps) {
  if (projetos.length === 0) return null;
  return (
    <div className={styles.grade}>
      {projetos.map((projeto) => (
        <ProjectCard key={projeto.id} projeto={projeto} />
      ))}
    </div>
  );
}
