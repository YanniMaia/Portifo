// Demo da Section para o /__styleguide (DS-05: export default sem props, só em dev).
// As 10 seções do registro único `SECTIONS` (F-12), empilhadas na ordem do §2, cada uma com o tom
// do registro, para mostrar a alternância de fundos nos dois temas. A Frase usa `padding="motto"`
// (S-06). Cada seção fica com pelo menos 200 px de altura: o espaço vertical real (64 a 112 px em
// cima e embaixo) não é encurtado, para a demo mostrar a medida verdadeira.
// Rótulos da ferramenta de desenvolvimento (não vão para o build). Sem dados da Yanni.
import { Container } from '@/components/Container';
import { SECTIONS } from '@/content/sections';
import { Section } from './index';

const TOKEN_POR_TOM = {
  base: '--color-bg · #FFFFFF / #150A10',
  alt: '--color-bg-alt · #FFF7FA / #1C0E16',
  tint: '--color-bg-tint · #FFEEF4 / #1C0E16 (DV-10)',
} as const;

// Conteúdo que completa 200 px de altura quando o espaço vertical da faixa é menor que isso.
const ALTURA_MIN = 'max(0px, calc(200px - 2 * var(--section-py)))';
const ALTURA_MIN_MOTTO = 'max(0px, calc(200px - 2 * var(--section-py-motto)))';

const estiloRotulo = {
  margin: 0,
  fontFamily: 'var(--font-mono)',
  fontSize: 'var(--fs-caption)',
  color: 'var(--color-text-secondary)',
  overflowWrap: 'anywhere',
} as const;

export default function SectionDemo() {
  return (
    <div style={{ border: 'var(--border-width) solid var(--color-border)' }}>
      {SECTIONS.map((s) => {
        const motto = s.id === 'frase';
        return (
          <Section key={s.id} id={s.id} padding={motto ? 'motto' : 'default'}>
            <Container>
              <div style={{ minBlockSize: motto ? ALTURA_MIN_MOTTO : ALTURA_MIN }}>
                <p style={estiloRotulo}>
                  {`#${s.id} · tone="${s.tone}" · ${TOKEN_POR_TOM[s.tone]}${motto ? ' · padding="motto"' : ''}`}
                </p>
              </div>
            </Container>
          </Section>
        );
      })}
    </div>
  );
}
