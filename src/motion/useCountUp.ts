// Contagem da faixa de destaques (A-04; doc 04 §4.4 passos 1-6 e §9 "Números da faixa"; D15).
//
// Observa todo `[data-countup]`: mesmo padrão arquitetural de `useReveal.ts`/`useStagger.ts`
// (A-02/A-03) — `IntersectionObserver` + `MutationObserver` cobrindo nós montados depois, uma vez
// só por elemento — sem importar nada de lá (D14/R7: cada gancho é a sua própria unidade). O valor
// final de cada elemento é o PRÓPRIO atributo `data-countup` (string numérica, escrita pelo S-05 a
// partir de `itensDaFaixa()` do C-06; mudar os dados em `projects.ts` muda o atributo sem esta task
// saber nem precisar saber o número).
//
// Diferença para o A-02/A-03 (motivo de não reusar `inView()` do pacote `motion` aqui): o passo 2
// da task exige que "o 0 inicial é aplicado só depois da montagem e só se a faixa ainda estiver
// fora da tela" — se o elemento já está visível no 1º quadro (ex. viewport alto o bastante para a
// Faixa de destaques aparecer já abaixo do Hero), o `textContent` NUNCA é tocado: ele fica exatamente
// no valor final que o S-05 já renderizou, sem nenhuma contagem, sem "flash" para 0. Essa decisão
//("já visível ou não") precisa ser tomada de forma SÍNCRONA, no exato instante em que o efeito
// roda (depois do 1º commit do React, antes do próximo quadro pintado) — um `IntersectionObserver`
// só entrega a 1ª notificação de forma assíncrona (depois de ao menos um quadro), tarde demais para
// decidir "escrever 0 ou não" sem arriscar 1 quadro do valor final pintado e sobrescrito por '0'
// depois (exatamente o "flash" que o passo 2 proíbe). Por isso a verificação usa
// `getBoundingClientRect()` uma única vez, no instante da montagem, com o mesmo limiar de 15% do
// A-02/A-03 — e só então, se estiver fora da tela, escreve '0' e liga um `IntersectionObserver`
// (threshold 0.15) para animar quando cruzar o limiar de verdade (decisão registrada no diário
// cp/A-04). Movimento reduzido (R4) usa a MESMA checagem síncrona: "valor final na hora, sem
// rolar" (critério de aceite) — se já está ativo na montagem, o '0' nem chega a ser escrito; se for
// ativado depois, enquanto o elemento ainda está fora da tela esperando o `IntersectionObserver`, a
// 2ª checagem (no instante exato da entrada, D14: fonte é o `MotionProvider`) ainda assim pula a
// contagem e escreve o valor final direto.
//
// A animação do número em si não é WAAPI (R1 só cobre `opacity`/`transform`, ver o topo de
// `animations.ts`): é o `textContent` mudando a cada quadro, isto é, não é um "preset" de
// `animarPreset`. Usamos `animate()` do pacote `motion` na sua sobrecarga NUMÉRICA
// (`animate(0, valorFinal, opções)`, sem elemento nem seletor): o `motion` interpola o número via
// `requestAnimationFrame` e entrega o valor interpolado no `onUpdate`, sem tocar no DOM por conta
// própria — cada quadro arredonda para inteiro (`Math.round`) e nunca deixa passar do valor final
// (`Math.min`), igual ao critério de aceite. `duracaoDoToken('--dur-count')`/`curvaDoToken('--ease-out')`
// de `./animations` leem os tokens do CSS (dono único, D14), nunca um número copiado.
import { animate } from 'motion';
import { useEffect } from 'react';
import { curvaDoToken, duracaoDoToken } from './animations';
import './count-up.css';
import { ATRIBUTO_MOVIMENTO_REDUZIDO } from './useReducedMotion';

/** Atributo-gancho do número animado (contrato doc 04 §4.4; D22). O valor é o alvo da contagem. */
export const ATRIBUTO_CONTAGEM = 'data-countup';
const SELETOR_CONTAGEM = `[${ATRIBUTO_CONTAGEM}]`;

/** Fração mínima visível para disparar (§9; mesmo limiar da entrada de seções, A-02/A-03). */
const LIMIAR_VISIVEL = 0.15;

/** Lê o estado de movimento reduzido no momento exato da entrada (D14: fonte é o MotionProvider). */
function movimentoReduzidoAgora(doc: Document): boolean {
  return doc.documentElement.getAttribute(ATRIBUTO_MOVIMENTO_REDUZIDO) === 'true';
}

/**
 * Valor final (inteiro, ≥ 0) do atributo `data-countup`; `null` se ausente/inválido — esses
 * elementos nunca são tocados (nenhum `[data-countup]` sem número é esperado do S-05, mas o código
 * é defensivo).
 */
function valorFinalDe(el: Element): number | null {
  const bruto = el.getAttribute(ATRIBUTO_CONTAGEM)?.trim();
  // Só dígitos (inteiro ≥ 0): rejeita ausente, vazio, negativo, fracionário e não numérico. Uma
  // string vazia convertida por `Number('')` daria 0 (um valor "válido" incorreto) sem este regex.
  if (!bruto || !/^\d+$/.test(bruto)) return null;
  return Number(bruto);
}

/**
 * Fração visível de `el` na janela de `doc` (0 a 1), só pela sobreposição vertical com o
 * viewport — a mesma aproximação simples usada pela sonda de limiar do `reveal.spec.ts` (A-02).
 * SEM MEDIÇÃO REAL DE LAYOUT (ex.: jsdom, que sempre devolve um retângulo 0×0 em 0,0 — não há
 * motor de layout) devolve `1` (trata como "já visível"): o princípio do passo 2 da task é "nunca
 * escrever um estado zerado antes de CONFIRMAR que está fora da tela"; sem uma medição confiável,
 * a decisão seguinte (não confirmar) é a segura — e é exatamente o que o `Highlights.test.tsx`
 * (S-05) já espera ao renderizar com `MotionProvider` de verdade: o valor final, sem nenhum '0'
 * escrito por cima. Um `<span>` com texto visível nunca tem de verdade os 4 valores (top, left,
 * width, height) exatamente zero num navegador real (decisão registrada no diário cp/A-04).
 */
function fracaoVisivel(el: Element, doc: Document): number {
  const win = doc.defaultView;
  const rect = el.getBoundingClientRect();
  const semMedicaoReal = rect.top === 0 && rect.left === 0 && rect.width === 0 && rect.height === 0;
  if (!win || semMedicaoReal) return 1;
  const alturaJanela = win.innerHeight || doc.documentElement.clientHeight;
  if (rect.height <= 0 || alturaJanela <= 0) return 0;
  const visivelTopo = Math.max(rect.top, 0);
  const visivelFundo = Math.min(rect.bottom, alturaJanela);
  return Math.max(0, visivelFundo - visivelTopo) / rect.height;
}

/**
 * Reserva a largura mínima dos dígitos do valor final, em `ch` (passo 5: evita deslocamento/CLS).
 * `attr()` não é aceito em `min-width` por nenhum navegador estável — por isso aqui, em JS, no
 * mesmo instante em que o valor final é lido, antes de qualquer troca de `textContent` (nenhum
 * quadro chega a mostrar uma largura menor que a reservada).
 */
function reservarLargura(el: HTMLElement, valorFinal: number): void {
  const digitos = Math.max(1, String(valorFinal).length);
  el.style.minWidth = `${digitos}ch`;
}

/** Anima `el` de 0 até `valorFinal` em `--dur-count`/`--ease-out`; movimento reduzido = direto. */
function animarContagem(el: HTMLElement, valorFinal: number, reduzido: boolean): void {
  if (reduzido) {
    el.textContent = String(valorFinal);
    return;
  }
  animate(0, valorFinal, {
    duration: duracaoDoToken('--dur-count'),
    ease: curvaDoToken('--ease-out'),
    onUpdate: (valor) => {
      // Nunca fracionário (arredonda) nem maior que o final (clampa) — critério de aceite A-04.
      const inteiro = Math.min(valorFinal, Math.max(0, Math.round(valor)));
      el.textContent = String(inteiro);
    },
    onComplete: () => {
      // Garante o valor final exato, sem depender de arredondamento de ponto flutuante do último
      // quadro (a curva `--ease-out` já chega a 1 exatamente, mas este passo é a rede de segurança).
      el.textContent = String(valorFinal);
    },
  });
}

/** Elementos contáveis (o próprio nó, se bater o seletor, e os descendentes dele). */
function contaveisEm(no: Node): Element[] {
  if (no.nodeType !== 1) return [];
  const el = no as Element;
  const dentro = [...el.querySelectorAll(SELETOR_CONTAGEM)];
  return el.matches(SELETOR_CONTAGEM) ? [el, ...dentro] : dentro;
}

/**
 * Liga a contagem no documento. Devolve a função que desliga tudo (StrictMode-safe: chamar de novo
 * depois do cleanup é seguro, igual a `iniciarRevelacao`/`iniciarCascata`). Cada elemento conta no
 * máximo uma vez.
 */
export function iniciarContagem(doc: Document = document): () => void {
  // Sem `IntersectionObserver`, nada escreve '0' por JS (mesmo princípio dos outros ganchos): os
  // elementos ficam no valor final que o S-05 já renderizou, só sem a contagem.
  const Observador = globalThis.IntersectionObserver as typeof IntersectionObserver | undefined;
  if (typeof Observador !== 'function') {
    return () => undefined;
  }

  const concluidos = new WeakSet<Element>();
  const valoresPendentes = new WeakMap<Element, number>();

  const io = new Observador(
    (entradas) => {
      for (const entrada of entradas) {
        const el = entrada.target;
        if (!entrada.isIntersecting || concluidos.has(el)) continue;
        const valorFinal = valoresPendentes.get(el);
        if (valorFinal === undefined) continue;
        concluidos.add(el);
        io.unobserve(el);
        animarContagem(el as HTMLElement, valorFinal, movimentoReduzidoAgora(doc));
      }
    },
    { threshold: LIMIAR_VISIVEL },
  );

  const ligar = (el: Element): void => {
    if (concluidos.has(el) || valoresPendentes.has(el)) return;
    const valorFinal = valorFinalDe(el);
    if (valorFinal === null) return;
    reservarLargura(el as HTMLElement, valorFinal);

    // Movimento reduzido: valor final na hora, sem rolar (mesmo critério do A-02/A-03) — nem
    // chega a escrever '0', então nem precisa saber se está visível ou não.
    if (movimentoReduzidoAgora(doc) || fracaoVisivel(el, doc) >= LIMIAR_VISIVEL) {
      // Já visível no 1º quadro (ou sem medição real de layout, ex. jsdom): fica no valor final do
      // jeito que o S-05 já renderizou. Nenhum '0' é escrito, nenhuma contagem acontece (passo 2).
      concluidos.add(el);
      return;
    }

    // Confirmado fora da tela (e sem movimento reduzido): só agora é seguro escrever o '0' inicial
    // (passo 2 da task). O movimento reduzido é checado de novo no instante da entrada (mais
    // abaixo): se for ativado nesse intervalo, a contagem ainda assim não acontece.
    el.textContent = '0';
    valoresPendentes.set(el, valorFinal);
    io.observe(el);
  };

  // Elementos já no documento.
  doc.querySelectorAll(SELETOR_CONTAGEM).forEach(ligar);

  // Elementos montados depois (troca de idioma/tema não desmonta as seções, mas o código é
  // defensivo): cada nó novo passa pela mesma checagem síncrona de visibilidade.
  const mo = new MutationObserver((mudancas) => {
    for (const mudanca of mudancas) {
      mudanca.addedNodes.forEach((no) => contaveisEm(no).forEach(ligar));
    }
  });
  mo.observe(doc.documentElement, { subtree: true, childList: true });

  return () => {
    mo.disconnect();
    io.disconnect();
  };
}

/** Hook: liga a contagem dentro do `MotionProvider` (A-01) e devolve a limpeza no `useEffect`. */
export function useCountUp(): void {
  useEffect(() => iniciarContagem(document), []);
}
