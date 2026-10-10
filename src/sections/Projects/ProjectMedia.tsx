// Imagem do projeto em 4:3 com raio de 20 px (S-10/S-11; doc de design §7.8 "Imagem do projeto",
// §14; C-08; Portão DS B-02).
//
// - Com `imagem` na ficha: `<img>` 4:3 (`object-fit: cover`, sem distorção) com o `alt` da ficha no
//   idioma atual (C-05). O `src` é relativo e recebe a base do Vite (`import.meta.env.BASE_URL`).
// - Sem `imagem`: a ilustração ÚNICA da C-08 (`ProjectIllustration`, D14), na variante que o
//   seletor `varianteIlustracao` (C-06) devolve. Ela não é decorativa: `role="img"` + `alt` de
//   `projetos.alt.*` (a própria C-08 faz isso). A legenda de reserva PH-03
//   (`projetos.legendaReserva`) vai só para a variante `estoque` (Gerenciador de Estoque, C-08
//   passo 4) e some em produção (D11).
// - Quadro: raio `--radius-media` (20 px) e `overflow: hidden` no invólucro (B-02 do Portão DS).
// - `zoomNoHover`: a imagem amplia 3% dentro do quadro quando o card interativo em volta recebe
//   hover (painel em destaque, §7.8), em 250 ms. Com movimento reduzido, não amplia.
import { ProjectIllustration } from '@/components/illustrations';
import { varianteIlustracao } from '@/content/selectors';
import type { Project } from '@/content/types';
import { useLanguage } from '@/i18n/useLanguage';
import styles from './ProjectMedia.module.css';

export interface ProjectMediaProps {
  projeto: Project;
  /** Amplia 3% no hover do card (painel em destaque, §7.8). */
  zoomNoHover?: boolean;
  /** Classe extra do consumidor, colocada no fim. */
  className?: string;
}

export function ProjectMedia({ projeto, zoomNoHover = false, className }: ProjectMediaProps) {
  const { dict, lang } = useLanguage();
  const classes = [styles.quadro, zoomNoHover && styles.zoom, className].filter(Boolean).join(' ');
  const imagem = projeto.imagem;
  const variante = varianteIlustracao(projeto);

  return (
    <div className={classes} data-midia={imagem ? 'imagem' : 'ilustracao'}>
      {imagem ? (
        <img
          className={styles.imagem}
          src={`${import.meta.env.BASE_URL}${imagem.src.replace(/^\//, '')}`}
          alt={imagem.alt[lang]}
          loading="lazy"
          decoding="async"
        />
      ) : (
        <ProjectIllustration
          variante={variante}
          legendaReserva={variante === 'estoque' ? dict.projetos.legendaReserva : undefined}
          className={styles.ilustracao}
        />
      )}
    </div>
  );
}
