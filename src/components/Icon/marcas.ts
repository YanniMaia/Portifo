// Ícones de marca de linha (DS-06, passo 5): o lucide-react 1.x removeu `Linkedin` e `Github`.
// Alternativa para o doc 03 (S-15 Contato, S-16 Rodapé): os mesmos desenhos de linha que o lucide
// publicava até a 0.x (licença ISC), recriados com `createLucideIcon` do próprio `lucide-react`.
// Assim continuam sendo ícones do lucide (D3, lint da F-03): grade 24 × 24, sem preenchimento,
// traço controlado pelo `Icon` (1,75 px), `currentColor`.
import { createLucideIcon } from 'lucide-react';

/** LinkedIn em linha (desenho do antigo `lucide/linkedin`). */
export const Linkedin = createLucideIcon('linkedin', [
  [
    'path',
    {
      d: 'M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z',
      key: 'linkedin-arco',
    },
  ],
  ['rect', { width: '4', height: '12', x: '2', y: '9', key: 'linkedin-barra' }],
  ['circle', { cx: '4', cy: '4', r: '2', key: 'linkedin-ponto' }],
]);

/** GitHub em linha (desenho do antigo `lucide/github`). */
export const Github = createLucideIcon('github', [
  [
    'path',
    {
      d: 'M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4',
      key: 'github-gato',
    },
  ],
  ['path', { d: 'M9 18c-4.51 2-5-2-7-2', key: 'github-cauda' }],
]);
