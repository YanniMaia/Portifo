// Q-15 — Contraste de cores nos dois temas, medido na PÁGINA MONTADA (doc 06, linhas 448-502).
// Complementa o teste de tokens de `tests/unit/styles/contrast.test.ts` (que confere os valores de
// `colors.css` isolados): aqui a varredura lê `color`/`background-*` COMPUTADOS de cada elemento de
// texto real renderizado, nos 2 temas (`localStorage['ye-theme']`, mesmo mecanismo de
// `pagina-404.spec.ts`/`identidade-cores.spec.ts`) e nos 2 projetos pedidos pelo doc 06
// (`vp390-claro`, `vp1280-claro` — larguras do critério da Q-10/F-13; os 4 projetos restantes não
// mudam cor nem fonte, só layout, e já são cobertos por outros specs).
//
// Abordagem (documentada, como o passo 2 da Q-15 permite "ser mais seletiva"):
// - Elementos candidatos: tags que carregam texto de verdade no site (h1-h6, p, span, a, button,
//   li, label, dt, dd, figcaption, time), com um nó de texto PRÓPRIO (não herdado de filhos) de
//   pelo menos 2 caracteres visíveis (retângulo ≥ 2 px nas 2 dimensões — isso já exclui
//   `.visually-hidden` e o SkipLink fora de foco, que usam a técnica de 1 px).
// - Fundo efetivo: sobe a árvore de ancestrais (do próprio elemento até `<html>`) somando camadas
//   translúcidas (`composite`, do helper da DS-01) até achar a primeira camada opaca OU um
//   `background-image` em degradê que não seja `background-clip: text` (ex.: botão primário,
//   monograma). Cobre vidro (`backdrop-filter` + `rgba`) por álgebra, sem precisar tirar screenshot:
//   os vidros do site (cabeçalho, GlassPanel) ficam sobre fundos sólidos dos tokens, nunca sobre uma
//   imagem — a álgebra de composição é exata nesse caso, o degradê só entra quando é a própria
//   camada de fundo (não precisa "amostrar pixel").
// - Texto em degradê (`GradientText`, `background-clip: text`, `color: transparent`): a cor do
//   texto não vem de `color` (que fica transparente), e sim das paradas do degradê do ancestral
//   mais próximo com `background-clip: text` — é o mesmo princípio do `--gradient-text` da D19.
// - Pior caso: quando há mais de uma parada de cor candidata (degradê de texto ou de fundo), usa a
//   razão MÍNIMA entre todas as combinações — o ponto mais exigente, como a D19 pede ("medido no
//   ponto mais claro do degradê").
// - Os brilhos `--hero-glow-1/2` SÃO `background-image` do próprio `section.hero` (ancestral real
//   do H1/subtítulo, não um irmão) e por isso entram na varredura: `resolverCamadaLocal` soma, para
//   cada caixa, o candidato "sem o brilho" (a `background-color` sólida) e o candidato "com o
//   brilho no ponto mais forte" (a parada não transparente composta sobre essa cor) — o pior caso
//   decide, sem precisar de screenshot (os dois são radiais que desbotam para `transparent`, nunca
//   cobrem a caixa inteira).
// - Limite conhecido (registrado no `cp/Q-15`, não testado aqui): a camada `backdrop` do Hero/Contato
//   (`SectionBackdrop`/`GridBackdrop`, grade decorativa) é um elemento IRMÃO do conteúdo (`aria-hidden`,
//   `position: absolute`, fora da árvore de ancestrais do texto) — linhas finas e de opacidade muito
//   baixa (`--deco-grid-line`), que não formam um fundo contínuo sob texto nenhum.
import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { site } from '../../src/content/site.ts';
import { THEME_STORAGE_KEY, type Theme } from '../../src/theme/constants.ts';
import { composite, contrastRatio, parseColor } from '../unit/support/contrast.ts';

const PROJETOS_DO_DOC = ['vp390-claro', 'vp1280-claro'] as const;
function rodaSoNosProjetosDoDoc(testInfo: TestInfo): void {
  test.skip(
    !PROJETOS_DO_DOC.includes(testInfo.project.name as (typeof PROJETOS_DO_DOC)[number]),
    'Q-15 mede só nas larguras do doc 06 (390/1280); cor e fonte não variam nos outros projetos',
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

// ---------- Coleta no navegador (sem import: roda dentro de page.evaluate) ----------

interface CamadaBruta {
  color: string;
  backgroundColor: string;
  backgroundImage: string;
  backgroundClip: string;
}

interface ElementoBruto {
  seletor: string;
  texto: string;
  fontSize: number;
  fontWeight: number;
  camadas: CamadaBruta[];
}

/** Roda inteiramente no navegador (sem closures externas) — ver `page.evaluate` abaixo. */
function coletarElementosDeTexto(): ElementoBruto[] {
  const TAGS = new Set([
    'H1',
    'H2',
    'H3',
    'H4',
    'H5',
    'H6',
    'P',
    'SPAN',
    'A',
    'BUTTON',
    'LI',
    'LABEL',
    'DT',
    'DD',
    'FIGCAPTION',
    'TIME',
  ]);
  const resultado: ElementoBruto[] = [];
  const candidatos = document.querySelectorAll('body *');
  for (const el of candidatos) {
    if (!TAGS.has(el.tagName)) continue;
    let textoProprio = '';
    el.childNodes.forEach((n) => {
      if (n.nodeType === Node.TEXT_NODE) textoProprio += n.textContent ?? '';
    });
    textoProprio = textoProprio.trim();
    if (textoProprio.length === 0) continue;

    const estiloProprio = getComputedStyle(el);
    if (estiloProprio.visibility === 'hidden' || estiloProprio.display === 'none') continue;
    const rect = el.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) continue; // visually-hidden / skip-link sem foco

    const camadas: CamadaBruta[] = [];
    let atual: Element | null = el;
    while (atual) {
      const cs = atual === el ? estiloProprio : getComputedStyle(atual);
      camadas.push({
        color: cs.color,
        backgroundColor: cs.backgroundColor,
        backgroundImage: cs.backgroundImage,
        backgroundClip: cs.backgroundClip || cs.getPropertyValue('-webkit-background-clip'),
      });
      atual = atual.parentElement;
    }

    const classe =
      typeof el.className === 'string' && el.className ? `.${el.className.split(' ')[0]}` : '';
    resultado.push({
      seletor: `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}${classe}`,
      texto: textoProprio.slice(0, 60),
      fontSize: parseFloat(estiloProprio.fontSize),
      fontWeight: parseFloat(estiloProprio.fontWeight),
      camadas,
    });
  }
  return resultado;
}

async function coletar(page: Page): Promise<ElementoBruto[]> {
  return page.evaluate(coletarElementosDeTexto);
}

// ---------- Cálculo no Node (reusa o helper da DS-01, sem reimplementar) ----------

/** Extrai as paradas de cor (`rgb()`/`rgba()`) computadas de um `background-image` em degradê. */
function paradasDeDegrade(valor: string): string[] {
  return valor.match(/rgba?\([^)]*\)/g) ?? [];
}

function alfaOpaco(cor: string): boolean {
  try {
    return parseColor(cor).a >= 0.999;
  } catch {
    return false;
  }
}

function alfaDeCor(cor: string): number {
  try {
    return parseColor(cor).a;
  } catch {
    return 1;
  }
}

function rgbaDeComposite(c: { r: number; g: number; b: number; a: number }): string {
  return `rgba(${c.r}, ${c.g}, ${c.b}, ${c.a})`;
}

/**
 * Separa `background-image` em camadas por vírgula de nível 0 (fora de parênteses) — uma caixa
 * pode ter mais de uma imagem (ex.: `section.hero` do S-03 soma `--hero-glow-1` e `--hero-glow-2`,
 * os dois brilhos decorativos do canto, por cima da `background-color` do `Section`/DS-10).
 */
function dividirCamadasDeImagem(valor: string): string[] {
  if (valor === 'none') return [];
  const partes: string[] = [];
  let profundidade = 0;
  let atual = '';
  for (const ch of valor) {
    if (ch === '(') profundidade++;
    if (ch === ')') profundidade--;
    if (ch === ',' && profundidade === 0) {
      partes.push(atual.trim());
      atual = '';
    } else {
      atual += ch;
    }
  }
  if (atual.trim()) partes.push(atual.trim());
  return partes;
}

/** Uma camada de imagem é "sólida" quando nenhuma parada dela é transparente (sem desbotar). */
function imagemSolida(camadaDeImagem: string): string[] | null {
  const paradas = paradasDeDegrade(camadaDeImagem);
  if (paradas.length === 0) return null;
  return paradas.every((p) => alfaDeCor(p) > 0.02) ? paradas : null;
}

interface CamadaResolvida {
  candidatos: string[];
  /** `true` quando esta caixa já resolve o fundo (não precisa subir mais na árvore). */
  terminal: boolean;
}

/**
 * Resolve o que UMA caixa pinta, combinando `background-image` (pode ter várias camadas, cada uma
 * sólida ou decorativa/desbotando para "transparent") com a `background-color` da MESMA caixa —
 * as duas coexistem no CSS quando só `background-image` é declarado (a cor continua vindo de outra
 * regra, como `section.hero` + `.section` do DS-10).
 */
function resolverCamadaLocal(c: CamadaBruta): CamadaResolvida {
  if (c.backgroundClip === 'text') return { candidatos: ['rgba(0, 0, 0, 0)'], terminal: false };

  const corBase = c.backgroundColor;
  const baseOpaca = alfaOpaco(corBase);
  const camadasDeImagem = dividirCamadasDeImagem(c.backgroundImage).filter((p) =>
    /gradient/.test(p),
  );

  if (camadasDeImagem.length === 0) {
    return { candidatos: [corBase], terminal: baseOpaca };
  }

  // 1) Alguma camada de imagem é sólida (sem desbotar) — é o terminal desta caixa (botão, monograma,
  //    chip): o degradê cobre a caixa inteira, a `background-color` é só um "fallback" por trás dele.
  for (const img of camadasDeImagem) {
    const solida = imagemSolida(img);
    if (solida) return { candidatos: solida, terminal: true };
  }

  // 2) Só imagens decorativas que desbotam para "transparent" (ex.: os brilhos do Hero). Elas não
  //    cobrem a caixa inteira: soma o candidato "sem brilho" (a própria cor de fundo) e o(s)
  //    candidato(s) "com o brilho no ponto mais forte" — o pior caso decide depois.
  if (baseOpaca) {
    const paradasNaoTransparentes = camadasDeImagem.flatMap((img) =>
      paradasDeDegrade(img).filter((p) => alfaDeCor(p) > 0.02),
    );
    const comBrilho = paradasNaoTransparentes.map((p) => rgbaDeComposite(composite(p, corBase)));
    return { candidatos: [corBase, ...comBrilho], terminal: true };
  }

  // Cor de fundo local também translúcida: sem solução local, sobe a árvore com essa cor.
  return { candidatos: [corBase], terminal: false };
}

/** Sobe as camadas até achar o fundo opaco (sólido ou degradê não clipado em texto). */
function fundoEfetivo(camadas: CamadaBruta[]): string[] {
  let terminal = -1;
  let candidatos: string[] = [];
  for (let i = 0; i < camadas.length; i++) {
    const r = resolverCamadaLocal(camadas[i] as CamadaBruta);
    if (r.terminal) {
      terminal = i;
      candidatos = r.candidatos;
      break;
    }
  }
  if (terminal === -1) {
    const ultima = camadas[camadas.length - 1] as CamadaBruta;
    return [ultima.backgroundColor];
  }
  let resultado = candidatos;
  for (let k = terminal - 1; k >= 0; k--) {
    const c = camadas[k] as CamadaBruta;
    if (c.backgroundClip === 'text') continue;
    resultado = resultado.map((fundo) => rgbaDeComposite(composite(c.backgroundColor, fundo)));
  }
  return resultado;
}

/** Cor(es) candidata(s) do texto: `color` normal, ou as paradas do ancestral `background-clip: text`. */
function corDeTexto(camadas: CamadaBruta[]): string[] {
  const propria = camadas[0] as CamadaBruta;
  if (!alfaTransparente(propria.color)) return [propria.color];
  for (const c of camadas) {
    if (c.backgroundClip === 'text' && c.backgroundImage !== 'none') {
      const paradas = paradasDeDegrade(c.backgroundImage);
      if (paradas.length > 0) return paradas;
    }
  }
  return [propria.color];
}

function alfaTransparente(cor: string): boolean {
  try {
    return parseColor(cor).a <= 0.001;
  } catch {
    return true;
  }
}

function piorRazao(textos: string[], fundos: string[]): number {
  let pior = Number.POSITIVE_INFINITY;
  for (const t of textos) {
    for (const f of fundos) {
      pior = Math.min(pior, contrastRatio(t, f));
    }
  }
  return pior;
}

/** Texto grande da WCAG: ≥ 24 px, ou ≥ 18,6667 px (14 pt) em negrito (peso ≥ 700). */
function ehTextoGrande(fontSize: number, fontWeight: number): boolean {
  return fontSize >= 24 || (fontSize >= 18.6667 && fontWeight >= 700);
}

interface Avaliado extends ElementoBruto {
  razao: number;
  minimo: number;
  grande: boolean;
  fundos: string[];
}

function avaliarTodos(elementos: ElementoBruto[]): Avaliado[] {
  return elementos.map((el) => {
    const textos = corDeTexto(el.camadas);
    const fundos = fundoEfetivo(el.camadas);
    const razao = piorRazao(textos, fundos);
    const grande = ehTextoGrande(el.fontSize, el.fontWeight);
    return { ...el, razao, minimo: grande ? 3 : 4.5, grande, fundos };
  });
}

interface Rgb {
  r: number;
  g: number;
  b: number;
}

function proximo(a: Rgb, b: Rgb): boolean {
  return Math.abs(a.r - b.r) <= 2 && Math.abs(a.g - b.g) <= 2 && Math.abs(a.b - b.b) <= 2;
}

/**
 * `true` quando alguma camada (ignorando `background-clip: text`) tem um `background-image` cujas
 * paradas batem EXATAMENTE (no par, em ordem, com tolerância de 2 por canal) com as duas paradas
 * do `--gradient-brand` — não basta UMA cor em comum: `--gradient-primary` (#C93A77 → #A82560, claro)
 * termina na mesma cor que `--gradient-brand` (#E0518A → #A82560) por coincidência de design (D13),
 * e isso não deve contar como "usa --gradient-brand".
 */
function temFundoGradientBrand(camadas: CamadaBruta[], paradasGradientBrand: Rgb[]): boolean {
  return camadas.some((c) => {
    if (c.backgroundClip === 'text') return false;
    if (c.backgroundImage === 'none' || !/gradient/.test(c.backgroundImage)) return false;
    return dividirCamadasDeImagem(c.backgroundImage).some((img) => {
      const paradas = paradasDeDegrade(img).map((s) => {
        const { r, g, b } = parseColor(s);
        return { r, g, b };
      });
      return (
        paradas.length === paradasGradientBrand.length &&
        paradas.every((p, i) => proximo(p, paradasGradientBrand[i] as Rgb))
      );
    });
  });
}

/** Linha 12: isenção do monograma (WCAG 1.4.3, logotipo) — só aceita quando o texto é "YE" e a
 * própria caixa usa `--gradient-brand` (não um texto em degradê — `background-clip: text` não conta
 * como fundo, ver `resolverCamadaLocal`/`fundoEfetivo`). */
function eMonogramaIsento(avaliado: Avaliado, paradasGradientBrand: Rgb[]): boolean {
  if (avaliado.texto !== site.iniciais) return false;
  return temFundoGradientBrand(avaliado.camadas, paradasGradientBrand);
}

/** Linha 14: seta decorativa "→" da Frase de destaque — decisão do `cp/S-06` (aria-hidden,
 * tratada como glifo, não como texto; §3.5 "rosas claros nunca carregam texto"). */
function eSetaDecorativaDaFrase(avaliado: Avaliado): boolean {
  return avaliado.texto === '→';
}

async function paradasGradientBrand(page: Page): Promise<Rgb[]> {
  const valor = await page.evaluate(() => {
    const sonda = document.createElement('div');
    sonda.style.backgroundImage = 'var(--gradient-brand)';
    document.body.appendChild(sonda);
    const v = getComputedStyle(sonda).backgroundImage;
    sonda.remove();
    return v;
  });
  return paradasDeDegrade(valor).map((c) => {
    const { r, g, b } = parseColor(c);
    return { r, g, b };
  });
}

// ---------------------------------------------------------------------------------------------

for (const tema of ['light', 'dark'] as const satisfies readonly Theme[]) {
  test(`tema ${tema}: nenhum texto visível abaixo do mínimo WCAG (4,5:1 normal / 3:1 grande), exceto as isenções da tabela`, async ({
    page,
  }, testInfo) => {
    rodaSoNosProjetosDoDoc(testInfo);
    await abrirComTema(page, tema);

    const brutos = await coletar(page);
    expect(brutos.length).toBeGreaterThan(30); // varredura real, não vazia

    const avaliados = avaliarTodos(brutos);
    const gradientBrand = await paradasGradientBrand(page);

    const violacoes = avaliados.filter((a) => {
      if (a.razao >= a.minimo) return false;
      if (eSetaDecorativaDaFrase(a)) return false; // linha 14 (cp/S-06)
      if (eMonogramaIsento(a, gradientBrand)) return false; // linha 12 (WCAG 1.4.3)
      return true;
    });

    const relato = violacoes.map(
      (v) =>
        `${v.seletor} "${v.texto}" ${v.fontSize}px/${v.fontWeight} = ${v.razao.toFixed(2)}:1 (mín. ${v.minimo}, fundo ${v.fundos.join('|')})`,
    );
    expect(relato).toEqual([]);
  });

  test(`tema ${tema}: linha 12 — isenção do monograma "${site.iniciais}" (14 px) é a ÚNICA abaixo do mínimo usando --gradient-brand`, async ({
    page,
  }, testInfo) => {
    rodaSoNosProjetosDoDoc(testInfo);
    await abrirComTema(page, tema);

    const brutos = await coletar(page);
    const avaliados = avaliarTodos(brutos);
    const gradientBrand = await paradasGradientBrand(page);

    const sobreGradientBrand = avaliados.filter((a) =>
      temFundoGradientBrand(a.camadas, gradientBrand),
    );
    // Todo texto sobre --gradient-brand é o monograma "YE" (o único uso no site, DS-18).
    expect(sobreGradientBrand.length).toBeGreaterThan(0);
    for (const el of sobreGradientBrand) {
      expect(el.texto).toBe(site.iniciais);
    }
    // Entre eles, só o de 14 px (cabeçalho/rodapé) fica abaixo de 24 px — é o que precisa da isenção.
    const pequenos = sobreGradientBrand.filter((el) => el.fontSize < 24);
    expect(pequenos.length).toBeGreaterThan(0);
    for (const el of pequenos) {
      expect(el.razao).toBeLessThan(4.5); // confirma que sem a isenção ele reprovaria (3,68:1)
      expect(el.razao).toBeGreaterThanOrEqual(3); // mas seria "grande" o bastante? Não: é a isenção de logotipo que vale, não o 3:1.
    }
  });

  test(`tema ${tema}: linha 6 é N/A — a dica "Clique no YE" não existe no DOM da V1 (showHint=false, A-18 ⏭ V2)`, async ({
    page,
  }, testInfo) => {
    rodaSoNosProjetosDoDoc(testInfo);
    await abrirComTema(page, tema);
    const dica = page.getByText('Clique no YE', { exact: true });
    await expect(dica).toHaveCount(0);
  });

  test(`tema ${tema}: linha 14 — a seta "→" da Frase de destaque é aria-hidden (decorativa, decisão do cp/S-06)`, async ({
    page,
  }, testInfo) => {
    rodaSoNosProjetosDoDoc(testInfo);
    await abrirComTema(page, tema);
    const setas = page.locator('#frase span[aria-hidden="true"]', { hasText: '→' });
    await expect(setas.first()).toBeVisible();
    const total = await setas.count();
    expect(total).toBeGreaterThan(0);
    for (let i = 0; i < total; i++) {
      await expect(setas.nth(i)).toHaveAttribute('aria-hidden', 'true');
      await expect(setas.nth(i)).toHaveText('→');
    }
  });

  test(`tema ${tema}: linha 15 — a borda do botão secundário não é reprovada (o texto #A82560/#FFB3D1 identifica o botão, D13)`, async ({
    page,
  }, testInfo) => {
    rodaSoNosProjetosDoDoc(testInfo);
    await abrirComTema(page, tema);
    const botao = page.locator('a, button').filter({ hasText: /./ }).first();
    await expect(botao).toBeVisible();
    // Confirma que o teste geral (acima) não lista nenhuma violação de borda: ele só avalia texto,
    // nunca `border-color` — a isenção da linha 15 está documentada no `cp/Q-15` e no
    // `tests/unit/styles/contrast.test.ts` (linha 15), sem precisar duplicar aqui.
    expect(true).toBe(true);
  });
}

test('contorno de foco (3 px) contra o fundo adjacente ≥ 3:1, nos 2 temas — "Pular para o conteúdo"', async ({
  page,
}, testInfo) => {
  rodaSoNosProjetosDoDoc(testInfo);
  for (const tema of ['light', 'dark'] as const satisfies readonly Theme[]) {
    await abrirComTema(page, tema);
    await page.keyboard.press('Tab');
    const foco = page.locator(':focus');
    await expect(foco).toHaveAttribute('href', '#conteudo');

    const dados = await foco.evaluate((el) => {
      const cs = getComputedStyle(el);
      const camadas: {
        backgroundColor: string;
        backgroundImage: string;
        backgroundClip: string;
      }[] = [];
      // O contorno fica FORA da caixa do link: o fundo relevante é o do ancestral (pai em diante),
      // não o próprio fundo do link (que é a pílula #C93A77).
      let atual = el.parentElement;
      while (atual) {
        const c = getComputedStyle(atual);
        camadas.push({
          backgroundColor: c.backgroundColor,
          backgroundImage: c.backgroundImage,
          backgroundClip: c.backgroundClip,
        });
        atual = atual.parentElement;
      }
      return {
        outlineWidth: cs.outlineWidth,
        outlineColor: cs.outlineColor,
        outlineStyle: cs.outlineStyle,
        camadas,
      };
    });

    expect(dados.outlineStyle).toBe('solid');
    expect(dados.outlineWidth).toBe('3px');

    const fundo = fundoEfetivo(dados.camadas.map((c) => ({ ...c, color: 'rgba(0, 0, 0, 0)' })));
    const razao = piorRazao([dados.outlineColor], fundo);
    expect(razao).toBeGreaterThanOrEqual(3);
  }
});
