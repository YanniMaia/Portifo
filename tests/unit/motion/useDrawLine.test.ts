// Desenho de linha (A-05; doc 04 §4.4, §9). IntersectionObserver controlável (mesmo padrão de
// useReveal.test.ts/useStagger.test.ts, A-02/A-03, reescrito aqui — nenhum código importado de
// outro arquivo de teste, cada gancho é a sua própria unidade). Confere que:
// - toda `[data-draw="y"]` (existente e montada depois) é observada com o limiar 0,15 e desenha com
//   `lineDrawY`, sem sobrescrita, lendo o movimento reduzido no instante exato da entrada;
// - cada grupo de `[data-draw="trail"]` (a `<ol>` ancestral mais próxima dos 3 conectores de uma
//   trilha) é observado como GRUPO, não conector a conector, e desenha os conectores EM SEQUÊNCIA
//   (duração = `--dur-draw` / nº de conectores, atraso = i × duração) no eixo certo
//   (`matchMedia('(min-width: 1024px)')`, recalculado a cada disparo, nunca cacheado);
// - a ponta de seta de cada conector ganha fade com o atraso aritmético (i + 1) × duração;
// - nenhum elemento/grupo desenha 2 vezes (nem saindo e entrando de novo na tela);
// - a ausência de `IntersectionObserver` não quebra.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fade, lineDrawX, lineDrawY } from '@/motion/animations';
import { ATRIBUTO_DESENHO, ATRIBUTO_PONTA, iniciarDesenho } from '@/motion/useDrawLine';
import { ATRIBUTO_MOVIMENTO_REDUZIDO } from '@/motion/useReducedMotion';

// O animate() real não roda no jsdom; só precisamos espiar os argumentos de animarPreset, igual a
// useReveal.test.ts/useStagger.test.ts (V-02 B2). O `inView`/`stagger` continuam reais.
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

/** Instala um `matchMedia` controlável só para `(min-width: 1024px)` (demais queries = false). */
function instalarEixo(desktopInicial: boolean) {
  let desktop = desktopInicial;
  vi.spyOn(window, 'matchMedia').mockImplementation(
    (query: string) =>
      ({
        matches: query === '(min-width: 1024px)' ? desktop : false,
        media: query,
        onchange: null,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        addListener: () => undefined,
        removeListener: () => undefined,
        dispatchEvent: () => false,
      }) as MediaQueryList,
  );
  return { setDesktop: (valor: boolean) => (desktop = valor) };
}

let parar: () => void = () => undefined;

beforeEach(() => {
  IOControlavel.instancias = [];
  vi.stubGlobal('IntersectionObserver', IOControlavel);
  document.body.innerHTML = '';
  document.documentElement.removeAttribute(ATRIBUTO_MOVIMENTO_REDUZIDO);
  document.documentElement.style.setProperty('--dur-draw', '800ms');
  animarPresetFalso.mockClear();
});

afterEach(() => {
  parar();
  parar = () => undefined;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  document.body.innerHTML = '';
  document.documentElement.removeAttribute(ATRIBUTO_MOVIMENTO_REDUZIDO);
  document.documentElement.removeAttribute('style');
});

/**
 * Monta uma trilha com 3 conectores, igual ao DOM real do Track (S-14): conector dentro do <li>,
 * ponta de seta dentro do conector. Cria um nó `<ol>` separado e o anexa com `appendChild` (nunca
 * `innerHTML +=`: concatenar serializaria e RECRIARIA os nós de uma trilha montada antes nesse
 * mesmo teste, trocando as referências já guardadas pela chamada anterior por nós "fantasmas" fora
 * do documento — achado de instrumentação de teste, não de produto, descoberto ao escrever os
 * testes com 2 trilhas).
 */
function montarTrilha(id: string): { ol: Element; conectores: Element[]; pontas: Element[] } {
  const ol = document.createElement('ol');
  ol.id = id;
  ol.setAttribute('data-stagger', 'steps');
  ol.innerHTML = `
    <li><span data-stagger-item></span><span data-draw="trail" id="${id}-c1"><span data-draw-tip id="${id}-t1"></span></span></li>
    <li><span data-stagger-item></span><span data-draw="trail" id="${id}-c2"><span data-draw-tip id="${id}-t2"></span></span></li>
    <li><span data-stagger-item></span><span data-draw="trail" id="${id}-c3"><span data-draw-tip id="${id}-t3"></span></span></li>
    <li><span data-stagger-item></span></li>`;
  document.body.appendChild(ol);
  const conectores = [...ol.querySelectorAll(`[${ATRIBUTO_DESENHO}="trail"]`)];
  const pontas = [...ol.querySelectorAll(`[${ATRIBUTO_PONTA}]`)];
  return { ol, conectores, pontas };
}

describe('iniciarDesenho — data-draw="y" (Formação)', () => {
  it('observa, com o limiar 0,15, toda [data-draw="y"] já existente (um observador compartilhado)', () => {
    document.body.innerHTML =
      '<span data-draw="y" id="a"></span><div id="b"></div><span data-draw="y" id="c"></span>';
    parar = iniciarDesenho(document);
    const a = document.getElementById('a') as Element;
    const c = document.getElementById('c') as Element;
    expect(observadorDe(a)).toBe(observadorDe(c));
    expect(observadorDe(a).opcoes).toEqual({ threshold: 0.15 });
    expect(() => observadorDe(document.getElementById('b') as Element)).toThrow();
  });

  it('ao entrar na tela, anima lineDrawY sem atraso nem sobrescrita', () => {
    document.body.innerHTML = '<span data-draw="y" id="a"></span>';
    parar = iniciarDesenho(document);
    const a = document.getElementById('a') as Element;
    observadorDe(a).disparar(a, true);
    expect(animarPresetFalso).toHaveBeenCalledTimes(1);
    expect(animarPresetFalso).toHaveBeenCalledWith(a, lineDrawY, false);
  });

  it('lê o movimento reduzido do <html> no momento exato da entrada', () => {
    document.body.innerHTML = '<span data-draw="y" id="a"></span>';
    parar = iniciarDesenho(document);
    document.documentElement.setAttribute(ATRIBUTO_MOVIMENTO_REDUZIDO, 'true');
    const a = document.getElementById('a') as Element;
    observadorDe(a).disparar(a, true);
    expect(animarPresetFalso).toHaveBeenCalledWith(a, lineDrawY, true);
  });

  it('nunca repete no mesmo elemento: o próprio inView para de observar depois da 1ª entrada', () => {
    document.body.innerHTML = '<span data-draw="y" id="a"></span>';
    parar = iniciarDesenho(document);
    const a = document.getElementById('a') as Element;
    const io = observadorDe(a);
    io.disparar(a, true);
    expect(animarPresetFalso).toHaveBeenCalledTimes(1);
    expect(io.observados.has(a)).toBe(false);
  });

  it('rolar para fora e para dentro de novo não dispara uma 2ª vez', () => {
    document.body.innerHTML = '<span data-draw="y" id="a"></span>';
    parar = iniciarDesenho(document);
    const a = document.getElementById('a') as Element;
    const io = observadorDe(a);
    io.disparar(a, true);
    io.disparar(a, false);
    io.disparar(a, true);
    expect(animarPresetFalso).toHaveBeenCalledTimes(1);
  });

  it('MutationObserver cobre [data-draw="y"] montado depois', async () => {
    parar = iniciarDesenho(document);
    const secao = document.createElement('section');
    secao.innerHTML = '<span data-draw="y" id="novo"></span>';
    document.body.append(secao);
    await microtarefas();
    const novo = document.getElementById('novo') as Element;
    expect(observadorDe(novo).opcoes).toEqual({ threshold: 0.15 });
    observadorDe(novo).disparar(novo, true);
    expect(animarPresetFalso).toHaveBeenCalledWith(novo, lineDrawY, false);
  });
});

describe('iniciarDesenho — data-draw="trail" (trilhas)', () => {
  it('observa o GRUPO (a <ol> ancestral), não cada conector, com o limiar 0,15', () => {
    const t1 = montarTrilha('t1');
    const t2 = montarTrilha('t2');
    parar = iniciarDesenho(document);
    expect(observadorDe(t1.ol)).toBe(observadorDe(t2.ol));
    expect(observadorDe(t1.ol).opcoes).toEqual({ threshold: 0.15 });
    // Os conectores em si nunca são observados diretamente (só o grupo).
    expect(() => observadorDe(t1.conectores[0]!)).toThrow();
  });

  it('desktop/tablet (≥ 1024 px): lineDrawX nos 3 conectores, duração --dur-draw/3, atraso 0/267/533 ms', () => {
    instalarEixo(true);
    const { ol, conectores } = montarTrilha('t1');
    parar = iniciarDesenho(document);
    observadorDe(ol).disparar(ol, true);

    expect(animarPresetFalso).toHaveBeenCalledTimes(2); // conectores + pontas
    const chamadaLinhas = animarPresetFalso.mock.calls[0]!;
    const recebidos = [...(chamadaLinhas[0] as Element[])];
    expect(recebidos).toEqual(conectores);
    expect(chamadaLinhas[1]).toBe(lineDrawX);
    expect(chamadaLinhas[2]).toBe(false);
    expect((chamadaLinhas[4] as { duracao: number }).duracao).toBeCloseTo(0.8 / 3, 5);

    const atraso = ultimoAtraso(0);
    expect(atraso(0, 3)).toBeCloseTo(0, 5);
    expect(atraso(1, 3)).toBeCloseTo(0.8 / 3, 5);
    expect(atraso(2, 3)).toBeCloseTo((2 * 0.8) / 3, 5);
  });

  it('celular (< 1024 px): lineDrawY nos conectores (eixo vertical)', () => {
    instalarEixo(false);
    const { ol } = montarTrilha('t1');
    parar = iniciarDesenho(document);
    observadorDe(ol).disparar(ol, true);
    expect(animarPresetFalso.mock.calls[0]![1]).toBe(lineDrawY);
  });

  it('ponta de seta: fade com atraso aritmético (i+1) × duração — termina quando o conector dela termina', () => {
    instalarEixo(true);
    const { ol, pontas } = montarTrilha('t1');
    parar = iniciarDesenho(document);
    observadorDe(ol).disparar(ol, true);

    const chamadaPontas = animarPresetFalso.mock.calls[1]!;
    const recebidos = [...(chamadaPontas[0] as Element[])];
    expect(recebidos).toEqual(pontas);
    expect(chamadaPontas[1]).toBe(fade);
    expect(chamadaPontas[2]).toBe(false);
    expect(chamadaPontas[4]).toBeUndefined();

    const atraso = ultimoAtraso(1);
    const trecho = 0.8 / 3;
    expect(atraso(0, 3)).toBeCloseTo(trecho, 5);
    expect(atraso(1, 3)).toBeCloseTo(2 * trecho, 5);
    expect(atraso(2, 3)).toBeCloseTo(3 * trecho, 5);
  });

  it('eixo recalculado a cada disparo: dois grupos distintos, cada um lê o matchMedia no próprio instante', () => {
    const eixo = instalarEixo(true); // 1º grupo entra com o eixo "desktop"
    const t1 = montarTrilha('t1');
    const t2 = montarTrilha('t2');
    parar = iniciarDesenho(document);

    observadorDe(t1.ol).disparar(t1.ol, true);
    expect(animarPresetFalso.mock.calls[0]![1]).toBe(lineDrawX);

    eixo.setDesktop(false); // redimensionou para celular ANTES do 2º grupo entrar
    observadorDe(t2.ol).disparar(t2.ol, true);
    expect(animarPresetFalso.mock.calls[2]![1]).toBe(lineDrawY); // calls[2] = linhas do 2º grupo
  });

  it('lê o movimento reduzido do <html> no momento exato da entrada (linhas e pontas)', () => {
    const { ol } = montarTrilha('t1');
    parar = iniciarDesenho(document);
    document.documentElement.setAttribute(ATRIBUTO_MOVIMENTO_REDUZIDO, 'true');
    observadorDe(ol).disparar(ol, true);
    expect(animarPresetFalso.mock.calls[0]![2]).toBe(true);
    expect(animarPresetFalso.mock.calls[1]![2]).toBe(true);
  });

  it('respeita o nº real de conectores do grupo (2, não 3): duração = --dur-draw / 2', () => {
    document.documentElement.style.setProperty('--dur-draw', '600ms');
    document.body.innerHTML = `
      <ol id="t1">
        <li><span data-draw="trail" id="c1"><span data-draw-tip></span></span></li>
        <li><span data-draw="trail" id="c2"><span data-draw-tip></span></span></li>
        <li></li>
      </ol>`;
    const ol = document.getElementById('t1') as Element;
    parar = iniciarDesenho(document);
    observadorDe(ol).disparar(ol, true);
    const chamadaLinhas = animarPresetFalso.mock.calls[0]!;
    expect((chamadaLinhas[4] as { duracao: number }).duracao).toBeCloseTo(0.3, 5);
  });

  it('nunca repete no mesmo grupo: o próprio inView para de observar depois da 1ª entrada', () => {
    const { ol } = montarTrilha('t1');
    parar = iniciarDesenho(document);
    const io = observadorDe(ol);
    io.disparar(ol, true);
    expect(animarPresetFalso).toHaveBeenCalledTimes(2);
    expect(io.observados.has(ol)).toBe(false);
  });

  it('rolar para fora e para dentro de novo não dispara uma 2ª vez', () => {
    const { ol } = montarTrilha('t1');
    parar = iniciarDesenho(document);
    const io = observadorDe(ol);
    io.disparar(ol, true);
    io.disparar(ol, false);
    io.disparar(ol, true);
    expect(animarPresetFalso).toHaveBeenCalledTimes(2);
  });

  it('grupo sem nenhum conector no instante do disparo (removido entre o carregamento e a entrada) não chama animarPreset', () => {
    const { ol, conectores } = montarTrilha('t1');
    parar = iniciarDesenho(document);
    conectores.forEach((c) => c.remove());
    observadorDe(ol).disparar(ol, true);
    expect(animarPresetFalso).not.toHaveBeenCalled();
  });

  it('conector sem <ol> ancestral forma um grupo de 1 (fallback: elemento pai) e ainda desenha', () => {
    document.body.innerHTML =
      '<div id="pai"><span data-draw="trail" id="solto"><span data-draw-tip id="ponta"></span></span></div>';
    parar = iniciarDesenho(document);
    const pai = document.getElementById('pai') as Element;
    const solto = document.getElementById('solto') as Element;
    expect(observadorDe(pai)).toBeDefined();
    observadorDe(pai).disparar(pai, true);
    expect(animarPresetFalso).toHaveBeenCalledTimes(2);
    expect([...(animarPresetFalso.mock.calls[0]![0] as Element[])]).toEqual([solto]);
  });

  it('MutationObserver cobre um grupo novo (conectores montados depois dentro de uma <ol> nova)', async () => {
    parar = iniciarDesenho(document);
    const secao = document.createElement('section');
    secao.innerHTML = `
      <ol id="novo">
        <li><span data-draw="trail" id="nc1"><span data-draw-tip></span></span></li>
        <li><span data-draw="trail" id="nc2"><span data-draw-tip></span></span></li>
        <li></li>
      </ol>`;
    document.body.append(secao);
    await microtarefas();
    const novo = document.getElementById('novo') as Element;
    expect(observadorDe(novo).opcoes).toEqual({ threshold: 0.15 });
    observadorDe(novo).disparar(novo, true);
    expect(animarPresetFalso).toHaveBeenCalledTimes(2);
  });

  it('o cleanup desconecta os observadores e pode reiniciar (StrictMode)', () => {
    const { ol } = montarTrilha('t1');
    const parar1 = iniciarDesenho(document);
    const io1 = observadorDe(ol);
    parar1();
    expect(io1.observados.has(ol)).toBe(false);
    parar = iniciarDesenho(document);
    const io2 = observadorDe(ol);
    expect(io2).not.toBe(io1);
    io2.disparar(ol, true);
    expect(animarPresetFalso).toHaveBeenCalledTimes(2);
  });

  it('sem IntersectionObserver não quebra; nenhuma animação é aplicada', () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    montarTrilha('t1');
    document.body.innerHTML += '<span data-draw="y"></span>';
    expect(() => {
      parar = iniciarDesenho(document);
    }).not.toThrow();
    expect(animarPresetFalso).not.toHaveBeenCalled();
  });
});
