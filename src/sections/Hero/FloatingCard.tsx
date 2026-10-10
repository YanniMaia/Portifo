// Cartão flutuante de vidro do hero (S-04; doc de design §7.2 "Composição visual", §3.4; DV-8, DV-9).
//
// - Vidro do DS-17 (`GlassPanel`, raio 20 = `media`), ícone de 32 px na cor de destaque do modo
//   (`--color-accent`: #E0518A / #F58FB8), traço 1,75 (DS-06).
// - Cartão de código (DV-8): 212 × 60, texto decorativo numa linha, mono 12 px. O texto vem de
//   `decorTexts.ts` do A-15 (não é do dicionário); sem texto, o cartão não é montado pelo `HeroVisual`.
// - Gancho do doc 04 §4.4: `data-float="<nome>"` no invólucro. Amplitude, período e atraso são só
//   dos presets do A-11a (`float.css`); este componente não define nenhum. O invólucro é posicionado
//   por `left`/`top` (nunca por `transform`, que é da flutuação: restrição do A-01/A-11a).
// - Decorativo: quem monta põe `aria-hidden` na camada. Não é interativo (sem hover/foco).
import type { LucideIcon } from 'lucide-react';
import { GlassPanel } from '@/components/GlassPanel';
import { Icon } from '@/components/Icon';
import type { NomeDeFlutuacao } from '@/components/decor/float/presets';
import styles from './FloatingCard.module.css';

/** Caixa no sistema de 520 × 520 do `HeroVisual` (x, y = canto superior esquerdo). */
export interface CaixaDoCartao {
  readonly x: number;
  readonly y: number;
  readonly largura: number;
  readonly altura: number;
}

export interface FloatingCardProps {
  /** Nome do cartão = valor do `data-float` (A-11a). */
  nome: NomeDeFlutuacao;
  caixa: CaixaDoCartao;
  /** Ícone (cadeado, banco de dados, gráfico). */
  icon?: LucideIcon;
  /** Texto decorativo do cartão de código (A-15). */
  texto?: string;
}

export function FloatingCard({ nome, caixa, icon, texto }: FloatingCardProps) {
  return (
    <div
      className={styles.cartao}
      data-float={nome}
      data-card-name={nome}
      style={{ left: caixa.x, top: caixa.y, width: caixa.largura, height: caixa.altura }}
    >
      <GlassPanel radius="media" className={styles.vidro}>
        {icon ? <Icon icon={icon} size={32} className={styles.icone} /> : null}
        {texto ? <span className={styles.codigo}>{texto}</span> : null}
      </GlassPanel>
    </div>
  );
}
