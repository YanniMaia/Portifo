// Demo do Eyebrow para o /__styleguide (DS-05: export default sem props, só em dev).
// Os rótulos são da ferramenta de desenvolvimento (não vão para o build). Os textos dos eyebrows
// são os do doc de design (§7.4 "O que me move", §7.5 "Sobre", §7.11 "Contato"), em caixa normal:
// o CSS põe em caixa alta. Nenhum dado da Yanni inventado.
// Fundos: `--color-bg` (#FFFFFF / #150A10), `--color-bg-alt` (#FFF7FA / #1C0E16) e
// `--color-bg-tint` (#FFEEF4 / #1C0E16), as duas variantes em cada um (passo 4).
import { Eyebrow, type EyebrowTone } from './index';

const FUNDOS = [
  { id: 'bg', token: '--color-bg', rotulo: '--color-bg · #FFFFFF / #150A10' },
  { id: 'bg-alt', token: '--color-bg-alt', rotulo: '--color-bg-alt · #FFF7FA / #1C0E16' },
  { id: 'bg-tint', token: '--color-bg-tint', rotulo: '--color-bg-tint · #FFEEF4 / #1C0E16' },
] as const;

const TONS: readonly { tone: EyebrowTone; rotulo: string; texto: string }[] = [
  { tone: 'default', rotulo: 'tone="default" (#C93A77 / #FFB3D1)', texto: 'Sobre' },
  {
    tone: 'tint',
    rotulo: 'tone="tint" (#A82560 / #FFB3D1) · obrigatório sobre #FFEEF4 (D13)',
    texto: 'O que me move',
  },
];

const ROTULOS = {
  aviso:
    'tone="default" sobre #FFEEF4 reprova (#C93A77/#FFEEF4 ≈ 4,3:1). Sobre rosa clarinho, use tone="tint".',
  span: 'as="span" dentro de um parágrafo',
  spanTexto: 'Contato',
} as const;

const estiloRotulo = {
  margin: 0,
  fontFamily: 'var(--font-mono)',
  fontSize: 'var(--fs-caption)',
  color: 'var(--color-text-secondary)',
} as const;
const estiloPalco = (token: string) =>
  ({
    display: 'grid',
    gap: 'var(--space-4)',
    padding: 'var(--space-6)',
    backgroundColor: `var(${token})`,
    border: 'var(--border-width) solid var(--color-border)',
    borderRadius: 'var(--radius-icon-box)',
  }) as const;

export default function EyebrowDemo() {
  return (
    <div style={{ display: 'grid', gap: 'var(--space-6)' }}>
      {FUNDOS.map((fundo) => (
        <div key={fundo.id} style={estiloPalco(fundo.token)} data-fundo={fundo.id}>
          <p style={estiloRotulo}>{fundo.rotulo}</p>
          {TONS.map((t) => (
            <div key={t.tone} style={{ display: 'grid', gap: 'var(--space-2)' }}>
              <p style={estiloRotulo}>{t.rotulo}</p>
              <Eyebrow tone={t.tone}>{t.texto}</Eyebrow>
            </div>
          ))}
        </div>
      ))}
      <p style={estiloRotulo}>{ROTULOS.aviso}</p>
      <div style={{ display: 'grid', gap: 'var(--space-2)' }} data-exemplo="span">
        <p style={estiloRotulo}>{ROTULOS.span}</p>
        <p style={{ margin: 0 }}>
          <Eyebrow as="span">{ROTULOS.spanTexto}</Eyebrow>
        </p>
      </div>
    </div>
  );
}
