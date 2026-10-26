// Contagem da faixa de destaques (A-04; doc 04 §4.4, §9 "Números da faixa"). IntersectionObserver
// controlável (mesmo padrão de useReveal.test.ts/useStagger.test.ts, A-02/A-03, reescrito aqui —
// nenhum código importado de outro arquivo de teste, cada gancho é a sua própria unidade). Confere:
// - um elemento FORA da tela (rect sob medida) ganha '0' e só anima ao cruzar o limiar 0,15 via
//   IntersectionObserver;
// - um elemento JÁ VISÍVEL no 1º quadro (ou sem medição real de layout, o caso padrão do jsdom)
//   NUNCA recebe '0': o `textContent` fica intocado, exatamente o valor que o S-05 renderizou;
// - a contagem usa `animate()` do pacote `motion` (sobrecarga numérica, não WAAPI) com a duração e
//   a curva dos tokens `--dur-count`/`--ease-out`, arredonda e nunca passa do valor final;
// - nunca repete por elemento; cada `[data-countup]` reserva `min-width` em `ch`;
// - movimento reduzido escreve o valor final direto, sem chamar `animate()`;
// - `MutationObserver` cobre elementos montados depois; sem `IntersectionObserver` não quebra.
import { createElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PROJECTS } from '@/content/projects';
import type { Project } from '@/content/types';
import { ATRIBUTO_CONTAGEM, iniciarContagem } from '@/motion/useCountUp';
import { ATRIBUTO_MOVIMENTO_REDUZIDO } from '@/motion/useReducedMotion';
import { Highlights } from '@/sections/Highlights/Highlights';
import { renderWithProviders } from '../support/render';

// O `animate()` numérico real roda via requestAnimationFrame (não resolve de forma síncrona nos
// testes); só precisamos espiar os argumentos (igual a animarPreset em useReveal.test.ts, V-02 B2)
// e, manualmente, invocar `onUpdate`/`onComplete` capturados para conferir o comportamento quadro a
// quadro. `curvaDoToken`/`duracaoDoToken` (de `./animations`) continuam reais: os tokens do <html>.
const animateFalso = vi.hoisted(() => vi.fn());
vi.mock('motion', async (original) => ({
  ...(await original<typeof import('motion')>()),
  animate: animateFalso,
}));

/** IntersectionObserver controlável: o código real chama `observe`/`unobserve` nele. */
class IOControlavel {
  static instancias: IOControlavel[] = [];
  readonly observados = new Set<Element>();
  readonly opcoes: IntersectionObserverInit;
  readonly callback: IntersectionObserverCallback;
  constructor(callback: IntersectionObserverCallback, opcoes: IntersectionObserverInit = {}) {
    this.callback = callback;
    this.opcoes = opcoes;
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
    if (!this.observados.has(el)) return;
    this.callback(
      [{ target: el, isIntersecting: visivel } as unknown as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    );
  }
}

/** A única instância viva (useCountUp cria um único IntersectionObserver compartilhado). */
function observador(): IOControlavel {
  const io = IOControlavel.instancias[0];
  if (!io) throw new Error('nenhum IntersectionObserver foi criado');
  return io;
}

/** Retângulo "fora da tela" (abaixo do viewport de 800 px) — NÃO é o 0×0×0×0 padrão do jsdom. */
function retanguloForaDaTela(): DOMRect {
  return { top: 2000, bottom: 2600, left: 0, right: 80, width: 80, height: 600 } as DOMRect;
}

/** Retângulo "visível" (dentro do viewport de 800 px). */
function retanguloVisivel(): DOMRect {
  return { top: 10, bottom: 50, left: 0, right: 80, width: 80, height: 40 } as DOMRect;
}

function marcarRect(el: Element, rect: DOMRect): void {
  el.getBoundingClientRect = () => rect;
}

interface OpcoesAnimateCapturadas {
  onUpdate: (v: number) => void;
  onComplete: () => void;
  duration: number;
  ease: unknown;
}

/** Opções (3º argumento) passadas à chamada `chamada` de `animate()`. */
function opcoesDaChamada(chamada: number): OpcoesAnimateCapturadas {
  return animateFalso.mock.calls[chamada]![2] as OpcoesAnimateCapturadas;
}

const microtarefas = () => new Promise<void>((r) => setTimeout(r, 0));

let parar: () => void = () => undefined;

beforeEach(() => {
  IOControlavel.instancias = [];
  vi.stubGlobal('IntersectionObserver', IOControlavel);
  Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true });
  document.body.innerHTML = '';
  document.documentElement.removeAttribute(ATRIBUTO_MOVIMENTO_REDUZIDO);
  document.documentElement.style.setProperty('--dur-count', '1200ms');
  document.documentElement.style.setProperty('--ease-out', 'cubic-bezier(0.22, 1, 0.36, 1)');
  animateFalso.mockClear();
});

afterEach(() => {
  parar();
  parar = () => undefined;
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
  document.documentElement.removeAttribute(ATRIBUTO_MOVIMENTO_REDUZIDO);
  document.documentElement.style.removeProperty('--dur-count');
  document.documentElement.style.removeProperty('--ease-out');
});

describe('iniciarContagem', () => {
  it('elemento fora da tela ganha "0" e é observado com o limiar 0,15', () => {
    document.body.innerHTML = '<span id="a" data-countup="24">24</span>';
    const a = document.getElementById('a') as HTMLElement;
    marcarRect(a, retanguloForaDaTela());
    parar = iniciarContagem(document);

    expect(a.textContent).toBe('0');
    expect(observador().observados.has(a)).toBe(true);
    expect(observador().opcoes).toEqual({ threshold: 0.15 });
    expect(animateFalso).not.toHaveBeenCalled();
  });

  it('elemento já visível no 1º quadro NUNCA recebe "0": textContent intocado, sem animate()', () => {
    document.body.innerHTML = '<span id="a" data-countup="24">24</span>';
    const a = document.getElementById('a') as HTMLElement;
    marcarRect(a, retanguloVisivel());
    parar = iniciarContagem(document);

    expect(a.textContent).toBe('24');
    expect(observador().observados.has(a)).toBe(false);
    expect(animateFalso).not.toHaveBeenCalled();
  });

  it('sem medição real de layout (rect 0×0×0×0, o padrão do jsdom): tratado como já visível', () => {
    // Nenhum `marcarRect`: usa o getBoundingClientRect padrão do jsdom (tudo zero) — mesmo cenário
    // do Highlights.test.tsx (S-05), que não espera nenhum '0' escrito por cima do valor final.
    document.body.innerHTML = '<span id="a" data-countup="3">3</span>';
    const a = document.getElementById('a') as HTMLElement;
    parar = iniciarContagem(document);

    expect(a.textContent).toBe('3');
    expect(animateFalso).not.toHaveBeenCalled();
  });

  it('reserva min-width em ch igual à quantidade de dígitos do valor final (CLS)', () => {
    document.body.innerHTML =
      '<span id="a" data-countup="24">24</span><span id="b" data-countup="3">3</span>';
    const a = document.getElementById('a') as HTMLElement;
    const b = document.getElementById('b') as HTMLElement;
    marcarRect(a, retanguloForaDaTela());
    marcarRect(b, retanguloVisivel());
    parar = iniciarContagem(document);

    expect(a.style.minWidth).toBe('2ch');
    expect(b.style.minWidth).toBe('1ch');
  });

  it('ao cruzar o limiar, anima de 0 ao valor final com a duração/curva dos tokens', () => {
    document.body.innerHTML = '<span id="a" data-countup="24">24</span>';
    const a = document.getElementById('a') as HTMLElement;
    marcarRect(a, retanguloForaDaTela());
    parar = iniciarContagem(document);

    observador().disparar(a, true);
    expect(animateFalso).toHaveBeenCalledTimes(1);
    const chamada = animateFalso.mock.calls[0]!;
    expect(chamada[0]).toBe(0);
    expect(chamada[1]).toBe(24);
    const opcoes = opcoesDaChamada(0);
    expect(opcoes.duration).toBeCloseTo(1.2);
    expect(opcoes.ease).toEqual([0.22, 1, 0.36, 1]);
  });

  it('onUpdate arredonda e nunca passa do valor final; onComplete finaliza no valor exato', () => {
    document.body.innerHTML = '<span id="a" data-countup="10">10</span>';
    const a = document.getElementById('a') as HTMLElement;
    marcarRect(a, retanguloForaDaTela());
    parar = iniciarContagem(document);
    observador().disparar(a, true);

    const { onUpdate, onComplete } = opcoesDaChamada(0);
    onUpdate(0);
    expect(a.textContent).toBe('0');
    onUpdate(3.7);
    expect(a.textContent).toBe('4'); // arredonda, nunca fracionário
    onUpdate(-2); // nunca abaixo de 0 (defesa; a curva real não produz isso)
    expect(a.textContent).toBe('0');
    onUpdate(15); // nunca acima do valor final (defesa; a curva real não produz isso)
    expect(a.textContent).toBe('10');
    onUpdate(9.9999999);
    expect(a.textContent).toBe('10');
    onComplete();
    expect(a.textContent).toBe('10');
  });

  it('nunca repete no mesmo elemento: o IntersectionObserver para de observar depois da 1ª entrada', () => {
    document.body.innerHTML = '<span id="a" data-countup="5">5</span>';
    const a = document.getElementById('a') as HTMLElement;
    marcarRect(a, retanguloForaDaTela());
    parar = iniciarContagem(document);
    const io = observador();
    io.disparar(a, true);
    expect(animateFalso).toHaveBeenCalledTimes(1);
    expect(io.observados.has(a)).toBe(false);
  });

  it('rolar para fora e para dentro de novo não dispara uma 2ª vez', () => {
    document.body.innerHTML = '<span id="a" data-countup="5">5</span>';
    const a = document.getElementById('a') as HTMLElement;
    marcarRect(a, retanguloForaDaTela());
    parar = iniciarContagem(document);
    const io = observador();
    io.disparar(a, true);
    io.disparar(a, false);
    io.disparar(a, true);
    expect(animateFalso).toHaveBeenCalledTimes(1);
  });

  it('lê o movimento reduzido do <html> no momento exato da entrada: valor final direto, sem animate()', () => {
    document.body.innerHTML = '<span id="a" data-countup="5">5</span>';
    const a = document.getElementById('a') as HTMLElement;
    marcarRect(a, retanguloForaDaTela());
    parar = iniciarContagem(document);
    document.documentElement.setAttribute(ATRIBUTO_MOVIMENTO_REDUZIDO, 'true');
    observador().disparar(a, true);

    expect(animateFalso).not.toHaveBeenCalled();
    expect(a.textContent).toBe('5');
  });

  it('movimento reduzido já ativo na montagem: nunca escreve "0", mesmo fora da tela, sem rolar', () => {
    document.documentElement.setAttribute(ATRIBUTO_MOVIMENTO_REDUZIDO, 'true');
    document.body.innerHTML = '<span id="a" data-countup="5">5</span>';
    const a = document.getElementById('a') as HTMLElement;
    marcarRect(a, retanguloForaDaTela()); // fora da tela, mas não importa: reduzido vence.
    parar = iniciarContagem(document);

    expect(a.textContent).toBe('5');
    expect(observador().observados.has(a)).toBe(false);
    expect(animateFalso).not.toHaveBeenCalled();
  });

  it('[data-countup] sem número válido não é tocado', () => {
    document.body.innerHTML =
      '<span id="a" data-countup="">x</span><span id="b" data-countup="abc">x</span>';
    const a = document.getElementById('a') as HTMLElement;
    const b = document.getElementById('b') as HTMLElement;
    marcarRect(a, retanguloForaDaTela());
    marcarRect(b, retanguloForaDaTela());
    parar = iniciarContagem(document);
    expect(a.textContent).toBe('x');
    expect(b.textContent).toBe('x');
    expect(IOControlavel.instancias[0]?.observados.size ?? 0).toBe(0);
  });

  it('MutationObserver cobre [data-countup] (inclusive aninhado) montado depois', async () => {
    parar = iniciarContagem(document);
    const secao = document.createElement('section');
    const novo = document.createElement('span');
    novo.id = 'novo';
    novo.setAttribute(ATRIBUTO_CONTAGEM, '7');
    novo.textContent = '7';
    marcarRect(novo, retanguloForaDaTela()); // definido ANTES de entrar no documento.
    secao.append(novo);
    document.body.append(secao);
    await microtarefas();

    expect(novo.textContent).toBe('0');
    observador().disparar(novo, true);
    expect(animateFalso).toHaveBeenCalledTimes(1);
    expect(animateFalso.mock.calls[0]![1]).toBe(7);
  });

  it('um nó novo que já bate o seletor (não só um descendente) também é coberto', async () => {
    parar = iniciarContagem(document);
    const novo = document.createElement('span');
    novo.setAttribute(ATRIBUTO_CONTAGEM, '9');
    marcarRect(novo, retanguloForaDaTela());
    document.body.append(novo);
    await microtarefas();
    expect(novo.textContent).toBe('0');
    observador().disparar(novo, true);
    expect(animateFalso).toHaveBeenCalledTimes(1);
  });

  it('o cleanup desconecta o observador e pode reiniciar (StrictMode)', () => {
    document.body.innerHTML = '<span id="a" data-countup="5">5</span>';
    const a = document.getElementById('a') as HTMLElement;
    marcarRect(a, retanguloForaDaTela());
    const parar1 = iniciarContagem(document);
    const io1 = observador();
    parar1();
    expect(io1.observados.has(a)).toBe(false);

    parar = iniciarContagem(document);
    const io2 = IOControlavel.instancias.at(-1) as unknown as IOControlavel;
    expect(io2).not.toBe(io1);
    io2.disparar(a, true);
    expect(animateFalso).toHaveBeenCalledTimes(1);
  });

  it('sem IntersectionObserver não quebra; nenhum "0" é escrito, nenhuma animação é aplicada', () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    document.body.innerHTML = '<span id="a" data-countup="5">5</span>';
    const a = document.getElementById('a') as HTMLElement;
    marcarRect(a, retanguloForaDaTela());
    expect(() => {
      parar = iniciarContagem(document);
    }).not.toThrow();
    expect(a.textContent).toBe('5');
    expect(animateFalso).not.toHaveBeenCalled();
  });
});

describe('A-04 + C-06: o valor vem de itensDaFaixa()/projects.ts, nunca fixo no componente', () => {
  /** Os `n` primeiros projetos com repositório publicado (link falso, só no teste). */
  function comPublicados(n: number): Project[] {
    return PROJECTS.map((p, i) =>
      i < n ? { ...p, publicado: true, linkGithub: `https://github.com/teste/repo-${i}` } : p,
    );
  }

  it('trocar os projetos muda data-countup (item "projetos") sem tocar em Highlights.tsx', () => {
    const { unmount } = renderWithProviders(
      createElement(Highlights, { projetos: comPublicados(1) }),
    );
    expect(document.querySelector('[data-item="projetos"] [data-countup]')).toHaveAttribute(
      ATRIBUTO_CONTAGEM,
      '1',
    );
    unmount();

    renderWithProviders(createElement(Highlights, { projetos: comPublicados(3) }));
    expect(document.querySelector('[data-item="projetos"] [data-countup]')).toHaveAttribute(
      ATRIBUTO_CONTAGEM,
      '3',
    );
  });
});
