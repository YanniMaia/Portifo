// /__styleguide (DS-05; doc 02 §1 item 4). Roda só no projeto `styleguide` do playwright.config.ts
// (servidor `dev`, porta 5173): o styleguide não existe no build de produção.
// Confere: abertura sem erros de console, o atalho sem a base, a tabela §4.1 inteira com o valor
// computado igual ao da tabela nos 2 temas, tipografia, espaçamento, foco por Tab, "forçar
// movimento reduzido", descoberta de demos e rolagem horizontal. Salva screenshots dos 2 temas ×
// 3 larguras (390, 768, 1280) em test-results/styleguide/.
import { readdirSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { expect, test, type Page } from '@playwright/test';

type Tema = 'light' | 'dark';

const CAMINHO = '__styleguide';

/** Tabela §4.1 do doc 02 (fonte independente do colors.css): token → [claro, escuro]. */
const TABELA_4_1: Record<string, [string, string]> = {
  '--color-bg': ['#FFFFFF', '#150A10'],
  '--color-bg-alt': ['#FFF7FA', '#1C0E16'],
  '--color-bg-tint': ['#FFEEF4', '#1C0E16'],
  '--color-surface': ['#FFFFFF', '#251320'],
  '--color-fill-soft': ['#FFEEF4', 'rgba(245, 143, 184, 0.12)'],
  '--color-chip-bg': ['#FFF7FA', '#1C0E16'],
  '--color-chip-bg-hover': ['#FFEEF4', 'rgba(245, 143, 184, 0.12)'],
  '--color-border': ['#F9D5E3', '#3B2030'],
  '--color-border-hover': ['#F286B0', 'rgba(245, 143, 184, 0.60)'],
  '--color-text': ['#2B1620', '#FDF0F5'],
  '--color-text-secondary': ['#6E4B5C', '#D8B4C4'],
  '--color-text-muted': ['#8C6A7A', '#A98496'],
  '--color-accent': ['#E0518A', '#F58FB8'],
  '--color-link': ['#C93A77', '#FFB3D1'],
  '--color-text-pink-on-tint': ['#A82560', '#FFB3D1'],
  '--color-eyebrow': ['#C93A77', '#FFB3D1'],
  '--color-eyebrow-on-tint': ['#A82560', '#FFB3D1'],
  '--color-primary': ['#C93A77', '#F58FB8'],
  '--color-primary-hover': ['#A82560', '#F06CA3'],
  '--color-on-primary': ['#FFFFFF', '#2A0A1A'],
  '--color-on-brand': ['#FFFFFF', '#FFFFFF'],
  '--color-secondary-border': ['#F286B0', 'rgba(245, 143, 184, 0.60)'],
  '--color-secondary-text': ['#A82560', '#FFB3D1'],
  '--color-focus': ['#E0518A', '#F58FB8'],
  '--color-skip-bg': ['#C93A77', '#C93A77'],
  '--color-skip-text': ['#FFFFFF', '#FFFFFF'],
  '--color-theme-icon': ['#C93A77', '#F58FB8'],
  '--glass-bg': ['rgba(255, 255, 255, 0.65)', 'rgba(255, 255, 255, 0.05)'],
  '--glass-border': ['#F9D5E3', 'rgba(255, 179, 209, 0.16)'],
  '--glass-blur': ['16px', '16px'],
  '--glass-bg-fallback': ['rgba(255, 255, 255, 0.92)', 'rgba(37, 19, 32, 0.92)'],
  '--header-bg': ['rgba(255, 255, 255, 0.80)', 'rgba(21, 10, 16, 0.75)'],
  '--header-blur': ['14px', '14px'],
  '--header-border': ['#F9D5E3', '#3B2030'],
  '--mobile-menu-bg': ['rgba(255, 255, 255, 0.96)', 'rgba(21, 10, 16, 0.96)'],
  '--control-bg': ['rgba(255, 255, 255, 0.60)', 'rgba(255, 255, 255, 0.05)'],
  '--control-border': ['#F9D5E3', 'rgba(255, 179, 209, 0.16)'],
  '--gradient-text': [
    'linear-gradient(135deg, #E0518A, #A82560)',
    'linear-gradient(135deg, #FFB3D1, #F06CA3)',
  ],
  '--gradient-primary': [
    'linear-gradient(135deg, #C93A77, #A82560)',
    'linear-gradient(135deg, #F58FB8, #F06CA3)',
  ],
  '--gradient-brand': [
    'linear-gradient(135deg, #E0518A, #A82560)',
    'linear-gradient(135deg, #E0518A, #A82560)',
  ],
  '--hero-glow-1': [
    'radial-gradient(circle 320px at 100% 0%, rgba(255, 220, 233, 0.70), transparent)',
    'radial-gradient(circle 320px at 100% 0%, rgba(74, 26, 51, 0.55), transparent)',
  ],
  '--hero-glow-2': [
    'radial-gradient(circle 240px at 0% 100%, #FFEEF4, transparent)',
    'radial-gradient(circle 240px at 0% 100%, rgba(42, 16, 32, 0.40), transparent)',
  ],
  '--gradient-contact': [
    'linear-gradient(160deg, #FFEEF4, #FFFFFF)',
    'linear-gradient(160deg, #2A1422, #1C0E16)',
  ],
  '--gradient-timeline': [
    'linear-gradient(180deg, #F286B0, #F7B7D0, transparent)',
    'linear-gradient(180deg, #F58FB8, #3B2030)',
  ],
  '--shadow-card': ['0 8px 28px rgba(201, 58, 119, 0.08)', '0 8px 28px rgba(0, 0, 0, 0.35)'],
  '--shadow-card-hover': [
    '0 16px 40px rgba(201, 58, 119, 0.16)',
    '0 16px 40px rgba(245, 143, 184, 0.14)',
  ],
  '--shadow-header': ['0 4px 20px rgba(201, 58, 119, 0.08)', '0 4px 20px rgba(0, 0, 0, 0.35)'],
  '--glow-deco': ['rgba(242, 134, 176, 0.25)', 'rgba(240, 108, 163, 0.18)'],
  '--color-deco-soft': ['#F7B7D0', 'rgba(240, 108, 163, 0.40)'],
  '--color-deco': ['#F286B0', '#F06CA3'],
  '--deco-grid-line': ['rgba(249, 213, 227, 0.35)', 'rgba(255, 255, 255, 0.05)'],
  '--deco-particle': ['#F7B7D0', '#F06CA3'],
  '--deco-network-line': ['rgba(247, 183, 208, 0.60)', 'rgba(240, 108, 163, 0.40)'],
  '--deco-code': ['rgba(224, 81, 138, 0.12)', 'rgba(245, 143, 184, 0.12)'],
  '--deco-bits': ['rgba(242, 134, 176, 0.20)', 'rgba(240, 108, 163, 0.20)'],
  '--deco-watermark': ['rgba(249, 213, 227, 0.50)', 'rgba(59, 32, 48, 0.50)'],
  '--deco-shape-stroke': ['#F7B7D0', '#3B2030'],
};

/** Mesma forma canônica do tests/unit/styles/colors.test.ts (minúsculas, sem zeros à direita). */
function normalizar(valor: string): string {
  return valor
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/\s*([(),])\s*/g, '$1')
    .replace(/(\d\.\d*?)0+\b/g, '$1')
    .replace(/\.(?=\D|$)/g, '')
    .trim();
}

function faixaDe(largura: number): string {
  if (largura >= 1440) return 'grande';
  if (largura >= 1024) return 'desktop';
  if (largura >= 640) return 'tablet';
  return 'celular';
}

/** `ButtonLink` → `button-link` (mesma regra do dados.ts, reescrita aqui de forma independente). */
function kebab(nome: string): string {
  return nome
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();
}

function demosNoDisco(): string[] {
  const pasta = resolve(process.cwd(), 'src/components');
  return readdirSync(pasta, { recursive: true, encoding: 'utf8' })
    .filter((f) => f.endsWith('.demo.tsx'))
    .map((f) => kebab(basename(f, '.demo.tsx')))
    .sort();
}

async function abrir(page: Page, caminho = CAMINHO): Promise<void> {
  await page.goto(caminho);
  await expect(page.locator('[data-styleguide]')).toBeVisible();
  await expect(page.locator('#sg-cores output[data-token="--color-bg"]')).toHaveAttribute(
    'data-computado',
    /.+/,
  );
}

/** Troca o tema pelo botão da barra (useTheme) e espera a transição de 300 ms acabar. */
async function usarTema(page: Page, tema: Tema): Promise<void> {
  const atual = await page.evaluate(() => document.documentElement.dataset.theme);
  if (atual !== tema) {
    await page.locator('[data-controle="tema"]').click();
  }
  await expect(page.locator('html')).toHaveAttribute('data-theme', tema);
  await expect(page.locator(`[data-styleguide][data-tema="${tema}"]`)).toBeVisible();
  await expect(page.locator('html')).not.toHaveClass(/theme-transition/);
}

test.describe('styleguide (DS-05)', () => {
  test('abre sem erros no console, também pelo atalho sem a base', async ({ page, baseURL }) => {
    const erros: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') erros.push(msg.text());
    });
    page.on('pageerror', (erro) => erros.push(erro.message));

    // Critério: http://localhost:5173/__styleguide (o Vite redireciona para <base>__styleguide).
    const atalho = new URL('/__styleguide', baseURL).href;
    expect(atalho).toBe('http://localhost:5173/__styleguide');
    await abrir(page, atalho);
    expect(new URL(page.url()).pathname).toMatch(/\/__styleguide$/);

    await usarTema(page, 'dark');
    await usarTema(page, 'light');
    await page.locator('[data-controle="idioma"]').click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await page.locator('[data-controle="idioma"]').click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');

    expect(erros).toEqual([]);
  });

  for (const tema of ['light', 'dark'] as const) {
    test(`§4.1 inteira com o valor computado da tabela (${tema})`, async ({ page }) => {
      await abrir(page);
      await usarTema(page, tema);
      const indice = tema === 'light' ? 0 : 1;

      // Todas as linhas da tabela, e nada além delas.
      const linhas = await page
        .locator('#sg-cores tr[data-linha-token]')
        .evaluateAll((trs) => trs.map((tr) => (tr as HTMLElement).dataset.linhaToken ?? ''));
      expect([...linhas].sort()).toEqual(Object.keys(TABELA_4_1).sort());

      // Colunas "claro" e "escuro" = valores da tabela.
      const colunas = await page.locator('#sg-cores tr[data-linha-token]').evaluateAll((trs) =>
        trs.map((tr) => {
          const el = tr as HTMLElement;
          return {
            token: el.dataset.linhaToken ?? '',
            claro: el.querySelector<HTMLElement>('[data-valor-claro]')?.dataset.valorClaro ?? '',
            escuro: el.querySelector<HTMLElement>('[data-valor-escuro]')?.dataset.valorEscuro ?? '',
          };
        }),
      );
      for (const { token, claro, escuro } of colunas) {
        const [eClaro, eEscuro] = TABELA_4_1[token] ?? ['', ''];
        expect({ token, claro: normalizar(claro) }).toEqual({ token, claro: normalizar(eClaro) });
        expect({ token, escuro: normalizar(escuro) }).toEqual({
          token,
          escuro: normalizar(eEscuro),
        });
      }

      // Valor computado exibido = o navegador aplicando o valor LITERAL da tabela na mesma
      // propriedade (mesma serialização: hex → rgb(), `transparent` → rgba(0, 0, 0, 0) etc.).
      const esperado = Object.fromEntries(
        Object.entries(TABELA_4_1).map(([token, valores]) => [token, valores[indice] ?? '']),
      );
      const comparacao = await page.evaluate((tabela) => {
        const sonda = document.createElement('div');
        sonda.style.setProperty('transition', 'none', 'important');
        sonda.style.setProperty('display', 'none');
        document.body.append(sonda);
        const resultado = Object.entries(tabela).map(([token, literal]) => {
          const saida = document.querySelector<HTMLElement>(
            `#sg-cores tr[data-linha-token="${token}"] output[data-token]`,
          );
          const medida = saida?.dataset.medida ?? '';
          let doLiteral = literal.trim();
          if (medida !== 'valor') {
            sonda.style.setProperty(medida, literal);
            doLiteral = getComputedStyle(sonda).getPropertyValue(medida).trim();
            sonda.style.removeProperty(medida);
          }
          return { token, medida, exibido: saida?.dataset.computado ?? '', esperado: doLiteral };
        });
        sonda.remove();
        return resultado;
      }, esperado);

      expect(comparacao).toHaveLength(Object.keys(TABELA_4_1).length);
      for (const { token, medida, exibido, esperado: valor } of comparacao) {
        expect(medida, token).not.toBe('');
        expect({ token, exibido }).toEqual({ token, exibido: valor });
      }
      // Amostra fixa, para o relatório não depender só da sonda.
      const bg = comparacao.find((c) => c.token === '--color-bg')?.exibido;
      expect(bg).toBe(tema === 'light' ? 'rgb(255, 255, 255)' : 'rgb(21, 10, 16)');
      test.info().annotations.push({
        type: `DS-05 §4.1 (${tema})`,
        description: `${comparacao.length} tokens conferidos`,
      });
    });
  }

  test('2 temas × 3 larguras: screenshots, faixa correta e sem rolagem horizontal', async ({
    page,
  }) => {
    await abrir(page);
    for (const tema of ['light', 'dark'] as const) {
      await usarTema(page, tema);
      for (const largura of [390, 768, 1280]) {
        await page.setViewportSize({ width: largura, height: 900 });
        const indicador = page.locator('[data-largura]');
        await expect(indicador).toHaveAttribute('data-largura', String(largura));
        await expect(indicador).toHaveAttribute('data-faixa', faixaDe(largura));
        const { scrollWidth, clientWidth } = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
        }));
        expect({ largura, scrollWidth }).toEqual({ largura, scrollWidth: clientWidth });
        await page.screenshot({
          path: `test-results/styleguide/styleguide-${tema}-${largura}.png`,
          fullPage: true,
        });
      }
    }
  });

  test('sem rolagem horizontal em 360 px (2 temas)', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await abrir(page);
    for (const tema of ['light', 'dark'] as const) {
      await usarTema(page, tema);
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(scrollWidth).toBe(360);
    }
  });

  test('tipografia: cada .t-* com a frase e o tamanho computado da faixa', async ({ page }) => {
    const tamanhosH1: Record<number, string> = { 390: '40px', 768: '52px', 1280: '68px' };
    await abrir(page);
    for (const [largura, h1] of Object.entries(tamanhosH1)) {
      await page.setViewportSize({ width: Number(largura), height: 900 });
      await expect(page.locator('[data-largura]')).toHaveAttribute('data-largura', largura);
      const itens = await page.locator('#sg-tipografia li[data-classe]').evaluateAll((lis) =>
        lis.map((li) => {
          const el = li as HTMLElement;
          const amostra = el.querySelector<HTMLElement>('p');
          const saida = el.querySelector<HTMLElement>('output');
          return {
            classe: el.dataset.classe ?? '',
            frase: amostra?.textContent ?? '',
            tamanhoReal: amostra ? getComputedStyle(amostra).fontSize : '',
            exibido: saida?.dataset.computado ?? '',
          };
        }),
      );
      expect(itens.map((i) => i.classe)).toEqual([
        't-h1',
        't-h2',
        't-h3',
        't-hero-sub',
        't-body',
        't-lead',
        't-caption',
        't-eyebrow',
        't-mono',
      ]);
      for (const item of itens) {
        expect(item.frase).toBe('Transformando conhecimento em soluções');
        expect(item.exibido.startsWith(`${item.tamanhoReal} · `), item.classe).toBe(true);
      }
      expect(itens[0]?.tamanhoReal).toBe(h1);
    }
  });

  test('espaçamento: barras de 4 a 128 px com a largura computada', async ({ page }) => {
    await abrir(page);
    const reguas = await page.locator('#sg-espacamento li[data-espaco]').evaluateAll((lis) =>
      lis.map((li) => {
        const el = li as HTMLElement;
        return {
          token: el.dataset.espaco ?? '',
          largura: el.querySelector<HTMLElement>('[id^="sg-regua-"]')?.getBoundingClientRect()
            .width,
          exibido: el.querySelector<HTMLElement>('output')?.dataset.computado ?? '',
        };
      }),
    );
    expect(reguas.map((r) => r.largura)).toEqual([4, 8, 12, 16, 24, 32, 48, 64, 96, 128]);
    expect(reguas.map((r) => r.exibido)).toEqual(reguas.map((r) => `${r.largura}px`));
  });

  test('raios: Tab chega às amostras e mostra o contorno de foco', async ({ page }) => {
    await abrir(page);
    const amostras = page.locator('[data-raio]');
    await expect(amostras).toHaveCount(6);
    await amostras.first().focus();
    await page.keyboard.press('Tab');
    const segunda = amostras.nth(1);
    await expect(segunda).toBeFocused();
    const contorno = await segunda.evaluate((el) => {
      const e = getComputedStyle(el);
      return `${e.outlineWidth} ${e.outlineStyle} ${e.outlineColor} / ${e.outlineOffset}`;
    });
    expect(contorno).toBe('3px solid rgb(224, 81, 138) / 3px');
  });

  test('"forçar movimento reduzido" zera lifts e animações e volta ao desmarcar', async ({
    page,
  }) => {
    await abrir(page);
    const lift = page.locator('#sg-movimento output[data-token="--lift-card"]');
    const animacao = page.locator('[data-animacao-demo]');
    await expect(lift).toHaveAttribute('data-computado', '-6px');

    await page.locator('[data-controle="movimento"]').check();
    await expect(page.locator('html')).toHaveClass(/movimentoReduzido/);
    await expect(page.locator('html')).toHaveClass(/\bmovimento-reduzido-forcado\b/);
    await expect(lift).toHaveAttribute('data-computado', '0px');
    await expect(page.locator('#sg-movimento output[data-token="--arrow-shift"]')).toHaveAttribute(
      'data-computado',
      '0px',
    );
    expect(await animacao.evaluate((el) => getComputedStyle(el).animationIterationCount)).toBe('1');

    await page.locator('[data-controle="movimento"]').uncheck();
    await expect(page.locator('html')).not.toHaveClass(/movimentoReduzido/);
    await expect(lift).toHaveAttribute('data-computado', '-6px');
    expect(await animacao.evaluate((el) => getComputedStyle(el).animationIterationCount)).toBe(
      'infinite',
    );
  });

  test('cada *.demo.tsx de src/components aparece com âncora própria', async ({ page }) => {
    await abrir(page);
    const noDisco = demosNoDisco();
    const naPagina = await page
      .locator('[data-demo]')
      .evaluateAll((els) => els.map((el) => (el as HTMLElement).id).sort());
    expect(naPagina).toEqual(noDisco);
    for (const id of noDisco) {
      await expect(page.locator(`nav a[href="#${id}"]`)).toHaveCount(1);
    }
    test.info().annotations.push({
      type: 'DS-05 demos',
      description: noDisco.length ? noDisco.join(', ') : '(nenhum *.demo.tsx ainda)',
    });
  });
});
