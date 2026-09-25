// Testes do PlaceholderMark (DS-21; D11, D23; F-15). O valor computado no navegador
// (`border-style: dashed`, cor rgb(224, 81, 138)) é medido no /__styleguide (diário DS-21);
// aqui ficam a lógica dev × produção e o contrato do CSS Module.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

// `SHOW_PLACEHOLDERS` é lido de `import.meta.env.DEV` quando `flags.ts` carrega.
// Para simular dev e produção: troca o env, limpa o cache de módulos e reimporta.
async function carregar(dev: boolean) {
  vi.stubEnv('DEV', dev);
  vi.stubEnv('PROD', !dev);
  vi.resetModules();
  const { PlaceholderMark } = await import('@/components/PlaceholderMark');
  return PlaceholderMark;
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

const URL_COM_PLACEHOLDER = 'https://github.com/YanniMaia/[repositório]';

describe('PlaceholderMark em dev (import.meta.env.DEV = true)', () => {
  it('value="[ano]" vira <span> marcado, com o texto e o title de ferramenta', async () => {
    const PlaceholderMark = await carregar(true);
    const { container } = render(<PlaceholderMark value="[ano]" />);
    const marca = container.querySelector('[data-placeholder]');
    expect(marca).not.toBeNull();
    expect(marca?.tagName).toBe('SPAN');
    expect(marca).toHaveAttribute('data-placeholder', 'inline');
    expect(marca).toHaveAttribute('title', 'placeholder — preencher');
    expect(marca).toHaveTextContent('[ano]');
    expect(marca?.className).toContain('mark');
    expect(marca?.className).toContain('inline');
  });

  it('"[…]" no meio da string também é placeholder (D23)', async () => {
    const PlaceholderMark = await carregar(true);
    const { container } = render(<PlaceholderMark value={URL_COM_PLACEHOLDER} />);
    expect(container.querySelector('[data-placeholder]')).toHaveTextContent(URL_COM_PLACEHOLDER);
  });

  it('kind="block" vira <div> com a mesma marcação e a classe block', async () => {
    const PlaceholderMark = await carregar(true);
    const { container } = render(
      <PlaceholderMark kind="block" value="[substituir por print do projeto]" className="extra" />,
    );
    const marca = container.querySelector('[data-placeholder]');
    expect(marca?.tagName).toBe('DIV');
    expect(marca).toHaveAttribute('data-placeholder', 'block');
    expect(marca?.className.split(' ')).toEqual(['mark', 'block', 'extra']);
  });

  it('valor real renderiza só o texto, sem nenhum elemento em volta', async () => {
    const PlaceholderMark = await carregar(true);
    const { container } = render(<PlaceholderMark value="https://github.com/YanniMaia" />);
    expect(container.innerHTML).toBe('https://github.com/YanniMaia');
    expect(container.querySelector('[data-placeholder]')).toBeNull();
  });

  it.each([[''], [null], [undefined]])('value=%j não renderiza nada', async (v) => {
    const PlaceholderMark = await carregar(true);
    const { container } = render(<PlaceholderMark value={v} />);
    expect(container.childNodes).toHaveLength(0);
  });
});

describe('PlaceholderMark em produção (import.meta.env.DEV = false)', () => {
  it.each([['[ano]'], [URL_COM_PLACEHOLDER]])('%j não gera nenhum nó no DOM', async (v) => {
    const PlaceholderMark = await carregar(false);
    const inline = render(<PlaceholderMark value={v} />);
    expect(inline.container.childNodes).toHaveLength(0);
    const bloco = render(<PlaceholderMark kind="block" value={v} />);
    expect(bloco.container.childNodes).toHaveLength(0);
    expect(document.body.innerHTML).not.toContain('placeholder — preencher');
  });

  it('valor real continua aparecendo como texto normal', async () => {
    const PlaceholderMark = await carregar(false);
    const { container } = render(<PlaceholderMark value="https://github.com/YanniMaia" />);
    expect(container.innerHTML).toBe('https://github.com/YanniMaia');
  });
});

describe('CSS Module (estilo do DS-21, só tokens)', () => {
  const css = readFileSync(
    resolve(process.cwd(), 'src/components/PlaceholderMark/PlaceholderMark.module.css'),
    'utf8',
  );
  const regra = (seletor: string) => {
    const m = new RegExp(`\\.${seletor}\\s*\\{([^}]*)\\}`).exec(css);
    return m?.[1] ?? '';
  };

  it('.mark: tracejado 1,5 px accent, fundo fill-soft, texto pink-on-tint, mono 13 px, raio 8 px', () => {
    const mark = regra('mark');
    expect(mark).toContain('border: var(--border-width-strong) dashed var(--color-accent);');
    expect(mark).toContain('background-color: var(--color-fill-soft);');
    expect(mark).toContain('color: var(--color-text-pink-on-tint);');
    expect(mark).toContain('font-family: var(--font-mono);');
    expect(mark).toContain('font-size: var(--fs-chip-sm);');
    expect(mark).toContain('border-radius: 8px;');
  });

  it('.inline: padding 2 px 6 px', () => {
    expect(regra('inline')).toContain('padding: 2px 6px;');
  });

  it('nenhum hex nas declarações do CSS Module (comentários à parte)', () => {
    expect(css.replace(/\/\*[\s\S]*?\*\//g, '')).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });
});
