// Pausa de loops fora da tela e com a aba oculta (A-01; doc 04 §4.3 "Loops fora da tela").
// Um único IntersectionObserver observa todo `[data-loop]` e todo `[data-float]` (cartões
// flutuantes do A-11a, que o contrato §4.4 marca só com `data-float`) e escreve
// `data-offscreen="true|false"`; um MutationObserver pega nós que entram ou saem depois (seções
// montadas, cartões novos) e os atributos postos ou tirados depois. O `visibilitychange` liga
// `data-page-hidden` no <html>. A pausa em si é CSS (`animation-play-state: paused`, em
// `reduced-motion.css`): nenhum loop roda em JS (§4.3).

/** Atributo que marca um elemento com animação em loop (gancho das A-10..A-17). */
export const ATRIBUTO_LOOP = 'data-loop';
/** Atributo dos cartões flutuantes (A-11a); pausado fora da tela igual a `data-loop`. */
export const ATRIBUTO_FLUTUANTE = 'data-float';
/** Escrito pelo observador: `"true"` fora da tela, `"false"` dentro. */
export const ATRIBUTO_FORA_DA_TELA = 'data-offscreen';
/** Presente no <html> enquanto a aba está oculta. */
export const ATRIBUTO_PAGINA_OCULTA = 'data-page-hidden';

/** Atributos que fazem um elemento ser observado. */
const ATRIBUTOS_PAUSAVEIS = [ATRIBUTO_LOOP, ATRIBUTO_FLUTUANTE];
const SELETOR_PAUSAVEL = ATRIBUTOS_PAUSAVEIS.map((a) => `[${a}]`).join(', ');

function paginaOculta(doc: Document): boolean {
  return doc.visibilityState === 'hidden' || doc.hidden;
}

/**
 * Liga o observador de loops no documento. Devolve a função que desliga tudo e limpa os
 * atributos escritos. Chamado uma vez pelo `MotionProvider`; chamar de novo depois do cleanup é
 * seguro (StrictMode monta, desmonta e monta de novo).
 */
export function iniciarPausaDeLoops(doc: Document = document): () => void {
  const html = doc.documentElement;

  const aoMudarVisibilidade = (): void => {
    html.toggleAttribute(ATRIBUTO_PAGINA_OCULTA, paginaOculta(doc));
  };
  aoMudarVisibilidade();
  doc.addEventListener('visibilitychange', aoMudarVisibilidade);

  const Observador = globalThis.IntersectionObserver as typeof IntersectionObserver | undefined;
  if (typeof Observador !== 'function') {
    // Sem IntersectionObserver os loops só pausam com a aba oculta.
    return () => {
      doc.removeEventListener('visibilitychange', aoMudarVisibilidade);
      html.removeAttribute(ATRIBUTO_PAGINA_OCULTA);
    };
  }

  const observados = new Set<Element>();
  const io = new Observador((entradas) => {
    for (const entrada of entradas) {
      entrada.target.setAttribute(ATRIBUTO_FORA_DA_TELA, String(!entrada.isIntersecting));
    }
  });

  const observar = (el: Element): void => {
    if (observados.has(el)) return;
    observados.add(el);
    io.observe(el);
  };
  const soltar = (el: Element): void => {
    if (!observados.delete(el)) return;
    io.unobserve(el);
    el.removeAttribute(ATRIBUTO_FORA_DA_TELA);
  };

  /** O próprio nó (se for `[data-loop]`/`[data-float]`) e os pausáveis dentro dele. */
  const pausaveisEm = (no: Node): Element[] => {
    if (no.nodeType !== 1) return [];
    const el = no as Element;
    const dentro = [...el.querySelectorAll(SELETOR_PAUSAVEL)];
    return el.matches(SELETOR_PAUSAVEL) ? [el, ...dentro] : dentro;
  };

  doc.querySelectorAll(SELETOR_PAUSAVEL).forEach(observar);

  const mo = new MutationObserver((mudancas) => {
    for (const mudanca of mudancas) {
      if (mudanca.type === 'attributes') {
        const el = mudanca.target as Element;
        // Só solta quando o elemento não tem mais NENHUM dos dois atributos.
        if (el.matches(SELETOR_PAUSAVEL)) observar(el);
        else soltar(el);
        continue;
      }
      mudanca.addedNodes.forEach((no) => pausaveisEm(no).forEach(observar));
      mudanca.removedNodes.forEach((no) => {
        // Nó movido de lugar continua no documento: segue observado.
        pausaveisEm(no)
          .filter((el) => !el.isConnected)
          .forEach(soltar);
      });
    }
  });
  mo.observe(html, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ATRIBUTOS_PAUSAVEIS,
  });

  return () => {
    mo.disconnect();
    io.disconnect();
    for (const el of observados) el.removeAttribute(ATRIBUTO_FORA_DA_TELA);
    observados.clear();
    doc.removeEventListener('visibilitychange', aoMudarVisibilidade);
    html.removeAttribute(ATRIBUTO_PAGINA_OCULTA);
  };
}
