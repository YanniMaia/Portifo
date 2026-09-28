// Demo do Card para o /__styleguide (DS-05: export default sem props, só em dev).
// Rótulos da ferramenta de desenvolvimento (não vão para o build). Nenhum conteúdo da Yanni: cada
// card mostra só a própria configuração. O botão interno serve para testar o `:focus-within`.
import { Card, type CardProps } from './index';

interface Exemplo {
  id: string;
  rotulo: string;
  props: Omit<CardProps, 'children'>;
  botao?: boolean;
}

const EXEMPLOS: readonly Exemplo[] = [
  { id: 'default', rotulo: 'variant="default" · repouso · raio 24 · padding 32/28/24', props: {} },
  {
    id: 'interativo',
    rotulo: 'interactive accentBar · passe o mouse ou Tab no botão (focus-within)',
    props: { interactive: true, accentBar: true },
    botao: true,
  },
  {
    id: 'hover',
    rotulo: 'interactive accentBar data-state="hover" · sobe 6 px, borda rosa, sombra, filete',
    props: { interactive: true, accentBar: true, 'data-state': 'hover' },
  },
  {
    id: 'compact',
    rotulo: 'padding="compact" · 28 px (24 no celular, §14)',
    props: { interactive: true, padding: 'compact' },
  },
  {
    id: 'panel',
    rotulo: 'variant="panel" interactive · raio 32 · padding 40 (24 no celular) · sobe 4 px',
    props: { variant: 'panel', interactive: true },
  },
  {
    id: 'panel-hover',
    rotulo: 'variant="panel" data-state="hover"',
    props: { variant: 'panel', interactive: true, 'data-state': 'hover' },
  },
  {
    id: 'dashed',
    rotulo: 'variant="dashed" · borda 1,5 px tracejada, sem sombra, nunca interativo (D21)',
    props: { variant: 'dashed', interactive: true },
  },
];

const ROTULOS = {
  botao: 'Botão interno',
} as const;

const estiloRotulo = {
  margin: 0,
  fontFamily: 'var(--font-mono)',
  fontSize: 'var(--fs-caption)',
  color: 'var(--color-text-secondary)',
  overflowWrap: 'anywhere',
} as const;

const estiloBotao = {
  minBlockSize: 'var(--touch-min)',
  marginBlockStart: 'var(--space-3)',
  paddingInline: 'var(--space-4)',
  border: 'var(--border-width) solid var(--color-border)',
  borderRadius: 'var(--radius-pill)',
  backgroundColor: 'var(--color-bg)',
  color: 'var(--color-text)',
} as const;

export default function CardDemo() {
  return (
    <div
      style={{
        display: 'grid',
        gap: 'var(--space-8)',
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
        padding: 'var(--space-4)',
      }}
    >
      {EXEMPLOS.map((ex) => (
        <div key={ex.id} data-exemplo={ex.id}>
          <Card {...ex.props}>
            <p style={estiloRotulo}>{ex.rotulo}</p>
            {ex.botao ? (
              <button type="button" style={estiloBotao}>
                {ROTULOS.botao}
              </button>
            ) : null}
          </Card>
        </div>
      ))}
    </div>
  );
}
