// Demo do ThemeToggle para o /__styleguide (DS-05: export default sem props, só em dev).
// Os três botões alternam o tema de verdade (mesmo `useTheme` da barra do styleguide): repouso,
// hover forçado e foco forçado. As notas são da ferramenta de desenvolvimento (não vão para o build).
import { ThemeToggle } from './index';

const EXEMPLOS = [
  { id: 'repouso', estado: undefined, nota: 'repouso (passe o mouse, use Tab + Enter/Espaço)' },
  { id: 'hover', estado: 'hover', nota: 'data-state="hover" (fundo --color-fill-soft)' },
  { id: 'focus', estado: 'focus', nota: 'data-state="focus" (contorno 3 px)' },
] as const;

const ROTULOS = {
  troca: 'Lua no claro, sol no escuro; o ícone gira 90° e troca com fade em 250 ms.',
} as const;

const estiloRotulo = {
  margin: 0,
  fontFamily: 'var(--font-mono)',
  fontSize: 'var(--fs-caption)',
  color: 'var(--color-text-secondary)',
  overflowWrap: 'anywhere',
} as const;

export default function ThemeToggleDemo() {
  return (
    <div style={{ display: 'grid', gap: 'var(--space-6)' }}>
      <p style={estiloRotulo}>{ROTULOS.troca}</p>
      {EXEMPLOS.map((ex) => (
        <div
          key={ex.id}
          data-exemplo={ex.id}
          style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}
        >
          <ThemeToggle data-state={ex.estado} />
          <p style={estiloRotulo}>{ex.nota}</p>
        </div>
      ))}
    </div>
  );
}
