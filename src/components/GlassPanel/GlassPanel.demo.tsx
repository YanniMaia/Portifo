// Demo do GlassPanel para o /__styleguide (DS-05: export default sem props, só em dev).
// Rótulos da ferramenta de desenvolvimento (não vão para o build). Sem dados da Yanni.
// Palco que imita o fundo do hero (passo 6): brilhos `--hero-glow-*`, grade `--deco-grid-line` e
// dois círculos rosa atrás dos painéis, para o desfoque ficar visível.
import { GlassPanel, type GlassPanelProps } from './index';

interface Exemplo {
  id: string;
  rotulo: string;
  props: Omit<GlassPanelProps, 'children'>;
}

const EXEMPLOS: readonly Exemplo[] = [
  {
    id: 'glass-media',
    rotulo: 'variant="glass" radius="media" (20 px) · cartões flutuantes',
    props: { radius: 'media', padding: 'md' },
  },
  {
    id: 'glass-card',
    rotulo: 'variant="glass" radius="card" (24 px) · faixa de destaques, trilhas',
    props: { radius: 'card', padding: 'md' },
  },
  {
    id: 'glass-panel',
    rotulo: 'variant="glass" radius="panel" (32 px) · cartão do hero',
    props: { radius: 'panel', padding: 'lg' },
  },
  {
    id: 'header',
    rotulo: 'variant="header" · antes da rolagem (sem sombra)',
    props: { variant: 'header', padding: 'md' },
  },
  {
    id: 'header-scrolled',
    rotulo: 'variant="header" scrolled · data-scrolled="true" (sombra acesa)',
    props: { variant: 'header', scrolled: true, padding: 'md' },
  },
  {
    id: 'menu',
    rotulo: 'variant="menu" · painel do menu no celular',
    props: { variant: 'menu', padding: 'md' },
  },
];

const ROTULOS = {
  nota: 'Uso restrito a 5 lugares: cabeçalho (e menu), cartão do hero, cartões flutuantes, faixa de destaques e trilhas.',
} as const;

const estiloRotulo = {
  margin: 0,
  fontFamily: 'var(--font-mono)',
  fontSize: 'var(--fs-caption)',
  color: 'var(--color-text)',
  overflowWrap: 'anywhere',
} as const;

const estiloPalco = {
  position: 'relative',
  display: 'grid',
  gap: 'var(--space-8)',
  padding: 'var(--space-8) var(--space-4)',
  overflow: 'hidden',
  borderRadius: 'var(--radius-card)',
  backgroundColor: 'var(--color-bg)',
  backgroundImage:
    'var(--hero-glow-1), var(--hero-glow-2), linear-gradient(var(--deco-grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--deco-grid-line) 1px, transparent 1px)',
  backgroundSize: '100% 100%, 100% 100%, 32px 32px, 32px 32px',
} as const;

// Círculos que ficam atrás dos painéis para o desfoque aparecer.
const circulo = (topo: string, esquerda: string, cor: string) =>
  ({
    position: 'absolute',
    top: topo,
    left: esquerda,
    width: '160px',
    height: '160px',
    borderRadius: '50%',
    backgroundColor: cor,
  }) as const;

export default function GlassPanelDemo() {
  return (
    <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
      <div style={estiloPalco}>
        <span aria-hidden="true" style={circulo('8%', '10%', 'var(--color-accent)')} />
        <span aria-hidden="true" style={circulo('45%', '55%', 'var(--color-deco)')} />
        <span aria-hidden="true" style={circulo('75%', '5%', 'var(--color-link)')} />
        {EXEMPLOS.map((ex) => (
          <div key={ex.id} data-exemplo={ex.id} style={{ position: 'relative' }}>
            <GlassPanel {...ex.props}>
              <p style={estiloRotulo}>{ex.rotulo}</p>
            </GlassPanel>
          </div>
        ))}
      </div>
      <p style={{ ...estiloRotulo, color: 'var(--color-text-secondary)' }}>{ROTULOS.nota}</p>
    </div>
  );
}
