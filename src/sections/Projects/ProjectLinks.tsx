// Botões de um projeto (S-10, reutilizado no S-11; doc de design §7.8 "Regra dos botões", §11, §14;
// D11, D14).
//
// - Renderiza EXATAMENTE os botões que `botoesDoProjeto` (C-06) devolver, na ordem dele. A regra de
//   quais existem (link real, `publicado`) é só da C-06; aqui não se decide nada.
// - "Ver projeto" = primário; "GitHub" = secundário com o ícone de marca `Github` de 20 px (DS-06,
//   `marcas.ts`). Os dois são externos: `ButtonLink external` (DS-11) abre em nova aba com
//   `rel="noopener noreferrer"` e o aviso oculto "(abre em nova aba)".
// - Sem nenhum botão, o bloco não existe (nenhum espaço vazio).
// - `size`: `normal` (52/52/48 px) ou `compacto` (44 px, cards da grade, §14). No celular, largura
//   total (`fullWidthOnMobile`).
// - Rótulos pela `rotuloChave` do seletor, lidos do dicionário (D5).
import { ButtonLink } from '@/components/Button';
import { Github } from '@/components/Icon';
import type { BotaoProjeto } from '@/content/selectors';
import type { Dictionary } from '@/i18n/types';
import { useLanguage } from '@/i18n/useLanguage';
import styles from './ProjectLinks.module.css';

export type ProjectLinksSize = 'normal' | 'compacto';

export interface ProjectLinksProps {
  botoes: readonly BotaoProjeto[];
  size?: ProjectLinksSize;
  /** Classe extra do consumidor, colocada no fim. */
  className?: string;
}

/** Texto de cada `rotuloChave` da C-06 no dicionário atual. */
const ROTULO: Record<BotaoProjeto['rotuloChave'], (d: Dictionary) => string> = {
  'projetos.botaoVer': (d) => d.projetos.botaoVer,
  'projetos.botaoGithub': (d) => d.projetos.botaoGithub,
};

export function ProjectLinks({ botoes, size = 'normal', className }: ProjectLinksProps) {
  const { dict } = useLanguage();
  if (botoes.length === 0) return null;
  const classes = [styles.links, className].filter(Boolean).join(' ');

  return (
    <div className={classes} data-size={size}>
      {botoes.map((botao) => (
        <ButtonLink
          key={botao.tipo}
          href={botao.href}
          external
          variant={botao.tipo === 'verProjeto' ? 'primary' : 'secondary'}
          size={size === 'compacto' ? 'compact' : 'default'}
          iconLeft={botao.tipo === 'github' ? Github : undefined}
          fullWidthOnMobile
        >
          {ROTULO[botao.rotuloChave](dict)}
        </ButtonLink>
      ))}
    </div>
  );
}
