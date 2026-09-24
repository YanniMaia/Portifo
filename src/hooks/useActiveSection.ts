// Único hook de seção ativa do site (F-12, D14; doc de design §7.1 e §9).
// O A-07 não cria outro: ele só anima o sublinhado a partir do valor devolvido aqui.
import { useEffect, useState } from 'react';
import { navTargetOf, SECTION_IDS, type NavTarget, type SectionId } from '@/content/sections';

/** Altura do cabeçalho fixo (80 px): a "faixa de leitura" começa aqui (§9, mesma medida da F-13). */
export const ACTIVE_SECTION_OFFSET_PX = 80;

/** Margem do `IntersectionObserver`: faixa de 80 px abaixo do topo até 40% da altura da tela. */
export const ACTIVE_SECTION_ROOT_MARGIN = `-${ACTIVE_SECTION_OFFSET_PX}px 0px -60% 0px`;

/** Tolerância do fim da página (`innerHeight + scrollY ≥ scrollHeight - 2`). */
const TOLERANCIA_FIM_PX = 2;

/**
 * Decide o item ativo a partir da posição atual (função pura sobre o DOM, sem estado):
 * 1. Fim da página (depois de ter rolado) → `navTarget` da última seção da lista (`contato`).
 * 2. Senão, a seção ativa é a ÚLTIMA, em ordem do documento, cujo topo está a ≤ 80 + 1 px do
 *    topo da viewport; devolve o `navTarget` dela (`objetivos` → `formacao`).
 * 3. Nenhuma passou da linha, ou a ativa não tem item no menu (`inicio`, `destaques`, `frase`) →
 *    `null`. No topo da página o hero está na faixa, então o resultado é `null`.
 */
export function computeActiveSection(ids: readonly SectionId[]): NavTarget | null {
  const elementos = ids
    .map((id) => ({ id, el: document.getElementById(id) }))
    .filter((item): item is { id: SectionId; el: HTMLElement } => item.el !== null);
  if (elementos.length === 0) return null;

  const { scrollY, innerHeight } = window;
  const alturaTotal = document.documentElement.scrollHeight;
  // `scrollY > 0`: numa página que não rola, "estar no fim" e "estar no topo" coincidem; vale o topo.
  if (scrollY > 0 && innerHeight + scrollY >= alturaTotal - TOLERANCIA_FIM_PX) {
    const ultima = elementos[elementos.length - 1];
    return ultima ? navTargetOf(ultima.id) : null;
  }

  let ativa: SectionId | null = null;
  for (const { id, el } of elementos) {
    if (el.getBoundingClientRect().top <= ACTIVE_SECTION_OFFSET_PX + 1) {
      ativa = id;
    }
  }
  return ativa === null ? null : navTargetOf(ativa);
}

/**
 * Item do menu ativo conforme a rolagem (§7.1: "o item da seção visível fica ativo").
 *
 * @param ids seções observadas, em ordem do documento. Padrão: `SECTION_IDS` (todas do registro).
 *   As seções precisam estar no DOM quando o hook monta (o App shell da F-14 renderiza todas).
 * @returns o `navTarget` da seção ativa (`'sobre' | ... | 'contato'`), nunca o id bruto
 *   (`objetivos` → `'formacao'`), ou `null` quando nenhum link deve ficar ativo.
 *
 * Funcionamento: `IntersectionObserver` com `rootMargin: '-80px 0px -60% 0px'` e os eventos
 * `scroll`/`resize` (passivos) servem só de GATILHO; a decisão é sempre `computeActiveSection`,
 * agendada com `requestAnimationFrame` (no máximo 1 cálculo por quadro). O `scroll` cobre a regra
 * do fim da página, que nenhuma interseção dispara. Tudo é desfeito no unmount.
 *
 * Contrato de uso (quem aplica é o S-01; o A-07 anima o sublinhado): o link cujo destino é o valor
 * devolvido recebe `aria-current="location"` (nunca `"true"`), cor `var(--color-link)` (#C93A77 no
 * claro, #FFB3D1 no escuro, D14) e peso 600. Os demais links ficam sem `aria-current`.
 */
export function useActiveSection(ids: readonly SectionId[] = SECTION_IDS): NavTarget | null {
  const [ativa, setAtiva] = useState<NavTarget | null>(null);
  // Chave estável: uma lista nova com os mesmos ids (ex.: array literal a cada render) não
  // recria o observer.
  const chave = ids.join(' ');

  useEffect(() => {
    const lista = (chave === '' ? [] : chave.split(' ')) as SectionId[];
    let quadro: number | null = null;

    const calcular = () => {
      quadro = null;
      setAtiva(computeActiveSection(lista));
    };
    const agendar = () => {
      if (quadro === null) quadro = window.requestAnimationFrame(calcular);
    };

    let observer: IntersectionObserver | null = null;
    if (typeof window.IntersectionObserver === 'function') {
      observer = new IntersectionObserver(agendar, { rootMargin: ACTIVE_SECTION_ROOT_MARGIN });
      for (const id of lista) {
        const el = document.getElementById(id);
        if (el) observer.observe(el);
      }
    }
    window.addEventListener('scroll', agendar, { passive: true });
    window.addEventListener('resize', agendar, { passive: true });
    agendar(); // estado inicial (ex.: carga com hash ou página já rolada)

    return () => {
      observer?.disconnect();
      window.removeEventListener('scroll', agendar);
      window.removeEventListener('resize', agendar);
      if (quadro !== null) window.cancelAnimationFrame(quadro);
    };
  }, [chave]);

  return ativa;
}
