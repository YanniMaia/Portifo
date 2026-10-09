// Demo do Icon para o /__styleguide (DS-05: export default sem props, só em dev).
// Rótulos da ferramenta de desenvolvimento (não vão para o build). A lista é a do DS-06, passo 5:
// ícone citado no doc de design → nome no lucide-react 1.x, nos 4 tamanhos (20/24/28/32 px).
import {
  ArrowRight,
  ArrowUp,
  Braces,
  BrainCircuit,
  ChartColumn,
  Copy,
  Database,
  GraduationCap,
  Lightbulb,
  Lock,
  Mail,
  Menu,
  Moon,
  ShieldCheck,
  Sun,
  Wrench,
  X,
  type LucideIcon,
} from 'lucide-react';
import { Github, Icon, Linkedin, type IconSize } from './index';

interface Item {
  doc: string;
  nome: string;
  icon: LucideIcon;
}

const ITENS: readonly Item[] = [
  { doc: 'banco de dados', nome: 'Database', icon: Database },
  { doc: 'escudo/cadeado', nome: 'ShieldCheck', icon: ShieldCheck },
  { doc: 'cadeado', nome: 'Lock', icon: Lock },
  { doc: 'colchetes de código', nome: 'Braces', icon: Braces },
  { doc: 'gráfico de barras', nome: 'ChartColumn (antigo BarChart3)', icon: ChartColumn },
  { doc: 'capelo', nome: 'GraduationCap', icon: GraduationCap },
  { doc: 'lâmpada', nome: 'Lightbulb', icon: Lightbulb },
  { doc: 'IA (DV-15)', nome: 'BrainCircuit', icon: BrainCircuit },
  { doc: 'ferramenta', nome: 'Wrench', icon: Wrench },
  { doc: 'lua', nome: 'Moon', icon: Moon },
  { doc: 'sol', nome: 'Sun', icon: Sun },
  { doc: 'LinkedIn', nome: 'Linkedin (marcas.ts, createLucideIcon)', icon: Linkedin },
  { doc: 'GitHub', nome: 'Github (marcas.ts, createLucideIcon)', icon: Github },
  { doc: 'e-mail', nome: 'Mail', icon: Mail },
  { doc: 'copiar', nome: 'Copy', icon: Copy },
  { doc: 'seta direita', nome: 'ArrowRight', icon: ArrowRight },
  { doc: 'seta para cima', nome: 'ArrowUp', icon: ArrowUp },
  { doc: 'menu', nome: 'Menu', icon: Menu },
  { doc: 'fechar', nome: 'X', icon: X },
];

const TAMANHOS: readonly IconSize[] = [20, 24, 28, 32];

const ROTULOS = {
  cabecalho: 'Ícone do doc → nome lucide · 20 / 24 / 28 / 32 px · traço 1,75 px · currentColor',
  rotulado: 'Com label (role="img"):',
  rotuloExemplo: 'Banco de dados (exemplo de nome acessível)',
} as const;

const estiloRotulo = {
  margin: 0,
  fontFamily: 'var(--font-mono)',
  fontSize: 'var(--fs-caption)',
  color: 'var(--color-text-secondary)',
  overflowWrap: 'anywhere',
} as const;

export default function IconDemo() {
  return (
    <div style={{ display: 'grid', gap: 'var(--space-6)' }}>
      <p style={estiloRotulo}>{ROTULOS.cabecalho}</p>
      <ul
        style={{
          display: 'grid',
          gap: 'var(--space-4)',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 260px), 1fr))',
          margin: 0,
          padding: 0,
          listStyle: 'none',
        }}
      >
        {ITENS.map((item) => (
          <li
            key={item.nome}
            data-icone={item.nome}
            style={{
              display: 'grid',
              gap: 'var(--space-2)',
              padding: 'var(--space-4)',
              border: 'var(--border-width) solid var(--color-border)',
              borderRadius: 'var(--radius-icon-box)',
            }}
          >
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-4)',
                color: 'var(--color-accent)',
              }}
            >
              {TAMANHOS.map((t) => (
                <Icon key={t} icon={item.icon} size={t} />
              ))}
            </span>
            <p style={estiloRotulo}>
              {item.doc} → {item.nome}
            </p>
          </li>
        ))}
      </ul>
      <p style={{ ...estiloRotulo, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        {ROTULOS.rotulado}
        <span style={{ color: 'var(--color-link)' }}>
          <Icon icon={Database} label={ROTULOS.rotuloExemplo} />
        </span>
      </p>
    </div>
  );
}
