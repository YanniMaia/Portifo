// Demo do Badge para o /__styleguide (DS-05: export default sem props, só em dev).
// Os rótulos dos selos vêm do dicionário (C-02): nenhum texto da Yanni escrito aqui. As notas são
// da ferramenta de desenvolvimento (não vão para o build). Mapa de uso do DS-13, passo 6.
import { useLanguage } from '@/i18n/useLanguage';
import { Badge, type BadgeProps } from './index';

interface Uso {
  id: string;
  props: Omit<BadgeProps, 'children'>;
  texto: string;
  nota: string;
}

const ROTULOS = {
  mapa: 'Mapa de uso (DS-13, passo 6): selo · variante · onde · origem',
  ladoALado: 'Lado a lado (D10, DV-4): "Foco principal" preenchido × "Em estudo" tracejado',
  fundos: 'Sobre --color-surface, --color-bg-alt e --color-bg-tint',
  movimento:
    'O ponto do dot pulsa em 2,4 s (PulseDot, DS-08) e fica estático com movimento reduzido.',
} as const;

const estiloRotulo = {
  margin: 0,
  fontFamily: 'var(--font-mono)',
  fontSize: 'var(--fs-caption)',
  color: 'var(--color-text-secondary)',
  overflowWrap: 'anywhere',
} as const;

const estiloPalco = (token: string) =>
  ({
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 'var(--space-3)',
    padding: 'var(--space-6)',
    backgroundColor: `var(${token})`,
    border: 'var(--border-width) solid var(--color-border)',
    borderRadius: 'var(--radius-icon-box)',
  }) as const;

export default function BadgeDemo() {
  const { dict } = useLanguage();
  const linguagem = dict.habilidades.linguagens.chips[0] ?? '';
  const usos: readonly Uso[] = [
    {
      id: 'foco',
      props: {},
      texto: dict.interesses.seloFoco,
      nota: 'filled sm · cards Dados e Cibersegurança (S-08) · §7.6',
    },
    {
      id: 'estudo',
      props: { variant: 'dashed' },
      texto: dict.interesses.seloEstudo,
      nota: 'dashed sm · card IA (S-08) · DV-4, 00-INDICE §3',
    },
    {
      id: 'projeto',
      props: {},
      texto: dict.projetos.seloEstudo,
      nota: 'filled sm · cards de estudo (S-11) · §7.8, D17',
    },
    {
      id: 'destaque',
      props: {},
      texto: dict.projetos.emDestaque,
      nota: 'filled sm · painel em destaque (S-10) · DV-7, D20',
    },
    {
      id: 'linguagem',
      props: { mono: true },
      texto: linguagem,
      nota: 'filled sm mono · etiqueta de linguagem (S-10, S-11) · §7.8',
    },
    {
      id: 'formacao',
      props: { dot: true },
      texto: dict.formacao.selo,
      nota: 'filled sm dot · marco principal (S-13) · §7.9',
    },
    {
      id: 'hero',
      props: { size: 'lg', mono: true, dot: true },
      texto: dict.hero.pilula,
      nota: 'filled lg mono dot · pílula do hero (S-03) · §7.2',
    },
  ];

  return (
    <div style={{ display: 'grid', gap: 'var(--space-8)' }}>
      <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
        <p style={estiloRotulo}>{ROTULOS.mapa}</p>
        <ul
          style={{
            display: 'grid',
            gap: 'var(--space-4)',
            margin: 0,
            padding: 0,
            listStyle: 'none',
          }}
        >
          {usos.map((u) => (
            <li
              key={u.id}
              data-exemplo={u.id}
              style={{ display: 'grid', gap: 'var(--space-2)', justifyItems: 'start' }}
            >
              <Badge {...u.props}>{u.texto}</Badge>
              <p style={estiloRotulo}>{u.nota}</p>
            </li>
          ))}
        </ul>
      </div>

      <div style={{ display: 'grid', gap: 'var(--space-3)' }} data-exemplo="lado-a-lado">
        <p style={estiloRotulo}>{ROTULOS.ladoALado}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <Badge>{dict.interesses.seloFoco}</Badge>
          <Badge variant="dashed">{dict.interesses.seloEstudo}</Badge>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
        <p style={estiloRotulo}>{ROTULOS.fundos}</p>
        {['--color-surface', '--color-bg-alt', '--color-bg-tint'].map((token) => (
          <div key={token} style={estiloPalco(token)} data-fundo={token}>
            <Badge>{dict.interesses.seloFoco}</Badge>
            <Badge variant="dashed">{dict.interesses.seloEstudo}</Badge>
            <Badge mono>{linguagem}</Badge>
            <Badge size="lg" mono dot>
              {dict.hero.pilula}
            </Badge>
          </div>
        ))}
      </div>

      <p style={estiloRotulo}>{ROTULOS.movimento}</p>
    </div>
  );
}
