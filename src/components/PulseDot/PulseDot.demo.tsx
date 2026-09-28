// Demo do PulseDot para o /__styleguide (DS-05: export default sem props, só em dev).
// Os rótulos são da ferramenta de desenvolvimento (não vão para o build, como o `textos.ts`
// do DS-05). A frase ao lado do ponto é a frase de amostra do styleguide (DS-05, passo 3),
// nenhum dado da Yanni.
import { PulseDot } from './PulseDot';

const ROTULOS = {
  size8: 'size={8} (padrão) · pílula do hero, selo, disponibilidade · anel no pico: 14,4 px',
  size20: 'size={20} · nó do marco principal (§7.9) · anel de 20 → 36 px',
  emLinha: 'size={8} alinhado a uma linha de texto (gap 8 px)',
  reduzido:
    'Movimento reduzido (sistema ou checkbox da barra): sem anel, só o núcleo. Ciclo: 2,4 s.',
} as const;

const FRASE_AMOSTRA = 'Transformando conhecimento em soluções';

const estiloLinha = { display: 'grid', gap: 'var(--space-3)' } as const;
const estiloRotulo = {
  margin: 0,
  fontFamily: 'var(--font-mono)',
  fontSize: 'var(--fs-caption)',
  color: 'var(--color-text-secondary)',
} as const;
// Palco com folga para o anel (até 8 px além do núcleo de 20 px) nunca ser cortado.
const estiloPalco = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--space-2)',
  minBlockSize: 'var(--space-12)',
  paddingInline: 'var(--space-4)',
} as const;

export default function PulseDotDemo() {
  return (
    <div style={{ display: 'grid', gap: 'var(--space-6)' }}>
      <div style={estiloLinha} data-exemplo="size8">
        <p style={estiloRotulo}>{ROTULOS.size8}</p>
        <div style={estiloPalco}>
          <PulseDot />
        </div>
      </div>
      <div style={estiloLinha} data-exemplo="size20">
        <p style={estiloRotulo}>{ROTULOS.size20}</p>
        <div style={estiloPalco}>
          <PulseDot size={20} />
        </div>
      </div>
      <div style={estiloLinha} data-exemplo="em-linha">
        <p style={estiloRotulo}>{ROTULOS.emLinha}</p>
        <p style={{ ...estiloPalco, margin: 0, fontSize: 'var(--fs-caption)' }}>
          <PulseDot />
          <span>{FRASE_AMOSTRA}</span>
        </p>
      </div>
      <p style={estiloRotulo}>{ROTULOS.reduzido}</p>
    </div>
  );
}
