// Demo do IconBox para o /__styleguide (DS-05: export default sem props, só em dev).
// Repouso (28 e 24 px), `active` e dentro de `Card interactive` (repouso e hover forçado), nos 2
// temas pela barra do styleguide. Os títulos dos cards vêm do dicionário (C-02); as notas são da
// ferramenta de desenvolvimento (não vão para o build). Ícones do §7.6 e do DV-15.
import { BrainCircuit, Database, ShieldCheck, Wrench } from 'lucide-react';
import { Card } from '@/components/Card';
import { useLanguage } from '@/i18n/useLanguage';
import { IconBox } from './index';

const ROTULOS = {
  soltos: 'Repouso (ícone 28 e 24 px) e active',
  cards: 'Dentro de Card interactive: repouso (passe o mouse ou foque) e data-state="hover"',
} as const;

const estiloRotulo = {
  margin: 0,
  fontFamily: 'var(--font-mono)',
  fontSize: 'var(--fs-caption)',
  color: 'var(--color-text-secondary)',
  overflowWrap: 'anywhere',
} as const;

const estiloLinha = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: 'var(--space-4)',
} as const;

const estiloGrade = {
  display: 'grid',
  gap: 'var(--card-gap)',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
} as const;

export default function IconBoxDemo() {
  const { dict } = useLanguage();
  const cards = [
    { id: 'repouso', icon: Database, titulo: dict.interesses.dados.titulo, estado: undefined },
    { id: 'hover', icon: ShieldCheck, titulo: dict.interesses.ciber.titulo, estado: 'hover' },
  ] as const;

  return (
    <div style={{ display: 'grid', gap: 'var(--space-8)' }}>
      <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
        <p style={estiloRotulo}>{ROTULOS.soltos}</p>
        <div style={estiloLinha}>
          <span data-exemplo="repouso-28" style={{ display: 'contents' }}>
            <IconBox icon={Database} />
          </span>
          <span data-exemplo="repouso-24" style={{ display: 'contents' }}>
            <IconBox icon={Wrench} iconSize={24} />
          </span>
          <span data-exemplo="active" style={{ display: 'contents' }}>
            <IconBox icon={BrainCircuit} active />
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
        <p style={estiloRotulo}>{ROTULOS.cards}</p>
        <div style={estiloGrade}>
          {cards.map((c) => (
            <div key={c.id} data-exemplo={`card-${c.id}`}>
              <Card interactive accentBar data-state={c.estado}>
                <div style={{ display: 'grid', gap: 'var(--space-4)', justifyItems: 'start' }}>
                  <IconBox icon={c.icon} />
                  <h3 className="t-h3" style={{ margin: 0 }}>
                    {c.titulo}
                  </h3>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
