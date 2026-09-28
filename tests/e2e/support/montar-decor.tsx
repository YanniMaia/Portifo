// Montagem de componentes decorativos isolados para os specs das A-base (A-12 em diante).
// Os componentes das A-base só entram na página depois das S e do A-19, então o spec abre o
// servidor de DESENVOLVIMENTO e importa este módulo pelo Vite (por `addScriptTag` de módulo):
//   import * as m from '/Portifolio/tests/e2e/support/montar-decor.tsx'
// O Vite transforma o TSX e resolve o React para a mesma cópia da página (sem duplicar).
// Não entra no build de produção: nada em src/ importa este arquivo.
import { createElement, type ComponentType, type ReactElement } from 'react';
import { flushSync } from 'react-dom';
import { createRoot, type Root } from 'react-dom/client';
import { CONSTELACOES, Constellation } from '@/components/decor/Constellation';
import { GridBackdrop } from '@/components/decor/GridBackdrop';
import { HeroLinks, LIGACOES_DO_HERO, ligacoesPara } from '@/components/decor/HeroLinks';
import { MiniBarChart, MiniLineChart } from '@/components/decor/MiniCharts';
import { FLUTUANTES_NO_CELULAR } from '@/components/decor/float/presets';

type Props = Record<string, unknown>;
const comProps =
  <P,>(Componente: ComponentType<P>) =>
  (props: Props): ReactElement =>
    createElement(Componente as ComponentType<Props>, props);

const COMPONENTES = {
  GridBackdrop: comProps(GridBackdrop),
  // `desenho` por nome (ex.: { desenho: 'heroSuperiorEsquerdo' }).
  Constellation: (props: Props) =>
    comProps(Constellation)({
      ...props,
      desenho: CONSTELACOES[props.desenho as keyof typeof CONSTELACOES],
    }),
  // `celular: true` usa só os 3 cartões do DV-9; sem ele, as 4 ligações padrão.
  HeroLinks: (props: Props) =>
    comProps(HeroLinks)({
      ...props,
      cards: props.celular ? ligacoesPara(FLUTUANTES_NO_CELULAR) : LIGACOES_DO_HERO,
    }),
  MiniBarChart: comProps(MiniBarChart),
  MiniLineChart: comProps(MiniLineChart),
} as const;

export type NomeDoDecor = keyof typeof COMPONENTES;

const raizes = new Map<HTMLElement, Root>();

/** Renderiza `nome` com `props` dentro de `alvo`, de forma síncrona. */
export function montar(nome: NomeDoDecor, props: Props, alvo: HTMLElement): void {
  const raiz = raizes.get(alvo) ?? createRoot(alvo);
  raizes.set(alvo, raiz);
  flushSync(() => raiz.render(COMPONENTES[nome](props)));
}

/** Desmonta o que `montar` pôs em `alvo`. */
export function desmontar(alvo: HTMLElement): void {
  raizes.get(alvo)?.unmount();
  raizes.delete(alvo);
}
