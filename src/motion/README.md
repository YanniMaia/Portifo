Infraestrutura de animação, criada pela task A-01 (doc 04), que também instala o `motion`.

- `useReducedMotion.ts`: `useReducedMotion()` (reage em tempo real), `CONSULTA_MOVIMENTO_REDUZIDO` e `ATRIBUTO_MOVIMENTO_REDUZIDO`.
- `MotionProvider.tsx`: `LazyMotion` (features de `features.ts`, sob demanda) + `MotionConfig reducedMotion="user"`, `data-reduced-motion` no `<html>` e o observador de loops. Registrado em `src/main.tsx`.
- `loopPause.ts`: `iniciarPausaDeLoops()` escreve `data-offscreen` em cada `[data-loop]` e em cada `[data-float]` (cartões flutuantes do A-11a) e `data-page-hidden` no `<html>`. Os dois ganchos pausam fora da tela e com a aba oculta; não é preciso pôr `data-loop` junto com `data-float`.
- `reduced-motion.css`: pausa dos loops e flutuantes e movimento reduzido nos ganchos `data-*` (complementa o DS-04).
- `animations.ts`:
  - presets `fadeUp`, `fade`, `lineDrawX` e `lineDrawY`, só com `opacity` e `transform` em string (`translateY(24px)`, `scaleX(0)`…). Em string, o `motion` manda a animação para o WAAPI, e ela aparece em `document.getAnimations()`. As chaves `x`/`y`/`scale*` rodariam em JS e não aparecem ali. Presets novos seguem o mesmo formato;
  - `staggerDelay(ms)`, `resolverPreset()` e `animarPreset()`, com versão reduzida de duração 0;
  - `duracaoDoToken('--dur-*')` (segundos) e `curvaDoToken('--ease-*')` leem os tokens do CSS;
  - `animarPreset(alvos, preset, reduzido, atraso?, { duracao })` aceita uma duração em segundos no lugar do token, por exemplo `duracaoDoToken('--dur-draw') / 3` por conector. No modo reduzido a duração continua 0.

## Restrições para quem usa os ganchos

- **Não use `transform` para posicionar ou orientar** um elemento com `data-reveal`, `data-stagger-item` ou `data-draw`. O `transform` desses elementos é de quem anima:
  - no modo normal, o `animate()` escreve `transform` inline e o valor final fica lá;
  - no modo reduzido, o `reduced-motion.css` força `transform: none !important`.

  Um `translateX` de posição ou um `rotate(90deg)` para virar um conector na vertical se perderia. Ponha o gancho num **invólucro** e o `transform` de layout no elemento de dentro (ou no de fora), ou posicione com `inset`/`margin`.

- **`[data-draw-tip]` com `scale(0)` no estado inicial fica invisível no modo reduzido.** O modo reduzido só força `opacity: 1` na ponta de seta, e não `transform: none`, para não desmontar a orientação dela. Se o estado inicial usar `scale(0)`, a ponta continua em escala 0. Use só `opacity: 0` no estado inicial da ponta (o preset `fade`), ou ponha a escala num invólucro.
- **SVG:** se o `data-draw` ficar num `<line>`/`<path>` interno, a `transform-origin` do preset é relativa ao `viewBox`. Acrescente `transform-box: fill-box` no elemento.
- **Loop de opacidade com duração por variável** (registrado no A-14, achado M3 da V-02): o teste anti-piscada (`no-flash.test.ts`) só resolve `var()` de `--dur-*` ou com fallback. Use as longhands com fallback, por exemplo `animation-duration: var(--twinkle-dur, 8s)`, e não a forma abreviada `animation: nome var(--x) …`, que reprova por "duração não resolvida". O valor por elemento (inline) precisa respeitar o mesmo mínimo de 1 s, e o teste do componente confere isso (ex.: `Constellation.test.tsx`).
