// Observador de loops (A-01; doc 04 §4.3). IntersectionObserver controlável: confere que TODO
// `[data-loop]` e `[data-float]` (existente, novo, com atributo acrescentado depois) é observado por UM observador,
// recebe `data-offscreen="true|false"`, é solto ao sair do documento, e que o cleanup limpa tudo.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { iniciarPausaDeLoops } from '@/motion/loopPause';

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
  /** Simula o navegador: `el` entrou (true) ou saiu (false) da tela. */
  disparar(el: Element, visivel: boolean) {
    this.callback(
      [{ target: el, isIntersecting: visivel } as unknown as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    );
  }
}

/** Deixa o MutationObserver (microtarefa) entregar os registros. */
const microtarefas = () => new Promise<void>((r) => setTimeout(r, 0));

let parar: () => void = () => undefined;

beforeEach(() => {
  IOControlavel.instancias = [];
  vi.stubGlobal('IntersectionObserver', IOControlavel);
  document.body.innerHTML = '';
});

afterEach(() => {
  parar();
  parar = () => undefined;
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
});

describe('iniciarPausaDeLoops', () => {
  it('um único IntersectionObserver observa os [data-loop] já existentes', () => {
    document.body.innerHTML = '<div data-loop id="a"></div><div id="b"></div><i data-loop></i>';
    parar = iniciarPausaDeLoops(document);
    expect(IOControlavel.instancias).toHaveLength(1);
    const io = IOControlavel.instancias[0] as IOControlavel;
    expect([...io.observados].map((el) => el.tagName)).toEqual(['DIV', 'I']);
  });

  it('escreve data-offscreen="true" fora da tela e "false" de volta', () => {
    document.body.innerHTML = '<div data-loop id="a"></div>';
    parar = iniciarPausaDeLoops(document);
    const io = IOControlavel.instancias[0] as IOControlavel;
    const el = document.getElementById('a') as HTMLElement;
    io.disparar(el, false);
    expect(el.getAttribute('data-offscreen')).toBe('true');
    io.disparar(el, true);
    expect(el.getAttribute('data-offscreen')).toBe('false');
  });

  it('observa nós novos (MutationObserver), inclusive aninhados e com atributo posto depois', async () => {
    parar = iniciarPausaDeLoops(document);
    const io = IOControlavel.instancias[0] as IOControlavel;
    const secao = document.createElement('section');
    secao.innerHTML = '<span data-loop id="filho"></span>';
    document.body.append(secao);
    const tardio = document.createElement('b');
    document.body.append(tardio);
    await microtarefas();
    expect(io.observados.has(document.getElementById('filho') as Element)).toBe(true);
    expect(io.observados.has(tardio)).toBe(false);
    tardio.setAttribute('data-loop', '');
    await microtarefas();
    expect(io.observados.has(tardio)).toBe(true);
    tardio.removeAttribute('data-loop');
    await microtarefas();
    expect(io.observados.has(tardio)).toBe(false);
  });

  it('[data-float] (cartões do A-11a) é observado igual a [data-loop]: existente, novo e atributo posto/tirado', async () => {
    document.body.innerHTML = '<div data-float id="c1"></div>';
    parar = iniciarPausaDeLoops(document);
    const io = IOControlavel.instancias[0] as IOControlavel;
    const c1 = document.getElementById('c1') as HTMLElement;
    expect(io.observados.has(c1)).toBe(true);
    io.disparar(c1, false);
    expect(c1.getAttribute('data-offscreen')).toBe('true');
    io.disparar(c1, true);
    expect(c1.getAttribute('data-offscreen')).toBe('false');

    const novo = document.createElement('article');
    novo.innerHTML = '<div data-float id="c2"></div>';
    document.body.append(novo);
    const tardio = document.createElement('div');
    document.body.append(tardio);
    await microtarefas();
    expect(io.observados.has(document.getElementById('c2') as Element)).toBe(true);
    tardio.setAttribute('data-float', '');
    await microtarefas();
    expect(io.observados.has(tardio)).toBe(true);
    // Com os dois atributos, tirar só um mantém observado; tirar os dois solta.
    tardio.setAttribute('data-loop', '');
    tardio.removeAttribute('data-float');
    await microtarefas();
    expect(io.observados.has(tardio)).toBe(true);
    tardio.removeAttribute('data-loop');
    await microtarefas();
    expect(io.observados.has(tardio)).toBe(false);
    expect(IOControlavel.instancias).toHaveLength(1);
  });

  it('solta nós removidos do documento', async () => {
    document.body.innerHTML = '<div data-loop id="a"></div>';
    parar = iniciarPausaDeLoops(document);
    const io = IOControlavel.instancias[0] as IOControlavel;
    const el = document.getElementById('a') as HTMLElement;
    el.remove();
    await microtarefas();
    expect(io.observados.has(el)).toBe(false);
  });

  it('visibilitychange liga e desliga data-page-hidden no <html>', () => {
    let estado: DocumentVisibilityState = 'visible';
    vi.spyOn(document, 'visibilityState', 'get').mockImplementation(() => estado);
    vi.spyOn(document, 'hidden', 'get').mockImplementation(() => estado === 'hidden');
    parar = iniciarPausaDeLoops(document);
    const html = document.documentElement;
    expect(html.hasAttribute('data-page-hidden')).toBe(false);
    estado = 'hidden';
    document.dispatchEvent(new Event('visibilitychange'));
    expect(html.hasAttribute('data-page-hidden')).toBe(true);
    estado = 'visible';
    document.dispatchEvent(new Event('visibilitychange'));
    expect(html.hasAttribute('data-page-hidden')).toBe(false);
    vi.restoreAllMocks();
  });

  it('o cleanup desconecta, apaga data-offscreen e data-page-hidden e pode reiniciar (StrictMode)', () => {
    document.body.innerHTML = '<div data-loop id="a"></div>';
    const parar1 = iniciarPausaDeLoops(document);
    const io = IOControlavel.instancias[0] as IOControlavel;
    const el = document.getElementById('a') as HTMLElement;
    io.disparar(el, false);
    parar1();
    expect(io.observados.size).toBe(0);
    expect(el.hasAttribute('data-offscreen')).toBe(false);
    expect(document.documentElement.hasAttribute('data-page-hidden')).toBe(false);
    parar = iniciarPausaDeLoops(document);
    expect(IOControlavel.instancias).toHaveLength(2);
    expect((IOControlavel.instancias[1] as IOControlavel).observados.has(el)).toBe(true);
  });

  it('sem IntersectionObserver não quebra (só a pausa por aba oculta vale)', () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    document.body.innerHTML = '<div data-loop></div>';
    expect(() => {
      parar = iniciarPausaDeLoops(document);
    }).not.toThrow();
  });
});
