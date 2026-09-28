// Constelação de nós de rede (A-14; doc de design §8 "Nós de rede"; doc 04 §5 e §7).
// SVG decorativo: pontos de 6 a 8 px em `--deco-node` ligados por linhas de 1 px em
// `--deco-network-line`, com o desenho recebido por prop (`designs.ts`). Cada nó cintila
// (opacidade 1 → 0,5 → 1) no próprio período de 6 a 10 s e tem `data-loop`, para o observador do
// A-01 pausar fora da tela e com a aba oculta. Com movimento reduzido, os nós ficam parados e
// visíveis. Sem texto, fora da árvore de acessibilidade e sem eventos de ponteiro.
import type { CSSProperties } from 'react';
import type { DesenhoDeConstelacao } from './designs';
import styles from './Constellation.module.css';

export interface ConstellationProps {
  /** Pontos, ligações e cintilar (ver `CONSTELACOES` em `designs.ts`). */
  desenho: DesenhoDeConstelacao;
  /** Classe extra (posição no canto, dada pelo consumidor). */
  className?: string;
}

type EstiloDoNo = CSSProperties & Record<'--twinkle-dur' | '--twinkle-delay', string>;

export function Constellation({ desenho, className }: ConstellationProps) {
  const { largura, altura, pontos, ligacoes, cintilar } = desenho;
  const classes = [styles.constelacao, className].filter(Boolean).join(' ');

  return (
    <svg
      className={classes}
      width={largura}
      height={altura}
      viewBox={`0 0 ${largura} ${altura}`}
      aria-hidden="true"
      focusable="false"
      data-decor="network"
      data-constellation={desenho.id}
    >
      <g className={styles.ligacoes}>
        {ligacoes.map(([a, b]) => {
          const p = pontos[a];
          const q = pontos[b];
          if (!p || !q) return null;
          return <line key={`${a}-${b}`} x1={p.x} y1={p.y} x2={q.x} y2={q.y} />;
        })}
      </g>
      {pontos.map((p, i) => {
        const c = cintilar[i];
        const estilo: EstiloDoNo = {
          '--twinkle-dur': `${c?.periodoS ?? 8}s`,
          '--twinkle-delay': `${c?.atrasoS ?? 0}s`,
        };
        return (
          <circle
            key={i}
            className={styles.no}
            cx={p.x}
            cy={p.y}
            r={p.r}
            style={estilo}
            data-loop=""
          />
        );
      })}
    </svg>
  );
}
