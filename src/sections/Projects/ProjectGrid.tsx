// Grade de projetos de estudo (S-11; doc de design §7.8 "Projetos de estudo (grade)", §14; DV-5;
// D14) + card "Projeto de IA — em breve" como último item (S-12; DV-5; D21).
//
// - Recebe a lista pronta de `projetosDaGrade` (C-06): todos os projetos, na ordem do array, exceto
//   o do painel. Os cards aparecem sempre, publicados ou não (D14); a grade não filtra nada.
// - 3 colunas no desktop (quebra de linha com mais projetos, DV-5), 2 no tablet e 1 no celular,
//   com `--card-gap` (24/24/16). 48 px abaixo do painel no desktop e 40 px no tablet e no celular.
// - `comCardIA`: acrescenta o `AiComingSoonCard` como ÚLTIMO filho (5º item com os dados atuais).
//   Desligado, o card não existe no DOM: nenhuma célula vazia, nº de filhos = nº de cards de estudo.
// - Sem `data-reveal` aqui: o gancho do A-02 fica só na raiz de Projetos (nota B-6).
// - Sem nenhum item (lista vazia e sem o card de IA) → a grade não existe.
import type { Project } from '@/content/types';
import { AiComingSoonCard } from './AiComingSoonCard';
import { ProjectCard } from './ProjectCard';
import styles from './ProjectGrid.module.css';

export interface ProjectGridProps {
  projetos: readonly Project[];
  /** Mostra o card "Projeto de IA — em breve" no fim (decisão de `mostrarCardIA`, C-06). */
  comCardIA?: boolean;
}

export function ProjectGrid({ projetos, comCardIA = false }: ProjectGridProps) {
  if (projetos.length === 0 && !comCardIA) return null;
  return (
    <div className={styles.grade}>
      {projetos.map((projeto) => (
        <ProjectCard key={projeto.id} projeto={projeto} />
      ))}
      {comCardIA ? <AiComingSoonCard /> : null}
    </div>
  );
}
