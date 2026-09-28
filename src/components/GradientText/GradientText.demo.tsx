// Demo do GradientText para o /__styleguide (DS-05: export default sem props, só em dev).
// Os rótulos são da ferramenta de desenvolvimento (não vão para o build, como o `textos.ts`
// do DS-05). Textos de exemplo: o nome vem de `src/content/site.ts` (F-11) e a frase é a frase
// de amostra do styleguide (DS-05, passo 3). Nenhum dado da Yanni inventado: a demo de 36 px
// usa as iniciais, e não um número de destaque (os valores da faixa §7.3 são da S-04).
// Tamanhos em px literal: são os pedidos pelo passo 3 da DS-07 (68, 48, 36 e 17 px).
import { site } from '@/content/site';
import { GradientText } from './GradientText';

const FRASE_AMOSTRA = 'Transformando conhecimento em soluções';

const EXEMPLOS = [
  { id: '68', px: 68, rotulo: '68 px · peso 800 · nome no hero (§7.2)', texto: site.nome },
  { id: '48', px: 48, rotulo: '48 px · peso 800 · frase de destaque (§7.4)', texto: FRASE_AMOSTRA },
  {
    id: '36',
    px: 36,
    rotulo: '36 px · peso 800 · valores da faixa de destaques (§7.3) · menor tamanho permitido',
    texto: site.iniciais,
  },
] as const;

const ROTULOS = {
  quebra:
    '48 px em caixa de 280 px · quebra de linha: cada linha recebe o degradê inteiro (box-decoration-break: clone)',
  strong: 'as="strong" · mesmo visual, ênfase semântica',
  proibido: '17 px · USO PROIBIDO abaixo de 36 px (R-DS-5 / D19) · só para comparação',
  notas:
    'Sem suporte a background-clip: text → cor sólida --color-link. Alto contraste (forced-colors) → cor do texto do sistema. Texto selecionável e copiável.',
} as const;

const estiloLinha = { display: 'grid', gap: 'var(--space-2)' } as const;
const estiloRotulo = {
  margin: 0,
  fontFamily: 'var(--font-mono)',
  fontSize: 'var(--fs-caption)',
  color: 'var(--color-text-secondary)',
} as const;
const estiloTexto = (px: number) =>
  ({
    margin: 0,
    fontFamily: 'var(--font-display)',
    fontWeight: 800,
    fontSize: `${px}px`,
    lineHeight: 1.1,
    overflowWrap: 'anywhere',
  }) as const;
// Aviso do exemplo proibido: borda tracejada no rosa de destaque (só tokens da paleta).
const estiloProibido = {
  ...estiloLinha,
  padding: 'var(--space-3)',
  border: 'var(--border-width) dashed var(--color-accent)',
  borderRadius: 'var(--radius-icon-box)',
} as const;

export default function GradientTextDemo() {
  return (
    <div style={{ display: 'grid', gap: 'var(--space-6)' }}>
      {EXEMPLOS.map((ex) => (
        <div key={ex.id} style={estiloLinha} data-exemplo={ex.id}>
          <p style={estiloRotulo}>{ex.rotulo}</p>
          <p style={estiloTexto(ex.px)}>
            <GradientText>{ex.texto}</GradientText>
          </p>
        </div>
      ))}
      <div style={estiloLinha} data-exemplo="quebra">
        <p style={estiloRotulo}>{ROTULOS.quebra}</p>
        <p style={{ ...estiloTexto(48), maxInlineSize: '280px' }}>
          <GradientText>{FRASE_AMOSTRA}</GradientText>
        </p>
      </div>
      <div style={estiloLinha} data-exemplo="strong">
        <p style={estiloRotulo}>{ROTULOS.strong}</p>
        <p style={estiloTexto(36)}>
          <GradientText as="strong">{FRASE_AMOSTRA}</GradientText>
        </p>
      </div>
      <div style={estiloProibido} data-exemplo="17-proibido">
        <p style={{ ...estiloRotulo, color: 'var(--color-link)', fontWeight: 700 }}>
          {ROTULOS.proibido}
        </p>
        <p style={estiloTexto(17)}>
          <GradientText>{FRASE_AMOSTRA}</GradientText>
        </p>
      </div>
      <p style={estiloRotulo}>{ROTULOS.notas}</p>
    </div>
  );
}
