// Tokens de layout e movimento resolvidos no navegador (DS-02; doc 02 §4.4 e §4.7).
// Lê `getComputedStyle(<html>)` em cada projeto de viewport e compara com a faixa da largura:
// celular (360, 390), tablet (768) e desktop (1024, 1280, 1440 — a tela grande herda o desktop).
import { expect, test, type Page } from '@playwright/test';

type Faixa = 'celular' | 'tablet' | 'desktop';

/** token → [celular, tablet, desktop] (tabela §4.4). */
const LAYOUT: Record<string, [string, string, string]> = {
  '--section-py': ['64px', '88px', '112px'],
  '--gutter': ['20px', '32px', '32px'],
  '--header-height': ['64px', '68px', '72px'],
  '--button-height': ['48px', '52px', '52px'],
  '--card-padding': ['24px', '28px', '32px'],
  '--card-gap': ['16px', '24px', '24px'],
  '--section-py-motto': ['64px', '88px', '96px'],
  '--container-max': ['100%', '100%', '1200px'],
  '--grid-columns': ['4', '8', '12'],
  '--anchor-offset': ['80px', '80px', '80px'],
};

function faixaDe(largura: number): Faixa {
  if (largura >= 1024) return 'desktop';
  if (largura >= 640) return 'tablet';
  return 'celular';
}

const INDICE: Record<Faixa, number> = { celular: 0, tablet: 1, desktop: 2 };

async function lerTokens(page: Page, tokens: string[]): Promise<Record<string, string>> {
  return page.evaluate((lista) => {
    const estilo = getComputedStyle(document.documentElement);
    return Object.fromEntries(lista.map((t) => [t, estilo.getPropertyValue(t).trim()]));
  }, tokens);
}

/** Duração CSS em ms (o minificador reescreve `200ms` como `.2s`). */
function emMs(valor: string): number {
  const m = /^(-?[\d.]+)(ms|s)$/.exec(valor);
  if (!m) return Number.NaN;
  return Math.round(Number(m[1]) * (m[2] === 's' ? 1000 : 1));
}

test('tokens de layout da faixa da largura atual (§4.4)', async ({ page, viewport }) => {
  await page.goto('./');
  const largura = viewport?.width ?? 0;
  const faixa = faixaDe(largura);
  const lidos = await lerTokens(page, Object.keys(LAYOUT));
  const esperados = Object.fromEntries(
    Object.entries(LAYOUT).map(([t, v]) => [t, v[INDICE[faixa]]]),
  );
  const nota = { type: `DS-02 ${largura}px (${faixa})`, description: JSON.stringify(lidos) };
  test.info().annotations.push(nota);
  expect(lidos).toEqual(esperados);
});

test('escala --space-* e tokens de movimento (§4.2, §4.7)', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('./');
  const lidos = await lerTokens(page, [
    '--space-1',
    '--space-32',
    '--dur-fast',
    '--dur-count',
    '--dur-pulse',
    '--lift-card',
    '--arrow-shift',
  ]);
  expect(lidos['--space-1']).toBe('4px');
  expect(lidos['--space-32']).toBe('128px');
  expect(emMs(lidos['--dur-fast'] ?? '')).toBe(200);
  expect(emMs(lidos['--dur-count'] ?? '')).toBe(1200);
  expect(emMs(lidos['--dur-pulse'] ?? '')).toBe(2400);
  expect(lidos['--lift-card']).toBe('-6px');
  expect(lidos['--arrow-shift']).toBe('4px');
});

test('com movimento reduzido, --lift-* e --arrow-shift resolvem para 0px (§9)', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('./');
  const lidos = await lerTokens(page, [
    '--lift-card',
    '--lift-panel',
    '--lift-button',
    '--lift-chip',
    '--arrow-shift',
  ]);
  expect(lidos).toEqual({
    '--lift-card': '0px',
    '--lift-panel': '0px',
    '--lift-button': '0px',
    '--lift-chip': '0px',
    '--arrow-shift': '0px',
  });
});
