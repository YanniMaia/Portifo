// Painel do projeto em destaque (S-10; doc de design §7.8 "Projeto em destaque", "Imagem",
// "Conteúdo", "Regra dos botões", "Hover do painel", "Celular"; §14; DV-7; D14, D17, D20).
//
// - `Card variant="panel" interactive` (DS-15, `<article>`): superfície, raio 32, borda 1 px, sombra
//   de repouso; hover sobe 4 px, borda rosa e sombra de hover (camadas do DS-15). Padding 40
//   (desktop) / 32 (tablet, AMB-S-32) / 24 (celular).
// - Desktop: imagem 5/12 + conteúdo 7/12 com 48 px; abaixo de 1024 px, imagem em cima.
// - Imagem: `ProjectMedia` (imagem da ficha ou a ilustração da C-08), 4:3, raio 20, amplia 3% no
//   hover do painel.
// - Conteúdo (DV-7): selos (etiqueta da ficha + "Em destaque" + "Projeto de estudo" se a ficha
//   pedir; todos `Badge` preenchidos, D17/D20) → H3 em 32/28/24 px, 800 → descrição → chips de
//   tecnologia (DS-12 pequenos, mono) → `ProjectLinks` (só os botões da C-06).
// - O projeto chega pronto do `projetoEmDestaque` (C-06); aqui não há regra de destaque nem de botão.
// - Sem texto fixo (D5): nome, descrição e tecnologias vêm da ficha (C-05); rótulos, do dicionário.
import { Badge } from '@/components/Badge';
import { Card } from '@/components/Card';
import { Chip, ChipList } from '@/components/Chip';
import { botoesDoProjeto } from '@/content/selectors';
import type { Project } from '@/content/types';
import { useLanguage } from '@/i18n/useLanguage';
import styles from './FeaturedProject.module.css';
import { ProjectLinks } from './ProjectLinks';
import { ProjectMedia } from './ProjectMedia';

export interface FeaturedProjectProps {
  projeto: Project;
}

export function FeaturedProject({ projeto }: FeaturedProjectProps) {
  const { dict, lang } = useLanguage();
  const etiqueta = projeto.etiqueta?.[lang];

  return (
    <Card as="article" variant="panel" interactive className={styles.painel}>
      <ProjectMedia projeto={projeto} zoomNoHover className={styles.midia} />
      <div className={styles.conteudo}>
        <div className={styles.selos}>
          {etiqueta ? <Badge>{etiqueta}</Badge> : null}
          <Badge>{dict.projetos.emDestaque}</Badge>
          {projeto.projetoDeEstudo ? <Badge>{dict.projetos.seloEstudo}</Badge> : null}
        </div>
        <h3 className={styles.titulo}>{projeto.nome}</h3>
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
        <ProjectLinks botoes={botoesDoProjeto(projeto)} className={styles.botoes} />
      </div>
    </Card>
  );
}
