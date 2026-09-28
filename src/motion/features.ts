// Features de DOM do `motion` (A-01; doc 04 §4.3 "Custo do motion no bundle"). Ficam num chunk
// separado, carregado pelo `LazyMotion` do MotionProvider depois da primeira pintura: o bundle
// inicial não paga por elas (orçamento: acréscimo ≤ 25 kB gzip).
import { domAnimation } from 'motion/react';

export default domAnimation;
