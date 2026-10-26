// Presets de animação compartilhados (A-01; doc 04 §4.1, §4.2 R1/R4 e §7; doc de design §9).
// Usados com a API vanilla do `motion` (`animate`, `inView`, `stagger`) pelas A-integração, que
// leem os ganchos `data-*` das seções (§4.4). Regras:
// - R1: os quadros-chave só usam `opacity` e `transform`. O `transform` vai em STRING
//   (`translateY(24px)`, `scaleX(0)`…) e só com funções translate/scale/rotate: assim o `motion`
//   manda a animação para o WAAPI do navegador (fora da thread principal e visível em
//   `document.getAnimations()`). As chaves independentes `x`/`y`/`scale*` rodariam em JS, quadro
//   a quadro (validação A-01 V-02, M1). Teste: tests/unit/motion/animations.test.ts.
// - Durações e curvas NÃO são números copiados: cada preset aponta o NOME do token do DS-02/A-01
//   (`--dur-enter`, `--ease-out`…), lido do CSS na hora de animar (dono único, D14).
// - R4: cada preset tem versão reduzida (duração 0, já no estado final), escolhida pelo booleano
//   de `useReducedMotion()`.
import { animate, stagger, type DOMKeyframesDefinition, type Easing } from 'motion';

/** Propriedades que um preset pode animar (R1). */
export const PROPRIEDADES_PERMITIDAS = ['opacity', 'transform'] as const;

export type PropriedadeAnimavel = (typeof PROPRIEDADES_PERMITIDAS)[number];

/**
 * Quadros-chave de um preset: só as propriedades de R1, cada uma com [início, fim]. O
 * `transform` usa só `translate*`, `scale*` e `rotate*` (nunca posição ou tamanho de layout).
 */
export interface QuadrosChave {
  opacity?: readonly [number, number];
  transform?: readonly [string, string];
}

/** Tokens de duração (DS-02 `motion.css` + A-01 `motion-extra.css`). */
export type TokenDuracao =
  | '--dur-fast'
  | '--dur-base'
  | '--dur-theme'
  | '--dur-enter'
  | '--dur-chip'
  | '--dur-draw'
  | '--dur-count'
  | '--dur-pulse'
  | '--dur-burst';

/** Tokens de curva (DS-02 `--ease-out` + A-01 `--ease-in-out`). */
export type TokenCurva = '--ease-out' | '--ease-in-out';

export interface Preset {
  quadros: QuadrosChave;
  duracao: TokenDuracao;
  curva: TokenCurva;
  /**
   * `transform-origin` estático, aplicado antes de animar (não é propriedade animada). As linhas
   * crescem a partir de uma ponta (§9: "desenho de linha").
   */
  origem?: string;
}

/** Entrada de seções e linhas da frase: fade + 24 px de baixo para cima, 600 ms, ease-out (§9). */
export const fadeUp: Preset = {
  quadros: { opacity: [0, 1], transform: ['translateY(24px)', 'translateY(0px)'] },
  duracao: '--dur-enter',
  curva: '--ease-out',
};

/** Só opacidade (ex.: ponta de seta das trilhas, §7.10), 600 ms, ease-out. */
export const fade: Preset = {
  quadros: { opacity: [0, 1] },
  duracao: '--dur-enter',
  curva: '--ease-out',
};

/** Linha horizontal desenhada da esquerda para a direita (trilhas, §7.10), 800 ms, ease-out. */
export const lineDrawX: Preset = {
  quadros: { transform: ['scaleX(0)', 'scaleX(1)'] },
  duracao: '--dur-draw',
  curva: '--ease-out',
  origem: 'left center',
};

/** Linha vertical desenhada de cima para baixo (Formação, §7.9), 800 ms, ease-out. */
export const lineDrawY: Preset = {
  quadros: { transform: ['scaleY(0)', 'scaleY(1)'] },
  duracao: '--dur-draw',
  curva: '--ease-out',
  origem: 'center top',
};

/**
 * "Acende" as etapas das trilhas (A-03; §7.10, §9 "Etapas das trilhas"): opacidade 0,35 → 1 e
 * escala 0,96 → 1 (sem `transform-origin` próprio: o padrão `center` já serve para um "pop" no
 * lugar, sem deslocar a pílula). Duração: `--dur-base` (250 ms), não `--dur-chip` (400 ms) —
 * decisão registrada no diário cp/A-03: a tabela-resumo do doc 04 §7 só fixa o atraso entre
 * etapas (200 ms), não a duração de cada uma; `--dur-chip` fica reservado à cascata de chips
 * (opacidade só, §9 "Cascata de chips"), para cada token continuar ligado a uma única família
 * semântica (D14). `--dur-base` é o token dos realces "acesos" por hover de card/painel/IconBox
 * (DS-15/DS-16) — a mesma linguagem visual de "ressaltar", e os 250 ms encaixam melhor no atraso
 * de 200 ms entre etapas (sobreposição de 50 ms, mais parecido com um aceso em cadeia do que os
 * 400 ms do chip, que dobrariam a sobreposição).
 */
export const lightUp: Preset = {
  quadros: { opacity: [0.35, 1], transform: ['scale(0.96)', 'scale(1)'] },
  duracao: '--dur-base',
  curva: '--ease-out',
};

/** Todos os presets, para os testes percorrerem (R1). */
export const PRESETS = { fadeUp, fade, lineDrawX, lineDrawY, lightUp } as const;

/**
 * Atraso em cascata de `ms` milissegundos entre itens (chips 40 ms, linhas da frase 150 ms,
 * etapas 200 ms; §9). Devolve a função do `stagger` do `motion`, para a opção `delay`.
 * Com movimento reduzido, não há cascata: todos aparecem juntos (atraso 0).
 */
export function staggerDelay(ms: number, reduzido = false) {
  return stagger(reduzido ? 0 : ms / 1000);
}

/** Lê um token do <html> (ou devolve `''` fora do navegador). */
function lerToken(nome: TokenDuracao | TokenCurva): string {
  if (typeof document === 'undefined') return '';
  return getComputedStyle(document.documentElement).getPropertyValue(nome).trim();
}

/** `600ms` → 0.6; `.6s` → 0.6. Valor ausente ou inválido → 0 (aparece sem animar, nunca some). */
export function duracaoEmSegundos(valor: string): number {
  const m = /^(-?\d*\.?\d+)(ms|s)$/.exec(valor.trim());
  if (!m) return 0;
  const n = Number(m[1]);
  return m[2] === 'ms' ? n / 1000 : n;
}

/** `cubic-bezier(0.22, 1, 0.36, 1)` → [0.22, 1, 0.36, 1]. Outro valor → `'linear'`. */
export function curvaParaMotion(valor: string): Easing {
  const m = /^cubic-bezier\(([^)]+)\)$/.exec(valor.trim());
  const numeros = m?.[1]?.split(',').map((n) => Number(n.trim()));
  if (numeros?.length === 4 && numeros.every((n) => Number.isFinite(n))) {
    return numeros as [number, number, number, number];
  }
  return 'linear';
}

/**
 * Duração de um token do CSS, em segundos, pronta para o `motion` (ex.: `--dur-count` do A-04,
 * `--dur-burst`, ou `duracaoDoToken('--dur-draw') / 3` por conector do A-05). Token ausente → 0.
 */
export function duracaoDoToken(nome: TokenDuracao): number {
  return duracaoEmSegundos(lerToken(nome));
}

/** Curva de um token do CSS, pronta para o `motion`. Token ausente → `'linear'`. */
export function curvaDoToken(nome: TokenCurva): Easing {
  return curvaParaMotion(lerToken(nome));
}

export interface OpcoesDoPreset {
  duration: number;
  ease: Easing;
  delay?: number | ReturnType<typeof stagger>;
}

/** Ajustes opcionais de um uso do preset (validação A-01 V-02, B2). */
export interface SobrescritaDoPreset {
  /**
   * Duração em segundos no lugar do token do preset (ex.: `duracaoDoToken('--dur-draw') / 3`).
   * Ignorada no movimento reduzido, que é sempre 0. Valor negativo ou não finito → 0.
   */
  duracao?: number;
}

/**
 * Quadros-chave e opções prontos para o `animate()` do `motion`.
 * - Normal: quadros [início, fim], duração e curva lidas dos tokens (ou a duração sobrescrita).
 * - Reduzido (R4): só o valor final de cada propriedade, duração 0 e sem atraso.
 */
export function resolverPreset(
  preset: Preset,
  reduzido: boolean,
  atraso?: OpcoesDoPreset['delay'],
  sobrescrita?: SobrescritaDoPreset,
): { quadros: DOMKeyframesDefinition; opcoes: OpcoesDoPreset } {
  const quadros: DOMKeyframesDefinition = {};
  const { opacity, transform } = preset.quadros;
  if (opacity) quadros.opacity = reduzido ? opacity[1] : [...opacity];
  if (transform) quadros.transform = reduzido ? transform[1] : [...transform];
  if (reduzido) {
    return { quadros, opcoes: { duration: 0, ease: 'linear' } };
  }
  const duracaoSobrescrita = sobrescrita?.duracao;
  const opcoes: OpcoesDoPreset = {
    duration:
      duracaoSobrescrita === undefined
        ? duracaoDoToken(preset.duracao)
        : Number.isFinite(duracaoSobrescrita) && duracaoSobrescrita > 0
          ? duracaoSobrescrita
          : 0,
    ease: curvaDoToken(preset.curva),
  };
  if (atraso !== undefined) opcoes.delay = atraso;
  return { quadros, opcoes };
}

/**
 * Aplica um preset com o `animate()` do `motion` em um ou mais elementos (ganchos `data-*`).
 * Define a `transform-origin` do preset antes. Devolve o controle da animação do `motion`.
 * `sobrescrita.duracao` (segundos) troca a duração do token só neste uso.
 */
export function animarPreset(
  alvos: Element | Element[] | NodeListOf<Element>,
  preset: Preset,
  reduzido: boolean,
  atraso?: OpcoesDoPreset['delay'],
  sobrescrita?: SobrescritaDoPreset,
) {
  const lista = alvos instanceof Element ? [alvos] : [...alvos];
  if (preset.origem) {
    for (const el of lista) (el as HTMLElement | SVGElement).style.transformOrigin = preset.origem;
  }
  const { quadros, opcoes } = resolverPreset(preset, reduzido, atraso, sobrescrita);
  return animate(lista, quadros, opcoes);
}
