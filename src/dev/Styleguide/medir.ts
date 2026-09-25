// Leitura de valores computados no /__styleguide (DS-05). O validador compara estes números com o
// doc de design sem abrir o DevTools: cada <output> marcado recebe o valor em `textContent` e em
// `data-computado`.
//
// Dois tipos de marcação:
// - `data-token="--x" data-medida="background-color|background-image|box-shadow|valor"`: aplica
//   `var(--x)` numa sonda e lê a propriedade computada (cores viram `rgb()`/`rgba()`). `valor` lê a
//   própria variável no elemento raiz (medidas e durações, na faixa atual).
// - `data-alvo="<id>" data-propriedades="font-size,font-weight"`: lê propriedades do elemento `#id`.
//
// A sonda tem `transition: none !important` inline, que vence o `!important` da `.theme-transition`
// (DS-04): o valor lido já é o do tema novo, nunca um quadro intermediário da transição de 300 ms.
import type { Medida } from './dados';

function medirToken(raiz: HTMLElement, nome: string, medida: Medida): string {
  if (medida === 'valor') {
    return getComputedStyle(raiz).getPropertyValue(nome).trim();
  }
  const sonda = document.createElement('div');
  sonda.style.setProperty('transition', 'none', 'important');
  sonda.style.setProperty('display', 'none');
  sonda.style.setProperty(medida, `var(${nome})`);
  raiz.appendChild(sonda);
  const valor = getComputedStyle(sonda).getPropertyValue(medida).trim();
  sonda.remove();
  return valor;
}

function escrever(saida: HTMLElement, valor: string): void {
  if (saida.dataset.computado !== valor) {
    saida.dataset.computado = valor;
    saida.textContent = valor;
  }
}

/** Atualiza todos os <output> marcados dentro de `raiz`. */
export function atualizarMedicoes(raiz: HTMLElement): void {
  for (const saida of raiz.querySelectorAll<HTMLElement>('[data-token][data-medida]')) {
    const nome = saida.dataset.token ?? '';
    const medida = (saida.dataset.medida ?? 'valor') as Medida;
    escrever(saida, medirToken(raiz, nome, medida));
  }

  for (const saida of raiz.querySelectorAll<HTMLElement>('[data-alvo][data-propriedades]')) {
    const alvo = document.getElementById(saida.dataset.alvo ?? '');
    if (!alvo) continue;
    const estilo = getComputedStyle(alvo);
    const valores = (saida.dataset.propriedades ?? '')
      .split(',')
      .map((p) => estilo.getPropertyValue(p.trim()).trim());
    escrever(saida, valores.join(' · '));
  }
}
