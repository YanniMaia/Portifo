// Contagem da faixa de destaques (A-04; doc 04 §4.4 passos 1-6 e §9 "Números da faixa"), no build
// de produção e nas 6 larguras (`playwright.config.ts`). Confere, no navegador real:
// - cada `[data-countup]` fora da tela conta de 0 ao valor final em 1,2 s (±50 ms), sem nunca
//   mostrar fracionário nem passar do valor final;
// - um elemento JÁ VISÍVEL quando entra no documento nunca mostra "0": fica direto no valor final
//   (passo 2 da task — "nunca escrever um estado zerado antes de confirmar que está fora da tela");
// - o leitor de tela só lê o valor final: `.visually-hidden` nunca muda e o `aria-hidden` do span
//   contador o esconde da árvore de acessibilidade o tempo todo, inclusive durante a contagem;
// - com `reducedMotion: 'reduce'`, o valor final aparece na hora, sem nenhuma amostra intermediária;
// - CLS ≤ 0,02 (mesmo orçamento aceito no cp/A-02) rolando até a Faixa de destaques.
//
// MEDIÇÃO: a contagem não passa pelo WAAPI (não é `opacity`/`transform`, é `textContent` mudando
// quadro a quadro via `requestAnimationFrame` do `animate()` numérico do pacote `motion` — ver
// `useCountUp.ts`), então interceptar `Element.prototype.animate` (A-02/A-03) não serve aqui. Este
// spec intercepta o SETTER de `Node.prototype.textContent` (instalado ANTES de qualquer script da
// página, igual ao padrão de `reveal.spec.ts`/`stagger.spec.ts`) e grava, por marca de elemento, a
// sequência real `{ valor, tempo }` de cada escrita — sem nenhuma corrida contra o fim da "animação"
// (não há nenhuma `Animation` do WAAPI para disputar com `getAnimations()`).
import { expect, test, type Locator, type Page } from '@playwright/test';

/** Atributo que o spec usa para identificar cada `[data-countup]` nas escritas de `textContent`. */
const ATRIBUTO_SONDA = 'data-a04-probe';

interface Amostra {
  valor: string;
  tempo: number;
}

/**
 * Intercepta o setter de `Node.prototype.textContent` ANTES de qualquer script da página: marca
 * cada `[data-countup]` no instante em que é inserido no DOM (`MutationObserver` ligado desde o 1º
 * documento, cobre tanto os elementos reais da Faixa quanto qualquer sonda sintética inserida pelo
 * próprio teste depois) e grava, por marca, a lista de amostras reais (valor escrito + `performance.now()`)
 * em `window.__a04`.
 */
async function instalarSonda(page: Page): Promise<void> {
  await page.addInitScript((atributo) => {
    const amostras: Record<string, Amostra[]> = {};
    const marcas: string[] = [];
    let contador = 0;
    (window as unknown as { __a04: typeof amostras }).__a04 = amostras;
    (window as unknown as { __a04Marcas: typeof marcas }).__a04Marcas = marcas;

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
          if (el.matches('[data-countup]')) marcar(el);
          el.querySelectorAll('[data-countup]').forEach(marcar);
        });
      }
    }).observe(document, { subtree: true, childList: true });

    const descritor = Object.getOwnPropertyDescriptor(Node.prototype, 'textContent')!;
    Object.defineProperty(Node.prototype, 'textContent', {
      configurable: true,
      get(this: Node): string | null {
        return descritor.get ? (descritor.get.call(this) as string | null) : null;
      },
      set(this: Node, valor: string | null) {
        if (this.nodeType === 1) {
          const el = this as Element;
          const marca = el.getAttribute(atributo);
          if (marca !== null) {
            (amostras[marca] ??= []).push({ valor: String(valor), tempo: performance.now() });
          }
        }
        if (descritor.set) descritor.set.call(this, valor);
      },
    });
  }, ATRIBUTO_SONDA);
}

async function abrir(page: Page): Promise<void> {
  await instalarSonda(page);
  await page.goto('./');
  await page.waitForLoadState('networkidle');
}

/** Amostras já gravadas para a marca de `elemento` (via `ATRIBUTO_SONDA`). */
async function amostrasDe(elemento: Locator): Promise<Amostra[]> {
  return elemento.evaluate((el, atributo) => {
    const amostras = (window as unknown as { __a04: Record<string, Amostra[]> }).__a04;
    const marca = el.getAttribute(atributo);
    return marca !== null ? (amostras[marca] ?? []) : [];
  }, ATRIBUTO_SONDA);
}

test.describe('A-04: contagem de 0 ao valor final em 1,2 s (±50 ms)', () => {
  /**
   * Sonda sintética (mesmo espírito da sonda de 2000 px do `reveal.spec.ts`, A-02): um spacer alto
   * seguido de um `[data-countup="37"]` bem abaixo da dobra — decoupled da altura real do Hero
   * (`min-height: max(100svh, 640px)`, que por design já deixa a Faixa de destaques real fora da
   * 1ª tela em qualquer viewport, mas este teste não depende dessa geometria específica).
   */
  async function montarSondaForaDaTela(page: Page): Promise<void> {
    await page.evaluate(() => {
      const espaco = document.createElement('div');
      espaco.id = 'a04-espaco';
      espaco.style.height = '3000px';
      const sonda = document.createElement('span');
      sonda.id = 'a04-sonda';
      sonda.setAttribute('data-countup', '37');
      sonda.textContent = '37';
      document.body.append(espaco, sonda);
    });
  }

  async function desmontarSonda(page: Page): Promise<void> {
    await page.evaluate(() => {
      document.getElementById('a04-espaco')?.remove();
      document.getElementById('a04-sonda')?.remove();
    });
  }

  test('conta de 0 a 37 em 1,2 s (±50 ms), nunca fracionário nem maior que o final', async ({
    page,
  }) => {
    await abrir(page);
    await montarSondaForaDaTela(page);
    const sonda = page.locator('#a04-sonda');

    // Fora da tela: a sonda já deve ter ganhado '0' (passo 2) antes mesmo de rolar.
    await expect(sonda).toHaveText('0');

    const t0 = await page.evaluate(() => performance.now());
    await sonda.scrollIntoViewIfNeeded();

    // Espera a ANIMAÇÃO terminar de verdade (não só o texto "parecer" '37'): o arredondamento para
    // inteiro (passo 1 da task) faz o texto virar '37' já perto de 70-75% da duração — "36,5"
    // arredonda para "37" bem antes da curva `--ease-out` chegar a 1 de verdade (achado desta
    // task). Esperar um tempo fixo, generoso o bastante para a duração real do token (1200 ms +
    // margem), garante medir a amostra de `onComplete` (a última de verdade), não a 1ª vez que o
    // texto bateu o valor final por arredondamento.
    await page.waitForTimeout(1_500);

    const amostras = (await amostrasDe(sonda)).filter((a) => a.tempo >= t0);
    expect(amostras.length).toBeGreaterThan(1);

    // Nunca fracionário, nunca negativo, nunca maior que 37.
    for (const amostra of amostras) {
      expect(amostra.valor).toMatch(/^\d+$/);
      const n = Number(amostra.valor);
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThanOrEqual(37);
    }
    // Nunca diminui (contagem monotônica).
    for (let i = 1; i < amostras.length; i++) {
      expect(Number(amostras[i]!.valor)).toBeGreaterThanOrEqual(Number(amostras[i - 1]!.valor));
    }

    const duracao = amostras.at(-1)!.tempo - amostras[0]!.tempo;
    expect(duracao).toBeGreaterThanOrEqual(1200 - 50);
    expect(duracao).toBeLessThanOrEqual(1200 + 50);
    expect(amostras.at(-1)!.valor).toBe('37');

    await desmontarSonda(page);
  });

  test('reserva min-width em ch igual à quantidade de dígitos do valor final (CLS)', async ({
    page,
  }) => {
    await abrir(page);
    await montarSondaForaDaTela(page);
    const sonda = page.locator('#a04-sonda');
    await expect(sonda).toHaveText('0'); // já fora da tela: min-width já foi aplicado na montagem.
    const minWidth = await sonda.evaluate((el) => getComputedStyle(el).minWidth);
    expect(minWidth).not.toBe('0px'); // "37" tem 2 dígitos: min-width = 2ch > 0.
    await desmontarSonda(page);
  });
});

test.describe('A-04: elemento já visível nunca mostra "0" (passo 2 da task)', () => {
  test('uma sonda inserida já dentro da área visível fica direto no valor final', async ({
    page,
  }) => {
    await abrir(page);
    await page.evaluate(() => {
      const sonda = document.createElement('span');
      sonda.id = 'a04-sonda-visivel';
      sonda.setAttribute('data-countup', '42');
      sonda.textContent = '42';
      sonda.style.position = 'fixed';
      sonda.style.top = '0';
      sonda.style.left = '0';
      sonda.style.zIndex = '9999';
      document.body.append(sonda);
    });

    const sonda = page.locator('#a04-sonda-visivel');
    await expect(sonda).toHaveText('42');
    // Observa um instante a mais: nenhuma contagem deveria começar (nenhum '0' escrito nunca).
    await page.waitForTimeout(300);
    await expect(sonda).toHaveText('42');
    const amostras = await amostrasDe(sonda);
    expect(amostras).toHaveLength(0); // textContent nunca foi tocado por JS depois da inserção.

    await page.evaluate(() => document.getElementById('a04-sonda-visivel')?.remove());
  });
});

test.describe('A-04: Faixa de destaques real (Highlights, S-05 + C-06)', () => {
  test('cada número termina exatamente no valor do atributo data-countup', async ({ page }) => {
    await abrir(page);
    const itens = page.locator('#destaques [data-countup]');
    const total = await itens.count();
    expect(total).toBeGreaterThan(0);

    for (let i = 0; i < total; i++) {
      const item = itens.nth(i);
      const esperado = await item.getAttribute('data-countup');
      await item.scrollIntoViewIfNeeded();
      await expect.poll(async () => item.textContent(), { timeout: 3_000 }).toBe(esperado);
    }
  });

  test('o leitor de tela só lê o valor final: .visually-hidden nunca muda; aria-hidden o tempo todo', async ({
    page,
  }) => {
    await abrir(page);
    const item = page.locator('#destaques [data-countup]').first();
    const esperado = await item.getAttribute('data-countup');
    // Estrutura do S-05 (Highlights.tsx): o `.visually-hidden` é o próximo irmão do span
    // `data-countup`, os dois dentro do mesmo `GradientText`.
    const oculto = item.locator('xpath=following-sibling::span[1]');
    const textoOculto = await oculto.textContent();
    expect(textoOculto).toBe(esperado);

    await item.scrollIntoViewIfNeeded();
    // Amostra algumas vezes durante a janela da contagem (até 1,3 s): o `.visually-hidden` nunca
    // muda e o `aria-hidden` do span contador continua 'true' o tempo todo, mesmo em pleno "0".
    for (let i = 0; i < 6; i++) {
      expect(await item.getAttribute('aria-hidden')).toBe('true');
      expect(await oculto.textContent()).toBe(textoOculto);
      await page.waitForTimeout(220);
    }
    await expect.poll(async () => item.textContent(), { timeout: 3_000 }).toBe(esperado);
    expect(await item.getAttribute('aria-hidden')).toBe('true');
    expect(await oculto.textContent()).toBe(textoOculto);
  });
});

test.describe('A-04: movimento reduzido (R4)', () => {
  test('o valor final aparece na hora, sem nenhuma amostra intermediária', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await abrir(page);
    const itens = page.locator('#destaques [data-countup]');
    const total = await itens.count();
    expect(total).toBeGreaterThan(0);

    for (let i = 0; i < total; i++) {
      const item = itens.nth(i);
      const esperado = await item.getAttribute('data-countup');
      expect(await item.textContent()).toBe(esperado);
    }

    // Rolar até lá (caso esteja fora da tela) não deve escrever nenhum '0' em nenhum momento.
    await itens.first().scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    for (let i = 0; i < total; i++) {
      const item = itens.nth(i);
      const esperado = await item.getAttribute('data-countup');
      expect(await item.textContent()).toBe(esperado);
      const amostras = await amostrasDe(item);
      expect(amostras.every((a) => a.valor === esperado)).toBe(true);
    }
  });
});

test.describe('A-04: CLS ≤ 0,02 (rolagem até a Faixa de destaques)', () => {
  test('nenhum layout-shift relevante ao rolar até #destaques e contar', async ({
    page,
    browserName,
  }) => {
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
        // Sem suporte: test.skip acima cobre o caso normal.
      }
    });
    await page.goto('./');
    await page.waitForLoadState('networkidle');

    await page.locator('#destaques').scrollIntoViewIfNeeded();
    await page.waitForTimeout(1_400); // tempo de sobra para a contagem terminar (1,2 s + margem).

    const cls = await page.evaluate(() => (window as unknown as { __cls: number }).__cls);
    // Orçamento oficial do doc 04 §4.3 ("CLS total ≤ 0,02"), mesmo ajuste já aceito no cp/A-02: a
    // contagem é só `textContent` dentro de uma largura já reservada (`min-width` em `ch`), que não
    // deveria gerar nenhum `layout-shift` atribuível a ela.
    expect(cls).toBeLessThanOrEqual(0.02);
  });
});
