// Desenho de linha (A-05; doc 04 §4.4 e §9 "Linha do tempo"/"Linha das trilhas"; D15).
//
// Observa dois ganchos sob o mesmo atributo `data-draw` (contrato doc 04 §4.4; D22), mesmo padrão
// arquitetural de `useReveal.ts`/`useStagger.ts` (A-02/A-03) — `inView()` da API vanilla do `motion`,
// limiar 0,15, "uma vez só" (o próprio `inView` para de observar quando `onStart` não devolve função
// de saída), `MutationObserver` para nós montados depois — sem importar nada desses dois arquivos
// (D14/R7: cada gancho é a sua própria unidade).
//
// 1) `data-draw="y"` (Formação, S-13): cada elemento é a própria linha vertical de 2 px. Ao entrar
//    na tela, `animarPreset(el, lineDrawY, reduzido)`, sem sobrescrita — `--dur-draw` (800 ms) já é
//    exatamente a duração do preset (`animations.ts`, A-01). Cada elemento é observado
//    individualmente (há só um na página hoje), igual ao padrão de `useReveal.ts`.
//
// 2) `data-draw="trail"` (trilhas, S-14): 3 conectores por trilha, dentro da MESMA `<ol>` que
//    `useStagger.ts` (A-03) já observa para "acender" as pílulas (`data-stagger="steps"`) — duas
//    assinaturas de `inView` independentes no mesmo elemento não conflitam (cada uma é o seu
//    próprio `IntersectionObserver`, nenhuma escreve no mesmo atributo). Os 3 conectores de uma
//    trilha desenham EM SEQUÊNCIA, não juntos, somando `--dur-draw` (800 ms): cada um dura
//    `--dur-draw / 3` (≈ 267 ms, por SOBRESCRITA de duração — nenhum preset novo) e começa quando o
//    anterior termina (`staggerDelay` com o valor de atraso igual à duração de cada um, mesmo
//    mecanismo de `animations.ts`, mas com um "passo" maior que o das cascatas do A-03, que usam
//    atrasos bem menores que a duração de cada item — aqui o atraso é a PRÓPRIA duração, para não
//    sobrepor dois conectores).
//    - **Grupo = a trilha, não o conector:** o gancho `data-draw="trail"` não marca o CONTÊINER
//      (só cada conector), então este arquivo deriva o grupo subindo até o `<ol>` mais próximo
//      (`grupoDoConector`, abaixo) — a lista de etapas de cada `Track` (S-14) só tem uma `<ol>` com
//      todos os seus conectores dentro. Observar o GRUPO (não cada conector individualmente) é o
//      que garante a sequência: a trilha entra na tela uma vez, e só então os 3 conectores recebem,
//      de uma só chamada a `animarPreset`, atrasos crescentes (0, 267, 533 ms) — exatamente o mesmo
//      desenho de `aplicarCascata` no `useStagger.ts`, só que aqui o "contêiner" é descoberto pela
//      estrutura do DOM, não por um atributo dedicado (não foi criado nenhum atributo novo: R7/D14,
//      a task não pede um `data-draw-group`, e criar um só para isto duplicaria o papel do `<ol>`).
//    - **Eixo (desktop/tablet × celular):** decidido por `matchMedia('(min-width: 1024px)')` — o
//      MESMO breakpoint de `Track.module.css` (DV-11; a task original do doc 04 cita "≤ 639 px",
//      mas o S-14 real usa 1024 px para empilhar a trilha inteira, decisão já registrada no diário
//      do S-14: a trilha de Cibersegurança não cabe em linha abaixo de 1024 px). `≥ 1024 px` (linha,
//      `lineDrawX`, seta para a direita) × `< 1024 px` (coluna, `lineDrawY`, seta para baixo, já por
//      CSS estático do S-14). O valor é lido de NOVO, direto do `matchMedia`, no exato instante em
//      que o grupo entra na tela (nunca cacheado no carregamento do hook) — por isso "recalcula ao
//      redimensionar" sem precisar de um `addEventListener('change', …)` nem de estado em React: um
//      grupo só dispara UMA vez, então não existe "redesenhar com o eixo novo" depois de desenhado
//      (passo 4 da task) — o código nem chega a essa situação, porque o `inView` já desligou a
//      observação daquele grupo. Um grupo que ainda não entrou na tela, se a pessoa redimensionar a
//      janela antes, lê o `matchMedia` certo quando finalmente entrar.
//    - **Ponta de seta (`data-draw-tip`, dentro de cada conector):** aparece com FADE (preset `fade`
//      já existente, só `opacity`) no fim do desenho do SEU conector — não com `onComplete`/callback
//      do `animate()`, e sim por ARITMÉTICA: como cada conector tem duração fixa (`--dur-draw / 3`)
//      e atraso `i * duração`, o fim do conector `i` é sempre `(i + 1) * duração` — exatamente
//      `stagger(duração, { startDelay: duração })` (ver `motion-dom/utils/stagger.mjs`:
//      `delay(i) = startDelay + duração * i`). Decisão registrada: usar aritmética em vez de
//      `onComplete` evita uma 2ª chamada de `animate()` por conector (uma para a linha, outra
//      disparada tardiamente pelo retorno do `animate()` da linha) e mantém as 3 pontas de uma
//      trilha numa ÚNICA chamada de `animarPreset` (lista), igual às linhas — o mesmo padrão de
//      "uma chamada, N elementos, `stagger()` para os atrasos" já usado em `useStagger.ts`.
//
// Movimento reduzido (R4): `animarPreset` já devolve o estado final (duração 0, sem atraso) pelo
// próprio `resolverPreset` de `animations.ts` — não há nenhum `if (reduzido)` que pule a chamada
// aqui (mesma arquitetura de `useReveal.ts`/`useStagger.ts`). O `reduced-motion.css` (A-01, não
// alterado por esta task) já cobre `[data-draw]`/`[data-draw-tip]`: linha e seta já inteiras, sem
// JS algum de largada.
import { inView, stagger } from 'motion';
import { useEffect } from 'react';
import { animarPreset, duracaoDoToken, fade, lineDrawX, lineDrawY } from './animations';
import { ATRIBUTO_MOVIMENTO_REDUZIDO } from './useReducedMotion';

/** Atributo-gancho do desenho de linha (contrato doc 04 §4.4; D22). Valores: `"y"` (Formação) e
 * `"trail"` (conectores das trilhas). */
export const ATRIBUTO_DESENHO = 'data-draw';
/** Atributo-gancho da ponta de seta de cada conector (contrato doc 04 §4.4; D22). */
export const ATRIBUTO_PONTA = 'data-draw-tip';

const SELETOR_LINHA_Y = `[${ATRIBUTO_DESENHO}="y"]`;
const SELETOR_CONECTOR = `[${ATRIBUTO_DESENHO}="trail"]`;
const SELETOR_PONTA = `[${ATRIBUTO_PONTA}]`;

/** Fração mínima visível para disparar (§9; mesmo limiar das demais A-integração). */
const LIMIAR_VISIVEL = 0.15;

/** Breakpoint do eixo das trilhas: desktop/tablet (linha) × celular (coluna) — igual a
 * `Track.module.css` (DV-11; decisão de layout do S-14, não os "≤ 639 px" do doc 04 original). */
const CONSULTA_EIXO_HORIZONTAL = '(min-width: 1024px)';

/** Lê o estado de movimento reduzido no momento exato da entrada (D14: fonte é o MotionProvider). */
function movimentoReduzidoAgora(doc: Document): boolean {
  return doc.documentElement.getAttribute(ATRIBUTO_MOVIMENTO_REDUZIDO) === 'true';
}

/**
 * `true` quando a trilha deve desenhar na horizontal (desktop/tablet, ≥ 1024 px). Lida de novo a
 * cada chamada (nunca cacheada): é assim que o eixo "recalcula ao redimensionar" sem listener
 * nenhum (ver o comentário do topo do arquivo). Sem `matchMedia` (SSR/navegador muito antigo),
 * cai para o eixo vertical — o mesmo "nunca trava" dos outros ganchos.
 */
function ehEixoHorizontalAgora(doc: Document): boolean {
  const win = doc.defaultView;
  if (!win || typeof win.matchMedia !== 'function') return false;
  try {
    return win.matchMedia(CONSULTA_EIXO_HORIZONTAL).matches;
  } catch {
    return false;
  }
}

/**
 * Grupo (trilha) de um conector: o `<ol>` ancestral mais próximo — a `<ol>` de etapas do `Track`
 * (S-14) é o único elemento que contém os 3 conectores de uma trilha e nenhum de outra. Sem um
 * `<ol>` ancestral (DOM inesperado), cai para o elemento pai direto: o conector então forma um
 * grupo de 1 (ainda desenha, só perde a sequência entre conectores — nunca quebra).
 */
function grupoDoConector(el: Element): Element {
  return el.closest('ol') ?? el.parentElement ?? el;
}

/** Os `[data-draw="trail"]` descendentes de `grupo`, na ordem do DOM (1º, 2º, 3º conector). */
function conectoresDoGrupo(grupo: Element): Element[] {
  return [...grupo.querySelectorAll(SELETOR_CONECTOR)];
}

/** A ponta de seta (`[data-draw-tip]`) dentro de um conector, se houver. */
function pontaDoConector(conector: Element): Element | null {
  return conector.querySelector(SELETOR_PONTA);
}

/** Desenha a linha vertical da Formação (`data-draw="y"`): `lineDrawY`, `--dur-draw`, sem atraso. */
function desenharLinhaY(el: Element, reduzido: boolean): void {
  animarPreset(el, lineDrawY, reduzido);
}

/**
 * Desenha os conectores de UMA trilha em sequência (soma = `--dur-draw`) e, no fim de cada um, a
 * ponta de seta dele com fade. Eixo (linha × coluna) decidido agora, não antes (ver
 * `ehEixoHorizontalAgora`).
 */
function desenharTrilha(grupo: Element, doc: Document): void {
  const conectores = conectoresDoGrupo(grupo);
  if (conectores.length === 0) return;

  const reduzido = movimentoReduzidoAgora(doc);
  const preset = ehEixoHorizontalAgora(doc) ? lineDrawX : lineDrawY;
  // `--dur-draw` dividido pelo nº real de conectores desta trilha (3, no conteúdo de hoje) — nunca
  // um número copiado (D14): se uma trilha tiver menos etapas, a soma continua batendo com o token.
  const trechoSegundos = duracaoDoToken('--dur-draw') / conectores.length;

  animarPreset(conectores, preset, reduzido, stagger(reduzido ? 0 : trechoSegundos), {
    duracao: trechoSegundos,
  });

  const pontas = conectores.map(pontaDoConector).filter((el): el is Element => el !== null);
  if (pontas.length === 0) return;
  // `startDelay: trechoSegundos` empurra o fade de CADA ponta para o instante em que o conector
  // dela (mesmo índice) termina: delay(i) = trecho + trecho·i = (i + 1)·trecho (ver o comentário do
  // topo do arquivo e `motion-dom/utils/stagger.mjs`).
  animarPreset(
    pontas,
    fade,
    reduzido,
    stagger(reduzido ? 0 : trechoSegundos, { startDelay: reduzido ? 0 : trechoSegundos }),
  );
}

/** `[data-draw="y"]` (o próprio nó, se bater, e os descendentes dele). */
function linhasEm(no: Node): Element[] {
  if (no.nodeType !== 1) return [];
  const el = no as Element;
  const dentro = [...el.querySelectorAll(SELETOR_LINHA_Y)];
  return el.matches(SELETOR_LINHA_Y) ? [el, ...dentro] : dentro;
}

/** Grupos (trilhas) de `data-draw="trail"]` descobertos dentro de (ou no próprio) `no`. */
function gruposEm(no: Node): Element[] {
  if (no.nodeType !== 1) return [];
  const el = no as Element;
  const conectores = [...el.querySelectorAll(SELETOR_CONECTOR)];
  if (el.matches(SELETOR_CONECTOR)) conectores.push(el);
  return [...new Set(conectores.map(grupoDoConector))];
}

/**
 * Liga o desenho de linha no documento. Devolve a função que desliga tudo (StrictMode-safe: chamar
 * de novo depois do cleanup é seguro, igual a `iniciarRevelacao`/`iniciarCascata`). Cada linha da
 * Formação e cada trilha (grupo de conectores) desenha no máximo uma vez.
 */
export function iniciarDesenho(doc: Document = document): () => void {
  // Sem `IntersectionObserver`, nada acontece por JS: linhas e conectores ficam no estado normal do
  // CSS (nenhum "escondido" é escrito em lugar nenhum, mesmo princípio do A-02/A-03/A-04).
  const Observador = globalThis.IntersectionObserver as typeof IntersectionObserver | undefined;
  if (typeof Observador !== 'function') {
    return () => undefined;
  }

  const linhasObservadas = new WeakSet<Element>();
  const gruposObservados = new WeakSet<Element>();
  const paradas: Array<() => void> = [];

  const ligarLinha = (el: Element): void => {
    if (linhasObservadas.has(el)) return;
    linhasObservadas.add(el);
    paradas.push(
      inView(
        el,
        () => {
          desenharLinhaY(el, movimentoReduzidoAgora(doc));
        },
        { amount: LIMIAR_VISIVEL },
      ),
    );
  };

  const ligarGrupo = (grupo: Element): void => {
    if (gruposObservados.has(grupo)) return;
    gruposObservados.add(grupo);
    paradas.push(
      inView(
        grupo,
        () => {
          desenharTrilha(grupo, doc);
        },
        { amount: LIMIAR_VISIVEL },
      ),
    );
  };

  // Linhas já existentes: um único `inView`/`IntersectionObserver` compartilhado (mesmo padrão de
  // `useReveal.ts`/`useStagger.ts`).
  paradas.push(
    inView(
      SELETOR_LINHA_Y,
      (el) => {
        linhasObservadas.add(el);
        desenharLinhaY(el, movimentoReduzidoAgora(doc));
      },
      { amount: LIMIAR_VISIVEL },
    ),
  );
  doc.querySelectorAll(SELETOR_LINHA_Y).forEach((el) => linhasObservadas.add(el));

  // Grupos (trilhas) já existentes: descobertos a partir dos conectores no documento, um único
  // `inView` para a lista inteira (o `inView` aceita um array de elementos, não só um seletor).
  const gruposIniciais = [
    ...new Set([...doc.querySelectorAll(SELETOR_CONECTOR)].map(grupoDoConector)),
  ];
  if (gruposIniciais.length > 0) {
    paradas.push(
      inView(
        gruposIniciais,
        (grupo) => {
          gruposObservados.add(grupo);
          desenharTrilha(grupo, doc);
        },
        { amount: LIMIAR_VISIVEL },
      ),
    );
    gruposIniciais.forEach((grupo) => gruposObservados.add(grupo));
  }

  // Nós montados depois (troca de idioma/tema não desmonta as seções, mas o código é defensivo):
  // cada linha/grupo novo ganha seu próprio `inView`, para nunca reobservar o que já desenhou.
  const mo = new MutationObserver((mudancas) => {
    for (const mudanca of mudancas) {
      mudanca.addedNodes.forEach((no) => {
        linhasEm(no).forEach(ligarLinha);
        gruposEm(no).forEach(ligarGrupo);
      });
    }
  });
  mo.observe(doc.documentElement, { subtree: true, childList: true });

  return () => {
    mo.disconnect();
    for (const parar of paradas) parar();
    paradas.length = 0;
  };
}

/** Hook: liga o desenho de linha dentro do `MotionProvider` (A-01) e devolve a limpeza no `useEffect`. */
export function useDrawLine(): void {
  useEffect(() => iniciarDesenho(document), []);
}
