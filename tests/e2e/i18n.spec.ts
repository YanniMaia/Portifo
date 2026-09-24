// Idioma no navegador de verdade (F-10): o LanguageProvider do bundle troca `<html lang>`,
// `document.title` e `ye-lang`; recarregar com `ye-lang=en` já nasce em EN.
//
// Ainda não existe botão PT/EN (ele vem no DS-20). Como no `theme-persist.spec.ts` (F-09), o teste
// acha o valor do contexto na árvore de fibras do React (a partir do `#root`) e usa o `toggleLang()`
// REAL do bundle, sem gancho de teste no código de produção. É acesso a detalhe interno do React,
// aceitável só até o botão existir: o Q-02/A-09 trocam por um clique no botão do DS-20.
import { expect, test, type Page } from '@playwright/test';

type Acao = 'alternar' | 'ler';

/** Acha o valor do LanguageContext; `alternar` chama `toggleLang()`, `ler` devolve o `lang`. */
async function idiomaDoContexto(page: Page, acao: Acao): Promise<string> {
  return page.evaluate((acao) => {
    const raiz = document.getElementById('root');
    if (!raiz) throw new Error('#root não encontrado');
    const chave = Object.keys(raiz).find((k) => k.startsWith('__reactContainer$'));
    if (!chave) throw new Error('raiz do React não encontrada');

    interface Valor {
      lang?: unknown;
      toggleLang?: unknown;
    }
    interface Fibra {
      child: Fibra | null;
      sibling: Fibra | null;
      stateNode?: { current?: Fibra } | null;
      memoizedProps: { value?: Valor } | null;
    }
    const hostRoot = (raiz as unknown as Record<string, Fibra | undefined>)[chave];
    const inicio = hostRoot?.stateNode?.current;
    if (!inicio) throw new Error('fibra raiz do React não encontrada');
    const pilha: Fibra[] = [inicio];
    while (pilha.length > 0) {
      const fibra = pilha.pop();
      if (!fibra) continue;
      const valor = fibra.memoizedProps?.value;
      if (valor && typeof valor.toggleLang === 'function') {
        if (acao === 'alternar') (valor.toggleLang as () => void)();
        return String(valor.lang);
      }
      if (fibra.sibling) pilha.push(fibra.sibling);
      if (fibra.child) pilha.push(fibra.child);
    }
    throw new Error('LanguageProvider não encontrado na árvore do React');
  }, acao);
}

async function abrir(page: Page): Promise<void> {
  await page.goto('./');
  await page.waitForLoadState('networkidle');
}

const html = (page: Page) => page.locator('html');

test('toggleLang troca lang, título e ye-lang; recarregar mantém; e volta para PT', async ({
  page,
}) => {
  const erros: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') erros.push(m.text());
  });
  page.on('pageerror', (e) => erros.push(e.message));

  await abrir(page);
  await expect(html(page)).toHaveAttribute('lang', 'pt-BR');
  await expect(page).toHaveTitle('Yanni Elyssa | Portfólio');
  expect(await idiomaDoContexto(page, 'ler')).toBe('pt');

  await idiomaDoContexto(page, 'alternar');
  await expect(html(page)).toHaveAttribute('lang', 'en');
  await expect(page).toHaveTitle('Yanni Elyssa | Portfolio');
  expect(await page.evaluate(() => localStorage.getItem('ye-lang'))).toBe('en');

  await page.reload();
  await page.waitForLoadState('networkidle');
  await expect(html(page)).toHaveAttribute('lang', 'en');
  await expect(page).toHaveTitle('Yanni Elyssa | Portfolio');
  expect(await idiomaDoContexto(page, 'ler')).toBe('en');

  await idiomaDoContexto(page, 'alternar');
  await expect(html(page)).toHaveAttribute('lang', 'pt-BR');
  await expect(page).toHaveTitle('Yanni Elyssa | Portfólio');
  expect(await page.evaluate(() => localStorage.getItem('ye-lang'))).toBe('pt');
  expect(erros).toEqual([]);
});

test('com ye-lang=en, o <html lang> nasce "en" e nunca passa por pt-BR', async ({ page }) => {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('ye-lang', 'en');
    } catch {
      // storage indisponível: o teste falha nas asserções abaixo
    }
    // Registra todo valor que o atributo lang assumir, desde o início do documento.
    const valores: (string | null)[] = [];
    (window as unknown as { __langs: typeof valores }).__langs = valores;
    new MutationObserver((registros) => {
      for (const r of registros) {
        valores.push((r.target as Element).getAttribute('lang'));
      }
    }).observe(document, { attributes: true, attributeFilter: ['lang'], subtree: true });
  });

  await abrir(page);
  expect(await idiomaDoContexto(page, 'ler')).toBe('en');
  await expect(html(page)).toHaveAttribute('lang', 'en');
  await expect(page).toHaveTitle('Yanni Elyssa | Portfolio');
  const langs = await page.evaluate(
    () => (window as unknown as { __langs: (string | null)[] }).__langs,
  );
  // O parser cria <html lang="pt-BR"> (sem mutação) e o script da F-08 aplica "en"; o React não
  // mexe no atributo na montagem.
  expect(langs.filter((v) => v !== 'en')).toEqual([]);
});
