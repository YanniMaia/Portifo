// Demo do Container para o /__styleguide (DS-05: export default sem props, só em dev).
// Rótulos da ferramenta de desenvolvimento (não vão para o build). Sem dados da Yanni.
// A faixa rosa-clarinho mostra a largura útil do conteúdo (dentro das margens `--gutter`).
// Dentro do palco do styleguide a largura disponível é menor que a janela; as medidas do critério
// (1200 px em 1440, 704 px em 768, 350 px em 390) valem com o contêiner na largura total da página,
// como na `Section` (diário DS-10).
import { Container, type ContainerSize } from './index';

const TAMANHOS: readonly { size: ContainerSize; rotulo: string }[] = [
  { size: 'default', rotulo: 'size="default" · --container-max (1200 px no desktop; 100% abaixo)' },
  { size: 'contact', rotulo: 'size="contact" · --measure-contact (1000 px, §7.11)' },
  { size: 'motto', rotulo: 'size="motto" · --measure-motto (900 px, §7.4)' },
  { size: 'narrow', rotulo: 'size="narrow" · --measure-narrow (760 px, §7.9, §7.10)' },
];

const estiloRotulo = {
  margin: 0,
  fontFamily: 'var(--font-mono)',
  fontSize: 'var(--fs-caption)',
  color: 'var(--color-text-secondary)',
  overflowWrap: 'anywhere',
} as const;
const estiloConteudo = {
  padding: 'var(--space-3)',
  backgroundColor: 'var(--color-fill-soft)',
  outline: 'var(--border-width) dashed var(--color-deco)',
} as const;

export default function ContainerDemo() {
  return (
    <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
      {TAMANHOS.map((t) => (
        <div
          key={t.size}
          style={{ border: 'var(--border-width) solid var(--color-border)' }}
          data-exemplo={t.size}
        >
          <Container size={t.size}>
            <div style={estiloConteudo} data-conteudo>
              <p style={estiloRotulo}>{t.rotulo}</p>
            </div>
          </Container>
        </div>
      ))}
    </div>
  );
}
