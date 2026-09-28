// Pausa fora da tela e conferência do PulseDot (A-10; doc 04 §4.3, §4.5, §7; D14: o PulseDot é do
// DS-08). O A-10 só acrescenta `data-loop` no span do ponto (o anel é o `::after` dele). Aqui:
// - o span tem `data-loop`, `data-decor="pulse"` e `aria-hidden` nos dois tamanhos;
// - o observador do A-01 escreve `data-offscreen` nele (IntersectionObserver controlável);
// - o CSS do A-01 pausa o `::after` de `[data-loop]` fora da tela e com a aba oculta, e desliga a
//   animação com movimento reduzido;
// - os números do DS-08 batem com a tabela §7 (anel 20 → 36 px, 2,4 s, só transform/opacity, cor
//   `--color-accent` = rgb(224, 81, 138) claro e rgb(245, 143, 184) escuro);
// - não existe outro arquivo PulseDot fora de src/components/PulseDot/.
// As medidas no navegador (getComputedStyle do `::after`) ficam registradas no diário do A-10.
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PulseDot } from '@/components/PulseDot';
import { iniciarPausaDeLoops } from '@/motion/loopPause';

const RAIZ = process.cwd();
const ler = (arq: string): string =>
  readFileSync(resolve(RAIZ, arq), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

class IOControlavel {
  static instancias: IOControlavel[] = [];
  readonly observados = new Set<Element>();
  readonly callback: IntersectionObserverCallback;
  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    IOControlavel.instancias.push(this);
  }
  observe(el: Element) {
    this.observados.add(el);
  }
  unobserve(el: Element) {
    this.observados.delete(el);
  }
  disconnect() {
    this.observados.clear();
  }
  takeRecords() {
    return [];
  }
  disparar(el: Element, visivel: boolean) {
    this.callback(
      [{ target: el, isIntersecting: visivel } as unknown as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    );
  }
}

const microtarefas = () => new Promise<void>((r) => setTimeout(r, 0));

describe('A-10: atributos do PulseDot', () => {
  it.each([8, 20] as const)('tamanho %i: data-loop, data-decor="pulse", aria-hidden', (size) => {
    const { container } = render(<PulseDot size={size} />);
    const ponto = container.firstElementChild as HTMLElement;
    expect(ponto).toHaveAttribute('data-loop');
    expect(ponto).toHaveAttribute('data-decor', 'pulse');
    expect(ponto).toHaveAttribute('aria-hidden', 'true');
    expect(ponto).not.toHaveAttribute('tabindex');
    expect(ponto.textContent).toBe('');
  });
});

describe('A-10: observador do A-01 sobre o PulseDot', () => {
  let parar: () => void = () => undefined;

  beforeEach(() => {
    IOControlavel.instancias = [];
    vi.stubGlobal('IntersectionObserver', IOControlavel);
  });

  afterEach(() => {
    parar();
    parar = () => undefined;
    vi.unstubAllGlobals();
  });

  it('PulseDot montado depois do observador recebe data-offscreen="true|false"', async () => {
    parar = iniciarPausaDeLoops(document);
    const { container } = render(<PulseDot size={20} />);
    await microtarefas();
    const ponto = container.firstElementChild as HTMLElement;
    const io = IOControlavel.instancias[0] as IOControlavel;
    expect(io.observados.has(ponto)).toBe(true);
    io.disparar(ponto, false);
    expect(ponto).toHaveAttribute('data-offscreen', 'true');
    io.disparar(ponto, true);
    expect(ponto).toHaveAttribute('data-offscreen', 'false');
  });

  it('PulseDot já presente é observado na partida', () => {
    const { container } = render(<PulseDot />);
    parar = iniciarPausaDeLoops(document);
    const io = IOControlavel.instancias[0] as IOControlavel;
    expect(io.observados.has(container.firstElementChild as Element)).toBe(true);
  });
});

describe('A-10: CSS de pausa e de movimento reduzido (A-01) cobre o anel', () => {
  const css = ler('src/motion/reduced-motion.css').replace(/\s+/g, ' ');

  it('anel pausado fora da tela e com a aba oculta (::after de [data-loop])', () => {
    const bloco =
      /(:is\(\[data-loop\], \[data-float\]\)\[data-offscreen='true'\]::after[^{]*)\{([^}]*)\}/.exec(
        css,
      );
    expect(bloco).not.toBeNull();
    expect(bloco?.[1]).toContain('html[data-page-hidden] :is([data-loop], [data-float])::after');
    expect(bloco?.[2]).toContain('animation-play-state: paused !important');
  });

  it('movimento reduzido: animation none no ::after de [data-loop] (media e atributo)', () => {
    expect(css).toMatch(
      /@media \(prefers-reduced-motion: reduce\) \{[\s\S]*?\[data-loop\],[\s\S]*?\)::after \{ animation: none !important;/,
    );
    expect(css).toMatch(
      /html\[data-reduced-motion='true'\] :is\([^)]*\[data-loop\][^)]*\)::after \{ animation: none !important;/,
    );
  });

  it('o próprio CSS do DS-08 esconde o anel com movimento reduzido (núcleo estático)', () => {
    const modulo = ler('src/components/PulseDot/PulseDot.module.css');
    expect(modulo).toMatch(
      /@media \(prefers-reduced-motion: reduce\)\s*\{\s*\.dot::after\s*\{[^}]*display: none;/,
    );
    // O núcleo nunca anima (R5: nada pisca).
    expect(/\n\.dot\s*\{([^}]*)\}/.exec(modulo)?.[1]).not.toMatch(/animation/);
  });
});

describe('A-10: conferência do DS-08 × tabela §7', () => {
  const modulo = ler('src/components/PulseDot/PulseDot.module.css');
  const tokens = ler('src/styles/tokens/motion.css');
  const cores = ler('src/styles/tokens/colors.css');
  const keyframes = /@keyframes\s+pulse-ring\s*\{([\s\S]*?)\n\}/.exec(modulo)?.[1] ?? '';

  it('anel do marco: 20 px × scale(1.8) = 36 px no pico', () => {
    expect(modulo).toMatch(/\.size20\s*\{[^}]*inline-size: 20px;[^}]*block-size: 20px;/);
    const escala = Number(/to\s*\{[^}]*transform: scale\(([\d.]+)\)/.exec(keyframes)?.[1]);
    expect(escala).toBe(1.8);
    expect(20 * escala).toBeCloseTo(36, 5);
  });

  it('período 2,4 s (±0,1): --dur-pulse = 2400ms, usado pelo anel com --ease-out', () => {
    const ms = Number(/--dur-pulse:\s*(\d+)ms;/.exec(tokens)?.[1]);
    expect(Math.abs(ms / 1000 - 2.4)).toBeLessThanOrEqual(0.1);
    expect(modulo).toContain('animation: pulse-ring var(--dur-pulse) var(--ease-out) infinite;');
  });

  it('opacidade do anel 0,7 → 0 (canvas) e só transform/opacity nos keyframes', () => {
    expect(/from\s*\{([^}]*)\}/.exec(keyframes)?.[1]).toContain('opacity: 0.7;');
    expect(/to\s*\{([^}]*)\}/.exec(keyframes)?.[1]).toContain('opacity: 0;');
    const props = new Set([...keyframes.matchAll(/([a-z-]+)\s*:/g)].map((m) => m[1]));
    expect(props).toEqual(new Set(['opacity', 'transform']));
  });

  it('cor --color-accent: #e0518a (claro) e #f58fb8 (escuro) = rgb(224, 81, 138) / rgb(245, 143, 184)', () => {
    const claro = /:root,\s*\[data-theme='light'\]\s*\{([\s\S]*?)\n\}/.exec(cores)?.[1] ?? '';
    const escuro = /\[data-theme='dark'\]\s*\{([\s\S]*?)\n\}/.exec(cores)?.[1] ?? '';
    const hexParaRgb = (hex: string) =>
      `rgb(${[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(', ')})`;
    const accent = (bloco: string) => /--color-accent:\s*(#[0-9a-f]{6});/i.exec(bloco)?.[1] ?? '';
    expect(hexParaRgb(accent(claro))).toBe('rgb(224, 81, 138)');
    expect(hexParaRgb(accent(escuro))).toBe('rgb(245, 143, 184)');
    expect(modulo).toMatch(/\.dot::after\s*\{[^}]*background-color: var\(--color-accent\);/);
  });
});

describe('A-10: dono único (D14)', () => {
  it('nenhum arquivo PulseDot fora de src/components/PulseDot/', () => {
    const src = resolve(RAIZ, 'src');
    const fora = readdirSync(src, { recursive: true, encoding: 'utf8' })
      .filter((f) => /PulseDot/i.test(f.split(/[\\/]/).pop() ?? ''))
      .map((f) => relative(RAIZ, join(src, f)).replaceAll('\\', '/'))
      .filter((f) => f !== 'src/components/PulseDot' && !f.startsWith('src/components/PulseDot/'));
    expect(fora).toEqual([]);
  });
});
