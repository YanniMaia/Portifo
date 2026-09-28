// Testes do GradientText (DS-07). Os valores computados no navegador (background-image
// `linear-gradient(135deg, rgb(224, 81, 138), rgb(168, 37, 96))` no claro e
// `linear-gradient(135deg, rgb(255, 179, 209), rgb(240, 108, 163))` no escuro, e o texto visível
// em forced-colors) são medidos no /__styleguide (diário DS-07). Aqui ficam o DOM, o contrato do
// CSS Module e o token de origem.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { GradientText } from '@/components/GradientText';

const ler = (arquivo: string) =>
  readFileSync(resolve(process.cwd(), arquivo), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

describe('GradientText (DOM)', () => {
  it('padrão: <span> com a classe text e o texto no DOM (selecionável/copiável)', () => {
    const { container } = render(<GradientText>Texto de teste</GradientText>);
    expect(container.childNodes).toHaveLength(1);
    const el = container.firstElementChild as HTMLElement;
    expect(el.tagName).toBe('SPAN');
    expect(el.className).toBe('text');
    expect(el.textContent).toBe('Texto de teste');
    expect(el).not.toHaveAttribute('aria-hidden');
    expect(screen.getByText('Texto de teste')).toBe(el);
  });

  it('as="strong": renderiza <strong>, className extra no fim', () => {
    const { container } = render(
      <GradientText as="strong" className="extra">
        Ênfase
      </GradientText>,
    );
    const el = container.firstElementChild as HTMLElement;
    expect(el.tagName).toBe('STRONG');
    expect(el.className.split(' ')).toEqual(['text', 'extra']);
    expect(el).toHaveTextContent('Ênfase');
  });

  it('aceita filhos compostos sem perder o texto', () => {
    const { container } = render(
      <GradientText>
        dados <em>e</em> segurança
      </GradientText>,
    );
    expect(container.textContent).toBe('dados e segurança');
  });

  it('não é interativo (sem tabindex nem papel)', () => {
    const { container } = render(<GradientText>x</GradientText>);
    const el = container.firstElementChild as HTMLElement;
    expect(el).not.toHaveAttribute('tabindex');
    expect(el).not.toHaveAttribute('role');
  });
});

describe('CSS Module (estilo do DS-07, só tokens)', () => {
  const css = ler('src/components/GradientText/GradientText.module.css');
  const primeiraRegra = /(?:^|\n)\.text\s*\{([^}]*)\}/.exec(css)?.[1] ?? '';

  it('degradê recortado no texto, com clone na quebra de linha', () => {
    expect(primeiraRegra).toContain('background-image: var(--gradient-text);');
    expect(primeiraRegra).toContain('-webkit-background-clip: text;');
    expect(primeiraRegra).toContain('background-clip: text;');
    expect(primeiraRegra).toContain('color: transparent;');
    expect(primeiraRegra).toContain('-webkit-box-decoration-break: clone;');
    expect(primeiraRegra).toContain('box-decoration-break: clone;');
  });

  it('background-clip vem depois do background-image (o atalho não o zera)', () => {
    expect(primeiraRegra.indexOf('background-image')).toBeLessThan(
      primeiraRegra.indexOf('background-clip: text'),
    );
    expect(primeiraRegra).not.toMatch(/(^|\s)background:/);
  });

  it('fallback sem background-clip: text → --color-link, sem fundo', () => {
    const bloco = /@supports not \(([\s\S]*?)\n\}/.exec(css)?.[1] ?? '';
    expect(bloco).toContain('background-clip: text');
    expect(bloco).toMatch(
      /\.text\s*\{[^}]*background-image: none;[^}]*color: var\(--color-link\);/,
    );
  });

  it('forced-colors → canvastext, sem fundo', () => {
    const bloco = /@media \(forced-colors: active\)\s*\{([\s\S]*?)\n\}/.exec(css)?.[1] ?? '';
    expect(bloco).toMatch(/\.text\s*\{[^}]*background-image: none;[^}]*color: canvastext;/);
  });

  it('seleção com cor sólida do tema', () => {
    expect(css).toMatch(/\.text::selection\s*\{[^}]*color: var\(--color-text\);/);
  });

  it('nenhum hex nas declarações do CSS Module', () => {
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });
});

describe('Token --gradient-text (DS-01, §3.4)', () => {
  const cores = ler('src/styles/tokens/colors.css').toLowerCase();

  it('claro 135° #E0518A → #A82560 e escuro 135° #FFB3D1 → #F06CA3', () => {
    const valores = [...cores.matchAll(/--gradient-text:\s*([^;]+);/g)].map((m) => m[1]);
    expect(valores).toEqual([
      'linear-gradient(135deg, #e0518a, #a82560)',
      'linear-gradient(135deg, #ffb3d1, #f06ca3)',
    ]);
  });
});
