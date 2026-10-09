// Demo do SectionHeader para o /__styleguide (DS-05: export default sem props, só em dev).
// Os textos dos cabeçalhos vêm do dicionário (C-02); as notas são da ferramenta de desenvolvimento
// (não vão para o build). Os ids dos H2 têm o prefixo `sg-sh-`, para não repetir os ids das seções
// que a demo da Section (DS-10) já usa (`#interesses`, `#contato`…).
import { useLanguage } from '@/i18n/useLanguage';
import { SectionHeader, type SectionHeaderProps } from './index';

interface Exemplo {
  id: string;
  fundo: string;
  nota: string;
  props: SectionHeaderProps;
}

const ROTULOS = {
  conteudo: 'conteúdo da seção (o espaço acima é o --section-head-gap: 56/48/40 px)',
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
    display: 'grid',
    gap: 'var(--space-4)',
    padding: 'var(--space-6)',
    backgroundColor: `var(${token})`,
    border: 'var(--border-width) solid var(--color-border)',
    borderRadius: 'var(--radius-icon-box)',
  }) as const;

const estiloConteudo = {
  margin: 0,
  padding: 'var(--space-3)',
  border: 'var(--border-width) dashed var(--color-border)',
  fontFamily: 'var(--font-mono)',
  fontSize: 'var(--fs-caption)',
  color: 'var(--color-text-muted)',
} as const;

export default function SectionHeaderDemo() {
  const { dict } = useLanguage();
  const exemplos: readonly Exemplo[] = [
    {
      id: 'com-subtitulo',
      fundo: '--color-bg-alt',
      nota: 'align="left" · com subtítulo · sobre --color-bg-alt (Interesses, S-08)',
      props: {
        id: 'sg-sh-interesses-titulo',
        eyebrow: dict.interesses.eyebrow,
        title: dict.interesses.titulo,
        subtitle: dict.interesses.subtitulo,
      },
    },
    {
      id: 'sem-subtitulo',
      fundo: '--color-bg',
      nota: 'align="left" · sem subtitle (nenhum <p> vazio) · sobre --color-bg (Sobre, S-07)',
      props: {
        id: 'sg-sh-sobre-titulo',
        eyebrow: dict.sobre.eyebrow,
        title: dict.sobre.titulo,
      },
    },
    {
      id: 'centro',
      fundo: '--color-bg',
      nota: 'align="center" · eyebrowTone="default" · sobre --color-bg',
      props: {
        id: 'sg-sh-projetos-titulo',
        eyebrow: dict.projetos.eyebrow,
        title: dict.projetos.titulo,
        subtitle: dict.projetos.subtitulo,
        align: 'center',
      },
    },
    {
      id: 'centro-tint',
      fundo: '--color-bg-tint',
      nota: 'align="center" · eyebrowTone="tint" (D13) · sobre --color-bg-tint (Contato, S-15)',
      props: {
        id: 'sg-sh-contato-titulo',
        eyebrow: dict.contato.eyebrow,
        eyebrowTone: 'tint',
        title: dict.contato.titulo,
        subtitle: dict.contato.texto,
        align: 'center',
      },
    },
  ];

  return (
    <div style={{ display: 'grid', gap: 'var(--space-6)' }}>
      {exemplos.map((ex) => (
        <div key={ex.id} style={estiloPalco(ex.fundo)} data-exemplo={ex.id}>
          <p style={estiloRotulo}>{ex.nota}</p>
          <div>
            <SectionHeader {...ex.props} />
            <p style={estiloConteudo} data-conteudo>
              {ROTULOS.conteudo}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
