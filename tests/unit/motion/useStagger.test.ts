// Cascatas (A-03; doc 04 §4.4, §9). IntersectionObserver controlável (mesmo padrão de
// useReveal.test.ts/loopPause.test.ts, A-01/A-02, reescrito aqui — nenhum código importado de
// outro arquivo de teste, cada gancho é a sua própria unidade). Confere que TODO `[data-stagger]`
// (existente e montado depois) é observado com o limiar 0,15, que a entrada anima os
// `[data-stagger-item]` DESCENDENTES com o preset certo por tipo (chips/motto/steps) e o atraso
// certo (`stagger()`), que nunca repete no mesmo contêiner, que cada contêiner recomeça o atraso
// do zero e que a ausência de `IntersectionObserver` não quebra.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fade, fadeUp, lightUp } from '@/motion/animations';
import { ATRIBUTO_MOVIMENTO_REDUZIDO } from '@/motion/useReducedMotion';
import { ATRIBUTO_CASCATA, ATRIBUTO_ITEM_CASCATA, iniciarCascata } from '@/motion/useStagger';

// O animate() real não roda no jsdom; só precisamos espiar os argumentos de animarPreset, igual a
// useReveal.test.ts (V-02 B2). `staggerDelay`/`duracaoDoToken` continuam reais: a verificação dos
// atrasos reais (0/40/80ms…) usa a função devolvida de verdade.
const animarPresetFalso = vi.hoisted(() => vi.fn());
vi.mock('@/motion/animations', async (original) => ({
  ...(await original<typeof import('@/motion/animations')>()),
  animarPreset: animarPresetFalso,
}));

/** IntersectionObserver controlável: o `inView` real do `motion` chama `observe`/`unobserve` nele. */
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
  /** Simula o navegador: nunca entrega entrada para um alvo já solto (`unobserve`). */
  disparar(el: Element, visivel: boolean) {
    if (!this.observados.has(el)) return;
    this.callback(
      [{ target: el, isIntersecting: visivel } as unknown as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    );
  }
}

function observadorDe(el: Element): IOControlavel {
  const io = IOControlavel.instancias.find((i) => i.observados.has(el));
  if (!io) throw new Error('nenhum IntersectionObserver observa este elemento');
  return io;
}

const microtarefas = () => new Promise<void>((r) => setTimeout(r, 0));

/** Último argumento `atraso` (função `stagger()`) passado a uma chamada de `animarPreset`. */
function ultimoAtraso(chamada: number): (i: number, total: number) => number {
  return animarPresetFalso.mock.calls[chamada]![3] as (i: number, total: number) => number;
}

let parar: () => void = () => undefined;

beforeEach(() => {
  IOControlavel.instancias = [];
  vi.stubGlobal('IntersectionObserver', IOControlavel);
  document.body.innerHTML = '';
  document.documentElement.removeAttribute(ATRIBUTO_MOVIMENTO_REDUZIDO);
  document.documentElement.removeAttribute('style');
  animarPresetFalso.mockClear();
});

afterEach(() => {
  parar();
  parar = () => undefined;
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
  document.documentElement.removeAttribute(ATRIBUTO_MOVIMENTO_REDUZIDO);
  document.documentElement.removeAttribute('style');
});

/** Monta um cartão de chips, igual ao DOM real do SkillCategory (S-09): item dentro de um `<ul>`. */
function montarChips(): { cartao: Element; itens: Element[] } {
  document.body.innerHTML = `
    <article id="cartao" data-stagger="chips">
      <h3>Linguagens</h3>
      <ul>
        <li data-stagger-item id="c1">Python</li>
        <li data-stagger-item id="c2">TypeScript</li>
        <li data-stagger-item id="c3">SQL</li>
      </ul>
    </article>`;
  const cartao = document.getElementById('cartao') as Element;
  const itens = [...cartao.querySelectorAll(`[${ATRIBUTO_ITEM_CASCATA}]`)];
  return { cartao, itens };
}

describe('iniciarCascata', () => {
  it('observa, com o limiar 0,15, todo [data-stagger] já existente', () => {
    document.body.innerHTML =
      '<div data-stagger="chips" id="a"><span data-stagger-item></span></div>' +
      '<div id="b"></div>' +
      '<section data-stagger="motto" id="c"><p data-stagger-item></p></section>';
    parar = iniciarCascata(document);
    const a = document.getElementById('a') as Element;
    const c = document.getElementById('c') as Element;
    expect(observadorDe(a)).toBe(observadorDe(c));
    expect(observadorDe(a).opcoes).toEqual({ threshold: 0.15 });
    expect(() => observadorDe(document.getElementById('b') as Element)).toThrow();
  });

  it('chips: anima os itens descendentes com fade + duração do token --dur-chip e atraso de 40 ms', () => {
    document.documentElement.style.setProperty('--dur-chip', '400ms');
    const { cartao, itens } = montarChips();
    parar = iniciarCascata(document);
    observadorDe(cartao).disparar(cartao, true);

    expect(animarPresetFalso).toHaveBeenCalledTimes(1);
    const chamada = animarPresetFalso.mock.calls[0]!;
    const recebidos = [...(chamada[0] as NodeListOf<Element>)];
    expect(recebidos).toHaveLength(itens.length);
    recebidos.forEach((el, i) => expect(el).toBe(itens[i]));
    expect(chamada[1]).toBe(fade);
    expect(chamada[2]).toBe(false);
    expect(chamada[4]).toEqual({ duracao: 0.4 });

    const atraso = ultimoAtraso(0);
    expect(atraso(0, 3)).toBeCloseTo(0);
    expect(atraso(1, 3)).toBeCloseTo(0.04);
    expect(atraso(2, 3)).toBeCloseTo(0.08);
  });

  it('motto: anima as 3 linhas (filhas diretas) com fadeUp e atraso de 150 ms, sem sobrescrita', () => {
    document.body.innerHTML = `
      <div id="linhas" data-stagger="motto">
        <p data-stagger-item id="l1"></p>
        <p data-stagger-item id="l2"></p>
        <p data-stagger-item id="l3"></p>
      </div>`;
    const linhas = document.getElementById('linhas') as Element;
    parar = iniciarCascata(document);
    observadorDe(linhas).disparar(linhas, true);

    expect(animarPresetFalso).toHaveBeenCalledTimes(1);
    const chamada = animarPresetFalso.mock.calls[0]!;
    expect(chamada[1]).toBe(fadeUp);
    expect(chamada[2]).toBe(false);
    expect(chamada[4]).toBeUndefined();

    const atraso = ultimoAtraso(0);
    expect(atraso(0, 3)).toBeCloseTo(0);
    expect(atraso(1, 3)).toBeCloseTo(0.15);
    expect(atraso(2, 3)).toBeCloseTo(0.3);
  });

  it('steps: anima as etapas (dentro de <li>) com lightUp e atraso de 200 ms', () => {
    document.body.innerHTML = `
      <ol id="etapas" data-stagger="steps">
        <li><span data-stagger-item id="e1"></span></li>
        <li><span data-stagger-item id="e2"></span></li>
        <li><span data-stagger-item id="e3"></span></li>
        <li><span data-stagger-item id="e4"></span></li>
      </ol>`;
    const etapas = document.getElementById('etapas') as Element;
    parar = iniciarCascata(document);
    observadorDe(etapas).disparar(etapas, true);

    expect(animarPresetFalso).toHaveBeenCalledTimes(1);
    const chamada = animarPresetFalso.mock.calls[0]!;
    expect(chamada[1]).toBe(lightUp);
    expect(chamada[4]).toBeUndefined();

    const atraso = ultimoAtraso(0);
    expect(atraso(0, 4)).toBeCloseTo(0);
    expect(atraso(1, 4)).toBeCloseTo(0.2);
    expect(atraso(2, 4)).toBeCloseTo(0.4);
    expect(atraso(3, 4)).toBeCloseTo(0.6);
  });

  it('lê o movimento reduzido do <html> no momento exato da entrada', () => {
    const { cartao } = montarChips();
    parar = iniciarCascata(document);
    document.documentElement.setAttribute(ATRIBUTO_MOVIMENTO_REDUZIDO, 'true');
    observadorDe(cartao).disparar(cartao, true);
    expect(animarPresetFalso).toHaveBeenCalledWith(
      expect.anything(),
      fade,
      true,
      expect.any(Function),
      expect.anything(),
    );
  });

  it('nunca repete no mesmo contêiner: o próprio inView para de observar depois da 1ª entrada', () => {
    const { cartao } = montarChips();
    parar = iniciarCascata(document);
    const io = observadorDe(cartao);
    io.disparar(cartao, true);
    expect(animarPresetFalso).toHaveBeenCalledTimes(1);
    expect(io.observados.has(cartao)).toBe(false);
  });

  it('rolar para fora e para dentro de novo não dispara uma 2ª vez', () => {
    const { cartao } = montarChips();
    parar = iniciarCascata(document);
    const io = observadorDe(cartao);
    io.disparar(cartao, true);
    io.disparar(cartao, false);
    io.disparar(cartao, true);
    expect(animarPresetFalso).toHaveBeenCalledTimes(1);
  });

  it('cada contêiner recomeça o atraso do zero: dois cartões de chips são independentes', () => {
    document.body.innerHTML = `
      <article id="c1" data-stagger="chips"><ul><li data-stagger-item></li><li data-stagger-item></li></ul></article>
      <article id="c2" data-stagger="chips"><ul><li data-stagger-item></li><li data-stagger-item></li></ul></article>`;
    const c1 = document.getElementById('c1') as Element;
    const c2 = document.getElementById('c2') as Element;
    parar = iniciarCascata(document);
    observadorDe(c2).disparar(c2, true); // só o 2º entra primeiro
    expect(animarPresetFalso).toHaveBeenCalledTimes(1);
    expect(ultimoAtraso(0)(0, 2)).toBeCloseTo(0); // começa do zero, não importa a ordem de entrada

    observadorDe(c1).disparar(c1, true);
    expect(animarPresetFalso).toHaveBeenCalledTimes(2);
    expect(ultimoAtraso(1)(0, 2)).toBeCloseTo(0);
  });

  it('contêiner sem [data-stagger-item] não chama animarPreset', () => {
    document.body.innerHTML = '<div id="vazio" data-stagger="chips"></div>';
    const vazio = document.getElementById('vazio') as Element;
    parar = iniciarCascata(document);
    observadorDe(vazio).disparar(vazio, true);
    expect(animarPresetFalso).not.toHaveBeenCalled();
  });

  it('tipo de data-stagger desconhecido não chama animarPreset', () => {
    document.body.innerHTML =
      '<div id="desconhecido" data-stagger="algo-novo"><span data-stagger-item></span></div>';
    const el = document.getElementById('desconhecido') as Element;
    parar = iniciarCascata(document);
    observadorDe(el).disparar(el, true);
    expect(animarPresetFalso).not.toHaveBeenCalled();
  });

  it('MutationObserver cobre [data-stagger] (inclusive aninhado) montado depois', async () => {
    parar = iniciarCascata(document);
    const secao = document.createElement('section');
    secao.innerHTML =
      '<div data-stagger="motto" id="novo"><p data-stagger-item></p><p data-stagger-item></p></div>';
    document.body.append(secao);
    await microtarefas();
    const novo = document.getElementById('novo') as Element;
    expect(observadorDe(novo).opcoes).toEqual({ threshold: 0.15 });
    observadorDe(novo).disparar(novo, true);
    expect(animarPresetFalso).toHaveBeenCalledTimes(1);
    expect(animarPresetFalso.mock.calls[0]![1]).toBe(fadeUp);
  });

  it('um nó novo que já bate o seletor (não só um descendente) também é coberto', async () => {
    parar = iniciarCascata(document);
    const novo = document.createElement('div');
    novo.setAttribute(ATRIBUTO_CASCATA, 'motto');
    novo.innerHTML = '<p data-stagger-item></p>';
    document.body.append(novo);
    await microtarefas();
    observadorDe(novo).disparar(novo, true);
    expect(animarPresetFalso).toHaveBeenCalledTimes(1);
  });

  it('o cleanup desconecta os observadores e pode reiniciar (StrictMode)', () => {
    const { cartao } = montarChips();
    const parar1 = iniciarCascata(document);
    const io1 = observadorDe(cartao);
    parar1();
    expect(io1.observados.has(cartao)).toBe(false);
    parar = iniciarCascata(document);
    const io2 = observadorDe(cartao);
    expect(io2).not.toBe(io1);
    io2.disparar(cartao, true);
    expect(animarPresetFalso).toHaveBeenCalledTimes(1);
  });

  it('sem IntersectionObserver não quebra; nenhuma animação é aplicada', () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    montarChips();
    expect(() => {
      parar = iniciarCascata(document);
    }).not.toThrow();
    expect(animarPresetFalso).not.toHaveBeenCalled();
  });
});
