Infraestrutura de animação, criada pela task A-01 (doc 04), que também instala o `motion`.

- `useReducedMotion.ts`: `useReducedMotion()` (reage em tempo real), `CONSULTA_MOVIMENTO_REDUZIDO` e `ATRIBUTO_MOVIMENTO_REDUZIDO`.
- `MotionProvider.tsx`: `LazyMotion` (features de `features.ts`, sob demanda) + `MotionConfig reducedMotion="user"`, `data-reduced-motion` no `<html>` e o observador de loops. Registrado em `src/main.tsx`.
- `loopPause.ts`: `iniciarPausaDeLoops()` escreve `data-offscreen` em cada `[data-loop]` e em cada `[data-float]` (cartões flutuantes do A-11a) e `data-page-hidden` no `<html>`. Os dois ganchos pausam fora da tela e com a aba oculta; não é preciso pôr `data-loop` junto com `data-float`.
- `reduced-motion.css`: pausa dos loops e flutuantes e movimento reduzido nos ganchos `data-*` (complementa o DS-04).
- `useReveal.ts` (A-02): `iniciarRevelacao(doc = document)` e o hook `useReveal()`, chamado dentro do `MotionProvider`.
  - Observa todo `[data-reveal]` com a API vanilla `inView()` do `motion`: ao cruzar 15% de visibilidade, aplica o preset `fadeUp` (`animarPreset`) uma vez só — o próprio `inView` para de observar o elemento quando o `onStart` não devolve uma função de saída.
  - `MutationObserver` cobre blocos `[data-reveal]` montados depois (um `inView` por nó novo, nunca reobservando o que já existia).
  - Sem `IntersectionObserver` no ambiente, não aplica nada: os blocos ficam no estado visível normal do CSS (nenhum estilo "escondido" é escrito por JS em lugar nenhum).
- `animations.ts`:
  - presets `fadeUp`, `fade`, `lineDrawX`, `lineDrawY` e `lightUp` (A-03: opacidade 0,35→1 + escala 0,96→1, `--dur-base`, etapas das trilhas), só com `opacity` e `transform` em string (`translateY(24px)`, `scaleX(0)`…). Em string, o `motion` manda a animação para o WAAPI, e ela aparece em `document.getAnimations()`. As chaves `x`/`y`/`scale*` rodariam em JS e não aparecem ali. Presets novos seguem o mesmo formato;
  - `staggerDelay(ms)`, `resolverPreset()` e `animarPreset()`, com versão reduzida de duração 0;
  - `duracaoDoToken('--dur-*')` (segundos) e `curvaDoToken('--ease-*')` leem os tokens do CSS;
  - `animarPreset(alvos, preset, reduzido, atraso?, { duracao })` aceita uma duração em segundos no lugar do token, por exemplo `duracaoDoToken('--dur-draw') / 3` por conector, ou `duracaoDoToken('--dur-chip')` na cascata de chips (A-03), que reaproveita o preset `fade` em vez de um preset novo só para trocar o token. No modo reduzido a duração continua 0.
- `useStagger.ts` (A-03): `iniciarCascata(doc = document)` e o hook `useStagger()`, chamado dentro do `MotionProvider`.
  - Mesmo padrão de `useReveal.ts`: observa todo `[data-stagger]` com `inView()`, uma vez só por contêiner. Ao entrar, anima todo `[data-stagger-item]` DESCENDENTE (não só filho direto — em Habilidades e Trilhas o item fica dentro de um `<ul>`/`<li>`) com `stagger()` (`staggerDelay`), na ordem do DOM.
  - Três tipos por `data-stagger="chips|motto|steps"`: chips = `fade` + `--dur-chip` (sobrescrita), 40 ms; motto = `fadeUp`, 150 ms; steps = `lightUp`, 200 ms. Tipo desconhecido não faz nada.
  - `MutationObserver` cobre `[data-stagger]` montados depois, mesmo padrão de `useReveal.ts`.
- `useCountUp.ts` (A-04): `iniciarContagem(doc = document)` e o hook `useCountUp()`, chamado dentro do `MotionProvider`.
  - Não usa `inView()`: o passo 2 da task exige decidir de forma SÍNCRONA, no instante da montagem, se o elemento já está visível (via `getBoundingClientRect()`, mesmo limiar de 15%) — um `IntersectionObserver` assíncrono chegaria tarde demais para evitar 1 quadro do valor final "piscando" para 0. Se já visível, o `textContent` nunca é tocado (fica no valor que o S-05 renderizou); só se estiver fora da tela escreve `'0'` e liga um `IntersectionObserver` (threshold 0.15) para animar depois.
  - A contagem em si não é WAAPI (não é `opacity`/`transform`): usa `animate(0, valorFinal, { duration, ease, onUpdate, onComplete })` do `motion` (sobrecarga numérica, sem elemento), que entrega o valor interpolado quadro a quadro; `onUpdate` arredonda e `onComplete` finaliza no valor exato.
  - `count-up.css`: `font-variant-numeric: tabular-nums` + `display: inline-block` em `[data-countup]` (necessário para o `min-width` ter efeito num `<span>`). A largura mínima em `ch` (dígitos do valor final) é escrita em JS (`el.style.minWidth`), porque `attr()` não é aceito em `min-width` por nenhum navegador estável.
  - `MutationObserver` cobre `[data-countup]` montados depois, cada um passando pela mesma checagem síncrona de visibilidade.
- `useDrawLine.ts` (A-05): `iniciarDesenho(doc = document)` e o hook `useDrawLine()`, chamado dentro do `MotionProvider`.
  - Mesmo padrão de `useReveal.ts`/`useStagger.ts`: `inView()`, limiar 0,15, uma vez só por elemento/grupo, `MutationObserver` para nós montados depois.
  - `data-draw="y"` (Formação): cada elemento é a própria linha; `animarPreset(el, lineDrawY, reduzido)`, sem sobrescrita (`--dur-draw`, 800 ms, já é a duração do preset).
  - `data-draw="trail"` (trilhas): o gancho marca cada CONECTOR, não o contêiner, então o grupo (a trilha) é descoberto subindo até o `<ol>` ancestral mais próximo (`grupoDoConector`) — a mesma `<ol>` que `useStagger.ts` observa para "acender" as pílulas, sem conflito (duas assinaturas de `inView` independentes no mesmo elemento). Ao entrar, os conectores do grupo desenham EM SEQUÊNCIA (não juntos): `--dur-draw / nº de conectores` cada um, com atraso igual à duração de cada um (`stagger(trecho)`, atraso = i·trecho — maior que os atrasos do A-03, de propósito, para não sobrepor dois conectores). Eixo decidido por `matchMedia('(min-width: 1024px)')` (DV-11, breakpoint real do S-14, não os "≤ 639 px" do doc 04 original) lido DE NOVO a cada disparo (nunca cacheado): é assim que "recalcula ao redimensionar" sem `addEventListener` — um grupo só dispara uma vez, então nunca "redesenha" com o eixo errado depois de desenhado. A ponta de seta (`data-draw-tip`) de cada conector ganha fade (preset `fade`) com `stagger(trecho, { startDelay: trecho })` → delay(i) = (i+1)·trecho = o instante exato em que o conector `i` termina, calculado por aritmética (não por `onComplete`).
  - `MutationObserver` cobre `[data-draw="y"]` e grupos de `[data-draw="trail"]` montados depois, mesmo padrão dos outros ganchos.

## Restrições para quem usa os ganchos

- **Não use `transform` para posicionar ou orientar** um elemento com `data-reveal`, `data-stagger-item` ou `data-draw`. O `transform` desses elementos é de quem anima:
  - no modo normal, o `animate()` escreve `transform` inline e o valor final fica lá;
  - no modo reduzido, o `reduced-motion.css` força `transform: none !important`.

  Um `translateX` de posição ou um `rotate(90deg)` para virar um conector na vertical se perderia. Ponha o gancho num **invólucro** e o `transform` de layout no elemento de dentro (ou no de fora), ou posicione com `inset`/`margin`.

- **`[data-draw-tip]` com `scale(0)` no estado inicial fica invisível no modo reduzido.** O modo reduzido só força `opacity: 1` na ponta de seta, e não `transform: none`, para não desmontar a orientação dela. Se o estado inicial usar `scale(0)`, a ponta continua em escala 0. Use só `opacity: 0` no estado inicial da ponta (o preset `fade`), ou ponha a escala num invólucro.
- **SVG:** se o `data-draw` ficar num `<line>`/`<path>` interno, a `transform-origin` do preset é relativa ao `viewBox`. Acrescente `transform-box: fill-box` no elemento.
- **Loop de opacidade com duração por variável** (registrado no A-14, achado M3 da V-02): o teste anti-piscada (`no-flash.test.ts`) só resolve `var()` de `--dur-*` ou com fallback. Use as longhands com fallback, por exemplo `animation-duration: var(--twinkle-dur, 8s)`, e não a forma abreviada `animation: nome var(--x) …`, que reprova por "duração não resolvida". O valor por elemento (inline) precisa respeitar o mesmo mínimo de 1 s, e o teste do componente confere isso (ex.: `Constellation.test.tsx`).
