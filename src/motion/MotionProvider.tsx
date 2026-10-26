// Provedor de movimento (A-01/A-02; doc 04 §4.2 R4, §4.3 e §4.4; D2). Registrado em src/main.tsx
// dentro de ThemeProvider › LanguageProvider (F-14). Faz quatro coisas:
// 1. `LazyMotion` com `domAnimation` (carregado sob demanda de `features.ts`, para o bundle inicial
//    caber no orçamento da §4.3) + `MotionConfig reducedMotion="user"`: componentes `m.*` (quando
//    existirem) usam só as features de DOM e respeitam o movimento reduzido do sistema.
// 2. Escreve `data-reduced-motion="true|false"` no <html>, lido por `reduced-motion.css`.
// 3. Liga o observador de loops (`loopPause.ts`): pausa `[data-loop]` fora da tela e com a aba oculta.
// 4. Liga a revelação de seções (`useReveal.ts`, A-02): fade + 24 px em cada `[data-reveal]`.
// 5. Liga as cascatas (`useStagger.ts`, A-03): chips, linhas da frase e etapas das trilhas em
//    cada `[data-stagger]`.
// 6. Liga a contagem da faixa de destaques (`useCountUp.ts`, A-04): 0 → valor final em cada
//    `[data-countup]`.
import { useEffect, useLayoutEffect, type ReactNode } from 'react';
import { LazyMotion, MotionConfig } from 'motion/react';
import { iniciarPausaDeLoops } from './loopPause';
import { useCountUp } from './useCountUp';
import { ATRIBUTO_MOVIMENTO_REDUZIDO, useReducedMotion } from './useReducedMotion';
import { useReveal } from './useReveal';
import { useStagger } from './useStagger';
import './reduced-motion.css';

/** `domAnimation` em chunk próprio (features.ts), carregado sob demanda (§4.3). */
const carregarFeatures = () => import('./features').then((modulo) => modulo.default);

interface MotionProviderProps {
  children: ReactNode;
}

export function MotionProvider({ children }: MotionProviderProps) {
  const reduzido = useReducedMotion();

  // Antes da pintura: a primeira tela já sai com o atributo certo; muda sem recarregar.
  useLayoutEffect(() => {
    document.documentElement.setAttribute(ATRIBUTO_MOVIMENTO_REDUZIDO, String(reduzido));
  }, [reduzido]);

  useEffect(() => iniciarPausaDeLoops(document), []);
  useReveal();
  useStagger();
  useCountUp();

  return (
    <LazyMotion features={carregarFeatures}>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
