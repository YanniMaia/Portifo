// Desenho de linha (A-05; doc 04 §4.4 e §9 "Linha do tempo"/"Linha das trilhas"), no build de
// produção e nas 6 larguras (`playwright.config.ts`: 360, 390, 768 < 1024 px → eixo vertical;
// 1024, 1280, 1440 ≥ 1024 px → eixo horizontal, DV-11). Confere, no navegador real:
// - Formação (`[data-draw="y"]`): `scaleY` 0→1 em 800 ms (±30 ms), de cima para baixo
//   (`transform-origin: center top`), uma vez, ao entrar na tela;
// - Trilhas (`[data-draw="trail"]`, 3 conectores por trilha): desenham EM SEQUÊNCIA (não juntos),
//   somando 800 ms (±30 ms) — ≈ 267 ms cada, atraso 0/267/533 ms —, `scaleX` no desktop/tablet
//   (≥ 1024 px, `transform-origin: left center`) ou `scaleY` no celular (< 1024 px,
//   `transform-origin: center top`);
// - a ponta de seta (`[data-draw-tip]`) de cada conector aparece em FADE (só opacity) no instante
//   em que o conector dela termina (delay = (i+1) × 267 ms);
// - nenhum conjunto desenha 2 vezes (rolando a página inteira duas vezes);
// - com `reducedMotion: 'reduce'`, linha e setas já nascem inteiras, sem rolar;
// - nenhuma propriedade fora de `opacity`/`transform` é animada (R1);
// - ao final, a linha ocupa todo o comprimento (`transform` = `none`/identidade).
//
// MEDIÇÃO: mesma técnica de `tests/e2e/stagger.spec.ts` (A-03) — intercepta
// `Element.prototype.animate` e guarda `keyframes`/`options` no instante exato da chamada, nunca
// `getAnimations()` depois do fato (corrida perdida contra animações curtas, achado já registrado
// no diário do A-03). O `motion` entrega `delay`/`duration` em MILISSEGUNDOS ao `animate()` nativo.
import { expect, test, type Locator, type Page } from '@playwright/test';

/** Atributo que o spec usa para identificar `[data-draw]`/`[data-draw-tip]` nas chamadas de `animate()`. */
const ATRIBUTO_SONDA = 'data-a05-probe';

interface ChamadaCrua {
  keyframes: Record<string, [unknown, unknown]>;
  options: { delay?: number; duration?: number };
}

/**
 * Intercepta `Element.prototype.animate` ANTES de qualquer script da página: marca cada
 * `[data-draw]`/`[data-draw-tip]` no instante em que é inserido no DOM (`MutationObserver` ligado
 * desde o 1º documento) e guarda, por marca, a lista de chamadas reais (`keyframes`+`options`) em
 * `window.__a05`. Mesmo padrão de `stagger.spec.ts` (A-03).
 */
async function instalarSonda(page: Page): Promise<void> {
  await page.addInitScript((atributo) => {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const original = Element.prototype.animate;
    const chamadas: Record<string, ChamadaCrua[]> = {};
    let contador = 0;
    (window as unknown as { __a05: typeof chamadas }).__a05 = chamadas;

    const SELETOR = '[data-draw], [data-draw-tip]';
    const marcar = (el: Element): void => {
      if (el.hasAttribute(atributo)) return;
      el.setAttribute(atributo, String(contador++));
    };

    new MutationObserver((mudancas) => {
      for (const mudanca of mudancas) {
        mudanca.addedNodes.forEach((no) => {
          if (no.nodeType !== 1) return;
          const el = no as Element;
          if (el.matches(SELETOR)) marcar(el);
          el.querySelectorAll(SELETOR).forEach(marcar);
        });
      }
    }).observe(document, { subtree: true, childList: true });

    Element.prototype.animate = function (
      this: Element,
      ...args: Parameters<typeof original>
    ): ReturnType<typeof original> {
      const marca = this.getAttribute(atributo);
      if (marca !== null) {
        const keyframes = (args[0] ?? {}) as Record<string, [unknown, unknown]>;
        const options = (typeof args[1] === 'object' ? args[1] : {}) as ChamadaCrua['options'];
        (chamadas[marca] ??= []).push({ keyframes, options });
      }
      return original.apply(this, args);
    };
  }, ATRIBUTO_SONDA);
}

async function abrir(page: Page): Promise<void> {
  await instalarSonda(page);
  await page.goto('./');
  await page.waitForLoadState('networkidle');
}

const lerContagens = (page: Page): Promise<Record<string, number>> =>
  page.evaluate(() => {
    const chamadas = (window as unknown as { __a05: Record<string, unknown[]> }).__a05;
    return Object.fromEntries(
      Object.entries(chamadas).map(([marca, lista]) => [marca, lista.length]),
    );
  });

interface TimingDoItem {
  delay: number;
  duration: number;
  props: string[];
  opacity: [string, string] | null;
  transform: [string, string] | null;
}

/** Espera o 1º elemento de `locator` ter pelo menos 1 chamada registrada. */
async function esperarDesenho(locator: Locator): Promise<void> {
  await expect
    .poll(
      async () =>
        locator.evaluate((el, atributo) => {
          const chamadas = (window as unknown as { __a05: Record<string, unknown[]> }).__a05;
          const marca = el.getAttribute(atributo);
          return marca !== null ? (chamadas[marca]?.length ?? 0) : 0;
        }, ATRIBUTO_SONDA),
      { timeout: 3_000 },
    )
    .toBeGreaterThan(0);
}

/** Lê as chamadas reais capturadas pela sonda para CADA elemento que `locator` resolve. */
async function medir(locator: Locator): Promise<TimingDoItem[]> {
  return locator.evaluateAll((els, atributo) => {
    const chamadas = (window as unknown as { __a05: Record<string, ChamadaCrua[]> }).__a05;
    return els.map((el) => {
      const marca = el.getAttribute(atributo);
      const entradas = (marca !== null ? chamadas[marca] : undefined) ?? [];
      const delays = new Set(entradas.map((e) => Number(e.options.delay ?? 0)));
      const duracoes = new Set(entradas.map((e) => Number(e.options.duration ?? -1)));
      const props: string[] = [];
      let opacity: [string, string] | null = null;
      let transform: [string, string] | null = null;
      for (const entrada of entradas) {
        for (const chave of Object.keys(entrada.keyframes)) {
          props.push(chave);
          const [de, para] = entrada.keyframes[chave]!;
          if (chave === 'opacity') opacity = [String(de), String(para)];
          if (chave === 'transform') transform = [String(de), String(para)];
        }
      }
      return {
        delay: Number([...delays][0] ?? -1),
        duration: Number([...duracoes][0] ?? -1),
        props: [...new Set(props)],
        opacity,
        transform,
      };
    });
  }, ATRIBUTO_SONDA);
}

/** `true` nos projetos ≥ 1024 px (eixo horizontal, DV-11); `false` < 1024 px (eixo vertical). */
function ehDesktopOuTablet(page: Page): boolean {
  const largura = page.viewportSize()?.width ?? 0;
  return largura >= 1024;
}

const IDENTIDADE = new Set(['none', 'matrix(1, 0, 0, 1, 0, 0)']);

test.describe('A-05: Formação — linha do tempo, 800 ms, de cima para baixo', () => {
  test('scaleY 0→1 em 800 ms (±30 ms), transform-origin "center top", só transform', async ({
    page,
  }) => {
    await abrir(page);
    await page.locator('#formacao').scrollIntoViewIfNeeded();

    const linha = page.locator('#formacao [data-draw="y"]');
    await expect(linha).toHaveCount(1);
    await esperarDesenho(linha);

    const [m] = await medir(linha);
    expect(m).toBeDefined();
    expect(m!.duration).toBeGreaterThanOrEqual(800 - 30);
    expect(m!.duration).toBeLessThanOrEqual(800 + 30);
    expect(m!.delay).toBeGreaterThanOrEqual(0);
    expect(m!.delay).toBeLessThanOrEqual(30);
    expect(m!.props).toEqual(['transform']);
    expect(m!.transform).toEqual(['scaleY(0)', 'scaleY(1)']);

    const origem = await linha.evaluate((el) => (el as HTMLElement).style.transformOrigin);
    expect(origem).toBe('center top');

    // Ao final, a linha ocupa todo o comprimento: transform = none/identidade (sem escala residual).
    await expect
      .poll(
        async () => {
          const v = await linha.evaluate((el) => getComputedStyle(el).transform);
          return IDENTIDADE.has(v);
        },
        { timeout: 2_000 },
      )
      .toBe(true);
  });

  test('desenha uma vez: rolar para fora e para dentro de novo não dispara uma 2ª chamada', async ({
    page,
  }) => {
    await abrir(page);
    const linha = page.locator('#formacao [data-draw="y"]');
    await page.locator('#formacao').scrollIntoViewIfNeeded();
    await esperarDesenho(linha);
    const antes = await lerContagens(page);

    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForTimeout(100);
    await page.locator('#formacao').scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    expect(await lerContagens(page)).toEqual(antes);
  });
});

test.describe('A-05: Trilhas — 3 conectores em sequência, somando 800 ms', () => {
  test('cada trilha: conectores com atraso 0/267/533 ms (±30 ms), ~267 ms cada, eixo certo para a largura', async ({
    page,
  }) => {
    await abrir(page);
    await page.locator('#objetivos').scrollIntoViewIfNeeded();

    const desktop = ehDesktopOuTablet(page);
    const trilhas = page.locator('#objetivos [data-stagger="steps"]'); // mesma <ol> do A-03
    const total = await trilhas.count();
    expect(total).toBe(3); // Dados, Cibersegurança, IA (00-INDICE §3)

    for (let i = 0; i < total; i++) {
      const trilha = trilhas.nth(i);
      // No celular/tablet, as 3 trilhas empilham com bastante altura: rola cada uma individualmente
      // (mesmo achado já registrado no diário do A-03, `stagger.spec.ts`).
      await trilha.scrollIntoViewIfNeeded();

      const conectores = trilha.locator('[data-draw="trail"]');
      await expect(conectores).toHaveCount(3); // 4 etapas por trilha = 3 conectores
      await esperarDesenho(conectores.first());

      const medidas = await medir(conectores);
      expect(medidas).toHaveLength(3);

      const somaDuracoes = medidas.reduce((soma, m) => soma + m.duration, 0);
      expect(somaDuracoes).toBeGreaterThanOrEqual(800 - 30);
      expect(somaDuracoes).toBeLessThanOrEqual(800 + 30);

      const esperados = [0, 800 / 3, (2 * 800) / 3];
      medidas.forEach((m, indice) => {
        expect(m.delay).toBeGreaterThanOrEqual(esperados[indice]! - 30);
        expect(m.delay).toBeLessThanOrEqual(esperados[indice]! + 30);
        expect(m.props).toEqual(['transform']);
        if (desktop) {
          expect(m.transform).toEqual(['scaleX(0)', 'scaleX(1)']);
        } else {
          expect(m.transform).toEqual(['scaleY(0)', 'scaleY(1)']);
        }
      });

      const origens = await conectores.evaluateAll((els) =>
        els.map((el) => (el as HTMLElement).style.transformOrigin),
      );
      for (const origem of origens) {
        expect(origem).toBe(desktop ? 'left center' : 'center top');
      }
    }
  });

  test('ponta de seta: fade (só opacity) com atraso (i+1) × 267 ms — termina quando o conector dela termina', async ({
    page,
  }) => {
    await abrir(page);
    await page.locator('#objetivos').scrollIntoViewIfNeeded();

    const trilhas = page.locator('#objetivos [data-stagger="steps"]');
    const total = await trilhas.count();

    for (let i = 0; i < total; i++) {
      const trilha = trilhas.nth(i);
      await trilha.scrollIntoViewIfNeeded();
      const pontas = trilha.locator('[data-draw-tip]');
      await expect(pontas).toHaveCount(3);
      await esperarDesenho(pontas.first());

      const medidas = await medir(pontas);
      expect(medidas).toHaveLength(3);
      const esperados = [800 / 3, (2 * 800) / 3, 800];
      medidas.forEach((m, indice) => {
        expect(m.delay).toBeGreaterThanOrEqual(esperados[indice]! - 30);
        expect(m.delay).toBeLessThanOrEqual(esperados[indice]! + 30);
        expect(m.props).toEqual(['opacity']);
        expect(m.opacity).toEqual(['0', '1']);
        expect(m.transform).toBeNull();
      });
    }
  });

  test('cada trilha desenha uma vez: rolando a página inteira duas vezes, nenhum conector/ponta ganha chamada nova', async ({
    page,
  }) => {
    await abrir(page);
    const alturaTotal = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y <= alturaTotal; y += 400) {
      await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), y);
      await page.waitForTimeout(30);
    }
    await expect
      .poll(async () => Object.keys(await lerContagens(page)).length, { timeout: 5_000 })
      .toBeGreaterThan(0);
    const antes = await lerContagens(page);
    expect(Object.values(antes).every((n) => n > 0)).toBe(true);

    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForTimeout(200);
    for (let y = 0; y <= alturaTotal; y += 400) {
      await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), y);
      await page.waitForTimeout(30);
    }
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForTimeout(300);
    expect(await lerContagens(page)).toEqual(antes);
  });
});

test.describe('A-05: movimento reduzido (R4)', () => {
  test('linha da Formação e setas das trilhas já nascem inteiras, sem rolar', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await abrir(page);

    const estadoLinha = await page.evaluate(() => {
      const el = document.querySelector('[data-draw="y"]') as HTMLElement;
      const s = getComputedStyle(el);
      return { opacity: s.opacity, transform: s.transform };
    });
    expect(estadoLinha.opacity).toBe('1');
    expect(IDENTIDADE.has(estadoLinha.transform)).toBe(true);

    const estadosTrail = await page.evaluate(() => {
      const conectores = [...document.querySelectorAll('[data-draw="trail"]')] as HTMLElement[];
      return conectores.map((el) => {
        const s = getComputedStyle(el);
        return { opacity: s.opacity, transform: s.transform };
      });
    });
    expect(estadosTrail.length).toBeGreaterThan(0);
    for (const estado of estadosTrail) {
      expect(IDENTIDADE.has(estado.transform)).toBe(true);
    }

    const estadosSeta = await page.evaluate(() => {
      const setas = [...document.querySelectorAll('[data-draw-tip]')] as HTMLElement[];
      return setas.map((el) => getComputedStyle(el).opacity);
    });
    expect(estadosSeta.length).toBeGreaterThan(0);
    for (const opacidade of estadosSeta) {
      expect(opacidade).toBe('1');
    }
  });
});

test.describe('A-05: só opacity/transform (R1)', () => {
  test('nenhuma propriedade fora da lista em nenhuma chamada real de animate() do desenho de linha', async ({
    page,
  }) => {
    await abrir(page);
    await page.locator('#formacao').scrollIntoViewIfNeeded();
    const trilhas = page.locator('#objetivos [data-stagger="steps"]');
    await page.locator('#objetivos').scrollIntoViewIfNeeded();
    for (let i = 0; i < (await trilhas.count()); i++) {
      await trilhas.nth(i).scrollIntoViewIfNeeded();
    }

    await expect
      .poll(async () => Object.keys(await lerContagens(page)).length, { timeout: 5_000 })
      .toBeGreaterThan(0);

    const props = await page.evaluate(() => {
      const chamadas = (window as unknown as { __a05: Record<string, ChamadaCrua[]> }).__a05;
      return Object.values(chamadas).flatMap((lista) =>
        lista.flatMap((c) => Object.keys(c.keyframes)),
      );
    });
    expect(new Set(props).size).toBeGreaterThan(0);
    expect([...new Set(props)].every((p) => p === 'opacity' || p === 'transform')).toBe(true);
  });
});
