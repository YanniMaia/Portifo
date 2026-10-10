// Composição visual do hero (S-04; doc de design §7.2 "Composição visual", "Interação extra" e
// "Celular", §3.4, §8, §10; DV-8, DV-9, DV-17; D13, D15, D22).
//
// - Palco de 520 × 520 (sistema de coordenadas do A-14) escalado por igual: 520 px no desktop,
//   420 no tablet e 320 no celular (CSS). A dica não escala (fica fora do palco, em 14 px).
// - Camadas, de trás para a frente: halo (`--glow-deco`), cartão central de vidro 300 × 300 raio 32
//   (DS-17), ligações de rede (`HeroLinks` do A-14, acima do central e abaixo dos flutuantes, como o
//   A-14 sugere), cartões flutuantes (`data-float`, A-11a), o monograma 120 px (DS-18) e, se houver,
//   a camada `burstLayer` (A-18).
// - Posições: as caixas propostas do A-14 (`CAIXAS_PROPOSTAS`, `CARTAO_CENTRAL`), fonte única das
//   coordenadas que as ligações também usam.
// - Celular: só cadeado, banco de dados e gráfico (DV-9). O cartão de código só existe com o texto
//   `codeText` (A-15, `decorTexts.ts`); na V1 o A-15 é V2 e o cartão não é montado (doc 09).
// - Props do doc 04 §4.4 (D22), com os padrões de lá: `monogramInteractive` (true),
//   `onMonogramActivate`, `showHint` (true) e `burstLayer`. Quem decide os valores é o `Hero.tsx`
//   (na V1: monograma não clicável e sem dica, doc 09).
// - Tudo é `aria-hidden`, exceto o botão do monograma e a dica. Sem texto fixo (D5) e sem
//   animação própria (CC-6).
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { ChartColumn, Database, Lock } from 'lucide-react';
import { GlassPanel } from '@/components/GlassPanel';
import { Monogram } from '@/components/Monogram';
import {
  CAIXAS_PROPOSTAS,
  CARTAO_CENTRAL,
  HeroLinks,
  ligacoesPara,
} from '@/components/decor/HeroLinks';
import { FLUTUANTES_NO_CELULAR, type NomeDeFlutuacao } from '@/components/decor/float/presets';
import { site } from '@/content/site';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useLanguage } from '@/i18n/useLanguage';
import { mq } from '@/styles/breakpoints';
import { FloatingCard } from './FloatingCard';
import styles from './HeroVisual.module.css';

/** Ícone de cada cartão flutuante (DS-06; `ChartColumn` é o nome novo de `BarChart3`). */
const ICONES: Record<Exclude<NomeDeFlutuacao, 'code'>, LucideIcon> = {
  lock: Lock,
  database: Database,
  chart: ChartColumn,
};

export interface HeroVisualProps {
  /** Monograma como `<button>` (padrão `true`, doc 04 §4.4). Com `false`, é decorativo. */
  monogramInteractive?: boolean;
  /** Chamada no clique, Enter ou Espaço do monograma (A-18). */
  onMonogramActivate?: () => void;
  /** Mostra a dica "Clique no YE" (padrão `true`), só com o monograma interativo. */
  showHint?: boolean;
  /** Camada sobre o cartão central (explosão do A-18), `aria-hidden` e sem ponteiro. */
  burstLayer?: ReactNode;
  /** Texto do cartão de código (`decorTexts.ts`, A-15). Sem ele, o cartão não existe. */
  codeText?: string;
  /** Retrato da Yanni no lugar do "YE" (pendência P-08). Hoje não é passado. */
  portrait?: ReactNode;
}

function existe(no: ReactNode): boolean {
  return no !== undefined && no !== null && no !== false;
}

export function HeroVisual({
  monogramInteractive = true,
  onMonogramActivate,
  showHint = true,
  burstLayer,
  codeText,
  portrait,
}: HeroVisualProps) {
  const { dict } = useLanguage();
  const naoCelular = useMediaQuery(mq.tablet);
  const comCodigo = naoCelular && Boolean(codeText);
  const nomes: NomeDeFlutuacao[] = comCodigo
    ? [...FLUTUANTES_NO_CELULAR, 'code']
    : [...FLUTUANTES_NO_CELULAR];
  const mostrarDica = monogramInteractive && showHint;
  const ativar = () => onMonogramActivate?.();

  let centro: ReactNode;
  if (existe(portrait)) {
    centro = monogramInteractive ? (
      <button
        type="button"
        className={`${styles.retrato} ${styles.interativo}`}
        aria-label={dict.hero.monogramaAria}
        onClick={ativar}
      >
        {portrait}
      </button>
    ) : (
      <span className={styles.retrato}>{portrait}</span>
    );
  } else {
    centro = monogramInteractive ? (
      <Monogram
        as="button"
        size="lg"
        initials={site.iniciais}
        label={dict.hero.monogramaAria}
        onClick={ativar}
        className={styles.interativo}
      />
    ) : (
      <Monogram size="lg" initials={site.iniciais} />
    );
  }

  return (
    <div className={styles.visual} data-hero-visual="">
      <div className={styles.caixa}>
        <div className={styles.palco}>
          <div className={styles.halo} aria-hidden="true" />
          <div
            className={styles.central}
            aria-hidden="true"
            style={{
              left: CARTAO_CENTRAL.x,
              top: CARTAO_CENTRAL.y,
              width: CARTAO_CENTRAL.largura,
              height: CARTAO_CENTRAL.altura,
            }}
          >
            <GlassPanel radius="panel" className={styles.vidroCentral} />
          </div>
          <HeroLinks cards={ligacoesPara(nomes)} className={styles.links} />
          <div className={styles.flutuantes} aria-hidden="true">
            {nomes.map((nome) =>
              nome === 'code' ? (
                <FloatingCard
                  key={nome}
                  nome={nome}
                  caixa={CAIXAS_PROPOSTAS[nome]}
                  texto={codeText}
                />
              ) : (
                <FloatingCard
                  key={nome}
                  nome={nome}
                  caixa={CAIXAS_PROPOSTAS[nome]}
                  icon={ICONES[nome]}
                />
              ),
            )}
          </div>
          <div
            className={styles.slot}
            style={{
              left: CARTAO_CENTRAL.x,
              top: CARTAO_CENTRAL.y,
              width: CARTAO_CENTRAL.largura,
              height: CARTAO_CENTRAL.altura,
            }}
          >
            {centro}
          </div>
          {existe(burstLayer) ? (
            <div
              className={styles.burst}
              aria-hidden="true"
              style={{
                left: CARTAO_CENTRAL.x,
                top: CARTAO_CENTRAL.y,
                width: CARTAO_CENTRAL.largura,
                height: CARTAO_CENTRAL.altura,
              }}
            >
              {burstLayer}
            </div>
          ) : null}
        </div>
      </div>
      {mostrarDica ? <p className={styles.dica}>{dict.hero.dicaMonograma}</p> : null}
    </div>
  );
}
