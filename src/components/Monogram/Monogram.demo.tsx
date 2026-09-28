// Demo do Monogram para o /__styleguide (DS-05: export default sem props, só em dev).
// Rótulos da ferramenta de desenvolvimento (não vão para o build). Iniciais e nome vêm de
// `src/content/site.ts` (F-11); nada inventado.
import { useState } from 'react';
import { site } from '@/content/site';
import { Monogram } from './index';

const ROTULOS = {
  sm: 'size="sm" · 36 × 36 · raio 12 · 14 px/800 · decorativo (aria-hidden) ao lado do nome',
  lg: 'size="lg" · 120 × 120 · círculo · 44 px/800 (hero)',
  botao:
    'as="button" (pronto para a V2; na V1 o monograma não é clicável, doc 09). O sm ganha área de toque de 44 × 44 px. Cliques:',
  botaoLabel: 'Monograma de exemplo (demo)',
  nota: 'O link do cabeçalho que envolve o sm (36 px) + o nome e tem ≥ 44 px é do S-01 (doc 03). Mesmo degradê e letras brancas nos 2 temas (R-DS-4).',
} as const;

const estiloLinha = { display: 'grid', gap: 'var(--space-3)' } as const;
const estiloRotulo = {
  margin: 0,
  fontFamily: 'var(--font-mono)',
  fontSize: 'var(--fs-caption)',
  color: 'var(--color-text-secondary)',
} as const;
const estiloNome = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 'var(--space-3)',
  margin: 0,
  fontFamily: 'var(--font-display)',
  fontSize: 'var(--fs-logo)',
  fontWeight: 'var(--fw-logo)',
  color: 'var(--color-text)',
} as const;

export default function MonogramDemo() {
  const [cliques, setCliques] = useState(0);
  return (
    <div style={{ display: 'grid', gap: 'var(--space-8)' }}>
      <div style={estiloLinha} data-exemplo="sm">
        <p style={estiloRotulo}>{ROTULOS.sm}</p>
        <p style={estiloNome}>
          <Monogram size="sm" initials={site.iniciais} />
          <span>{site.nome}</span>
        </p>
      </div>
      <div style={estiloLinha} data-exemplo="lg">
        <p style={estiloRotulo}>{ROTULOS.lg}</p>
        <div>
          <Monogram size="lg" initials={site.iniciais} />
        </div>
      </div>
      <div style={estiloLinha} data-exemplo="botao">
        <p style={estiloRotulo}>
          {ROTULOS.botao} <output data-cliques>{cliques}</output>
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-8)' }}>
          <Monogram
            as="button"
            size="sm"
            initials={site.iniciais}
            label={ROTULOS.botaoLabel}
            onClick={() => setCliques((n) => n + 1)}
          />
          <Monogram
            as="button"
            size="lg"
            initials={site.iniciais}
            label={ROTULOS.botaoLabel}
            onClick={() => setCliques((n) => n + 1)}
          />
        </div>
      </div>
      <p style={estiloRotulo}>{ROTULOS.nota}</p>
    </div>
  );
}
