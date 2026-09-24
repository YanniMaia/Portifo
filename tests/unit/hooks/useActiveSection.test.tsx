// useActiveSection (F-12): IntersectionObserver, getBoundingClientRect, rolagem e
// requestAnimationFrame mockados. Os ids vêm do registro (`SECTION_IDS`), nunca escritos à mão.
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import { SECTION_IDS, type SectionId } from '@/content/sections';
import {
  ACTIVE_SECTION_ROOT_MARGIN,
  computeActiveSection,
  useActiveSection,
} from '@/hooks/useActiveSection';

// ---------- IntersectionObserver controlável ----------
class FakeIntersectionObserver implements IntersectionObserver {
  static instancias: FakeIntersectionObserver[] = [];
  readonly root = null;
  readonly rootMargin: string;
  readonly thresholds: ReadonlyArray<number> = [0];
  readonly scrollMargin = '0px';
  readonly alvos = new Set<Element>();
  vivo = true;
  private readonly callback: IntersectionObserverCallback;

  constructor(callback: IntersectionObserverCallback, opcoes?: IntersectionObserverInit) {
    this.callback = callback;
    this.rootMargin = opcoes?.rootMargin ?? '0px';
    FakeIntersectionObserver.instancias.push(this);
  }

  observe(el: Element): void {
    this.alvos.add(el);
  }

  unobserve(el: Element): void {
    this.alvos.delete(el);
  }

  disconnect(): void {
    this.alvos.clear();
    this.vivo = false;
  }

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  /** Simula uma interseção mudando (o conteúdo das entradas não importa: é só gatilho). */
  disparar(): void {
    this.callback([], this);
  }
}

// ---------- requestAnimationFrame manual ----------
let filaQuadros = new Map<number, FrameRequestCallback>();
let proximoQuadro = 1;

function rodarQuadro(): void {
  const pendentes = [...filaQuadros.values()];
  filaQuadros = new Map();
  act(() => {
    for (const cb of pendentes) cb(performance.now());
  });
}

// ---------- layout simulado ----------
const tops = new Map<string, number>();

function definirLayout(opcoes: {
  scrollY: number;
  innerHeight?: number;
  scrollHeight?: number;
  topos: Partial<Record<SectionId, number>>;
}): void {
  Object.defineProperty(window, 'scrollY', { configurable: true, value: opcoes.scrollY });
  Object.defineProperty(window, 'innerHeight', {
    configurable: true,
    value: opcoes.innerHeight ?? 800,
  });
  Object.defineProperty(document.documentElement, 'scrollHeight', {
    configurable: true,
    value: opcoes.scrollHeight ?? 10000,
  });
  tops.clear();
  for (const [id, top] of Object.entries(opcoes.topos)) tops.set(id, top);
}

/**
 * Layout com as 10 seções de 1000 px cada, empilhadas (página de 10000 px), rolado em `scrollY`.
 * O topo de cada seção na viewport é `índice * 1000 - scrollY`.
 */
function layoutEmpilhado(scrollY: number, ajustes: Partial<Record<SectionId, number>> = {}) {
  const topos: Partial<Record<SectionId, number>> = {};
  SECTION_IDS.forEach((id, i) => {
    topos[id] = i * 1000 - scrollY;
  });
  definirLayout({ scrollY, topos: { ...topos, ...ajustes } });
}

function montarSecoes(): void {
  for (const id of SECTION_IDS) {
    const el = document.createElement('section');
    el.id = id;
    el.getBoundingClientRect = () => {
      const top = tops.get(id) ?? 99999;
      const rect = { x: 0, y: top, top, left: 0, right: 1280, bottom: top + 1000 };
      return { ...rect, width: 1280, height: 1000, toJSON: () => rect };
    };
    document.body.appendChild(el);
  }
}

const originalIO = window.IntersectionObserver;
let rafSpy: MockInstance<typeof window.requestAnimationFrame>;

beforeEach(() => {
  FakeIntersectionObserver.instancias = [];
  filaQuadros = new Map();
  proximoQuadro = 1;
  window.IntersectionObserver = FakeIntersectionObserver;
  vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
  rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
    const id = proximoQuadro++;
    filaQuadros.set(id, cb);
    return id;
  });
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => {
    filaQuadros.delete(id);
  });
  montarSecoes();
  layoutEmpilhado(0);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  window.IntersectionObserver = originalIO;
  document.body.innerHTML = '';
  tops.clear();
});

function montarHook() {
  const resultado = renderHook(() => useActiveSection(SECTION_IDS));
  rodarQuadro(); // cálculo inicial agendado na montagem
  return resultado;
}

/** Rola: muda o layout, dispara o gatilho do IO e roda o quadro. */
function rolarPara(scrollY: number, ajustes: Partial<Record<SectionId, number>> = {}) {
  layoutEmpilhado(scrollY, ajustes);
  for (const io of FakeIntersectionObserver.instancias) if (io.vivo) io.disparar();
  rodarQuadro();
}

describe('useActiveSection — as 4 regras', () => {
  it('scrollY = 0 → null (hero na faixa, nenhum link ativo)', () => {
    const { result } = montarHook();
    expect(window.scrollY).toBe(0);
    expect(result.current).toBeNull();
  });

  it('scrollY = 0 numa página que não rola (scrollHeight = innerHeight) → null', () => {
    definirLayout({ scrollY: 0, scrollHeight: 800, topos: { inicio: 0, destaques: 900 } });
    const { result } = montarHook();
    expect(result.current).toBeNull();
  });

  it('topo de objetivos em 80 px → "formacao" (navTarget, não o id bruto)', () => {
    const { result } = montarHook();
    // objetivos é o índice 8: topo = 8000 - 7920 = 80.
    rolarPara(7920);
    expect(document.getElementById('objetivos')?.getBoundingClientRect().top).toBe(80);
    expect(result.current).toBe('formacao');
  });

  it('rolagem até o fim → "contato", mesmo com o topo do contato abaixo da faixa', () => {
    const { result } = montarHook();
    // innerHeight 800 + scrollY 9200 = 10000 = scrollHeight; contato forçado para 300 px.
    rolarPara(9200, { contato: 300 });
    expect(result.current).toBe('contato');
    // Tolerância de 2 px: 800 + 9198 ≥ 10000 - 2.
    rolarPara(9198, { contato: 300 });
    expect(result.current).toBe('contato');
    // 1 px antes da tolerância: volta à regra geral (objetivos ativo → "formacao").
    rolarPara(9197, { contato: 300 });
    expect(result.current).toBe('formacao');
  });

  it('a ativa é a última seção com topo ≤ 80 + 1 px', () => {
    const { result } = montarHook();
    // formacao é o índice 7: topo 82 → ainda "projetos"; 81 → "formacao".
    rolarPara(6918);
    expect(result.current).toBe('projetos');
    rolarPara(6919);
    expect(result.current).toBe('formacao');
    rolarPara(3000);
    expect(result.current).toBe('sobre');
    // destaques/frase não têm item no menu.
    rolarPara(1500);
    expect(result.current).toBeNull();
  });
});

describe('useActiveSection — gatilho, quadro e limpeza', () => {
  it('um IntersectionObserver com a faixa de leitura observa as 10 seções', () => {
    montarHook();
    expect(FakeIntersectionObserver.instancias).toHaveLength(1);
    const [io] = FakeIntersectionObserver.instancias;
    expect(io?.rootMargin).toBe('-80px 0px -60% 0px');
    expect(ACTIVE_SECTION_ROOT_MARGIN).toBe('-80px 0px -60% 0px');
    expect([...(io?.alvos ?? [])].map((el) => el.id)).toEqual([...SECTION_IDS]);
  });

  it('no máximo 1 cálculo por quadro, mesmo com vários gatilhos', () => {
    const { result } = montarHook();
    const raf = rafSpy;
    raf.mockClear();
    layoutEmpilhado(3000);
    const [io] = FakeIntersectionObserver.instancias;
    io?.disparar();
    io?.disparar();
    window.dispatchEvent(new Event('scroll'));
    window.dispatchEvent(new Event('resize'));
    expect(raf).toHaveBeenCalledTimes(1);
    expect(result.current).toBeNull(); // ainda não calculou
    rodarQuadro();
    expect(result.current).toBe('sobre');
  });

  it('o evento scroll também é gatilho (regra do fim da página)', () => {
    const { result } = montarHook();
    layoutEmpilhado(9200, { contato: 300 });
    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });
    rodarQuadro();
    expect(result.current).toBe('contato');
  });

  it('zero observers vivos após unmount; quadro pendente cancelado; sem ouvintes', () => {
    const remover = vi.spyOn(window, 'removeEventListener');
    const disconnect = vi.spyOn(FakeIntersectionObserver.prototype, 'disconnect');
    const { unmount } = montarHook();
    const [io] = FakeIntersectionObserver.instancias;
    io?.disparar(); // deixa um quadro pendente
    expect(filaQuadros.size).toBe(1);

    unmount();

    expect(disconnect).toHaveBeenCalledTimes(1);
    expect(disconnect.mock.contexts[0]).toBe(io);
    expect(FakeIntersectionObserver.instancias.filter((o) => o.vivo)).toHaveLength(0);
    expect(filaQuadros.size).toBe(0);
    expect(remover).toHaveBeenCalledWith('scroll', expect.any(Function));
    expect(remover).toHaveBeenCalledWith('resize', expect.any(Function));
  });

  it('re-render com uma lista nova de mesmos ids não recria o observer', () => {
    const { rerender } = renderHook(() => useActiveSection([...SECTION_IDS]));
    rerender();
    rerender();
    expect(FakeIntersectionObserver.instancias).toHaveLength(1);
  });
});

describe('computeActiveSection', () => {
  it('sem seções no DOM → null', () => {
    document.body.innerHTML = '';
    expect(computeActiveSection(SECTION_IDS)).toBeNull();
  });

  it('ignora ids ausentes do DOM', () => {
    document.getElementById('formacao')?.remove();
    layoutEmpilhado(7500);
    // objetivos (índice 8) está em 500; projetos (índice 6) em -1500; formacao não existe.
    expect(computeActiveSection(SECTION_IDS)).toBe('projetos');
  });
});
