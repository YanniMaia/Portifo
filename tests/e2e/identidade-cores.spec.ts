// Q-19 grupo 7 — "Sem azul/roxo como identidade" (doc de design §3.1 "Nada de azul, roxo"; §17
// item 15; 00-INDICE D11), medido no DOM renderizado do build de produção, nos 2 temas (claro e
// escuro via `localStorage['ye-theme']`, mesmo mecanismo de `theme-persist.spec.ts`/`pagina-404.spec.ts`).
//
// Diferença do teste de unidade `tests/unit/styles/colors.test.ts` (que varre o texto-fonte de
// `src/**/*.css` com um corte de matiz 190°–300°): aqui a varredura é sobre os valores
// COMPUTADOS (`getComputedStyle`) de `color`, `background-color`, `border-color`, `fill` e `stroke`
// de todo elemento realmente renderizado na página montada, convertidos para HSL, com o corte da
// Q-19 (matiz 180°–290°, saturação > 25%, luminosidade entre 15% e 90%) — um corte um pouco mais
// largo que o do teste de unidade, de propósito (D11: nenhuma exceção).
import { expect, test, type Page } from '@playwright/test';
import { THEME_STORAGE_KEY, type Theme } from '../../src/theme/constants.ts';
import { parseColor } from '../unit/support/contrast.ts';

interface Hsl {
  hue: number;
  saturation: number;
  lightness: number;
}

/** Matiz (0–360), saturação (0–1) e luminosidade (0–1) de uma cor `rgb()`/`rgba()`/hex. */
function hslDe(cor: string): Hsl | null {
  let rgba;
  try {
    rgba = parseColor(cor);
  } catch {
    return null; // valores como "none" (SVG) não são cor: sem violação possível.
  }
  if (rgba.a === 0) return null; // totalmente transparente: nenhum pixel visível desta cor.
  const [rn, gn, bn] = [rgba.r / 255, rgba.g / 255, rgba.b / 255];
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  const lightness = (max + min) / 2;
  if (d === 0) return { hue: 0, saturation: 0, lightness };
  const saturation = d / (1 - Math.abs(2 * lightness - 1));
  let hue: number;
  if (max === rn) hue = 60 * (((gn - bn) / d) % 6);
  else if (max === gn) hue = 60 * ((bn - rn) / d + 2);
  else hue = 60 * ((rn - gn) / d + 4);
  if (hue < 0) hue += 360;
  return { hue, saturation, lightness };
}

/** Q-19 passo 7: falha se matiz 180°–290°, saturação > 25% e luminosidade entre 15% e 90%. */
function violaIdentidade({ hue, saturation, lightness }: Hsl): boolean {
  return hue >= 180 && hue <= 290 && saturation > 0.25 && lightness >= 0.15 && lightness <= 0.9;
}

interface Coleta {
  prop: string;
  valor: string;
  seletor: string;
}

/** Elementos sem pintura própria relevante (não contam como "elemento visível" do passo 7). */
const TAGS_IGNORADAS = new Set([
  'SCRIPT',
  'STYLE',
  'NOSCRIPT',
  'TEMPLATE',
  'LINK',
  'META',
  'TITLE',
]);

async function coletarCores(page: Page): Promise<Coleta[]> {
  return page.evaluate(
    (tagsIgnoradas) => {
      const resultado: { prop: string; valor: string; seletor: string }[] = [];
      const elementos = [...document.querySelectorAll('body *')];
      for (const el of elementos) {
        if (tagsIgnoradas.includes(el.tagName)) continue;
        const estilo = getComputedStyle(el);
        // Elemento não renderizado (display: none ou visibility: hidden) não pinta nenhum pixel.
        if (estilo.display === 'none' || estilo.visibility === 'hidden') continue;
        const seletor =
          el.tagName.toLowerCase() +
          (el.id ? `#${el.id}` : '') +
          (typeof el.className === 'string' && el.className
            ? `.${el.className.split(' ')[0]}`
            : '');
        const propriedades: readonly [string, string][] = [
          ['color', estilo.color],
          ['background-color', estilo.backgroundColor],
          ['border-color', estilo.borderTopColor],
          ['fill', estilo.fill],
          ['stroke', estilo.stroke],
        ];
        for (const [prop, valor] of propriedades) {
          if (valor && valor !== 'none') resultado.push({ prop, valor, seletor });
        }
      }
      return resultado;
    },
    [...TAGS_IGNORADAS],
  );
}

async function abrirComTema(page: Page, tema: Theme): Promise<void> {
  await page.addInitScript(([chave, valor]) => localStorage.setItem(chave, valor), [
    THEME_STORAGE_KEY,
    tema,
  ] as const);
  await page.goto('./');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('html')).toHaveAttribute('data-theme', tema);
}

for (const tema of ['light', 'dark'] as const satisfies readonly Theme[]) {
  test(`tema ${tema}: nenhuma cor computada com matiz 180°-290° (azul/roxo)`, async ({ page }) => {
    await abrirComTema(page, tema);
    const cores = await coletarCores(page);
    expect(cores.length).toBeGreaterThan(0);

    const violacoes = cores
      .map((c) => ({ ...c, hsl: hslDe(c.valor) }))
      .filter((c): c is Coleta & { hsl: Hsl } => c.hsl !== null && violaIdentidade(c.hsl))
      .map((c) => `${c.seletor} ${c.prop}=${c.valor} (matiz ${Math.round(c.hsl.hue)}°)`);

    expect([...new Set(violacoes)]).toEqual([]);
  });
}
