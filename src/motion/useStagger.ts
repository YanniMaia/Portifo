// Cascatas (A-03; doc 04 §4.4 e §9 "Cascata de chips"/"Linhas da frase"/"Etapas das trilhas"; D15).
//
// Observa todo `[data-stagger]` com a API vanilla `inView()` do pacote `motion` — mesmo padrão
// arquitetural de `useReveal.ts` (A-02), sem importar nada de lá (cada gancho é a sua própria
// unidade, D14/R7: nenhum hook paralelo). Ao cruzar 15% de visibilidade (`amount: 0.15`, o mesmo
// limiar da entrada de seções), anima todo `[data-stagger-item]` DESCENDENTE do contêiner (não
// necessariamente filho direto no DOM: nos ganchos reais das S-09/S-14 o item fica um ou dois
// níveis abaixo — chip dentro de `<ul>` dentro do cartão; pílula dentro de `<li>` dentro da
// `<ol>` — só a Frase, S-06, tem os `<p data-stagger-item>` como filhos diretos do contêiner
// `data-stagger="motto"`), na ordem do DOM (`querySelectorAll` devolve nessa ordem), com
// `stagger()` (`staggerDelay` de `./animations`) entre um item e o próximo.
//
// "Uma vez só" por `[data-stagger]`, e cada cartão/trilha "recomeça o atraso do zero" (passo 2 do
// doc 04): vem de graça do `inView`, igual ao A-02 — cada contêiner tem sua própria chamada de
// `inView`, que o `motion` desliga (`unobserve`) quando `onStart` não devolve função de saída.
// Como o atraso é sempre calculado a partir do próprio conjunto de itens DESSE contêiner (índice
// 0, 1, 2… dentro dele), cada categoria de chips ou cada trilha cria sua cascata começando em
// 0 ms, independente de quando as outras entraram na tela.
//
// Três tipos, pelo valor de `data-stagger` (contrato único do doc 04 §4.4; nenhum preset nem
// atraso fica "solto" fora desta tabela):
// - `"chips"` (Habilidades, S-09): só opacity, preset `fade` (já existente) com a duração do
//   token `--dur-chip` (400 ms) por SOBRESCRITA (`animarPreset(…, { duracao })`) em vez de um
//   preset novo — decisão registrada no diário cp/A-03: o `fade` já é "só opacity"; a função
//   `duracaoDoToken`/a opção `sobrescrita` do A-01 foi feita exatamente para isto (ver o
//   comentário de `duracaoDoToken` em `animations.ts`, que já cita `--dur-count`/`--dur-burst`
//   como exemplos de uso fora do próprio preset). Criar um `fadeChip` novo só para trocar o nome
//   do token seria um preset duplicado do `fade` (R7). 40 ms de atraso entre um chip e outro.
// - `"motto"` (Frase, S-06): preset `fadeUp` (fade + 24 px), já na duração certa (`--dur-enter`,
//   600 ms). 150 ms de atraso entre uma linha e a próxima.
// - `"steps"` (Onde quero chegar, S-14): preset novo `lightUp` (`./animations`, opacity 0,35→1 +
//   scale 0,96→1, `--dur-base`). 200 ms de atraso entre uma etapa e a próxima. A 1ª etapa de cada
//   trilha nasce com `--gradient-primary` por CSS estático (`Track.module.css` `.primeira`, D13);
//   esta task não toca nisso, só anima opacity/scale, iguais às demais etapas.
//
// Um `MutationObserver` (mesmo padrão de `loopPause.ts`/`useReveal.ts`) cobre `[data-stagger]`
// montados depois do primeiro disparo.
import { inView } from 'motion';
import { useEffect } from 'react';
import {
  animarPreset,
  duracaoDoToken,
  fade,
  fadeUp,
  lightUp,
  staggerDelay,
  type Preset,
  type SobrescritaDoPreset,
} from './animations';
import { ATRIBUTO_MOVIMENTO_REDUZIDO } from './useReducedMotion';

/** Atributo-gancho do contêiner da cascata (contrato doc 04 §4.4; D22). */
export const ATRIBUTO_CASCATA = 'data-stagger';
/** Atributo-gancho de cada item animado dentro do contêiner (contrato doc 04 §4.4; D22). */
export const ATRIBUTO_ITEM_CASCATA = 'data-stagger-item';

const SELETOR_CASCATA = `[${ATRIBUTO_CASCATA}]`;
const SELETOR_ITEM = `[${ATRIBUTO_ITEM_CASCATA}]`;

/** Fração mínima visível para disparar (§9; mesmo limiar da entrada de seções, A-02). */
const LIMIAR_VISIVEL = 0.15;

/** Atrasos entre itens, em ms, por tipo de cascata (tabela única do doc 04 §7/§9). */
const ATRASO_CHIPS_MS = 40;
const ATRASO_MOTTO_MS = 150;
const ATRASO_STEPS_MS = 200;

/** Lê o estado de movimento reduzido no momento exato da entrada (D14: fonte é o MotionProvider). */
function movimentoReduzidoAgora(doc: Document): boolean {
  return doc.documentElement.getAttribute(ATRIBUTO_MOVIMENTO_REDUZIDO) === 'true';
}

/** Preset, atraso (ms) e sobrescrita de duração de um tipo de cascata; `undefined` = tipo desconhecido. */
function configuracaoDaCascata(
  tipo: string | null,
): { preset: Preset; atrasoMs: number; sobrescrita?: SobrescritaDoPreset } | undefined {
  switch (tipo) {
    case 'chips':
      // `--dur-chip` (400 ms) por sobrescrita; o preset `fade` continua com `--dur-enter` nos
      // outros usos (D14: cada token numa única família de consumo).
      return {
        preset: fade,
        atrasoMs: ATRASO_CHIPS_MS,
        sobrescrita: { duracao: duracaoDoToken('--dur-chip') },
      };
    case 'motto':
      return { preset: fadeUp, atrasoMs: ATRASO_MOTTO_MS };
    case 'steps':
      return { preset: lightUp, atrasoMs: ATRASO_STEPS_MS };
    default:
      return undefined;
  }
}

/** Anima os `[data-stagger-item]` descendentes de `container`, pelo tipo em `data-stagger`. */
function aplicarCascata(container: Element, reduzido: boolean): void {
  const config = configuracaoDaCascata(container.getAttribute(ATRIBUTO_CASCATA));
  if (!config) return;
  const itens = container.querySelectorAll(SELETOR_ITEM);
  if (itens.length === 0) return;
  animarPreset(
    itens,
    config.preset,
    reduzido,
    staggerDelay(config.atrasoMs, reduzido),
    config.sobrescrita,
  );
}

/** Contêineres de cascata (o próprio nó, se bater o seletor, e os descendentes dele). */
function cascatasEm(no: Node): Element[] {
  if (no.nodeType !== 1) return [];
  const el = no as Element;
  const dentro = [...el.querySelectorAll(SELETOR_CASCATA)];
  return el.matches(SELETOR_CASCATA) ? [el, ...dentro] : dentro;
}

/**
 * Liga as cascatas no documento. Devolve a função que desliga tudo (StrictMode-safe: chamar de
 * novo depois do cleanup é seguro, igual a `iniciarRevelacao`/`iniciarPausaDeLoops`). Cada
 * contêiner `[data-stagger]` anima seus itens no máximo uma vez: nunca de novo ao rolar para cima
 * e para baixo.
 */
export function iniciarCascata(doc: Document = document): () => void {
  // Sem `IntersectionObserver`, nada esconde os itens por JS (nenhum estilo "escondido" é escrito
  // em lugar nenhum): eles ficam visíveis do jeito que o CSS normal já os deixa, só sem a cascata.
  const Observador = globalThis.IntersectionObserver as typeof IntersectionObserver | undefined;
  if (typeof Observador !== 'function') {
    return () => undefined;
  }

  const observados = new WeakSet<Element>();
  const paradas: Array<() => void> = [];

  const ligar = (el: Element): void => {
    if (observados.has(el)) return;
    observados.add(el);
    paradas.push(
      inView(
        el,
        () => {
          aplicarCascata(el, movimentoReduzidoAgora(doc));
          // Sem devolver função de saída: o `inView` solta este elemento (uma vez só).
        },
        { amount: LIMIAR_VISIVEL },
      ),
    );
  };

  // Contêineres já no documento: um único `inView`/`IntersectionObserver` compartilhado por eles.
  paradas.push(
    inView(
      SELETOR_CASCATA,
      (el) => {
        observados.add(el);
        aplicarCascata(el, movimentoReduzidoAgora(doc));
      },
      { amount: LIMIAR_VISIVEL },
    ),
  );
  doc.querySelectorAll(SELETOR_CASCATA).forEach((el) => observados.add(el));

  // Contêineres montados depois (troca de idioma/tema não desmonta as seções, mas o código é
  // defensivo): cada nó novo ganha seu próprio `inView`, para nunca reobservar o que já animou.
  const mo = new MutationObserver((mudancas) => {
    for (const mudanca of mudancas) {
      mudanca.addedNodes.forEach((no) => cascatasEm(no).forEach(ligar));
    }
  });
  mo.observe(doc.documentElement, { subtree: true, childList: true });

  return () => {
    mo.disconnect();
    for (const parar of paradas) parar();
    paradas.length = 0;
  };
}

/** Hook: liga as cascatas dentro do `MotionProvider` (A-01) e devolve a limpeza no `useEffect`. */
export function useStagger(): void {
  useEffect(() => iniciarCascata(document), []);
}
