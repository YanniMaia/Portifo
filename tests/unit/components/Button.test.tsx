// Testes do Button e do ButtonLink (DS-11). Alturas, cores, degradês, hover e movimento reduzido
// nos 2 temas são medidos no /__styleguide (diário DS-11). Aqui ficam o DOM, a regra "sem link, sem
// botão" (D11), a nova aba, o teclado e o contrato do CSS.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { ReactElement } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Mail } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';
import { Button, ButtonLink } from '@/components/Button';
import { en } from '@/content/en';
import { pt } from '@/content/pt';
import { LanguageProvider } from '@/i18n/LanguageProvider';

const ler = (arquivo: string) =>
  readFileSync(resolve(process.cwd(), arquivo), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

const comIdioma = (ui: ReactElement) => render(<LanguageProvider>{ui}</LanguageProvider>);

describe('Button (DOM e teclado)', () => {
  it('<button type="button"> com classes da variante e o texto do children', () => {
    render(<Button variant="primary">Ver projeto</Button>);
    const b = screen.getByRole('button', { name: 'Ver projeto' });
    expect(b).toHaveAttribute('type', 'button');
    expect(b.className.split(' ')).toEqual(['button', 'primary']);
    expect(b).toHaveAttribute('data-variant', 'primary');
    expect(b).toHaveAttribute('data-size', 'default');
  });

  it('compact, fullWidthOnMobile e className na ordem', () => {
    render(
      <Button variant="secondary" size="compact" fullWidthOnMobile className="x">
        a
      </Button>,
    );
    expect(screen.getByRole('button').className.split(' ')).toEqual([
      'button',
      'secondary',
      'compact',
      'fullWidthOnMobile',
      'x',
    ]);
  });

  it('ícone à esquerda e seta à direita, ambos de 20 px e decorativos', () => {
    render(
      <Button variant="primary" iconLeft={Mail} arrow>
        E-mail
      </Button>,
    );
    const b = screen.getByRole('button', { name: 'E-mail' });
    const svgs = b.querySelectorAll('svg');
    expect(svgs).toHaveLength(2);
    for (const svg of svgs) {
      expect(svg).toHaveAttribute('width', '20');
      expect(svg).toHaveAttribute('height', '20');
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    }
    expect(svgs[0]?.classList).toContain('icon');
    expect(svgs[1]?.classList).toContain('arrow');
    expect(b.children[1]?.textContent).toBe('E-mail');
  });

  it('Enter e Espaço ativam o Button', async () => {
    const usuario = userEvent.setup();
    const aoClicar = vi.fn();
    render(
      <Button variant="primary" onClick={aoClicar}>
        Copiar
      </Button>,
    );
    await usuario.tab();
    expect(screen.getByRole('button')).toHaveFocus();
    await usuario.keyboard('{Enter}');
    await usuario.keyboard(' ');
    expect(aoClicar).toHaveBeenCalledTimes(2);
  });

  it('disabled: aria-disabled, continua focável e o clique é ignorado', async () => {
    const usuario = userEvent.setup();
    const aoClicar = vi.fn();
    render(
      <Button variant="primary" disabled onClick={aoClicar}>
        Copiar
      </Button>,
    );
    const b = screen.getByRole('button');
    expect(b).toHaveAttribute('aria-disabled', 'true');
    expect(b).not.toHaveAttribute('disabled');
    await usuario.click(b);
    expect(b).toHaveFocus();
    await usuario.keyboard('{Enter}');
    expect(aoClicar).not.toHaveBeenCalled();
  });

  it('data-state força o visual do estado (styleguide)', () => {
    render(
      <Button variant="text" data-state="hover">
        a
      </Button>,
    );
    expect(screen.getByRole('button')).toHaveAttribute('data-state', 'hover');
  });
});

describe('ButtonLink', () => {
  it.each([
    ['indefinido', undefined],
    ['vazio', ''],
    ['placeholder', '[link da demonstração]'],
    ['placeholder no meio da URL', 'https://github.com/YanniMaia/[repositório]'],
  ])('href %s → nada no DOM (D11)', (_caso, href) => {
    const { container } = comIdioma(
      <ButtonLink variant="primary" href={href}>
        Ver projeto
      </ButtonLink>,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('link interno: <a href> sem target, com as classes do botão', () => {
    comIdioma(
      <ButtonLink variant="secondary" href="#contato">
        Contato
      </ButtonLink>,
    );
    const a = screen.getByRole('link', { name: 'Contato' });
    expect(a).toHaveAttribute('href', '#contato');
    expect(a).not.toHaveAttribute('target');
    expect(a.className.split(' ')).toEqual(['button', 'secondary']);
  });

  it('external (PT): nova aba, rel noopener noreferrer e nome acessível com o aviso', () => {
    comIdioma(
      <ButtonLink variant="secondary" href="https://github.com/YanniMaia" external>
        GitHub
      </ButtonLink>,
    );
    const a = screen.getByRole('link');
    expect(a).toHaveAttribute('target', '_blank');
    expect(a.getAttribute('rel')?.split(' ')).toEqual(
      expect.arrayContaining(['noopener', 'noreferrer']),
    );
    expect(a).toHaveAccessibleName(`GitHub (${pt.a11y.opensInNewTab})`);
    expect(a).toHaveAccessibleName('GitHub (abre em nova aba)');
    expect(a.querySelector('.visually-hidden')?.textContent).toBe('(abre em nova aba)');
    expect(a.textContent).toBe('GitHub (abre em nova aba)');
  });

  it('external (EN): "(opens in a new tab)"', () => {
    // O provedor lê o idioma do `<html lang>` (F-10).
    const antes = document.documentElement.lang;
    document.documentElement.lang = 'en';
    try {
      comIdioma(
        <ButtonLink variant="primary" href="https://github.com/YanniMaia" external>
          GitHub
        </ButtonLink>,
      );
      expect(screen.getByRole('link')).toHaveAccessibleName(`GitHub (${en.a11y.opensInNewTab})`);
    } finally {
      document.documentElement.lang = antes;
    }
  });

  it('external com aria-label: o aviso entra no rótulo', () => {
    comIdioma(
      <ButtonLink variant="text" href="https://x.test" external aria-label="Perfil">
        GitHub
      </ButtonLink>,
    );
    expect(screen.getByRole('link')).toHaveAccessibleName('Perfil (abre em nova aba)');
  });

  it('Enter ativa o ButtonLink', async () => {
    const usuario = userEvent.setup();
    const aoClicar = vi.fn((e: { preventDefault: () => void }) => e.preventDefault());
    comIdioma(
      <ButtonLink variant="primary" href="#sobre" onClick={aoClicar}>
        Sobre
      </ButtonLink>,
    );
    await usuario.tab();
    expect(screen.getByRole('link')).toHaveFocus();
    await usuario.keyboard('{Enter}');
    expect(aoClicar).toHaveBeenCalledTimes(1);
  });
});

describe('Sem texto fixo (D5)', () => {
  it.each(['Button.tsx', 'ButtonLink.tsx', 'ConteudoDoBotao.tsx'])('%s', (arquivo) => {
    const tsx = ler(`src/components/Button/${arquivo}`).replace(/\/\/.*$/gm, '');
    expect(tsx).not.toMatch(/>\s*[A-Za-zÀ-ÿ0-9][^<{]*</);
  });
});

describe('CSS (DS-11, só tokens)', () => {
  const css = ler('src/components/Button/Button.module.css');
  const regra = (sel: string) =>
    new RegExp(`(?:^|\\n)\\s*${sel.replace(/[.[\]'=():]/g, '\\$&')}\\s*\\{([^}]*)\\}`).exec(
      css,
    )?.[1] ?? '';

  it('base: altura --button-height, padding 0 28 px, pílula, 16 px/600, sem caixa alta', () => {
    const r = regra('.button');
    expect(r).toContain('height: var(--button-height);');
    expect(r).toContain('padding: 0 28px;');
    expect(r).toContain('gap: var(--space-2);');
    expect(r).toContain('border-radius: var(--radius-pill);');
    expect(r).toContain('font-size: var(--fs-button);');
    expect(r).toContain('font-weight: var(--fw-button);');
    expect(r).toContain('text-transform: none;');
    expect(r).toContain('min-width: var(--touch-min);');
  });

  it('primário: --gradient-primary, texto --color-on-primary, camada --color-primary-hover', () => {
    const r = regra('.primary');
    expect(r).toContain('background-image: var(--gradient-primary);');
    expect(r).toContain('color: var(--color-on-primary);');
    expect(r).toContain('--button-layer: var(--color-primary-hover);');
  });

  it('secundário (DV-1): borda --border-width-strong --color-secondary-border, camada fill-soft', () => {
    const r = regra('.secondary');
    expect(r).toContain('border: var(--border-width-strong) solid var(--color-secondary-border);');
    expect(r).toContain('color: var(--color-secondary-text);');
    expect(r).toContain('--button-layer: var(--color-fill-soft);');
  });

  it('texto: --color-link, padding 0, altura mínima 44 px (--touch-min)', () => {
    const r = regra('.text');
    expect(r).toContain('color: var(--color-link);');
    expect(r).toContain('padding: 0;');
    expect(r).toContain('min-height: var(--touch-min);');
  });

  it('compact = --button-height-compact; largura total só abaixo de 640 px', () => {
    expect(regra('.compact')).toContain('height: var(--button-height-compact);');
    expect(css).toMatch(
      /\.fullWidthOnMobile \{\s*width: 100%;[\s\S]*@media \(min-width: 640px\) \{\s*\.fullWidthOnMobile \{\s*width: auto;/,
    );
  });

  it('hover: lift só no primário, seta com --arrow-shift, dentro de @media (hover: hover)', () => {
    const hover = /@media \(hover: hover\) \{([\s\S]*?)\n\}/.exec(css)?.[1] ?? '';
    expect(hover).toMatch(
      /\.primary:not\(\[aria-disabled='true'\]\):hover \{\s*transform: translateY\(var\(--lift-button\)\);/,
    );
    expect(hover).toMatch(/:hover \.arrow \{\s*transform: translateX\(var\(--arrow-shift\)\);/);
    expect(hover).not.toMatch(/\.secondary[^{]*:hover \{[^}]*transform/);
  });

  it('transições só em transform e opacity, em --dur-fast; nada de background ou box-shadow', () => {
    const transicoes = css.match(/transition:[^;]*;/g) ?? [];
    expect(transicoes.length).toBeGreaterThan(0);
    for (const t of transicoes) {
      expect(t).toMatch(/^transition: (transform|opacity) var\(--dur-fast\) var\(--ease-out\);$/);
    }
    expect(css).not.toMatch(/box-shadow/);
  });

  it('desabilitado: opacidade 0,5 e cursor not-allowed', () => {
    const r = regra(".button[aria-disabled='true']");
    expect(r).toContain('opacity: 0.5;');
    expect(r).toContain('cursor: not-allowed;');
  });

  it('sem hex', () => {
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });
});
