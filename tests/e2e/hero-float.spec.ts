// Flutuação dos cartões do hero (A-11b; doc 04 §4.4 e §9 "Elementos flutuantes"; doc de design
// §7.2 e §9; DV-8, DV-9), nas 6 larguras do `playwright.config.ts` (360, 390, 768, 1024, 1280,
// 1440 px). Confere, no navegador real:
// - só 3 cartões com `data-float` (lock, database, chart) em TODAS as larguras — na V1 o cartão de
//   código nunca existe (A-15 é V2, doc 09 §1; `Hero.tsx` nunca passa `codeText` ao `HeroVisual`),
//   diferente do critério original do doc 04 (4 no desktop, 3 no celular); adaptação registrada no
//   checkpoint `A-11b.md`;
// - os 3 presets continuam com combinações diferentes (amplitude/período/atraso) também no CSS
//   computado do navegador (não só no `presets.ts`, já coberto por `tests/unit/decor/float.test.ts`);
// - o desalinhamento entre o nó do `HeroLinks` (estático) e a borda do cartão flutuante
//   correspondente (que só anima `translateY`) ao longo de 10 amostras por ciclo completo;
// - parado com movimento reduzido (`transform: none`) e fora da tela (`animation-play-state: paused`).
//
// MEDIÇÃO DO DESALINHAMENTO (passo 2 da task): a flutuação é CSS puro (`@keyframes` em loop
// infinito, não `Element.prototype.animate()` do `motion`), então a técnica de interceptação de
// `animate()` do A-03/A-05 não se aplica aqui. Em vez de esperar o tempo real (o ciclo mais longo é
// 9 s × 10 amostras × 3 cartões × 6 larguras = minutos), cada cartão tem exatamente 1
// `Animation` (CSS Animation) que o `Element.getAnimations()` expõe pela Web Animations API: o
// teste PAUSA essa animação e define `animation.currentTime` diretamente (em ms), avançando o
// relógio da animação sem esperar nenhum tempo real. Depois de cada ajuste, espera 1
// `requestAnimationFrame` (para o navegador recalcular o `transform` antes de ler
// `getBoundingClientRect`) e mede a distância real entre o centro do nó (círculo do `HeroLinks`,
// que não anima) e a borda do cartão (ponto mais próximo do retângulo, `getBoundingClientRect`,
// já considerando a escala `--hero-escala` do `.palco` no tablet/celular).
import { expect, test, type Page } from '@playwright/test';

/** Nomes com `data-float` que existem de fato na V1 (sem `code`, nunca montado — doc 09 §1). */
const NOMES_NA_V1 = ['lock', 'database', 'chart'] as const;

/** Limite do passo 3 da task (doc 04 linha 646): desalinhamento nó × cartão. */
const LIMITE_PX = 12;
/** Tolerância de medição (doc 08 V-00 item 6: medidas ± 1 px). */
const TOLERANCIA_PX = 1;

interface Amostra {
  readonly tMs: number;
  readonly distPx: number;
}

interface ResultadoDoCartao {
  readonly periodoMs: number;
  readonly amostras: Amostra[];
}

/**
 * Pausa a(s) `Animation` do cartão `[data-float="<nome>"]`, varre 10 instantes igualmente
 * espaçados de um ciclo completo (`animation.currentTime`) e mede, em cada um, a distância entre
 * o nó do `HeroLinks` (o 1º `<circle>` de `g[data-card="<nome>"]`, que não anima) e o ponto mais
 * próximo da borda do cartão (distância ponto-retângulo; 0 se o nó estiver dentro do retângulo).
 * Devolve a animação tocando de novo ao final (mesmo estado de antes da medição).
 */
async function medirDesalinhamento(page: Page, nome: string): Promise<ResultadoDoCartao | null> {
  return page.evaluate(async (nomeDoCartao) => {
    const cartao = document.querySelector(`[data-float="${nomeDoCartao}"]`);
    const no = document.querySelector(`g[data-card="${nomeDoCartao}"] circle`);
    if (!cartao || !no) return null;

    const animacoes = cartao.getAnimations();
    if (animacoes.length === 0) return null;
    animacoes.forEach((a) => a.pause());

    const periodoMs =
      Number.parseFloat(getComputedStyle(cartao).getPropertyValue('--float-dur')) * 1000;
    const amostras: { tMs: number; distPx: number }[] = [];

    for (let i = 0; i < 10; i++) {
      const tMs = (i / 10) * periodoMs;
      animacoes.forEach((a) => {
        a.currentTime = tMs;
      });
      // Espera o navegador recalcular o `transform` antes de medir (currentTime é síncrono na
      // Web Animations API, mas o recálculo de estilo/layout some no próximo quadro).
      await new Promise<void>((resolver) => requestAnimationFrame(() => resolver()));

      const noRect = no.getBoundingClientRect();
      const cartaoRect = cartao.getBoundingClientRect();
      const noCx = (noRect.left + noRect.right) / 2;
      const noCy = (noRect.top + noRect.bottom) / 2;
      // Distância ponto-retângulo (0 se o ponto já estiver dentro do retângulo).
      const dx = Math.max(cartaoRect.left - noCx, 0, noCx - cartaoRect.right);
      const dy = Math.max(cartaoRect.top - noCy, 0, noCy - cartaoRect.bottom);
      amostras.push({ tMs, distPx: Math.sqrt(dx * dx + dy * dy) });
    }

    animacoes.forEach((a) => a.play());
    return { periodoMs, amostras };
  }, nome);
}

async function abrir(page: Page): Promise<void> {
  await page.goto('./');
  await page.waitForLoadState('networkidle');
}

test.describe('A-11b: cartões do hero — quais existem (adaptação V1)', () => {
  test('sempre 3 cartões com data-float (lock, database, chart); o de código nunca existe na V1', async ({
    page,
  }) => {
    await abrir(page);

    const cartoes = page.locator('[data-hero-visual] [data-float]');
    await expect(cartoes).toHaveCount(3);

    const nomes = await cartoes.evaluateAll((els) =>
      els.map((el) => el.getAttribute('data-float')),
    );
    expect(new Set(nomes)).toEqual(new Set(NOMES_NA_V1));
    expect(nomes).not.toContain('code');
  });

  test('os 3 presets têm combinações diferentes no CSS computado do navegador', async ({
    page,
  }) => {
    await abrir(page);

    const valores = await page.evaluate(
      (nomes: readonly string[]) =>
        nomes.map((nome) => {
          const el = document.querySelector(`[data-float="${nome}"]`);
          const s = el ? getComputedStyle(el) : null;
          return {
            nome,
            amp: s?.getPropertyValue('--float-amp').trim(),
            dur: s?.getPropertyValue('--float-dur').trim(),
            delay: s?.getPropertyValue('--float-delay').trim(),
          };
        }),
      NOMES_NA_V1,
    );

    expect(valores).toEqual([
      { nome: 'lock', amp: '8px', dur: '6s', delay: '-1.2s' },
      { nome: 'database', amp: '10px', dur: '7.5s', delay: '-3.1s' },
      { nome: 'chart', amp: '12px', dur: '9s', delay: '-4.4s' },
    ]);

    const combos = valores.map((v) => `${v.amp}|${v.dur}|${v.delay}`);
    expect(new Set(combos).size).toBe(3);
  });
});

test.describe('A-11b: desalinhamento nó × cartão (passos 2 e 3 da task)', () => {
  for (const nome of NOMES_NA_V1) {
    test(`${nome}: ≤ ${LIMITE_PX} px (+ ${TOLERANCIA_PX} px de tolerância) em 10 amostras de 1 ciclo completo`, async ({
      page,
    }) => {
      await abrir(page);

      const resultado = await medirDesalinhamento(page, nome);
      expect(resultado).not.toBeNull();
      const { periodoMs, amostras } = resultado!;
      expect(amostras).toHaveLength(10);

      // Nota: por causa do `--float-delay` NEGATIVO de cada cartão (A-11a), `currentTime = 0`
      // já cai dentro do ciclo (não é exatamente o keyframe 0%/100%) — por isso a 1ª amostra não
      // é necessariamente a posição de repouso exata. Ainda assim, pela composição do A-14 (ver
      // achado no checkpoint `A-11b.md`), a distância medida em QUALQUER instante deveria ficar
      // dentro da tolerância: o nó de cada cartão fica sempre dentro (ou bem perto) da caixa do
      // cartão ao longo de toda a amplitude (8–12 px), nunca exposto para fora da borda.
      expect(amostras[0]!.distPx).toBeLessThanOrEqual(TOLERANCIA_PX);

      const maximo = Math.max(...amostras.map((a) => a.distPx));
      console.log(
        `[A-11b] ${nome} (período ${periodoMs} ms): ${amostras.map((a) => a.distPx.toFixed(2)).join(', ')} px — máximo ${maximo.toFixed(2)} px`,
      );

      for (const amostra of amostras) {
        expect(amostra.distPx).toBeLessThanOrEqual(LIMITE_PX + TOLERANCIA_PX);
      }
    });
  }
});

test.describe('A-11b: parado com movimento reduzido e fora da tela', () => {
  test('movimento reduzido: os 3 cartões ficam em transform: none (sem a animação de flutuação)', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await abrir(page);

    const estados = await page.evaluate(
      (nomes: readonly string[]) =>
        nomes.map((nome) => {
          const el = document.querySelector(`[data-float="${nome}"]`);
          return el ? getComputedStyle(el).transform : null;
        }),
      NOMES_NA_V1,
    );
    for (const transform of estados) {
      expect(transform).toBe('none');
    }
  });

  test('fora da tela: animation-play-state fica "paused" quando o hero sai do viewport', async ({
    page,
  }) => {
    await abrir(page);

    // No celular (< 1024 px) o texto do hero vem antes do visual numa única coluna (S-03/S-04):
    // o palco com os cartões pode já nascer fora do viewport inicial, então rola até o 1º cartão
    // e espera o observador do A-01 marcar `data-offscreen="false"` antes de medir "tocando".
    // `Element.scrollIntoView` direto (via `locator.evaluate`), não `scrollIntoViewIfNeeded`: o
    // cartão está sempre em `translateY` (loop infinito), então a checagem de "estável" do
    // Playwright nunca termina (acerta "not stable" para sempre).
    await page
      .locator(`[data-float="${NOMES_NA_V1[0]}"]`)
      .evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await expect
      .poll(
        async () =>
          page.evaluate(
            (nome: string) =>
              document.querySelector(`[data-float="${nome}"]`)?.getAttribute('data-offscreen'),
            NOMES_NA_V1[0],
          ),
        { timeout: 3_000 },
      )
      .toBe('false');

    // `data-offscreen="false"` já confirmado acima; mais um `poll` curto para o `animation-play-
    // state` (CSS) acompanhar — pode haver 1 quadro de atraso entre o atributo e o repaint.
    await expect
      .poll(
        async () =>
          page.evaluate(
            (nomes: readonly string[]) =>
              nomes.map(
                (nome) =>
                  getComputedStyle(document.querySelector(`[data-float="${nome}"]`)!)
                    .animationPlayState,
              ),
            NOMES_NA_V1,
          ),
        { timeout: 3_000 },
      )
      .toEqual(['running', 'running', 'running']);

    // Rola para o fim da página: o observador do A-01 marca `data-offscreen="true"`, que o
    // `reduced-motion.css` usa para pausar (`animation-play-state: paused`).
    await page.evaluate(() =>
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }),
    );

    await expect
      .poll(
        async () =>
          page.evaluate(
            (nome: string) =>
              document.querySelector(`[data-float="${nome}"]`)?.getAttribute('data-offscreen'),
            NOMES_NA_V1[0],
          ),
        { timeout: 3_000 },
      )
      .toBe('true');

    await expect
      .poll(
        async () =>
          page.evaluate(
            (nomes: readonly string[]) =>
              nomes.map(
                (nome) =>
                  getComputedStyle(document.querySelector(`[data-float="${nome}"]`)!)
                    .animationPlayState,
              ),
            NOMES_NA_V1,
          ),
        { timeout: 3_000 },
      )
      .toEqual(['paused', 'paused', 'paused']);
  });
});
