// Rolagem por âncora (F-13, D14; doc de design §9, §7.1 e §7.12). ÚNICA implementação do site:
// o menu (S-01), o logo, o "Voltar ao topo ↑" (S-16/S-17) e o boot (F-14) chamam estas funções.
// O offset de 80 px NÃO é calculado aqui: vem do `scroll-padding-top` do `<html>` (base.css), que o
// `scrollIntoView` respeita. Os ids válidos vêm do registro da F-12.
import { SECTION_IDS, type SectionId } from '@/content/sections';

const CONSULTA_MOVIMENTO_REDUZIDO = '(prefers-reduced-motion: reduce)';
const ID_DO_TOPO: SectionId = 'inicio';

const IDS_VALIDOS: ReadonlySet<string> = new Set(SECTION_IDS);

/** `true` se `valor` é um id do registro de seções. */
export function isSectionId(valor: string): valor is SectionId {
  return IDS_VALIDOS.has(valor);
}

/** Id da seção citada no hash (`'#contato'` → `'contato'`), ou `null` se o hash não é do registro. */
export function sectionIdFromHash(hash: string): SectionId | null {
  const bruto = hash.startsWith('#') ? hash.slice(1) : hash;
  if (bruto === '') return null;
  let id: string;
  try {
    id = decodeURIComponent(bruto);
  } catch {
    return null;
  }
  return isSectionId(id) ? id : null;
}

function prefereMovimentoReduzido(): boolean {
  return (
    typeof window.matchMedia === 'function' &&
    window.matchMedia(CONSULTA_MOVIMENTO_REDUZIDO).matches
  );
}

/**
 * Comportamento da rolagem disparada por clique: `smooth`, ou `auto` com movimento reduzido.
 * `auto` segue o `scroll-behavior` do CSS, que também é `auto` com movimento reduzido (base.css).
 */
function comportamentoDoClique(): ScrollBehavior {
  return prefereMovimentoReduzido() ? 'auto' : 'smooth';
}

/**
 * Move o foco para o título da seção sem rolar de novo. O título (`h2`; no hero, o `h1`) recebe
 * `tabIndex={-1}` no DS-14; sem isso o navegador ignora o `focus()`.
 */
function focarTitulo(secao: HTMLElement): void {
  const titulo = secao.querySelector<HTMLElement>('h1, h2');
  titulo?.focus({ preventScroll: true });
}

/** URL atual sem o hash (caminho + query), para "limpar" o `#` sem recarregar. */
function urlSemHash(): string {
  return window.location.pathname + window.location.search;
}

/**
 * Rola até a seção `id` (a 80 px do topo, via `scroll-padding-top`), grava `#id` na URL com
 * `history.pushState` e move o foco para o `h2` da seção com `preventScroll: true`.
 * Rolagem suave, ou `auto` com movimento reduzido. Id fora do registro ou ausente do DOM: não faz nada.
 */
export function scrollToSection(id: SectionId): void {
  if (!isSectionId(id)) return;
  const secao = document.getElementById(id);
  if (!secao) return;

  secao.scrollIntoView({ behavior: comportamentoDoClique(), block: 'start' });
  // Clicar de novo no mesmo item não empilha entradas repetidas no histórico.
  if (window.location.hash !== `#${id}`) {
    window.history.pushState(null, '', `#${id}`);
  }
  focarTitulo(secao);
}

/**
 * Volta ao topo (`#inicio`: logo do cabeçalho §7.1 e "Voltar ao topo ↑" §7.12) e limpa o hash da
 * URL (`history.pushState(null, '', caminho)`). O foco vai para o título do hero (`h1`), se ele for
 * focável, para o teclado continuar do topo e não do rodapé.
 */
export function scrollToTop(): void {
  const comportamento = comportamentoDoClique();
  const topo = document.getElementById(ID_DO_TOPO);
  if (topo) {
    topo.scrollIntoView({ behavior: comportamento, block: 'start' });
  } else {
    window.scrollTo({ top: 0, behavior: comportamento });
  }
  if (window.location.hash !== '') {
    window.history.pushState(null, '', urlSemHash());
  }
  if (topo) focarTitulo(topo);
}

/**
 * Carregamento com hash (`/#contato`): rola SEM animação até a seção do hash, se ela for do registro,
 * e refaz uma vez quando as fontes carregam (`document.fonts.ready`), porque a troca de fonte muda
 * as alturas. Hash vazio ou desconhecido: ignora em silêncio. Não mexe no foco nem na URL.
 *
 * Deve ser chamada depois do primeiro render (as seções precisam estar no DOM): quem chama no boot
 * é a F-14 (`useEffect` do `App`). Devolve uma função que cancela o segundo ajuste (limpeza do efeito).
 */
export function scrollToInitialHash(): () => void {
  const id = sectionIdFromHash(window.location.hash);
  if (!id) return () => undefined;

  // `instant`, não `auto`: `auto` herdaria o `scroll-behavior: smooth` do CSS e animaria.
  const rolar = (): void => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'instant', block: 'start' });
  };
  rolar();

  let cancelado = false;
  // `document.fonts` falta em alguns ambientes (jsdom); aí o primeiro ajuste basta.
  const fontes = (document as Partial<Pick<Document, 'fonts'>>).fonts;
  void fontes?.ready.then(() => {
    if (!cancelado) rolar();
  });
  return () => {
    cancelado = true;
  };
}
