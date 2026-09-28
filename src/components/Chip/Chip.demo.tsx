// Demo do Chip para o /__styleguide (DS-05: export default sem props, só em dev).
// Rótulos da ferramenta de desenvolvimento (não vão para o build). Os nomes nos chips são os do
// doc de design (§7.5: Python, SQL, Git, GitHub, Excel, Trello), sem nada inventado.
import { Chip, ChipList } from './index';

const TECNOLOGIAS = ['Python', 'SQL', 'Git', 'GitHub', 'Excel', 'Trello'] as const;

const ROTULOS = {
  padrao: 'size="default" · 40 px · 15 px/500 · ChipList gap 12 px',
  mono: 'size="default" mono · JetBrains Mono (linguagens e ferramentas, §7.7)',
  sm: 'size="sm" mono · 32 px · 13 px/500 · ChipList gap="sm" (8 px)',
  hover: 'data-state="hover" · fundo --color-chip-bg-hover, borda --color-border-hover, sobe 2 px',
  quebra: 'Quebra de linha em 220 px: 12 px também na vertical',
  solto: 'Fora de ChipList: <span>',
  notas:
    'Não interativo: fora da ordem de Tab. Hover só com ponteiro. Movimento reduzido: sem subir, só a cor muda.',
} as const;

const estiloLinha = { display: 'grid', gap: 'var(--space-3)' } as const;
const estiloRotulo = {
  margin: 0,
  fontFamily: 'var(--font-mono)',
  fontSize: 'var(--fs-caption)',
  color: 'var(--color-text-secondary)',
} as const;

export default function ChipDemo() {
  return (
    <div style={{ display: 'grid', gap: 'var(--space-8)' }}>
      <div style={estiloLinha} data-exemplo="padrao">
        <p style={estiloRotulo}>{ROTULOS.padrao}</p>
        <ChipList>
          {TECNOLOGIAS.map((t) => (
            <Chip key={t}>{t}</Chip>
          ))}
        </ChipList>
      </div>
      <div style={estiloLinha} data-exemplo="mono">
        <p style={estiloRotulo}>{ROTULOS.mono}</p>
        <ChipList>
          {TECNOLOGIAS.map((t) => (
            <Chip key={t} mono>
              {t}
            </Chip>
          ))}
        </ChipList>
      </div>
      <div style={estiloLinha} data-exemplo="sm">
        <p style={estiloRotulo}>{ROTULOS.sm}</p>
        <ChipList gap="sm">
          {TECNOLOGIAS.map((t) => (
            <Chip key={t} size="sm" mono>
              {t}
            </Chip>
          ))}
        </ChipList>
      </div>
      <div style={estiloLinha} data-exemplo="hover">
        <p style={estiloRotulo}>{ROTULOS.hover}</p>
        <ChipList>
          <Chip mono>{TECNOLOGIAS[0]}</Chip>
          <Chip mono data-state="hover">
            {TECNOLOGIAS[1]}
          </Chip>
          <Chip size="sm" mono data-state="hover">
            {TECNOLOGIAS[2]}
          </Chip>
        </ChipList>
      </div>
      <div style={{ ...estiloLinha, maxInlineSize: '220px' }} data-exemplo="quebra">
        <p style={estiloRotulo}>{ROTULOS.quebra}</p>
        <ChipList>
          {TECNOLOGIAS.map((t) => (
            <Chip key={t} mono>
              {t}
            </Chip>
          ))}
        </ChipList>
      </div>
      <div style={estiloLinha} data-exemplo="solto">
        <p style={estiloRotulo}>{ROTULOS.solto}</p>
        <p style={{ margin: 0 }}>
          <Chip mono>{TECNOLOGIAS[0]}</Chip>
        </p>
      </div>
      <p style={estiloRotulo}>{ROTULOS.notas}</p>
    </div>
  );
}
