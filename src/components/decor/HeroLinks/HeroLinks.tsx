// Ligações de rede do hero (A-14; doc de design §7.2 "Composição visual"; doc 04 §5; DV-8, DV-9).
// Dono único das linhas que ligam os cartões flutuantes ao cartão central (N27): o S-04 usa este
// componente e não cria outro. SVG `viewBox 0 0 520 520`, que ocupa a área do `HeroVisual` e
// escala junto com ela. Cada cartão recebido em `cards` ganha uma linha de 1 px em
// `--deco-network-line` e dois nós de 8 px em `--deco-node` (um em cada ponta). Cartão ausente
// (ex.: o de código no celular, DV-9) não tem linha. Estático, sem texto, `aria-hidden`.
import { LADO_DO_HERO, type LigacaoDoHero } from './ligacoes';
import styles from './HeroLinks.module.css';

/** Raio do nó no sistema de 520 (8 px de diâmetro na escala 1). */
const RAIO_DO_NO = 4;

export interface HeroLinksProps {
  /** Ligações a desenhar: 4 no desktop e no tablet, 3 no celular (sem `code`). */
  cards: readonly LigacaoDoHero[];
  /** Classe extra (camada no `HeroVisual`). */
  className?: string;
}

export function HeroLinks({ cards, className }: HeroLinksProps) {
  const classes = [styles.links, className].filter(Boolean).join(' ');
  // Um cartão aparece uma vez só, mesmo que venha repetido.
  const unicos = cards.filter((c, i) => cards.findIndex((o) => o.nome === c.nome) === i);

  return (
    <svg
      className={classes}
      viewBox={`0 0 ${LADO_DO_HERO} ${LADO_DO_HERO}`}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
      data-decor="network"
    >
      {unicos.map(({ nome, cartao, centro }) => (
        <g key={nome} data-card={nome}>
          <line className={styles.linha} x1={cartao.x} y1={cartao.y} x2={centro.x} y2={centro.y} />
          <circle className={styles.no} cx={cartao.x} cy={cartao.y} r={RAIO_DO_NO} />
          <circle className={styles.no} cx={centro.x} cy={centro.y} r={RAIO_DO_NO} />
        </g>
      ))}
    </svg>
  );
}
