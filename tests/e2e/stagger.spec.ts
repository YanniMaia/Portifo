// Cascatas (A-03; doc 04 §4.4 e §9 "Cascata de chips"/"Linhas da frase"/"Etapas das trilhas"), no
// build de produção e nas 6 larguras (`playwright.config.ts`). Confere, no navegador real:
// - chips (Habilidades): atraso 0, 40, 80… ms entre chips (±10 ms), 400 ms cada, só opacity;
// - linhas da frase (Motto): atraso 0, 150, 300 ms, 600 ms cada, fade + translateY 24 px — e que
//   o mesmo contêiner ter `data-reveal` (A-02) e `data-stagger="motto"` ao mesmo tempo não causa
//   nenhum "double fade" visível (opacidade nunca cai: produto de duas curvas monótonas 0→1
//   continua monótono) nem estado final errado;
// - etapas das trilhas (Onde quero chegar): atraso 0, 200, 400, 600 ms nas 3 trilhas, "acende"
//   opacity 0,35→1 + scale 0,96→1;
// - cada cascata dispara uma vez só (rolando a página inteira duas vezes, nenhum item ganha
//   chamada nova na 2ª passada);
// - com `reducedMotion: 'reduce'`, todo item já nasce em opacity 1 e sem transform, sem rolar;
// - nenhuma propriedade fora de opacity/transform é animada (R1).
//
// MEDIÇÃO: em vez de ler `Element.getAnimations()` depois do fato (que falha de forma intermitente
// — achado desta task: o chip de 400 ms já pode ter terminado e sido removido da lista pelo
// `motion`, que aplica `commitStyles()` + `cancel()` ao fim de cada animação, antes do Playwright
// conseguir medir), este spec intercepta `Element.prototype.animate` (mesmo padrão do
// `reveal.spec.ts`, A-02) e guarda os argumentos REAIS (`keyframes`, `options`) no instante exato
// da chamada — sem nenhuma corrida contra o fim da animação. Confirmado com uma sonda manual: o
// `motion` já entrega `delay`/`duration` em MILISSEGUNDOS ao `Element.prototype.animate()` nativo
// (as mesmas unidades do `KeyframeEffect.getTiming()`), então os números medidos aqui batem direto
// com os critérios de aceite (0/40/80…, 0/150/300, 0/200/400/600).
import { expect, test, type Locator, type Page } from '@playwright/test';

/** Atributo que o spec usa para identificar cada `[data-stagger-item]` nas chamadas de `animate()`. */
const ATRIBUTO_SONDA = 'data-a03-probe';

interface ChamadaCrua {
  keyframes: Record<string, [unknown, unknown]>;
  options: { delay?: number; duration?: number };
}

/**
 * Intercepta `Element.prototype.animate` ANTES de qualquer script da página: marca cada
 * `[data-stagger-item]` no instante em que é inserido no DOM (`MutationObserver` ligado desde o
 * 1º documento) e guarda, por marca, a lista de chamadas reais (`keyframes`+`options`) em
 * `window.__a03`. Uma marca pode ter mais de 1 chamada (preset com opacity+transform vira 2
 * `Animation` nativas por item, achado do A-01/A-02) — todas com o mesmo `delay`/`duration`.
 */
async function instalarSonda(page: Page): Promise<void> {
  await page.addInitScript((atributo) => {
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const original = Element.prototype.animate;
    const chamadas: Record<string, ChamadaCrua[]> = {};
    let contador = 0;
    (window as unknown as { __a03: typeof chamadas }).__a03 = chamadas;

    const marcar = (el: Element): void => {
      if (el.hasAttribute(atributo)) return;
      el.setAttribute(atributo, String(contador++));
    };

    new MutationObserver((mudancas) => {
      for (const mudanca of mudancas) {
        mudanca.addedNodes.forEach((no) => {
          if (no.nodeType !== 1) return;
          const el = no as Element;
          if (el.matches('[data-stagger-item]')) marcar(el);
          el.querySelectorAll('[data-stagger-item]').forEach(marcar);
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

/** Nº de chamadas registradas por marca (para o teste "uma vez só"). */
const lerContagens = (page: Page): Promise<Record<string, number>> =>
  page.evaluate(() => {
    const chamadas = (window as unknown as { __a03: Record<string, unknown[]> }).__a03;
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

/** Espera o 1º `[data-stagger-item]` de `container` ter pelo menos 1 chamada registrada. */
async function esperarCascata(container: Locator): Promise<void> {
  await expect
    .poll(
      async () =>
        container.evaluate((elContainer, atributo) => {
          const chamadas = (window as unknown as { __a03: Record<string, unknown[]> }).__a03;
          const primeiro = elContainer.querySelector(`[${'data-stagger-item'}]`);
          const marca = primeiro?.getAttribute(atributo) ?? null;
          return marca !== null ? (chamadas[marca]?.length ?? 0) : 0;
        }, ATRIBUTO_SONDA),
      { timeout: 3_000 },
    )
    .toBeGreaterThan(0);
}

/**
 * Para cada `[data-stagger-item]` descendente de `container`, lê as chamadas reais capturadas
 * pela sonda (nunca `getAnimations()` — ver o comentário do topo do arquivo) e resume em
 * `delay`/`duration`/propriedades/valores. As várias chamadas da mesma marca devem compartilhar
 * `delay`/`duration` (mesmo preset, mesmo atraso).
 */
async function medirCascata(container: Locator): Promise<TimingDoItem[]> {
  return container.evaluate((elContainer, atributo) => {
    const chamadas = (window as unknown as { __a03: Record<string, ChamadaCrua[]> }).__a03;
    const itens = [...elContainer.querySelectorAll('[data-stagger-item]')];
    return itens.map((el) => {
      const marca = el.getAttribute(atributo);
      const entradas = (marca !== null ? chamadas[marca] : undefined) ?? [];
      const delays = new Set(entradas.map((e) => Number(e.options.delay ?? -1)));
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

test.describe('A-03: cascata de chips (Habilidades) — 40 ms, 400 ms cada, só opacity', () => {
  test('cada cartão de categoria anima seus chips com atraso 0, 40, 80… ms (±10 ms)', async ({
    page,
  }) => {
    await abrir(page);
    await page.locator('#habilidades').scrollIntoViewIfNeeded();

    const cartoes = page.locator('#habilidades [data-stagger="chips"]');
    const total = await cartoes.count();
    expect(total).toBeGreaterThan(0);

    for (let i = 0; i < total; i++) {
      const cartao = cartoes.nth(i);
      // No celular/tablet, as categorias empilham: nem todas ficam a 15% visível só com o scroll
      // para #habilidades. Rola cada cartão individualmente (a medição não depende de velocidade,
      // já que captura a chamada de animate() no instante exato, não o estado de getAnimations()).
      await cartao.scrollIntoViewIfNeeded();
      await esperarCascata(cartao);
      const medidas = await medirCascata(cartao);
      expect(medidas.length).toBeGreaterThan(0);
      medidas.forEach((m, indice) => {
        expect(m.delay).toBeGreaterThanOrEqual(indice * 40 - 10);
        expect(m.delay).toBeLessThanOrEqual(indice * 40 + 10);
        expect(m.duration).toBe(400);
        expect(m.props).toEqual(['opacity']);
        expect(m.opacity).toEqual(['0', '1']);
        expect(m.transform).toBeNull();
      });
    }
  });
});

test.describe('A-03: linhas da frase (Motto) — 150 ms, 600 ms cada, convive com data-reveal', () => {
  test('as 3 linhas animam com atraso 0, 150, 300 ms; fade + translateY 24 px → 0', async ({
    page,
  }) => {
    await abrir(page);
    await page.locator('#frase').scrollIntoViewIfNeeded();

    const container = page.locator('#frase [data-stagger="motto"]');
    await esperarCascata(container);

    const medidas = await medirCascata(container);
    expect(medidas).toHaveLength(3);
    const esperados = [0, 150, 300];
    medidas.forEach((m, i) => {
      expect(m.delay).toBeGreaterThanOrEqual(esperados[i]! - 10);
      expect(m.delay).toBeLessThanOrEqual(esperados[i]! + 10);
      expect(m.duration).toBe(600);
      expect(new Set(m.props)).toEqual(new Set(['opacity', 'transform']));
      expect(m.opacity).toEqual(['0', '1']);
      expect(m.transform).toEqual(['translateY(24px)', 'translateY(0px)']);
    });
  });

  test('o contêiner também tem data-reveal; a cascata não causa flicker nem estado final errado', async ({
    page,
  }) => {
    await abrir(page);
    await page.locator('#frase').scrollIntoViewIfNeeded();

    const container = page.locator('#frase [data-reveal][data-stagger="motto"]');
    await expect(container).toHaveCount(1); // o mesmo elemento tem os dois atributos (A-02 cp)
    await esperarCascata(container);

    // A última linha (atraso 300 ms) é a que fica mais tempo em transição: amostra a opacidade
    // computada dela algumas vezes ao longo da janela de animação (300 ms de atraso + 600 ms de
    // duração = 900 ms) e confere que nunca CAI (produto de duas curvas monótonas 0→1 — a do
    // contêiner, do A-02, e a da própria linha — continua monótono: nenhuma "piscada").
    const ultimaLinha = container.locator('[data-stagger-item]').last();
    const opacidades: number[] = [];
    for (let i = 0; i < 6; i++) {
      if (i > 0) await page.waitForTimeout(150);
      const valor = await ultimaLinha.evaluate((el) => Number(getComputedStyle(el).opacity));
      opacidades.push(valor);
    }
    for (let i = 1; i < opacidades.length; i++) {
      expect(opacidades[i]!).toBeGreaterThanOrEqual(opacidades[i - 1]! - 0.001);
    }
    expect(opacidades.at(-1)).toBeCloseTo(1, 2);

    // Estado final: opacity 1 e SEM deslocamento residual no contêiner E em cada linha. O `motion`
    // deixa o valor final do quadro-chave (`translateY(0px)`) como estilo inline em vez de limpar
    // para `none` (fill: 'both', confirmado na sonda) — por isso o computed pode virar a matriz
    // identidade (`matrix(1, 0, 0, 1, 0, 0)`) em vez da string `none`; as duas são a mesma ausência
    // de deslocamento, então o teste aceita as duas.
    const IDENTIDADE = new Set(['none', 'matrix(1, 0, 0, 1, 0, 0)']);
    await page.waitForTimeout(200);
    const estados = await container.evaluate((c) => {
      const linhas = [...c.querySelectorAll('[data-stagger-item]')] as HTMLElement[];
      const ler = (el: Element) => ({
        opacity: getComputedStyle(el).opacity,
        transform: getComputedStyle(el).transform,
      });
      return { container: ler(c), linhas: linhas.map(ler) };
    });
    expect(estados.container.opacity).toBe('1');
    expect(IDENTIDADE.has(estados.container.transform)).toBe(true);
    for (const linha of estados.linhas) {
      expect(linha.opacity).toBe('1');
      expect(IDENTIDADE.has(linha.transform)).toBe(true);
    }
  });
});

test.describe('A-03: etapas das trilhas (Onde quero chegar) — 200 ms, acende opacity+scale', () => {
  test('as 3 trilhas animam suas etapas com atraso 0, 200, 400, 600 ms', async ({ page }) => {
    await abrir(page);
    await page.locator('#objetivos').scrollIntoViewIfNeeded();

    const trilhas = page.locator('#objetivos [data-stagger="steps"]');
    const total = await trilhas.count();
    expect(total).toBe(3); // Dados, Cibersegurança, IA (00-INDICE §3)

    for (let i = 0; i < total; i++) {
      const trilha = trilhas.nth(i);
      // No celular/tablet, as 3 trilhas empilham com bastante altura cada: nem todas ficam a 15%
      // visível só com o scroll para #objetivos. Rola cada trilha individualmente.
      await trilha.scrollIntoViewIfNeeded();
      await esperarCascata(trilha);
      const medidas = await medirCascata(trilha);
      expect(medidas).toHaveLength(4); // cada trilha tem 4 etapas (C-05/pt.ts, objetivos.*)
      const esperados = [0, 200, 400, 600];
      medidas.forEach((m, indice) => {
        expect(m.delay).toBeGreaterThanOrEqual(esperados[indice]! - 10);
        expect(m.delay).toBeLessThanOrEqual(esperados[indice]! + 10);
        expect(new Set(m.props)).toEqual(new Set(['opacity', 'transform']));
        expect(m.opacity).toEqual(['0.35', '1']);
        expect(m.transform).toEqual(['scale(0.96)', 'scale(1)']);
      });
    }
  });
});

test.describe('A-03: cada cascata dispara uma vez (rolando a página inteira duas vezes)', () => {
  test('nenhum [data-stagger-item] ganha chamada nova de animate() na 2ª passada', async ({
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
    const contagemAntes = await lerContagens(page);
    expect(Object.values(contagemAntes).every((n) => n > 0)).toBe(true);

    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForTimeout(200);
    for (let y = 0; y <= alturaTotal; y += 400) {
      await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), y);
      await page.waitForTimeout(30);
    }
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForTimeout(300);
    expect(await lerContagens(page)).toEqual(contagemAntes);
  });
});

test.describe('A-03: movimento reduzido (R4)', () => {
  test('todo [data-stagger-item] já nasce em opacity 1 e sem transform, sem rolar', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await abrir(page);
    const estados = await page.evaluate(() => {
      const itens = [...document.querySelectorAll('[data-stagger-item]')] as HTMLElement[];
      return itens.map((el) => {
        const s = getComputedStyle(el);
        return { opacity: s.opacity, transform: s.transform };
      });
    });
    expect(estados.length).toBeGreaterThan(0);
    for (const estado of estados) {
      expect(estado).toEqual({ opacity: '1', transform: 'none' });
    }
  });
});

test.describe('A-03: só opacity/transform (R1)', () => {
  test('nenhuma propriedade fora da lista em nenhuma chamada real de animate()', async ({
    page,
  }) => {
    await abrir(page);
    for (const id of ['#habilidades', '#frase', '#objetivos']) {
      await page.locator(id).scrollIntoViewIfNeeded();
    }
    // As 3 trilhas e as categorias de chips empilhadas podem exigir rolagem individual (ver testes
    // acima); aqui só precisamos de AO MENOS algumas chamadas reais para varrer as propriedades.
    const trilhas = page.locator('#objetivos [data-stagger="steps"]');
    for (let i = 0; i < (await trilhas.count()); i++) await trilhas.nth(i).scrollIntoViewIfNeeded();
    const cartoes = page.locator('#habilidades [data-stagger="chips"]');
    for (let i = 0; i < (await cartoes.count()); i++) await cartoes.nth(i).scrollIntoViewIfNeeded();

    await expect
      .poll(async () => Object.keys(await lerContagens(page)).length, { timeout: 5_000 })
      .toBeGreaterThan(0);

    const props = await page.evaluate(() => {
      const chamadas = (window as unknown as { __a03: Record<string, ChamadaCrua[]> }).__a03;
      return Object.values(chamadas).flatMap((lista) =>
        lista.flatMap((c) => Object.keys(c.keyframes)),
      );
    });
    expect(new Set(props).size).toBeGreaterThan(0);
    expect([...new Set(props)].every((p) => p === 'opacity' || p === 'transform')).toBe(true);
  });
});
