// Revelação de seções (A-02; doc 04 §4.4, §9). IntersectionObserver controlável (mesmo padrão de
// loopPause.test.ts, A-01): confere que TODO `[data-reveal]` (existente e montado depois) é
// observado com o limiar 0,15, que a entrada chama `animarPreset(el, fadeUp, reduzido)` lendo o
// `data-reduced-motion` do <html> na hora, que nunca repete no mesmo elemento (nem saindo e
// entrando de novo), que o cleanup desliga tudo e que a ausência de `IntersectionObserver` não
// quebra (nenhum estilo "escondido" é escrito por JS em lugar nenhum).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fadeUp } from '@/motion/animations';
import { ATRIBUTO_MOVIMENTO_REDUZIDO } from '@/motion/useReducedMotion';
import { ATRIBUTO_REVELACAO, iniciarRevelacao } from '@/motion/useReveal';

// O animate() real não roda no jsdom; só precisamos espiar os argumentos do animarPreset, igual a
// animations.test.ts (V-02 B2). O `inView` continua real: só ele sabe desligar a observação do
// elemento depois da 1ª entrada ("uma vez só").
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
  /**
   * Simula o navegador: `el` entrou (true) ou saiu (false) da área visível. Um navegador real
   * nunca entrega entrada para um alvo depois do `unobserve` — por isso este método, realista,
   * não chama o callback para um alvo que já não está observado (é assim que o `inView` consegue
   * garantir "uma vez só": ele mesmo chama `unobserve` quando `onStart` não devolve função).
   */
  disparar(el: Element, visivel: boolean) {
    if (!this.observados.has(el)) return;
    this.callback(
      [{ target: el, isIntersecting: visivel } as unknown as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    );
  }
}

/** Observador que detém `el` (o `inView` pode criar mais de um, um por chamada). */
function observadorDe(el: Element): IOControlavel {
  const io = IOControlavel.instancias.find((i) => i.observados.has(el));
  if (!io) throw new Error('nenhum IntersectionObserver observa este elemento');
  return io;
}

const microtarefas = () => new Promise<void>((r) => setTimeout(r, 0));

let parar: () => void = () => undefined;

beforeEach(() => {
  IOControlavel.instancias = [];
  vi.stubGlobal('IntersectionObserver', IOControlavel);
  document.body.innerHTML = '';
  document.documentElement.removeAttribute(ATRIBUTO_MOVIMENTO_REDUZIDO);
  animarPresetFalso.mockClear();
});

afterEach(() => {
  parar();
  parar = () => undefined;
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
  document.documentElement.removeAttribute(ATRIBUTO_MOVIMENTO_REDUZIDO);
});

describe('iniciarRevelacao', () => {
  it('observa, com o limiar 0,15, todo [data-reveal] já existente', () => {
    document.body.innerHTML =
      '<div data-reveal id="a"></div><div id="b"></div><section data-reveal id="c"></section>';
    parar = iniciarRevelacao(document);
    const a = document.getElementById('a') as Element;
    const c = document.getElementById('c') as Element;
    expect(observadorDe(a)).toBe(observadorDe(c)); // um único observador para os dois já existentes
    expect(observadorDe(a).opcoes).toEqual({ threshold: 0.15 });
    expect(document.getElementById('b')).not.toBeNull();
    expect(() => observadorDe(document.getElementById('b') as Element)).toThrow();
  });

  it('ao entrar na tela, anima opacity 0→1 + translateY 24→0 (fadeUp) sem movimento reduzido', () => {
    document.body.innerHTML = '<div data-reveal id="a"></div>';
    parar = iniciarRevelacao(document);
    const a = document.getElementById('a') as Element;
    observadorDe(a).disparar(a, true);
    expect(animarPresetFalso).toHaveBeenCalledTimes(1);
    expect(animarPresetFalso).toHaveBeenCalledWith(a, fadeUp, false);
  });

  it('lê o movimento reduzido do <html> no momento exato da entrada', () => {
    document.body.innerHTML = '<div data-reveal id="a"></div>';
    parar = iniciarRevelacao(document);
    document.documentElement.setAttribute(ATRIBUTO_MOVIMENTO_REDUZIDO, 'true');
    const a = document.getElementById('a') as Element;
    observadorDe(a).disparar(a, true);
    expect(animarPresetFalso).toHaveBeenCalledWith(a, fadeUp, true);
  });

  it('nunca repete no mesmo elemento: o próprio inView para de observar depois da 1ª entrada', () => {
    document.body.innerHTML = '<div data-reveal id="a"></div>';
    parar = iniciarRevelacao(document);
    const a = document.getElementById('a') as Element;
    const io = observadorDe(a);
    io.disparar(a, true);
    expect(animarPresetFalso).toHaveBeenCalledTimes(1);
    // "Uma vez só": o próprio `inView` já soltou o elemento (onStart não devolveu função de saída).
    expect(io.observados.has(a)).toBe(false);
  });

  it('rolar para fora e para dentro de novo não dispara uma 2ª vez', () => {
    document.body.innerHTML = '<div data-reveal id="a"></div>';
    parar = iniciarRevelacao(document);
    const a = document.getElementById('a') as Element;
    const io = observadorDe(a);
    io.disparar(a, true);
    io.disparar(a, false); // elemento já não está observado: callback não existe mais para ele
    io.disparar(a, true);
    expect(animarPresetFalso).toHaveBeenCalledTimes(1);
  });

  it('um bloco já visível no 1º quadro anima a partir do estado atual (nenhum "escondido" de largada)', () => {
    // Nada no módulo escreve opacity/transform antes do disparo: a 1ª notificação já pode vir
    // com isIntersecting=true (o próprio navegador decide, aqui simulado), sem nenhuma "piscada".
    document.body.innerHTML = '<div data-reveal id="destaques"></div>';
    parar = iniciarRevelacao(document);
    const el = document.getElementById('destaques') as Element;
    expect(el.getAttribute('style')).toBeNull();
    observadorDe(el).disparar(el, true);
    expect(animarPresetFalso).toHaveBeenCalledWith(el, fadeUp, false);
  });

  it('MutationObserver cobre [data-reveal] (inclusive aninhado) montado depois, com um observador próprio', async () => {
    parar = iniciarRevelacao(document);
    const secao = document.createElement('section');
    secao.innerHTML = '<div data-reveal id="novo"></div>';
    document.body.append(secao);
    await microtarefas();
    const novo = document.getElementById('novo') as Element;
    expect(observadorDe(novo).opcoes).toEqual({ threshold: 0.15 });
    observadorDe(novo).disparar(novo, true);
    expect(animarPresetFalso).toHaveBeenCalledWith(novo, fadeUp, false);
  });

  it('um nó novo que já bate o seletor (não só um descendente) também é coberto', async () => {
    parar = iniciarRevelacao(document);
    const novo = document.createElement('div');
    novo.setAttribute(ATRIBUTO_REVELACAO, '');
    document.body.append(novo);
    await microtarefas();
    observadorDe(novo).disparar(novo, true);
    expect(animarPresetFalso).toHaveBeenCalledWith(novo, fadeUp, false);
  });

  it('o cleanup desconecta os observadores e pode reiniciar (StrictMode)', () => {
    document.body.innerHTML = '<div data-reveal id="a"></div>';
    const parar1 = iniciarRevelacao(document);
    const a = document.getElementById('a') as Element;
    const io1 = observadorDe(a);
    parar1();
    expect(io1.observados.has(a)).toBe(false);
    parar = iniciarRevelacao(document);
    const io2 = observadorDe(a);
    expect(io2).not.toBe(io1);
    io2.disparar(a, true);
    expect(animarPresetFalso).toHaveBeenCalledTimes(1);
  });

  it('sem IntersectionObserver não quebra; nenhuma animação é aplicada', () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    document.body.innerHTML = '<div data-reveal id="a"></div>';
    expect(() => {
      parar = iniciarRevelacao(document);
    }).not.toThrow();
    expect(animarPresetFalso).not.toHaveBeenCalled();
  });
});
