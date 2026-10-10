// Coluna de texto do hero (S-03; doc de design §7.2, §4, §3.4; índice §3 — pílula e subtítulo com IA;
// DV-1; D13).
//
// - Pílula: `Badge size="lg" mono dot` (DS-13): 36 px, padding 0 16, fundo #FFEEF4, borda #F9D5E3,
//   13 px mono #A82560 e o `PulseDot` de 8 px (DS-08). Texto `hero.pilula` (sugerido, IA).
// - H1 (único da página): "Olá, eu sou" + "Yanni Elyssa." com `GradientText` (DS-07). A quebra entre
//   as duas partes é forçada só no desktop (o nome vira bloco no CSS); abaixo de 1024 px o título
//   flui numa frase só. `tabIndex={-1}`: a rolagem do F-13 (`scrollToTop`) foca o H1.
// - Subtítulo e frase de assinatura: opcionais. Sem valor (ou placeholder em produção), o bloco não
//   é renderizado e não deixa espaço (D11); placeholder em dev aparece marcado (`PlaceholderMark`).
// - Botões (`ButtonLink`, DS-11): "Ver meus projetos" (primário, seta) → `#projetos` e "Entre em
//   contato" (secundário) → `#contato`. Clique simples usa a rolagem do F-13 (offset de 80 px, foco
//   no H2); clique com modificador segue o `href` nativo, que também funciona sem JS.
// - Sem texto fixo (D5) e sem animação própria (CC-6): o hero aparece pronto.
import type { MouseEvent } from 'react';
import { Badge } from '@/components/Badge';
import { ButtonLink } from '@/components/Button';
import { GradientText } from '@/components/GradientText';
import { PlaceholderMark } from '@/components/PlaceholderMark';
import type { SectionId } from '@/content/sections';
import { useLanguage } from '@/i18n/useLanguage';
import { resolveOptional } from '@/lib/placeholder';
import { scrollToSection } from '@/lib/scroll';
import { eCliqueSimples } from '../Header/navegacao';
import styles from './Hero.module.css';

/** Destinos dos botões (§7.2). `satisfies` garante que os ids existem no registro da F-12. */
const ALVO_PROJETOS = 'projetos' satisfies SectionId;
const ALVO_CONTATO = 'contato' satisfies SectionId;

export interface HeroTextProps {
  /** Id do H1, usado pelo `aria-labelledby` da seção. */
  idTitulo: string;
}

const irPara = (id: SectionId) => (evento: MouseEvent<HTMLAnchorElement>) => {
  if (!eCliqueSimples(evento)) return;
  evento.preventDefault();
  scrollToSection(id);
};

export function HeroText({ idTitulo }: HeroTextProps) {
  const { dict } = useLanguage();
  const subtitulo = resolveOptional(dict.hero.subtitulo);
  const assinatura = resolveOptional(dict.hero.assinatura);

  return (
    <div className={styles.texto}>
      <Badge size="lg" mono dot className={styles.pilula}>
        {dict.hero.pilula}
      </Badge>

      <h1 id={idTitulo} className={`t-h1 ${styles.titulo}`} tabIndex={-1}>
        <span>{dict.hero.tituloLinha1}</span>{' '}
        <GradientText className={styles.nome}>{dict.hero.tituloNome}</GradientText>
      </h1>

      {subtitulo ? (
        <p className={`t-hero-sub ${styles.subtitulo}`}>
          <PlaceholderMark value={subtitulo} />
        </p>
      ) : null}

      {assinatura ? (
        <p className={styles.assinatura}>
          <PlaceholderMark value={assinatura} />
        </p>
      ) : null}

      <div className={styles.botoes}>
        <ButtonLink
          variant="primary"
          arrow
          fullWidthOnMobile
          href={`#${ALVO_PROJETOS}`}
          onClick={irPara(ALVO_PROJETOS)}
        >
          {dict.hero.botaoProjetos}
        </ButtonLink>
        <ButtonLink
          variant="secondary"
          fullWidthOnMobile
          href={`#${ALVO_CONTATO}`}
          onClick={irPara(ALVO_CONTATO)}
        >
          {dict.hero.botaoContato}
        </ButtonLink>
      </div>
    </div>
  );
}
