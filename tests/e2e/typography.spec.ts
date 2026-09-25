// Tipografia resolvida no navegador (DS-03; doc 02 §4.5; doc de design §4).
// Injeta sondas com as classes .t-* no build de produção e lê getComputedStyle em cada projeto:
// celular (360, 390), tablet (768) e desktop (1024, 1280, 1440 — a tela grande herda o desktop).
// A página real ainda não tem títulos (vêm das seções, doc 03): as sondas saem depois de medir.
import { expect, test, type Page } from '@playwright/test';

type Faixa = 0 | 1 | 2;
const faixaDe = (largura: number): Faixa => (largura >= 1024 ? 2 : largura >= 640 ? 1 : 0);
const NOMES = ['celular', 'tablet', 'desktop'] as const;

/** classe → [tamanhos celular/tablet/desktop], peso, fator de entrelinha. */
const CLASSES: Record<string, { fs: [number, number, number]; fw: string; lh: number }> = {
  't-h1': { fs: [40, 52, 68], fw: '800', lh: 1.05 },
  't-h2': { fs: [30, 38, 44], fw: '800', lh: 1.15 },
  't-h3': { fs: [20, 22, 24], fw: '700', lh: 1.3 },
  't-hero-sub': { fs: [17, 19, 20], fw: '400', lh: 1.6 },
  't-body': { fs: [16, 16, 17], fw: '400', lh: 1.7 },
  't-lead': { fs: [18, 18, 18], fw: '400', lh: 1.7 },
  't-caption': { fs: [14, 14, 14], fw: '400', lh: 1.5 },
  't-eyebrow': { fs: [12, 13, 13], fw: '700', lh: 1.2 },
};

interface Medida {
  fontSize: string;
  fontWeight: string;
  lineHeight: string;
  letterSpacing: string;
  maxWidth: string;
  textTransform: string;
  color: string;
  fontFamily: string;
  largura65ch: string;
}

async function medir(page: Page): Promise<Record<string, Medida>> {
  return page.evaluate((classes) => {
    const caixa = document.createElement('div');
    caixa.setAttribute('aria-hidden', 'true');
    document.body.append(caixa);
    const saida: Record<string, Medida> = {};
    for (const classe of [...classes, 't-mono']) {
      const el = document.createElement('p');
      el.className = classe;
      el.textContent = 'ação';
      // Sonda irmã com width: 65ch na MESMA fonte, para comparar com max-width: 65ch.
      const ch = document.createElement('p');
      ch.className = classe;
      ch.style.width = '65ch';
      caixa.append(el, ch);
      const c = getComputedStyle(el);
      saida[classe] = {
        fontSize: c.fontSize,
        fontWeight: c.fontWeight,
        lineHeight: c.lineHeight,
        letterSpacing: c.letterSpacing,
        maxWidth: c.maxWidth,
        textTransform: c.textTransform,
        color: c.color,
        fontFamily: c.fontFamily,
        largura65ch: getComputedStyle(ch).width,
      };
    }
    caixa.remove();
    return saida;
  }, Object.keys(CLASSES));
}

const px = (v: string): number => Number.parseFloat(v);

test('classes .t-* nos tamanhos da faixa (§4.5)', async ({ page, viewport }) => {
  await page.goto('./');
  const largura = viewport?.width ?? 0;
  const faixa = faixaDe(largura);
  const lidos = await medir(page);
  test.info().annotations.push({
    type: `DS-03 ${largura}px (${NOMES[faixa]})`,
    description: JSON.stringify(
      Object.fromEntries(
        Object.entries(lidos).map(([k, v]) => [
          k,
          `${v.fontSize}/${v.fontWeight}/${v.lineHeight}/${v.letterSpacing}`,
        ]),
      ),
    ),
  });

  for (const [classe, { fs, fw, lh }] of Object.entries(CLASSES)) {
    const m = lidos[classe];
    const tamanho = fs[faixa];
    expect(m?.fontSize, classe).toBe(`${tamanho}px`);
    expect(m?.fontWeight, classe).toBe(fw);
    expect(px(m?.lineHeight ?? ''), classe).toBeCloseTo(tamanho * lh, 2);
  }

  // h1: −0,02em (−1,36 px em 68 px); eyebrow: +0,12em, caixa alta.
  expect(px(lidos['t-h1']?.letterSpacing ?? '')).toBeCloseTo(
    -0.02 * (CLASSES['t-h1']?.fs[faixa] ?? 0),
    3,
  );
  expect(px(lidos['t-eyebrow']?.letterSpacing ?? '')).toBeCloseTo(
    0.12 * (CLASSES['t-eyebrow']?.fs[faixa] ?? 0),
    3,
  );
  expect(lidos['t-eyebrow']?.textTransform).toBe('uppercase');

  // Larguras máximas: 560 px e 65ch (medido na mesma fonte).
  expect(lidos['t-hero-sub']?.maxWidth).toBe('560px');
  expect(px(lidos['t-body']?.maxWidth ?? '')).toBeCloseTo(
    px(lidos['t-body']?.largura65ch ?? ''),
    1,
  );

  expect(lidos['t-mono']?.fontFamily.startsWith('"JetBrains Mono"')).toBe(true);
  expect(lidos['t-h1']?.fontFamily.startsWith('"Plus Jakarta Sans"')).toBe(true);
  expect(lidos['t-body']?.fontFamily.startsWith('Inter')).toBe(true);
});

test('tokens --fs-hint e --fs-featured-title na faixa (D13, DV-7)', async ({ page, viewport }) => {
  await page.goto('./');
  const faixa = faixaDe(viewport?.width ?? 0);
  const lidos = await page.evaluate(() => {
    const c = getComputedStyle(document.documentElement);
    return {
      hint: c.getPropertyValue('--fs-hint').trim(),
      featured: c.getPropertyValue('--fs-featured-title').trim(),
    };
  });
  expect(lidos.hint).toBe('14px');
  expect(lidos.featured).toBe(['24px', '28px', '32px'][faixa]);
});

test('famílias: body Inter, h2 Plus Jakarta Sans; cor do eyebrow nos 2 temas', async ({ page }) => {
  await page.goto('./');
  const r = await page.evaluate(() => {
    const h2 = document.createElement('h2');
    h2.textContent = 'ação';
    const eb = document.createElement('p');
    eb.className = 't-eyebrow';
    eb.textContent = 'ação';
    document.body.append(h2, eb);
    const html = document.documentElement;
    const antes = html.getAttribute('data-theme');
    html.setAttribute('data-theme', 'light');
    const claro = getComputedStyle(eb).color;
    html.setAttribute('data-theme', 'dark');
    const escuro = getComputedStyle(eb).color;
    if (antes) html.setAttribute('data-theme', antes);
    const saida = {
      body: getComputedStyle(document.body).fontFamily,
      bodySize: getComputedStyle(document.body).fontSize,
      bodyColor: getComputedStyle(document.body).color,
      h2: getComputedStyle(h2).fontFamily,
      h2Wrap: getComputedStyle(h2).getPropertyValue('text-wrap'),
      claro,
      escuro,
    };
    h2.remove();
    eb.remove();
    return saida;
  });
  expect(r.body.startsWith('Inter')).toBe(true);
  expect(r.h2.startsWith('"Plus Jakarta Sans"')).toBe(true);
  expect(r.h2Wrap).toContain('balance');
  expect(r.claro).toBe('rgb(201, 58, 119)');
  expect(r.escuro).toBe('rgb(255, 179, 209)');
  expect(r.bodyColor).toBe('rgb(43, 22, 32)');
});

test('skip link com foco usa Inter 600 (pendência V-03 #1 / V-04 #3 do Portão F)', async ({
  page,
}) => {
  await page.goto('./');
  await page.keyboard.press('Tab');
  const foco = page.locator('a:focus');
  await expect(foco).toBeVisible();
  const familia = await foco.evaluate((el) => getComputedStyle(el).fontFamily);
  expect(familia.startsWith('Inter')).toBe(true);
  await expect(foco).toHaveCSS('font-weight', '600');
  // A face realmente carregou (não ficou na serif padrão nem no fallback do sistema).
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => document.fonts.check('600 16px Inter'))).toBe(true);
});

test('preload do Inter 400 é consumido pela fonte-base (pendência do Portão F)', async ({
  page,
}) => {
  await page.goto('./');
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);
  const faces = await page.evaluate(() =>
    [...document.fonts]
      .filter((f) => f.status === 'loaded')
      .map((f) => `${f.family.replaceAll('"', '')} ${f.weight} ${f.style}`),
  );
  expect(faces).toContain('Inter 400 normal');
});
