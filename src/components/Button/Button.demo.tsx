// Demo do Button e do ButtonLink para o /__styleguide (DS-05: export default sem props, só em dev).
// Matriz do DS-11, passo 9: 3 variantes × (com seta, com ícone, só texto) × estados (repouso,
// hover, foco, ativo, desabilitado) × tamanhos, nos 2 temas pela barra do styleguide. Os rótulos dos
// botões vêm do dicionário (C-02) e os links de `site.ts`; as notas são da ferramenta de
// desenvolvimento (não vão para o build).
import { Copy, Mail } from 'lucide-react';
import { Github } from '@/components/Icon';
import { site } from '@/content/site';
import { useLanguage } from '@/i18n/useLanguage';
import { Button, ButtonLink, type ButtonForcedState, type ButtonVariant } from './index';

const VARIANTES: readonly ButtonVariant[] = ['primary', 'secondary', 'text'];
const ESTADOS: readonly (ButtonForcedState | 'repouso')[] = ['repouso', 'hover', 'focus', 'active'];

const ROTULOS = {
  tamanhos: 'size="default" (52/52/48 px) × size="compact" (44 px)',
  largura: 'fullWidthOnMobile: largura total abaixo de 640 px',
  links: 'ButtonLink: âncora interna, externo (nova aba) e com href="[link da demonstração]"',
  placeholder: '↓ ButtonLink com href placeholder: nada é renderizado (D11)',
  desabilitado: 'disabled (D): aria-disabled, opacidade 0,5, sem hover',
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
  gap: 'var(--button-gap)',
} as const;

const estiloPalco = {
  display: 'grid',
  gap: 'var(--space-4)',
  padding: 'var(--space-6)',
  border: 'var(--border-width) solid var(--color-border)',
  borderRadius: 'var(--radius-icon-box)',
} as const;

export default function ButtonDemo() {
  const { dict } = useLanguage();
  const conteudos = [
    { id: 'seta', props: { arrow: true }, texto: dict.projetos.botaoVer },
    { id: 'icone', props: { iconLeft: Mail }, texto: dict.contato.botaoEmail },
    { id: 'texto', props: {}, texto: dict.projetos.botaoVer },
  ] as const;

  return (
    <div style={{ display: 'grid', gap: 'var(--space-8)' }}>
      {VARIANTES.map((variante) => (
        <div key={variante} style={estiloPalco} data-exemplo={`variante-${variante}`}>
          <p style={estiloRotulo}>{`variant="${variante}"`}</p>
          {ESTADOS.map((estado) => (
            <div key={estado} style={{ display: 'grid', gap: 'var(--space-2)' }}>
              <p style={estiloRotulo}>{`data-state=${estado}`}</p>
              <div style={estiloLinha}>
                {conteudos.map((c) => (
                  <span
                    key={c.id}
                    style={{ display: 'contents' }}
                    data-exemplo={`${variante}-${estado}-${c.id}`}
                  >
                    <Button
                      variant={variante}
                      {...c.props}
                      data-state={estado === 'repouso' ? undefined : estado}
                    >
                      {c.texto}
                    </Button>
                  </span>
                ))}
              </div>
            </div>
          ))}
          <div style={{ display: 'grid', gap: 'var(--space-2)' }}>
            <p style={estiloRotulo}>{ROTULOS.desabilitado}</p>
            <div style={estiloLinha}>
              <Button variant={variante} iconLeft={Copy} disabled>
                {dict.contato.copiar}
              </Button>
            </div>
          </div>
        </div>
      ))}

      <div style={estiloPalco} data-exemplo="tamanhos">
        <p style={estiloRotulo}>{ROTULOS.tamanhos}</p>
        <div style={estiloLinha}>
          <Button variant="primary" arrow>
            {dict.projetos.botaoVer}
          </Button>
          <Button variant="primary" size="compact" arrow>
            {dict.projetos.botaoVer}
          </Button>
          <Button variant="secondary" size="compact">
            {dict.projetos.botaoGithub}
          </Button>
          <Button variant="text" size="compact" arrow>
            {dict.projetos.botaoVer}
          </Button>
        </div>
      </div>

      <div style={estiloPalco} data-exemplo="largura">
        <p style={estiloRotulo}>{ROTULOS.largura}</p>
        <div style={estiloLinha}>
          <Button variant="primary" iconLeft={Mail} fullWidthOnMobile>
            {dict.contato.botaoEmail}
          </Button>
          <Button variant="secondary" iconLeft={Github} fullWidthOnMobile>
            {dict.contato.botaoGithub}
          </Button>
        </div>
      </div>

      <div style={estiloPalco} data-exemplo="links">
        <p style={estiloRotulo}>{ROTULOS.links}</p>
        <div style={estiloLinha}>
          <ButtonLink variant="primary" href="#button" arrow>
            {dict.projetos.botaoVer}
          </ButtonLink>
          <ButtonLink variant="secondary" href={site.github} external iconLeft={Github}>
            {dict.contato.botaoGithub}
          </ButtonLink>
          <ButtonLink variant="text" href={site.github} external arrow>
            {dict.projetos.botaoGithub}
          </ButtonLink>
        </div>
        <p style={estiloRotulo}>{ROTULOS.placeholder}</p>
        <div style={estiloLinha} data-exemplo="placeholder">
          <ButtonLink variant="primary" href="[link da demonstração]">
            {dict.projetos.botaoVer}
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
