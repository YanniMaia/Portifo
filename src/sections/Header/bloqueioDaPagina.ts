// Bloqueio da página enquanto o menu do celular está aberto (S-02; doc de design §7.1, §11).
//
// - Trava de rolagem que funciona no iOS: guarda o `scrollY`, fixa o `<body>` (`position: fixed;
//   top: -scrollY; width: 100%`) e compensa a largura da barra de rolagem com `padding-right`. Ao
//   liberar, devolve os estilos anteriores e volta EXATAMENTE à posição guardada (`behavior:
//   'instant'`, para não herdar o `scroll-behavior: smooth` do `<html>`).
// - `inert` no resto da página (`main`, `footer`): sem foco, sem clique, fora da árvore acessível.
//   Só os elementos que este módulo marcou são desmarcados.
// - `liberarPagina()` é idempotente. O menu chama a liberação ANTES da rolagem do F-13 quando fecha
//   por clique num link, para a rolagem partir da posição real e o foco poder entrar no `<main>`.
// - Funções puras de DOM, sem React: o `MobileMenu` (efeito) e o `Header` (clique num link) usam.

interface EstilosDoBody {
  position: string;
  top: string;
  width: string;
  paddingRight: string;
}

interface Bloqueio {
  y: number;
  estilos: EstilosDoBody;
  inertes: Element[];
}

/** Partes da página que ficam inertes com o menu aberto (§11; S-02 passo 8). */
const RESTO_DA_PAGINA = 'main, footer';

let bloqueio: Bloqueio | null = null;

/** Trava a rolagem do fundo e deixa `main` e `footer` inertes. Chamada repetida não faz nada. */
export function bloquearPagina(): void {
  if (bloqueio) return;
  const { body, documentElement } = document;
  const y = window.scrollY;
  const barra = Math.max(0, window.innerWidth - documentElement.clientWidth);

  const inertes = [...document.querySelectorAll(RESTO_DA_PAGINA)].filter(
    (el) => !el.hasAttribute('inert'),
  );
  bloqueio = {
    y,
    estilos: {
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      paddingRight: body.style.paddingRight,
    },
    inertes,
  };

  body.style.position = 'fixed';
  body.style.top = `-${y}px`;
  body.style.width = '100%';
  if (barra > 0) body.style.paddingRight = `${barra}px`;
  for (const el of inertes) el.setAttribute('inert', '');
}

/** Desfaz o `bloquearPagina`: estilos do `<body>`, posição exata e `inert`. Idempotente. */
export function liberarPagina(): void {
  if (!bloqueio) return;
  const { y, estilos, inertes } = bloqueio;
  bloqueio = null;
  const { body } = document;
  body.style.position = estilos.position;
  body.style.top = estilos.top;
  body.style.width = estilos.width;
  body.style.paddingRight = estilos.paddingRight;
  for (const el of inertes) el.removeAttribute('inert');
  window.scrollTo({ top: y, left: 0, behavior: 'instant' });
}

/**
 * `scrollY` guardado enquanto a página está travada (o `window.scrollY` real vale 0 com o `<body>`
 * fixo), ou `null` sem trava. O cabeçalho usa para manter o estado "rolado" com o menu aberto.
 */
export function posicaoTravada(): number | null {
  return bloqueio ? bloqueio.y : null;
}
