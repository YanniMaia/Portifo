// Card de projeto da grade (S-11; doc de design §7.8 "Projetos de estudo", "Selo de honestidade",
// §12.1–12.5, §14; DV-5; D14, D17).
//
// - `Card as="article" interactive accentBar padding="compact"` (DS-15): superfície, borda 1 px,
//   raio 24, padding 28 (24 no celular, AMB-S-11). Hover igual ao dos cards de interesse (S-08):
//   sobe 6 px, borda rosa, sombra de hover e filete de 3 px, tudo do DS-15.
// - Topo: `ProjectMedia` (imagem 4:3 da ficha ou a ilustração da C-08 com `role="img"` + `alt`).
// - Linha de selos: etiqueta da ficha + "Projeto de estudo" quando a ficha indica dados fictícios
//   (`Badge` preenchido: #FFEEF4 / #A82560, 12 px, D17).
// - H3; descrição cortada em 3 linhas (o texto inteiro continua no DOM, para o leitor de tela);
//   chips de tecnologia pequenos e mono (DS-12); `ProjectLinks size="compacto"` (44 px) na base.
// - O card aparece sempre (D14). Os botões são exatamente os de `botoesDoProjeto` (C-06): sem
//   repositório publicado, nenhum.
// - Sem texto fixo (D5): textos da ficha (C-05) e do dicionário.
import { Badge } from '@/components/Badge';
import { Card } from '@/components/Card';
import { Chip, ChipList } from '@/components/Chip';
import { botoesDoProjeto } from '@/content/selectors';
import type { Project } from '@/content/types';
import { useLanguage } from '@/i18n/useLanguage';
import styles from './ProjectCard.module.css';
import { ProjectLinks } from './ProjectLinks';
import { ProjectMedia } from './ProjectMedia';

export interface ProjectCardProps {
  projeto: Project;
}

export function ProjectCard({ projeto }: ProjectCardProps) {
  const { dict, lang } = useLanguage();
  const etiqueta = projeto.etiqueta?.[lang];
  const temSelos = Boolean(etiqueta) || projeto.projetoDeEstudo;

  return (
    <Card as="article" interactive accentBar padding="compact" className={styles.card}>
      <ProjectMedia projeto={projeto} />
      {temSelos ? (
        <div className={styles.selos}>
          {etiqueta ? <Badge>{etiqueta}</Badge> : null}
          {projeto.projetoDeEstudo ? <Badge>{dict.projetos.seloEstudo}</Badge> : null}
        </div>
      ) : null}
      <h3 className={`t-h3 ${styles.titulo}`}>{projeto.nome}</h3>
      <p className={`t-body ${styles.descricao}`}>{projeto.descricao[lang]}</p>
      {projeto.tecnologias.length > 0 ? (
        <ChipList gap="sm" className={styles.chips}>
          {projeto.tecnologias.map((tecnologia) => (
            <Chip key={tecnologia} size="sm" mono>
              {tecnologia}
            </Chip>
          ))}
        </ChipList>
      ) : null}
      <ProjectLinks botoes={botoesDoProjeto(projeto)} size="compacto" className={styles.botoes} />
    </Card>
  );
}
