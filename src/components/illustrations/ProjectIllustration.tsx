// Ilustração rosa padrão do projeto, 4:3 (C-08; doc de design §7.8 "Imagem do projeto", §14 "Sem
// imagem, usar a ilustração rosa padrão", §8 "gráficos são ilustrações, não dados reais"; DV-5, DV-7).
// ÚNICA ilustração de projeto (D14): S-10 e S-11 importam esta e não criam a sua.
// - `estoque`: tabela de estoque estilizada (linhas e colunas sem texto) + mini gráfico de barras.
// - `padrao`: grade + formas abstratas + mini gráfico de linha, para qualquer projeto sem imagem.
// Regra de ouro: nenhum texto, número, eixo ou dado dentro do SVG. As medidas abaixo são só formas.
// Cores: todo `fill`/`stroke` é `var(--…)` de token do DS-01 (claro e escuro); os mini gráficos
// (A-17) trazem as próprias cores por classe (`--deco-chart-1/2`, aliases do DS-01).
// Acessibilidade: não é decorativa (representa o projeto, §11) → `role="img"` + `aria-label` com o
// `alt` do Anexo A.9 (`projetos.alt.*`), no idioma atual.
// `legendaReserva` (PH-03): só o Gerenciador de Estoque recebe; vira `PlaceholderMark` em bloco
// abaixo do SVG e some em produção (D11).
import { MiniBarChart, MiniLineChart } from '@/components/decor/MiniCharts';
import { PlaceholderMark } from '@/components/PlaceholderMark';
import { useLanguage } from '@/i18n/useLanguage';
import styles from './ProjectIllustration.module.css';

export type ProjectIllustrationVariant = 'estoque' | 'padrao';

export interface ProjectIllustrationProps {
  /** `estoque` (Gerenciador de Estoque) ou `padrao` (qualquer projeto sem imagem). */
  variante: ProjectIllustrationVariant;
  /** Texto de reserva (PH-03, `projetos.legendaReserva`). Em produção é `''` e nada aparece. */
  legendaReserva?: string;
  /** Classe extra no contêiner (tamanho e cantos dados pelo consumidor). */
  className?: string;
}

/** Caixa 4:3 do SVG. */
const LARGURA = 400;
const ALTURA = 300;

const COR = {
  fundo: 'var(--color-bg-alt)',
  superficie: 'var(--color-surface)',
  borda: 'var(--color-border)',
  suave: 'var(--color-fill-soft)',
  decoSuave: 'var(--color-deco-soft)',
  deco: 'var(--color-deco)',
  destaque: 'var(--color-accent)',
  brilho: 'var(--glow-deco)',
  contornoForma: 'var(--deco-shape-stroke)',
} as const;

/* ------------------------------ Variante "estoque" ------------------------------ */

/** Linhas da tabela: larguras das barras das colunas 1 e 2 (formas, não dados). */
const LINHAS_DA_TABELA = [
  { y: 90, col1: 60, col2: 36 },
  { y: 122, col1: 74, col2: 28 },
  { y: 154, col1: 52, col2: 42, destaque: true },
  { y: 186, col1: 68, col2: 30 },
  { y: 218, col1: 58, col2: 38 },
] as const;

function Estoque() {
  return (
    <>
      <rect width={LARGURA} height={ALTURA} fill={COR.fundo} />
      <circle cx={360} cy={30} r={90} fill={COR.brilho} />
      <circle cx={24} cy={290} r={70} fill={COR.suave} />

      {/* Cartão da tabela */}
      <rect
        x={28}
        y={40}
        width={230}
        height={220}
        rx={14}
        fill={COR.superficie}
        stroke={COR.borda}
        strokeWidth={1.5}
      />
      {/* Cabeçalho: três colunas */}
      <rect x={44} y={54} width={70} height={10} rx={5} fill={COR.deco} />
      <rect x={128} y={54} width={50} height={10} rx={5} fill={COR.deco} />
      <rect x={194} y={54} width={48} height={10} rx={5} fill={COR.deco} />
      <rect x={40} y={76} width={206} height={1.5} fill={COR.borda} />

      {LINHAS_DA_TABELA.map((linha, i) => (
        <g key={linha.y} data-linha-tabela="">
          {'destaque' in linha ? (
            <rect x={34} y={linha.y - 6} width={218} height={26} rx={6} fill={COR.suave} />
          ) : null}
          <rect x={44} y={linha.y} width={linha.col1} height={8} rx={4} fill={COR.borda} />
          <rect x={128} y={linha.y} width={linha.col2} height={8} rx={4} fill={COR.borda} />
          <rect
            x={194}
            y={linha.y - 3}
            width={40}
            height={14}
            rx={7}
            fill={COR.suave}
            stroke={COR.decoSuave}
            strokeWidth={1}
          />
          <circle
            cx={203}
            cy={linha.y + 4}
            r={3}
            fill={'destaque' in linha ? COR.destaque : COR.deco}
          />
          {i < LINHAS_DA_TABELA.length - 1 ? (
            <rect x={40} y={linha.y + 22} width={206} height={1} fill={COR.borda} />
          ) : null}
        </g>
      ))}

      {/* Cartão do mini gráfico de barras */}
      <rect
        x={274}
        y={96}
        width={104}
        height={120}
        rx={14}
        fill={COR.superficie}
        stroke={COR.borda}
        strokeWidth={1.5}
      />
      <rect x={288} y={110} width={44} height={8} rx={4} fill={COR.decoSuave} />
      <MiniBarChart x={287} y={138} width={78} height={60} />
    </>
  );
}

/* ------------------------------ Variante "padrao" ------------------------------ */

/** Grade suave: uma linha a cada 40 unidades (desenhada como um único <path>, sem <line>). */
const PASSO_DA_GRADE = 40;
const CAMINHO_DA_GRADE = [
  ...Array.from({ length: LARGURA / PASSO_DA_GRADE - 1 }, (_, i) => {
    const x = (i + 1) * PASSO_DA_GRADE;
    return `M${x} 0V${ALTURA}`;
  }),
  ...Array.from({ length: ALTURA / PASSO_DA_GRADE }, (_, i) => {
    const y = (i + 1) * PASSO_DA_GRADE - 10;
    return `M0 ${y}H${LARGURA}`;
  }),
].join('');

function Padrao() {
  return (
    <>
      <rect width={LARGURA} height={ALTURA} fill={COR.fundo} />
      <path d={CAMINHO_DA_GRADE} fill="none" stroke={COR.borda} strokeWidth={1} />

      {/* Formas abstratas */}
      <circle
        cx={322}
        cy={66}
        r={46}
        fill={COR.suave}
        stroke={COR.contornoForma}
        strokeWidth={1.5}
      />
      <circle cx={66} cy={238} r={30} fill={COR.decoSuave} />
      <circle cx={88} cy={66} r={14} fill="none" stroke={COR.destaque} strokeWidth={2} />
      <rect
        x={300}
        y={200}
        width={56}
        height={56}
        rx={12}
        transform="rotate(12 328 228)"
        fill="none"
        stroke={COR.deco}
        strokeWidth={2}
      />
      <circle cx={46} cy={130} r={5} fill={COR.deco} />
      <circle cx={360} cy={150} r={4} fill={COR.destaque} />
      <circle cx={250} cy={262} r={6} fill={COR.decoSuave} />

      {/* Cartão do mini gráfico de linha */}
      <rect
        x={100}
        y={90}
        width={200}
        height={130}
        rx={16}
        fill={COR.superficie}
        stroke={COR.borda}
        strokeWidth={1.5}
      />
      <rect x={120} y={106} width={64} height={8} rx={4} fill={COR.decoSuave} />
      <rect x={120} y={120} width={40} height={6} rx={3} fill={COR.borda} />
      <MiniLineChart x={140} y={132} width={120} height={80} />
    </>
  );
}

export function ProjectIllustration({
  variante,
  legendaReserva,
  className,
}: ProjectIllustrationProps) {
  const { dict } = useLanguage();
  const classes = [styles.ilustracao, className].filter(Boolean).join(' ');

  return (
    <div className={classes} data-ilustracao={variante}>
      <svg
        className={styles.svg}
        viewBox={`0 0 ${LARGURA} ${ALTURA}`}
        preserveAspectRatio="xMidYMid slice"
        role="img"
        aria-label={dict.projetos.alt[variante]}
        focusable="false"
      >
        {variante === 'estoque' ? <Estoque /> : <Padrao />}
      </svg>
      {legendaReserva !== undefined ? (
        <PlaceholderMark kind="block" value={legendaReserva} className={styles.legenda} />
      ) : null}
    </div>
  );
}
