// Revelação de seções ao rolar (A-02; doc 04 §4.4 e §9 "Entrada de seções"; D15).
//
// Observa todo `[data-reveal]` com a API vanilla `inView()` do pacote `motion` (sugestão do passo 1
// da task): ao cruzar 15% de visibilidade (`amount: 0.15`), anima `opacity 0→1` + `translateY(24px)
// → translateY(0px)` em `--dur-enter`/`--ease-out` — o preset `fadeUp` de `./animations` (D14/R7:
// nenhum preset nem função de animação paralela).
//
// "Uma vez só" vem de graça do próprio `inView`, sem código extra: o `onStart` daqui não devolve
// uma função de saída, e o `inView` então desliga a observação **desse elemento** (ver
// `node_modules/framer-motion/dist/es/render/dom/viewport/index.mjs`, função `onIntersectionChange`:
// `if (typeof newOnEnd === 'function') … else observer.unobserve(entry.target)`). Rolar para cima e
// para baixo de novo não dispara mais nada nesse elemento. Decisão registrada no diário cp/A-02:
// não foi preciso escrever um `IntersectionObserver` próprio (a alternativa que a task também
// permite) porque o `inView` já entrega exatamente esse comportamento.
//
// Um `MutationObserver` (mesmo padrão arquitetural de `loopPause.ts`) cobre blocos `[data-reveal]`
// montados depois do primeiro disparo: cada nó novo chama `inView` individualmente (a chamada
// inicial usa o seletor, um único `IntersectionObserver` compartilhado para quem já existe no
// documento; re-rodar o seletor depois re-observaria elementos já revelados e disputaria "uma vez
// só" — por isso os nós novos entram um a um, nunca via nova chamada ao seletor completo).
//
// O estado inicial "escondido" nunca é aplicado por JS (passo 4 da task): quem decide isso é o
// próprio navegador, que só chama `onStart` quando o elemento cruza o limiar **vindo de fora** da
// tela. Um bloco já visível no primeiro quadro (ex.: a Faixa de destaques, logo abaixo do Hero)
// nunca "pisca": ele é intersectado desde o primeiro `observe()`, então `onIntersectionChange`
// recebe `isIntersecting: true` imediatamente e anima a partir do estado atual (já visível) — sem
// nenhum CSS de "opacity: 0" de largada. Sem JavaScript (ou com o `inView` indisponível), tudo
// fica visível porque nenhum estilo inicial é escrito fora do JS.
import { inView } from 'motion';
import { useEffect } from 'react';
import { animarPreset, fadeUp } from './animations';
import { ATRIBUTO_MOVIMENTO_REDUZIDO } from './useReducedMotion';

/** Atributo-gancho das seções reveladas (contrato doc 04 §4.4; D22). */
export const ATRIBUTO_REVELACAO = 'data-reveal';
const SELETOR_REVELACAO = `[${ATRIBUTO_REVELACAO}]`;

/** Fração mínima visível para disparar (§9; critério de aceite A-02: 15%, não 10%). */
const LIMIAR_VISIVEL = 0.15;

/** Lê o estado de movimento reduzido no momento exato da entrada (D14: fonte é o MotionProvider). */
function movimentoReduzidoAgora(doc: Document): boolean {
  return doc.documentElement.getAttribute(ATRIBUTO_MOVIMENTO_REDUZIDO) === 'true';
}

/** Elementos revogáveis (o próprio nó, se bater o seletor, e os descendentes dele). */
function revelaveisEm(no: Node): Element[] {
  if (no.nodeType !== 1) return [];
  const el = no as Element;
  const dentro = [...el.querySelectorAll(SELETOR_REVELACAO)];
  return el.matches(SELETOR_REVELACAO) ? [el, ...dentro] : dentro;
}

/**
 * Liga a revelação de seções no documento. Devolve a função que desliga tudo (StrictMode-safe:
 * chamar de novo depois do cleanup é seguro, igual a `iniciarPausaDeLoops`). Cada elemento revela
 * no máximo uma vez: nunca de novo ao rolar para cima e para baixo.
 */
export function iniciarRevelacao(doc: Document = document): () => void {
  // Sem `IntersectionObserver` (navegador muito antigo, ou SSR), o `inView` lançaria ao tentar
  // instanciar um novo. Sem observador, nada esconde os blocos por JS (não há estilo "escondido"
  // escrito em lugar nenhum): eles ficam visíveis do jeito que o CSS normal já os deixa, igual ao
  // "sem JavaScript, tudo fica visível" do passo 4 — só não recebem a animação de entrada.
  const Observador = globalThis.IntersectionObserver as typeof IntersectionObserver | undefined;
  if (typeof Observador !== 'function') {
    return () => undefined;
  }

  const observados = new WeakSet<Element>();
  const paradas: Array<() => void> = [];

  const revelar = (el: Element): void => {
    if (observados.has(el)) return;
    observados.add(el);
    paradas.push(
      inView(
        el,
        () => {
          animarPreset(el, fadeUp, movimentoReduzidoAgora(doc));
          // Sem devolver função de saída: o `inView` solta este elemento (uma vez só).
        },
        { amount: LIMIAR_VISIVEL },
      ),
    );
  };

  // Elementos já no documento: um único `inView`/`IntersectionObserver` compartilhado por eles.
  paradas.push(
    inView(
      SELETOR_REVELACAO,
      (el) => {
        observados.add(el);
        animarPreset(el, fadeUp, movimentoReduzidoAgora(doc));
      },
      { amount: LIMIAR_VISIVEL },
    ),
  );
  doc.querySelectorAll(SELETOR_REVELACAO).forEach((el) => observados.add(el));

  // Blocos montados depois (troca de idioma/tema não desmonta as seções, mas o código é
  // defensivo): cada nó novo ganha seu próprio `inView`, para nunca reobservar o que já revelou.
  const mo = new MutationObserver((mudancas) => {
    for (const mudanca of mudancas) {
      mudanca.addedNodes.forEach((no) => revelaveisEm(no).forEach(revelar));
    }
  });
  mo.observe(doc.documentElement, { subtree: true, childList: true });

  return () => {
    mo.disconnect();
    for (const parar of paradas) parar();
    paradas.length = 0;
  };
}

/** Hook: liga a revelação dentro do `MotionProvider` (A-01) e devolve a limpeza no `useEffect`. */
export function useReveal(): void {
  useEffect(() => iniciarRevelacao(document), []);
}
