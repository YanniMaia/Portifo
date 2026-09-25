// Demo do PlaceholderMark para o /__styleguide (DS-05: export default sem props, só em dev).
// Os rótulos são da ferramenta de desenvolvimento (não vão para o build, como o `textos.ts`
// do DS-05). Os valores de exemplo são os do próprio plano (DS-21 e D23), nenhum dado da Yanni:
// a frase "real" é a frase de amostra do styleguide (DS-05, passo 3).
import { PlaceholderMark } from './PlaceholderMark';

const EXEMPLOS = {
  inline: { rotulo: 'kind="inline" · value="[ano]"', valor: '[ano]' },
  noMeio: {
    rotulo: 'kind="inline" · "[…]" no meio da string (D23)',
    valor: 'https://github.com/YanniMaia/[repositório]',
  },
  real: {
    rotulo: 'valor real (sem "[" e "]") → texto normal',
    valor: 'Transformando conhecimento em soluções',
  },
  bloco: {
    rotulo: 'kind="block" · área 16:9',
    valor: '[substituir por print do projeto]',
  },
  vazio: { rotulo: 'value="" → nada renderizado', valor: '' },
} as const;

const estiloLinha = { display: 'grid', gap: 'var(--space-2)' } as const;
const estiloRotulo = {
  margin: 0,
  fontFamily: 'var(--font-mono)',
  fontSize: 'var(--fs-caption)',
  color: 'var(--color-text-secondary)',
} as const;

export default function PlaceholderMarkDemo() {
  return (
    <div style={{ display: 'grid', gap: 'var(--space-6)' }}>
      {(['inline', 'noMeio', 'real'] as const).map((chave) => (
        <div key={chave} style={estiloLinha} data-exemplo={chave}>
          <p style={estiloRotulo}>{EXEMPLOS[chave].rotulo}</p>
          <p style={{ margin: 0 }}>
            <PlaceholderMark value={EXEMPLOS[chave].valor} />
          </p>
        </div>
      ))}
      <div style={estiloLinha} data-exemplo="bloco">
        <p style={estiloRotulo}>{EXEMPLOS.bloco.rotulo}</p>
        <div style={{ aspectRatio: '16 / 9', maxInlineSize: '480px' }}>
          <PlaceholderMark kind="block" value={EXEMPLOS.bloco.valor} />
        </div>
      </div>
      <div style={estiloLinha} data-exemplo="vazio">
        <p style={estiloRotulo}>{EXEMPLOS.vazio.rotulo}</p>
        <p style={{ margin: 0 }}>
          <PlaceholderMark value={EXEMPLOS.vazio.valor} />
        </p>
      </div>
    </div>
  );
}
