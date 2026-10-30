// Tema no navegador de verdade (F-09): o ThemeProvider do bundle troca, persiste e sobrevive ao
// recarregar; a classe `theme-transition` dura ~300 ms e some com movimento reduzido.
//
// Ainda não existe botão de tema (ele vem no DS-19/S-01). Para acionar o `toggleTheme()` REAL do
// bundle sem criar gancho de teste no código de produção, o teste acha o valor do contexto na
// árvore de fibras do React (a partir do `#root`) e chama a função. É um acesso a detalhe interno
// do React, aceitável só até o botão existir: o Q-02/A-09 trocam por um clique no botão.
import { expect, test, type Page } from '@playwright/test';

async function alternarTema(page: Page): Promise<void> {
  await page.evaluate(() => {
    const raiz = document.getElementById('root');
    if (!raiz) throw new Error('#root não encontrado');
    const chave = Object.keys(raiz).find((k) => k.startsWith('__reactContainer$'));
    if (!chave) throw new Error('raiz do React não encontrada');

    interface Fibra {
      child: Fibra | null;
      sibling: Fibra | null;
      stateNode?: { current?: Fibra } | null;
      memoizedProps: { value?: { toggleTheme?: unknown } } | null;
    }
    // A chave guarda a fibra HostRoot do momento do `createRoot`; a árvore atual está em
    // `stateNode.current` (o FiberRoot aponta sempre para a versão em uso).
    const hostRoot = (raiz as unknown as Record<string, Fibra | undefined>)[chave];
    const inicio = hostRoot?.stateNode?.current;
    if (!inicio) throw new Error('fibra raiz do React não encontrada');
    const pilha: Fibra[] = [inicio];
    while (pilha.length > 0) {
      const fibra = pilha.pop();
      if (!fibra) continue;
      const alternar = fibra.memoizedProps?.value?.toggleTheme;
      if (typeof alternar === 'function') {
        (alternar as () => void)();
        return;
      }
      if (fibra.sibling) pilha.push(fibra.sibling);
      if (fibra.child) pilha.push(fibra.child);
    }
    throw new Error('ThemeProvider não encontrado na árvore do React');
  });
}

/** Começa a registrar quando a classe `theme-transition` entra e sai do `<html>`. */
async function gravarTransicao(page: Page): Promise<void> {
  await page.evaluate(() => {
    const html = document.documentElement;
    const registro: { tipo: 'entrou' | 'saiu'; t: number }[] = [];
    let tinha = html.classList.contains('theme-transition');
    new MutationObserver(() => {
      const tem = html.classList.contains('theme-transition');
      if (tem !== tinha) {
        registro.push({ tipo: tem ? 'entrou' : 'saiu', t: performance.now() });
        tinha = tem;
      }
    }).observe(html, { attributes: true, attributeFilter: ['class'] });
    (window as unknown as { __transicao: typeof registro }).__transicao = registro;
  });
}

async function lerTransicao(page: Page) {
  return page.evaluate(
    () =>
      (window as unknown as { __transicao: { tipo: 'entrou' | 'saiu'; t: number }[] }).__transicao,
  );
}

async function abrir(page: Page): Promise<void> {
  await page.goto('./');
  await page.waitForLoadState('networkidle');
}

const html = (page: Page) => page.locator('html');
const meta = (page: Page) => page.locator('meta[name="theme-color"]');

test('toggle troca e persiste o tema; recarregar mantém a escolha', async ({ page }) => {
  const erros: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') erros.push(m.text());
  });
  page.on('pageerror', (e) => erros.push(e.message));

  await abrir(page);
  await expect(html(page)).toHaveAttribute('data-theme', 'light');

  await alternarTema(page);
  await expect(html(page)).toHaveAttribute('data-theme', 'dark');
  await expect(meta(page)).toHaveAttribute('content', '#150A10');
  expect(await page.evaluate(() => localStorage.getItem('ye-theme'))).toBe('dark');

  await page.reload();
  await page.waitForLoadState('networkidle');
  await expect(html(page)).toHaveAttribute('data-theme', 'dark');
  await expect(meta(page)).toHaveAttribute('content', '#150A10');
  await expect(html(page)).toHaveCSS('background-color', 'rgb(21, 10, 16)');

  await alternarTema(page);
  await expect(html(page)).toHaveAttribute('data-theme', 'light');
  await expect(meta(page)).toHaveAttribute('content', '#FFF7FA');
  expect(await page.evaluate(() => localStorage.getItem('ye-theme'))).toBe('light');

  await page.reload();
  await page.waitForLoadState('networkidle');
  await expect(html(page)).toHaveAttribute('data-theme', 'light');
  await expect(meta(page)).toHaveAttribute('content', '#FFF7FA');
  expect(erros).toEqual([]);
});

test('a classe theme-transition fica ~300 ms no <html> e depois some', async ({ page }) => {
  await abrir(page);
  // No carregamento a classe não aparece (o script da F-08 não usa transição).
  await expect(html(page)).not.toHaveClass(/theme-transition/);

  await gravarTransicao(page);
  await alternarTema(page);
  await expect(html(page)).toHaveAttribute('data-theme', 'dark');
  await expect(html(page)).not.toHaveClass(/theme-transition/, { timeout: 2_000 });

  const registro = await lerTransicao(page);
  expect(registro.map((r) => r.tipo)).toEqual(['entrou', 'saiu']);
  const [entrou, saiu] = registro;
  if (!entrou || !saiu) throw new Error('registro de transição incompleto');
  const duracao = saiu.t - entrou.t;
  expect(duracao).toBeGreaterThanOrEqual(250);
  // Tolerância alargada na A-20 (pendência registrada em CHECKPOINTS.md, origem S-17): o teste
  // media ≤350 ms quando a página tinha poucas seções; com as 10 seções reais do S-17, o
  // `setTimeout(300)` do ThemeProvider mede mais, por dois motivos medidos nesta rodada (não é
  // regressão de produção):
  // 1) Isolado (`--workers=1`, sem concorrência entre os 6 projetos de viewport): 363–410 ms —
  //    perto do 1,3× esperado, custo real de recálculo de estilo de uma página maior (confirmado
  //    por diagnóstico: desligar todo `backdrop-filter` via `addStyleTag` NÃO mudou o tempo, então
  //    o vidro não é a causa).
  // 2) Em paralelo (`fullyParallel: true`, os 6 projetos `vp*` disputando CPU no mesmo processo
  //    Playwright, como roda localmente e na CI): 480–880 ms, sem relação com a largura do
  //    viewport (medido 2× com valores diferentes a cada rodada) — é contenção de CPU entre
  //    instâncias de Chromium concorrentes, não custo de renderização por tamanho de tela.
  // O ajuste de produção que acompanha esta pendência (cp/A-20): excluir `[data-decor]` da
  // transição de cor em `src/styles/base.css` (eles trocam instantaneamente por decisão da
  // A-19/A-09, D14; o crossfade é da A-09, ⏭ V2) — ganho pequeno (10–40 ms) mas correto. O volume
  // restante é ambiente de teste, não produto: 1000 ms dá margem confortável acima do pior caso
  // medido (880 ms) e ainda é 5× mais estrito que o teto de segurança de 2000 ms da asserção
  // anterior (`not.toHaveClass`), então uma regressão real (temporizador preso, loop infinito)
  // continua sendo pega.
  expect(duracao).toBeLessThanOrEqual(1000);
});

test('com movimento reduzido, a classe theme-transition nunca aparece', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await abrir(page);
  await gravarTransicao(page);

  await alternarTema(page);
  await expect(html(page)).toHaveAttribute('data-theme', 'dark');
  await page.waitForTimeout(500);
  expect(await lerTransicao(page)).toEqual([]);
});

test('sem escolha manual, segue o sistema ao vivo; depois da escolha, não segue', async ({
  page,
}) => {
  await abrir(page);
  await expect(html(page)).toHaveAttribute('data-theme', 'light');

  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(html(page)).toHaveAttribute('data-theme', 'dark');
  await expect(meta(page)).toHaveAttribute('content', '#150A10');
  expect(await page.evaluate(() => localStorage.getItem('ye-theme'))).toBeNull();

  await alternarTema(page); // escolha manual: claro
  await expect(html(page)).toHaveAttribute('data-theme', 'light');
  await page.emulateMedia({ colorScheme: 'light' });
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.waitForTimeout(200);
  await expect(html(page)).toHaveAttribute('data-theme', 'light');
});
