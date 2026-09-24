// Rolagem por âncora (F-13). jsdom não rola nem mede layout: `scrollIntoView`, `scrollTo`,
// `history.pushState`, `matchMedia` e `document.fonts` são mockados. A medida real (80 ± 1 px) é
// do e2e `tests/e2e/anchors.spec.ts`, ativado na F-14.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SECTION_IDS, type SectionId } from '@/content/sections';
import {
  isSectionId,
  scrollToInitialHash,
  scrollToSection,
  scrollToTop,
  sectionIdFromHash,
} from '@/lib/scroll';

const scrollIntoView = vi.fn<(opcoes?: ScrollIntoViewOptions | boolean) => void>();

/** Monta as 10 seções do registro, cada uma com um título focável (`tabIndex=-1`, como no DS-14). */
function montarSecoes(): void {
  document.body.innerHTML = '';
  for (const id of SECTION_IDS) {
    const secao = document.createElement('section');
    secao.id = id;
    const titulo = document.createElement(id === 'inicio' ? 'h1' : 'h2');
    titulo.tabIndex = -1;
    titulo.textContent = id;
    secao.append(titulo);
    document.body.append(secao);
  }
}

function tituloDe(id: SectionId): HTMLElement {
  const titulo = document.getElementById(id)?.querySelector<HTMLElement>('h1, h2');
  if (!titulo) throw new Error(`título de ${id} não encontrado`);
  return titulo;
}

function definirMovimentoReduzido(reduzido: boolean): void {
  vi.spyOn(window, 'matchMedia').mockImplementation(
    (query: string) =>
      ({
        matches: reduzido && query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: () => undefined,
        removeListener: () => undefined,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        dispatchEvent: () => false,
      }) as MediaQueryList,
  );
}

/** Coloca a URL em `/Portifolio/?q=1#hash` sem passar pelo spy do `pushState`. */
function definirUrl(hash: string): void {
  window.history.replaceState(null, '', `/Portifolio/?q=1${hash}`);
}

/** Instala um `document.fonts.ready` controlável pelo teste. */
function instalarFontes(): () => void {
  let liberar: () => void = () => undefined;
  const ready = new Promise<void>((resolve) => {
    liberar = resolve;
  });
  Object.defineProperty(document, 'fonts', { configurable: true, value: { ready } });
  return liberar;
}

beforeEach(() => {
  montarSecoes();
  definirUrl('');
  scrollIntoView.mockClear();
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
    configurable: true,
    writable: true,
    value: scrollIntoView,
  });
  definirMovimentoReduzido(false);
});

afterEach(() => {
  vi.restoreAllMocks();
  Reflect.deleteProperty(document, 'fonts');
  document.body.innerHTML = '';
});

describe('isSectionId / sectionIdFromHash', () => {
  it('aceita só ids do registro', () => {
    for (const id of SECTION_IDS) expect(isSectionId(id)).toBe(true);
    expect(isSectionId('faixa')).toBe(false);
    expect(isSectionId('')).toBe(false);
  });

  it('lê o hash com ou sem #; vazio, desconhecido ou malformado → null', () => {
    expect(sectionIdFromHash('#contato')).toBe('contato');
    expect(sectionIdFromHash('projetos')).toBe('projetos');
    expect(sectionIdFromHash('')).toBeNull();
    expect(sectionIdFromHash('#')).toBeNull();
    expect(sectionIdFromHash('#nao-existe')).toBeNull();
    expect(sectionIdFromHash('#%E0%A4%A')).toBeNull();
  });
});

describe('scrollToSection', () => {
  it('rola a seção com smooth/start, grava #sobre na URL e foca o h2 sem rolar', () => {
    const pushState = vi.spyOn(window.history, 'pushState');
    const focar = vi.spyOn(tituloDe('sobre'), 'focus');

    scrollToSection('sobre');

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView.mock.contexts[0]).toBe(document.getElementById('sobre'));
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
    expect(pushState).toHaveBeenCalledWith(null, '', '#sobre');
    expect(window.location.href.endsWith('#sobre')).toBe(true);
    expect(focar).toHaveBeenCalledWith({ preventScroll: true });
    expect(document.activeElement).toBe(tituloDe('sobre'));
    expect(document.activeElement?.tagName).toBe('H2');
  });

  it('com movimento reduzido usa behavior "auto"', () => {
    definirMovimentoReduzido(true);
    scrollToSection('projetos');
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'auto', block: 'start' });
  });

  it('sem matchMedia no ambiente, cai no smooth sem quebrar', () => {
    vi.restoreAllMocks();
    const original: unknown = Reflect.get(window, 'matchMedia');
    Reflect.deleteProperty(window, 'matchMedia');
    try {
      scrollToSection('contato');
      expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
    } finally {
      Object.defineProperty(window, 'matchMedia', {
        configurable: true,
        writable: true,
        value: original,
      });
    }
  });

  it('funciona para todos os ids do registro', () => {
    for (const id of SECTION_IDS) {
      scrollToSection(id);
      expect(window.location.hash).toBe(`#${id}`);
      expect(document.activeElement).toBe(tituloDe(id));
    }
    expect(scrollIntoView).toHaveBeenCalledTimes(SECTION_IDS.length);
  });

  it('clicar de novo na mesma seção não empilha outra entrada no histórico', () => {
    const pushState = vi.spyOn(window.history, 'pushState');
    scrollToSection('habilidades');
    scrollToSection('habilidades');
    expect(pushState).toHaveBeenCalledTimes(1);
    expect(scrollIntoView).toHaveBeenCalledTimes(2);
  });

  it('id fora do registro ou ausente do DOM: não rola, não mexe na URL nem no foco', () => {
    const pushState = vi.spyOn(window.history, 'pushState');
    const antes = document.activeElement;

    // Simula um valor vindo de fora sem tipo (ex.: dado externo); o tipo já barra no typecheck.
    scrollToSection('faixa' as SectionId);
    document.getElementById('interesses')?.remove();
    scrollToSection('interesses');

    expect(scrollIntoView).not.toHaveBeenCalled();
    expect(pushState).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(antes);
  });
});

describe('scrollToTop', () => {
  it('rola até #inicio, limpa o hash (mantém caminho e query) e foca o título do hero', () => {
    definirUrl('#projetos');
    const pushState = vi.spyOn(window.history, 'pushState');

    scrollToTop();

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView.mock.contexts[0]).toBe(document.getElementById('inicio'));
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
    expect(pushState).toHaveBeenCalledWith(null, '', '/Portifolio/?q=1');
    expect(window.location.hash).toBe('');
    expect(window.location.pathname).toBe('/Portifolio/');
    expect(document.activeElement).toBe(tituloDe('inicio'));
  });

  it('com movimento reduzido usa behavior "auto"', () => {
    definirMovimentoReduzido(true);
    scrollToTop();
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'auto', block: 'start' });
  });

  it('sem hash na URL, não empilha entrada no histórico', () => {
    const pushState = vi.spyOn(window.history, 'pushState');
    scrollToTop();
    expect(pushState).not.toHaveBeenCalled();
  });

  it('sem #inicio no DOM, rola a janela para o topo', () => {
    document.getElementById('inicio')?.remove();
    const scrollTo = vi.fn();
    vi.spyOn(window, 'scrollTo').mockImplementation(scrollTo);
    definirUrl('#contato');

    scrollToTop();

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
    expect(window.location.hash).toBe('');
  });
});

describe('scrollToInitialHash', () => {
  it('hash válido: rola sem animação e refaz uma vez em document.fonts.ready', async () => {
    const liberar = instalarFontes();
    definirUrl('#contato');
    const pushState = vi.spyOn(window.history, 'pushState');
    const antes = document.activeElement;

    scrollToInitialHash();

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView.mock.contexts[0]).toBe(document.getElementById('contato'));
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'instant', block: 'start' });

    liberar();
    await vi.waitFor(() => {
      expect(scrollIntoView).toHaveBeenCalledTimes(2);
    });
    expect(scrollIntoView.mock.contexts[1]).toBe(document.getElementById('contato'));
    expect(scrollIntoView).toHaveBeenLastCalledWith({ behavior: 'instant', block: 'start' });
    // Não mexe na URL nem no foco.
    expect(pushState).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(antes);
  });

  it('a limpeza cancela o ajuste de document.fonts.ready', async () => {
    const liberar = instalarFontes();
    definirUrl('#projetos');

    const cancelar = scrollToInitialHash();
    cancelar();
    liberar();
    await Promise.resolve();
    await Promise.resolve();

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it('sem document.fonts (jsdom): rola uma vez e não quebra', () => {
    definirUrl('#sobre');
    expect(() => scrollToInitialHash()).not.toThrow();
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it('hash desconhecido ou vazio: ignora em silêncio', async () => {
    const liberar = instalarFontes();
    const pushState = vi.spyOn(window.history, 'pushState');
    const erro = vi.spyOn(console, 'error');
    const aviso = vi.spyOn(console, 'warn');

    for (const hash of ['#nao-existe', '#faixa', '']) {
      definirUrl(hash);
      expect(() => scrollToInitialHash()).not.toThrow();
    }
    liberar();
    await Promise.resolve();

    expect(scrollIntoView).not.toHaveBeenCalled();
    expect(pushState).not.toHaveBeenCalled();
    expect(erro).not.toHaveBeenCalled();
    expect(aviso).not.toHaveBeenCalled();
  });
});
