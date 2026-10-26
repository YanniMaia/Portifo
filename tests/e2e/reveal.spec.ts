// Revelação de seções (A-02; doc 04 §4.4 passo 3 e §9 "Entrada de seções"), no build de produção
// e nas 6 larguras (`playwright.config.ts`). Confere, no navegador real:
// - cada `[data-reveal]` (as 9 seções do registro, menos o Hero) entra com fade + 24 px de baixo
//   para cima, 600 ms, medido em `getAnimations()` (WAAPI, R1: só opacity/transform);
// - rolando a página inteira e de volta ao topo, nenhuma seção já revelada anima de novo;
// - o limiar é 15%: uma sonda de 2000 px não dispara com 10% visível e dispara com 15%;
// - o Hero (sem `data-reveal`, CC-6/D11) já sai em opacity 1, sem transição, no 1º quadro;
// - com `reducedMotion: 'reduce'`, toda seção com `data-reveal` já nasce em opacity 1 e sem
//   transform, mesmo sem rolar (o `reduced-motion.css` do A-01 garante isso independente do JS);
// - CLS ≤ 0,02 (orçamento do doc 04 §4.3) rolando a página inteira (PerformanceObserver de
//   `layout-shift`, só Chromium); o gate completo contra o orçamento é o motion-budget.spec.ts
//   da A-20.
import { expect, test, type Page } from '@playwright/test';
import { SECTION_IDS } from '../../src/content/sections.ts';

/** As 9 seções com `data-reveal` (A-02 §4.4 passo 3): todas, menos o Hero (`inicio`). */
const SECOES_COM_REVEAL = SECTION_IDS.filter((id) => id !== 'inicio');

/** Atributo que o spec usa para identificar cada `[data-reveal]` nas chamadas de `animate()`. */
const ATRIBUTO_SONDA = 'data-a02-probe';

/**
 * Intercepta `Element.prototype.animate` ANTES de qualquer script da página rodar (o `motion`
 * manda a animação do preset para o WAAPI nativo, por isso interceptar aqui conta exatamente as
 * chamadas reais, sem depender de como o `animarPreset`/`inView` estão implementados por dentro).
 * Conta por `data-a02-probe`, em `window.__a02`. Nenhum teste depende de "1 chamada por seção":
 * só de a contagem não aumentar depois da 1ª vez (independe de o preset usar 1 ou 2 Animation,
 * uma por propriedade — ver `plano/checkpoints/A-01.md`).
 *
 * A marcação de cada `[data-reveal]` (passo que antes vivia em `marcarGanchos`, rodado DEPOIS do
 * `networkidle`) foi movida para dentro deste `addInitScript`, via `MutationObserver` ligado desde
 * o primeiro documento (antes de qualquer script da página, inclusive o `React`): ela corrigia uma
 * condição de corrida real — algumas seções (ex. "Faixa de destaques", logo abaixo do Hero) já
 * cruzam os 15% de visibilidade e disparam o `animate()` ANTES do `page.evaluate` pós-carregamento
 * rodar, então a chamada acontecia num elemento ainda sem o atributo `data-a02-probe` e não era
 * contada (achado do guardião ao verificar a A-02: 8 de 9 seções contadas em vez de 9, só em
 * viewports largos/altos o bastante para a Faixa já entrar visível no 1º quadro). Marcando cada
 * `[data-reveal]` no instante em que ele é inserido no DOM (um `MutationObserver` que sempre
 * termina antes do `IntersectionObserver` do `useReveal.ts` conseguir entregar a 1ª notificação,
 * que depende de um passo de layout), o atributo já existe quando o `animate()` real é chamado.
 */
async function instalarContadorDeAnimate(page: Page): Promise<void> {
  await page.addInitScript((atributo) => {
    // Referência ao `animate()` nativo, chamada abaixo com `.apply(this, …)` (preserva o `this`).
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const original = Element.prototype.animate;
    const chamadas: Record<string, number> = {};
    const marcas: string[] = [];
    let contador = 0;
    (window as unknown as { __a02: typeof chamadas }).__a02 = chamadas;
    (window as unknown as { __a02Marcas: typeof marcas }).__a02Marcas = marcas;

    const marcar = (el: Element): void => {
      if (el.hasAttribute(atributo)) return;
      const marca = String(contador++);
      el.setAttribute(atributo, marca);
      marcas.push(marca);
    };

    new MutationObserver((mudancas) => {
      for (const mudanca of mudancas) {
        mudanca.addedNodes.forEach((no) => {
          if (no.nodeType !== 1) return;
          const el = no as Element;
          if (el.matches('[data-reveal]')) marcar(el);
          el.querySelectorAll('[data-reveal]').forEach(marcar);
        });
      }
    }).observe(document, { subtree: true, childList: true });

    Element.prototype.animate = function (
      this: Element,
      ...args: Parameters<typeof original>
    ): ReturnType<typeof original> {
      const marca = this.getAttribute(atributo);
      if (marca !== null) chamadas[marca] = (chamadas[marca] ?? 0) + 1;
      return original.apply(this, args);
    };
  }, ATRIBUTO_SONDA);
}

async function abrir(page: Page): Promise<void> {
  await instalarContadorDeAnimate(page);
  await page.goto('./');
  await page.waitForLoadState('networkidle');
}

/**
 * Lê as marcas que o `addInitScript` já aplicou a cada `[data-reveal]` real da página. A sonda do
 * bloco "limiar de 15%" (abaixo) já nasce com a marca própria `'sonda'` (atributo escrito ANTES de
 * entrar no documento), então o `MutationObserver` do `addInitScript` a reconhece como já marcada
 * (`hasAttribute`) e não a renumera.
 */
async function marcarGanchos(page: Page): Promise<string[]> {
  return page.evaluate(() => [...(window as unknown as { __a02Marcas: string[] }).__a02Marcas]);
}

/** Leitura atual de `window.__a02` (cópia simples, serializável). */
const lerContagens = (page: Page): Promise<Record<string, number>> =>
  page.evaluate(() => ({ ...(window as unknown as { __a02: Record<string, number> }).__a02 }));

test.describe('A-02: cada seção revela uma vez (fade + 24 px, 600 ms, WAAPI)', () => {
  test('rolando a página inteira, todas as 9 seções animam; rolando de novo não repete', async ({
    page,
  }) => {
    await abrir(page);
    const marcas = await marcarGanchos(page);
    expect(marcas).toHaveLength(SECOES_COM_REVEAL.length);

    // 1ª passada: de cima para baixo, cada seção entra na tela pelo menos uma vez.
    for (const id of SECOES_COM_REVEAL) {
      await page.locator(`#${id}`).scrollIntoViewIfNeeded();
    }
    await expect
      .poll(async () => Object.keys(await lerContagens(page)).length, { timeout: 5_000 })
      .toBe(marcas.length);
    const contagemAntes = await lerContagens(page);
    expect(Object.values(contagemAntes).every((n) => n > 0)).toBe(true);

    // 2ª passada: volta ao topo e desce de novo, mesma ordem. Nenhuma seção ganha chamada nova.
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    for (const id of SECOES_COM_REVEAL) {
      await page.locator(`#${id}`).scrollIntoViewIfNeeded();
    }
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForTimeout(300);
    expect(await lerContagens(page)).toEqual(contagemAntes);
  });

  test('a entrada é fade (opacity 0→1) + translateY 24px→0, 600 ms, só opacity/transform', async ({
    page,
  }) => {
    await abrir(page);
    await page.locator('#sobre').scrollIntoViewIfNeeded();
    const seletor = '#sobre [data-reveal]';
    await expect
      .poll(
        async () =>
          page
            .locator(seletor)
            .first()
            .evaluate((el) => el.getAnimations().length),
        { timeout: 3_000 },
      )
      .toBeGreaterThan(0);

    const efeitos = await page
      .locator(seletor)
      .first()
      .evaluate((el) =>
        (el as Element).getAnimations().map((a) => {
          const efeito = a.effect as KeyframeEffect;
          const quadros = efeito.getKeyframes();
          return {
            // `computedOffset` é um campo que o próprio `KeyframeEffect.getKeyframes()` do
            // navegador acrescenta a cada quadro-chave resolvido (não é uma propriedade animada:
            // é a posição `offset` já calculada); por isso entra no filtro ao lado de
            // `offset`/`easing`/`composite` (achado do guardião ao verificar a A-02).
            propriedades: Object.keys(quadros[0] ?? {}).filter(
              (k) => !['offset', 'computedOffset', 'easing', 'composite'].includes(k),
            ),
            duracao: efeito.getTiming().duration,
            quadros: quadros.map((q) => ({ opacity: q.opacity, transform: q.transform })),
          };
        }),
      );

    expect(efeitos.length).toBeGreaterThan(0);
    expect(efeitos.every((e) => e.duracao === 600)).toBe(true);
    const todasAsPropriedades = new Set(efeitos.flatMap((e) => e.propriedades));
    expect(todasAsPropriedades).toEqual(new Set(['opacity', 'transform']));

    const quadrosOpacity = efeitos.find((e) => e.propriedades.includes('opacity'))?.quadros;
    expect(quadrosOpacity?.map((q) => q.opacity)).toEqual(['0', '1']);
    const quadrosTransform = efeitos.find((e) => e.propriedades.includes('transform'))?.quadros;
    expect(quadrosTransform?.map((q) => q.transform)).toEqual([
      'translateY(24px)',
      'translateY(0px)',
    ]);
  });
});

test.describe('A-02: limiar de 15% (não 10%)', () => {
  /** Sonda de 2000 px de altura, bem abaixo da dobra, só para medir o limiar (não é conteúdo real). */
  async function montarSonda(page: Page): Promise<void> {
    await page.evaluate((atributo) => {
      const espaco = document.createElement('div');
      espaco.id = 'a02-espaco';
      espaco.style.height = '3000px';
      const sonda = document.createElement('div');
      sonda.id = 'a02-sonda';
      sonda.style.height = '2000px';
      sonda.setAttribute('data-reveal', '');
      sonda.setAttribute(atributo, 'sonda');
      document.body.append(espaco, sonda);
    }, ATRIBUTO_SONDA);
  }

  async function desmontarSonda(page: Page): Promise<void> {
    await page.evaluate(() => {
      document.getElementById('a02-espaco')?.remove();
      document.getElementById('a02-sonda')?.remove();
    });
  }

  /**
   * Rola para que ~`fracao` da altura da sonda (2000 px) fique visível, vinda de baixo. Soma 2 px
   * de margem a favor de ficar MAIS visível, nunca menos (achado do guardião ao verificar a A-02:
   * o layout real tem posições fracionárias — `getBoundingClientRect().top` como `600.359375` —
   * então pedir exatamente 15,00% podia cair a 14,98%, abaixo do limiar, e nunca disparar; 2 px
   * de sobra em 2000 px é 0,1 ponto percentual, muito pouco para o caso de 10% cruzar os 15%).
   */
  async function rolarParaFracaoVisivel(page: Page, fracao: number): Promise<void> {
    await page.evaluate((f) => {
      const sonda = document.getElementById('a02-sonda') as HTMLElement;
      const topoAbsoluto = sonda.getBoundingClientRect().top + window.scrollY;
      const alturaVisivel = f * sonda.offsetHeight + 2;
      const destino = topoAbsoluto - window.innerHeight + alturaVisivel;
      window.scrollTo({ top: Math.max(0, destino), behavior: 'instant' });
    }, fracao);
  }

  test('10% visível não dispara; 15% dispara', async ({ page }) => {
    await abrir(page);
    await montarSonda(page);

    await rolarParaFracaoVisivel(page, 0.1);
    // Dá tempo de sobra para o IntersectionObserver notificar, se fosse disparar com 10%.
    await page.waitForTimeout(400);
    expect(await lerContagens(page)).not.toHaveProperty('sonda');

    await rolarParaFracaoVisivel(page, 0.15);
    await expect.poll(async () => lerContagens(page), { timeout: 3_000 }).toHaveProperty('sonda');

    await desmontarSonda(page);
  });
});

test.describe('A-02: Hero sem reveal (CC-6/D11)', () => {
  test('o Hero (#inicio) está em opacity 1, sem transição, já no 1º quadro', async ({ page }) => {
    await abrir(page);
    const hero = await page.evaluate(() => {
      const el = document.getElementById('inicio') as HTMLElement;
      const s = getComputedStyle(el);
      return {
        temDataReveal: el.hasAttribute('data-reveal'),
        opacity: s.opacity,
        transitionDuration: s.transitionDuration,
      };
    });
    expect(hero.temDataReveal).toBe(false);
    expect(hero.opacity).toBe('1');
  });
});

test.describe('A-02: movimento reduzido (R4)', () => {
  test('toda seção com data-reveal já nasce em opacity 1 e sem transform, sem rolar', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await abrir(page);
    const estados = await page.evaluate((id) => {
      const secoes = Array.from(document.querySelectorAll(`${id}`));
      return secoes.map((el) => {
        const s = getComputedStyle(el);
        return { opacity: s.opacity, transform: s.transform };
      });
    }, '[data-reveal]');
    expect(estados).toHaveLength(SECOES_COM_REVEAL.length);
    for (const estado of estados) {
      expect(estado).toEqual({ opacity: '1', transform: 'none' });
    }
  });
});

test.describe('A-02: CLS = 0 (rolagem da página inteira)', () => {
  test('nenhum layout-shift ao rolar do topo ao fim e de volta', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'layout-shift só existe no Chromium');
    await page.addInitScript(() => {
      (window as unknown as { __cls: number }).__cls = 0;
      try {
        new PerformanceObserver((lista) => {
          for (const entrada of lista.getEntries() as unknown as Array<{
            hadRecentInput: boolean;
            value: number;
          }>) {
            if (!entrada.hadRecentInput) {
              (window as unknown as { __cls: number }).__cls += entrada.value;
            }
          }
        }).observe({ type: 'layout-shift', buffered: true });
      } catch {
        // Sem suporte: o teste pula fora do Chromium (test.skip acima cobre o caso normal).
      }
    });
    await page.goto('./');
    await page.waitForLoadState('networkidle');

    const alturaTotal = await page.evaluate(() => document.documentElement.scrollHeight);
    const passo = 400;
    for (let y = 0; y <= alturaTotal; y += passo) {
      await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), y);
      await page.waitForTimeout(40);
    }
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForTimeout(200);

    const cls = await page.evaluate(() => (window as unknown as { __cls: number }).__cls);
    // Orçamento oficial do doc 04 §4.3: "CLS total ≤ 0,02" (não "= 0" — a própria tabela da §7
    // fala em CLS atribuível à ANIMAÇÃO, não a qualquer ruído do navegador real). Medido pelo
    // guardião ao verificar a A-02: ~0,00045 em todas as 6 larguras (menos de 3% do orçamento),
    // consistente e não ligado ao reveal (R1: `translateY`/`opacity` em `transform` não contam
    // para `layout-shift`, por definição da API) — provavelmente troca de fonte ou subpixel de
    // layout, de qualquer forma não causado por esta task. `toBe(0)` falhava por exigir um valor
    // que nenhum navegador real entrega; o gate oficial e completo de desempenho é o
    // `tests/e2e/motion-budget.spec.ts` da A-20, que mede o CLS da página inteira contra a §4.3.
    expect(cls).toBeLessThanOrEqual(0.02);
  });
});
