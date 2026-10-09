// Mocks controláveis dos testes de unidade (Q-01; estende os mocks mínimos do F-04).
// O `tests/unit/setup.ts` chama `instalarMocksPadrao()` antes de cada teste, então todo teste começa
// com: nenhuma preferência do sistema (claro, sem movimento reduzido), IntersectionObserver que só
// dispara quando o teste pede, sem área de transferência (igual ao jsdom) e `window.scrollTo` espião.
// Um teste muda o cenário chamando as funções abaixo; o `beforeEach` seguinte volta ao padrão.
import { vi, type Mock } from 'vitest';

// ---------------------------------------------------------------------------------------------
// matchMedia
// ---------------------------------------------------------------------------------------------

export interface PreferenciasDoSistema {
  /** `prefers-color-scheme`. Padrão: `'light'`. */
  colorScheme?: 'light' | 'dark';
  /** `prefers-reduced-motion: reduce`. Padrão: `false`. */
  reducedMotion?: boolean;
}

export interface ControleMatchMedia {
  /** Preferências em vigor. */
  readonly atual: Readonly<Required<PreferenciasDoSistema>>;
  /**
   * Muda as preferências "do sistema" e dispara `change` (com `matches` atualizado) em cada
   * MediaQueryList cujo resultado mudou, como o navegador faz.
   */
  definir(novas: PreferenciasDoSistema): void;
}

type OuvinteMql = (evento: MediaQueryListEvent) => void;

interface MqlFalsa extends MediaQueryList {
  _ouvintes: Set<OuvinteMql>;
}

const PADRAO_SISTEMA: Required<PreferenciasDoSistema> = {
  colorScheme: 'light',
  reducedMotion: false,
};

/** Resolve as media queries de preferência do usuário. Qualquer outra query não casa. */
function avaliar(query: string, prefs: Required<PreferenciasDoSistema>): boolean {
  const q = query.replace(/\s+/g, '').toLowerCase();
  if (q === '(prefers-color-scheme:dark)') return prefs.colorScheme === 'dark';
  if (q === '(prefers-color-scheme:light)') return prefs.colorScheme === 'light';
  if (q === '(prefers-reduced-motion:reduce)') return prefs.reducedMotion;
  if (q === '(prefers-reduced-motion:no-preference)') return !prefs.reducedMotion;
  return false;
}

/**
 * Instala um `window.matchMedia` controlável. Ex.: `mockMatchMedia({ colorScheme: 'dark' })` faz
 * `matchMedia('(prefers-color-scheme: dark)').matches === true`.
 */
export function mockMatchMedia(preferencias: PreferenciasDoSistema = {}): ControleMatchMedia {
  let prefs: Required<PreferenciasDoSistema> = { ...PADRAO_SISTEMA, ...preferencias };
  const listas: MqlFalsa[] = [];

  function criar(query: string): MediaQueryList {
    const ouvintes = new Set<OuvinteMql>();
    const mql: MqlFalsa = {
      _ouvintes: ouvintes,
      matches: avaliar(query, prefs),
      media: query,
      onchange: null,
      addListener: (fn) => {
        if (fn) ouvintes.add(fn as OuvinteMql);
      },
      removeListener: (fn) => {
        if (fn) ouvintes.delete(fn as OuvinteMql);
      },
      addEventListener: (_tipo: string, fn: EventListenerOrEventListenerObject | null) => {
        if (typeof fn === 'function') ouvintes.add(fn);
      },
      removeEventListener: (_tipo: string, fn: EventListenerOrEventListenerObject | null) => {
        if (typeof fn === 'function') ouvintes.delete(fn);
      },
      dispatchEvent: () => false,
    };
    listas.push(mql);
    return mql;
  }

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: criar,
  });

  return {
    get atual() {
      return prefs;
    },
    definir(novas) {
      prefs = { ...prefs, ...novas };
      for (const mql of listas) {
        const casa = avaliar(mql.media, prefs);
        if (casa === mql.matches) continue;
        (mql as { matches: boolean }).matches = casa;
        const evento = { matches: casa, media: mql.media } as MediaQueryListEvent;
        for (const fn of [...mql._ouvintes]) fn(evento);
        mql.onchange?.call(mql, evento);
      }
    },
  };
}

// ---------------------------------------------------------------------------------------------
// IntersectionObserver
// ---------------------------------------------------------------------------------------------

/** Observadores vivos (criados e não desconectados) do teste atual. */
const observadores = new Set<IntersectionObserverControlavel>();

export class IntersectionObserverControlavel implements IntersectionObserver {
  readonly root: Element | Document | null;
  readonly rootMargin: string;
  readonly thresholds: ReadonlyArray<number>;
  readonly scrollMargin: string = '0px';
  readonly alvos = new Set<Element>();
  private readonly callback: IntersectionObserverCallback;

  constructor(callback: IntersectionObserverCallback, opcoes: IntersectionObserverInit = {}) {
    this.callback = callback;
    this.root = opcoes.root ?? null;
    this.rootMargin = opcoes.rootMargin ?? '0px';
    const limiar = opcoes.threshold ?? 0;
    this.thresholds = Array.isArray(limiar) ? limiar : [limiar];
    observadores.add(this);
  }

  observe(alvo: Element): void {
    this.alvos.add(alvo);
  }

  unobserve(alvo: Element): void {
    this.alvos.delete(alvo);
  }

  disconnect(): void {
    this.alvos.clear();
    observadores.delete(this);
  }

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  /** Chama o callback com uma entrada para `alvo` (uso interno de `dispararEntrada`). */
  notificar(alvo: Element, isIntersecting: boolean, intersectionRatio: number): void {
    const retangulo = alvo.getBoundingClientRect();
    const entrada = {
      target: alvo,
      isIntersecting,
      intersectionRatio,
      boundingClientRect: retangulo,
      intersectionRect: retangulo,
      rootBounds: null,
      time: performance.now(),
    } as IntersectionObserverEntry;
    this.callback([entrada], this);
  }
}

export interface OpcoesEntrada {
  /** Padrão: `true` (o elemento entrou na área visível). */
  isIntersecting?: boolean;
  /** Padrão: `1` quando entra e `0` quando sai. */
  intersectionRatio?: number;
}

/** Instala o IntersectionObserver controlável e esquece os observadores do teste anterior. */
export function instalarIntersectionObserver(): void {
  observadores.clear();
  for (const alvo of [window, globalThis]) {
    Object.defineProperty(alvo, 'IntersectionObserver', {
      writable: true,
      configurable: true,
      value: IntersectionObserverControlavel,
    });
  }
}

/**
 * Simula `elemento` entrando (ou saindo, com `{ isIntersecting: false }`) na área visível: dispara o
 * callback de cada observador vivo que observa o elemento. Devolve quantos callbacks foram chamados.
 */
export function dispararEntrada(elemento: Element, opcoes: OpcoesEntrada = {}): number {
  const isIntersecting = opcoes.isIntersecting ?? true;
  const ratio = opcoes.intersectionRatio ?? (isIntersecting ? 1 : 0);
  let chamados = 0;
  for (const obs of [...observadores]) {
    if (!obs.alvos.has(elemento)) continue;
    obs.notificar(elemento, isIntersecting, ratio);
    chamados++;
  }
  return chamados;
}

/** Observadores vivos agora (para conferir que um componente desconecta ao desmontar). */
export function observadoresAtivos(): readonly IntersectionObserverControlavel[] {
  return [...observadores];
}

// ---------------------------------------------------------------------------------------------
// Área de transferência
// ---------------------------------------------------------------------------------------------

export type ModoClipboard = 'sucesso' | 'negado' | 'ausente';

export interface ControleClipboard {
  /** Espião do `navigator.clipboard.writeText` (`undefined` no modo `'ausente'`). */
  writeText: Mock<(texto: string) => Promise<void>> | undefined;
}

/**
 * Controla `navigator.clipboard`:
 * - `'sucesso'`: `writeText` resolve e registra o texto;
 * - `'negado'`: `writeText` rejeita com `DOMException` `NotAllowedError` (permissão negada);
 * - `'ausente'`: `navigator.clipboard` é `undefined` (contexto inseguro ou navegador antigo).
 * Atenção: `userEvent.setup()` instala a própria área de transferência. Chame `mockClipboard`
 * DEPOIS do `userEvent.setup()`.
 */
export function mockClipboard(modo: ModoClipboard): ControleClipboard {
  let writeText: ControleClipboard['writeText'];
  let valor: Clipboard | undefined;
  if (modo === 'ausente') {
    writeText = undefined;
    valor = undefined;
  } else {
    writeText =
      modo === 'sucesso'
        ? vi.fn<(texto: string) => Promise<void>>(() => Promise.resolve())
        : vi.fn<(texto: string) => Promise<void>>(() =>
            Promise.reject(new DOMException('Permissão negada', 'NotAllowedError')),
          );
    valor = { writeText } as unknown as Clipboard;
  }
  Object.defineProperty(window.navigator, 'clipboard', {
    configurable: true,
    get: () => valor,
  });
  return { writeText };
}

// ---------------------------------------------------------------------------------------------
// Rolagem
// ---------------------------------------------------------------------------------------------

let espiaoAtualScrollTo: Mock<Window['scrollTo']> = vi.fn<Window['scrollTo']>();

/** Troca `window.scrollTo` por um espião novo (o do jsdom só avisa "not implemented"). */
export function espionarScrollTo(): Mock<Window['scrollTo']> {
  espiaoAtualScrollTo = vi.fn<Window['scrollTo']>();
  Object.defineProperty(window, 'scrollTo', {
    writable: true,
    configurable: true,
    value: espiaoAtualScrollTo,
  });
  return espiaoAtualScrollTo;
}

/** Espião instalado em `window.scrollTo` no teste atual (evita ler o método solto do `window`). */
export function scrollToEspiao(): Mock<Window['scrollTo']> {
  return espiaoAtualScrollTo;
}

// ---------------------------------------------------------------------------------------------
// Padrão de cada teste
// ---------------------------------------------------------------------------------------------

/** Chamado pelo setup antes de cada teste. */
export function instalarMocksPadrao(): void {
  mockMatchMedia();
  instalarIntersectionObserver();
  mockClipboard('ausente');
  espionarScrollTo();
}
