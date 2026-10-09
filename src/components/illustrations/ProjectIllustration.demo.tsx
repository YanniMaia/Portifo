// Demo da ProjectIllustration para o /__styleguide (DS-05: export default sem props, só em dev).
// Os rótulos são da ferramenta de desenvolvimento (fora do build, como o `textos.ts` do DS-05).
// A legenda de reserva vem do próprio dicionário (`projetos.legendaReserva`, PH-03).
import { useLanguage } from '@/i18n/useLanguage';
import { ProjectIllustration } from './ProjectIllustration';

const ROTULOS = {
  estoque: 'variante="estoque" + legendaReserva (PH-03, só em dev)',
  padrao: 'variante="padrao"',
} as const;

const estiloExemplo = { display: 'grid', gap: 'var(--space-2)', alignContent: 'start' } as const;
const estiloRotulo = {
  margin: 0,
  fontFamily: 'var(--font-mono)',
  fontSize: 'var(--fs-caption)',
  color: 'var(--color-text-secondary)',
} as const;

export default function ProjectIllustrationDemo() {
  const { dict } = useLanguage();
  return (
    <div
      style={{
        display: 'grid',
        gap: 'var(--space-6)',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 400px))',
      }}
    >
      <div style={estiloExemplo} data-exemplo="estoque">
        <p style={estiloRotulo}>{ROTULOS.estoque}</p>
        <ProjectIllustration variante="estoque" legendaReserva={dict.projetos.legendaReserva} />
      </div>
      <div style={estiloExemplo} data-exemplo="padrao">
        <p style={estiloRotulo}>{ROTULOS.padrao}</p>
        <ProjectIllustration variante="padrao" />
      </div>
    </div>
  );
}
