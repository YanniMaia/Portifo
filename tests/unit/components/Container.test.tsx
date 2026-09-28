// Testes do Container (DS-10). As larguras computadas (1200 px em 1440 com 120 px de cada lado,
// 704 px em 768, 350 px em 390) são medidas no navegador (diário DS-10). Aqui ficam o DOM, o
// contrato do CSS Module e a conta das larguras a partir dos tokens.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Container } from '@/components/Container';

const ler = (arquivo: string) =>
  readFileSync(resolve(process.cwd(), arquivo), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

describe('Container (DOM)', () => {
  it('padrão: <div class="container" data-size="default"> com os filhos', () => {
    const { container } = render(
      <Container>
        <p>conteúdo</p>
      </Container>,
    );
    const el = container.firstElementChild as HTMLElement;
    expect(el.tagName).toBe('DIV');
    expect(el.className).toBe('container');
    expect(el).toHaveAttribute('data-size', 'default');
    expect(el).toHaveTextContent('conteúdo');
  });

  it.each(['narrow', 'motto', 'contact'] as const)('size="%s" acrescenta a classe', (size) => {
    const { container } = render(<Container size={size} className="extra" />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.className.split(' ')).toEqual(['container', size, 'extra']);
  });
});

describe('CSS (DS-10, só tokens)', () => {
  const css = ler('src/components/Container/Container.module.css');

  it('100%, max-width = largura útil + 2 × gutter, padding-inline gutter, centralizado', () => {
    const regra = /\.container\s*\{([^}]*)\}/.exec(css)?.[1] ?? '';
    expect(regra).toContain('--content-max: var(--container-max);');
    expect(regra).toContain('width: 100%;');
    expect(regra).toContain('max-width: calc(var(--content-max) + 2 * var(--gutter));');
    expect(regra).toContain('padding-inline: var(--gutter);');
    expect(regra).toContain('margin-inline: auto;');
  });

  it('narrow/motto/contact → --measure-narrow/-motto/-contact', () => {
    expect(css).toMatch(/\.narrow\s*\{[^}]*--content-max: var\(--measure-narrow\);/);
    expect(css).toMatch(/\.motto\s*\{[^}]*--content-max: var\(--measure-motto\);/);
    expect(css).toMatch(/\.contact\s*\{[^}]*--content-max: var\(--measure-contact\);/);
  });

  it('sem hex e sem medida em px solta', () => {
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(css).not.toMatch(/\d+px/);
  });

  it('tokens: 760/900/1000 px e 1200 px no desktop', () => {
    const tokens = ler('src/styles/tokens/spacing.css');
    expect(tokens).toContain('--measure-narrow: 760px;');
    expect(tokens).toContain('--measure-motto: 900px;');
    expect(tokens).toContain('--measure-contact: 1000px;');
    expect(tokens).toMatch(/min-width: 1024px\)\s*\{\s*:root\s*\{[^}]*--container-max: 1200px;/);
  });

  it('conta das larguras úteis (§5): 1440 → 1200 (+120 de cada lado); 768 → 704; 390 → 350', () => {
    const util = (janela: number, max: number | null, gutter: number) => {
      const caixa = Math.min(janela, max === null ? Infinity : max + 2 * gutter);
      return { conteudo: caixa - 2 * gutter, margem: (janela - caixa) / 2 + gutter };
    };
    expect(util(1440, 1200, 32)).toEqual({ conteudo: 1200, margem: 120 });
    expect(util(768, null, 32).conteudo).toBe(704);
    expect(util(390, null, 20).conteudo).toBe(350);
  });
});
