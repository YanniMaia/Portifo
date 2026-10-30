// SEO (doc 06, Q-21): metadados, `lang`, canonical, robots, sitemap e JSON-LD `Person`, no HTML
// servido pelo `npm run preview` (build de produção, mesmo `webServer` do `playwright.config.ts`).
// D14: a C-11 PRODUZ (`src/content/seo.ts`, `scripts/build-seo.mjs`, `index.html`, `public/robots.txt`,
// `public/sitemap.xml`); esta task SÓ TESTA. Nenhum arquivo fora de `tests/` é editado aqui.
//
// Adaptações da V1 (doc 09) frente ao doc 06 original (linhas 618-642), registradas no checkpoint:
// - Passo 4 do doc 06 ("troca para EN: document.title, html lang e meta description passam às
//   chaves EN") foi PULADO de propósito: a V1 é só PT, sem botão de idioma (doc 09 §1, "a versão em
//   inglês é opcional... na V1 o site é só PT e não mostra botão PT/EN"). Não existe nenhum caminho
//   de UI para forçar EN nesta rodada, então não há nada de produção para testar nesse passo.
// - O passo 2 do doc 06 pedia também `og:locale:alternate=en_US` e, implicitamente, `hreflang`. A
//   C-11 decidiu de propósito NÃO gerar nenhum dos dois na V1 (cp/C-11, "Adaptações da V1": "Sem
//   og:locale:alternate... e sem hreflang"), porque a C-03 (traduções) está `⏭ V2`. Os testes abaixo
//   conferem exatamente o que foi implementado (ausência desses 2 itens), não o que o doc pedia
//   antes dessa decisão — isso é escopo reduzido combinado, não uma falha da C-11.
import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { pt } from '../../src/content/pt.ts';
import { CHAVES_JSON_LD_PERMITIDAS, type PessoaJsonLd } from '../../src/content/seo.ts';
import { SITE_URL } from '../../src/site.config.ts';
import { THEME_COLOR, THEME_STORAGE_KEY, type Theme } from '../../src/theme/constants.ts';

// HTML/robots.txt/sitemap.xml/dist/ são o MESMO artefato nos 6 projetos de largura (não variam com
// viewport): 1 projeto basta, como em theme-no-flash.spec.ts e pagina-404.spec.ts. O doc 06 pede
// "vp1280-claro" (linha 637) — é o escolhido.
const PROJETO_UNICO = 'vp1280-claro';
function rodaSoEm(testInfo: TestInfo, projeto: string): void {
  test.skip(testInfo.project.name !== projeto, 'HTML/robots/sitemap/dist não variam por largura');
}

async function abrirComTema(page: Page, tema: Theme): Promise<void> {
  await page.addInitScript(([chave, valor]) => localStorage.setItem(chave, valor), [
    THEME_STORAGE_KEY,
    tema,
  ] as const);
  await page.goto('./');
  await expect(page.locator('html')).toHaveAttribute('data-theme', tema);
}

test.describe('`<head>`: lang, título, descrição, canonical, theme-color', () => {
  test('html lang="pt-BR"; título exato; meta description = pt.meta.description', async ({
    page,
  }, testInfo) => {
    rodaSoEm(testInfo, PROJETO_UNICO);
    await page.goto('./');
    await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
    await expect(page).toHaveTitle(pt.meta.title);
    await expect(page.locator('meta[name="description"]')).toHaveCount(1);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      pt.meta.description,
    );
  });

  test('link rel="canonical" = SITE_URL', async ({ page }, testInfo) => {
    rodaSoEm(testInfo, PROJETO_UNICO);
    await page.goto('./');
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', SITE_URL);
  });

  // F-08 é a dona do theme-color e já tem cobertura extensa (theme-no-flash.spec.ts: anti-flash,
  // DOMContentLoaded, color-scheme efetivo). Aqui só a parte que é "critério de SEO" (doc 06, Q-21):
  // exatamente UMA meta e o valor certo nos 2 temas, sem duplicar o resto daquela suíte.
  for (const tema of ['light', 'dark'] as const satisfies readonly Theme[]) {
    test(`uma única meta theme-color, "${THEME_COLOR[tema]}" no tema ${tema}`, async ({
      page,
    }, testInfo) => {
      rodaSoEm(testInfo, PROJETO_UNICO);
      await abrirComTema(page, tema);
      await expect(page.locator('meta[name="theme-color"]')).toHaveCount(1);
      await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute(
        'content',
        THEME_COLOR[tema],
      );
    });
  }
});

test.describe('Open Graph e Twitter (só o que a C-11 implementou na V1 — sem alternate/hreflang)', () => {
  test('og:type, og:locale (sem alternate), og:title, og:description, og:url, og:image*, twitter:card', async ({
    page,
  }, testInfo) => {
    rodaSoEm(testInfo, PROJETO_UNICO);
    await page.goto('./');

    const conteudoDe = async (seletor: string): Promise<string | null> =>
      page.locator(seletor).getAttribute('content');

    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute('content', 'website');
    await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute('content', 'pt_BR');
    // Decisão da C-11 na V1: SEM og:locale:alternate (C-03, traduções, está ⏭ V2).
    await expect(page.locator('meta[property="og:locale:alternate"]')).toHaveCount(0);
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      'content',
      pt.meta.title,
    );
    await expect(page.locator('meta[property="og:description"]')).toHaveAttribute(
      'content',
      pt.meta.description,
    );
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', SITE_URL);

    const ogImage = await conteudoDe('meta[property="og:image"]');
    expect(ogImage).not.toBeNull();
    expect(ogImage).toMatch(/^https:\/\//);
    expect(ogImage).toBe(`${SITE_URL}og-image.png`);
    await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute(
      'content',
      '1200',
    );
    await expect(page.locator('meta[property="og:image:height"]')).toHaveAttribute(
      'content',
      '630',
    );
    const ogAlt = await conteudoDe('meta[property="og:image:alt"]');
    expect(ogAlt).not.toBeNull();
    expect(ogAlt?.trim().length).toBeGreaterThan(0);

    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      'content',
      'summary_large_image',
    );
  });

  test('V1 só PT: nenhum hreflang na página', async ({ page }, testInfo) => {
    rodaSoEm(testInfo, PROJETO_UNICO);
    await page.goto('./');
    await expect(page.locator('[hreflang]')).toHaveCount(0);
  });
});

test.describe('robots.txt e sitemap.xml', () => {
  test('robots.txt: 200, User-agent *, Allow /, Sitemap = SITE_URL + sitemap.xml', async ({
    request,
  }, testInfo) => {
    rodaSoEm(testInfo, PROJETO_UNICO);
    const resposta = await request.get('robots.txt');
    expect(resposta.status()).toBe(200);
    const corpo = await resposta.text();
    expect(corpo).toContain('User-agent: *');
    expect(corpo).toContain('Allow: /');
    expect(corpo).toContain(`Sitemap: ${SITE_URL}sitemap.xml`);
  });

  test('sitemap.xml: 200, uma <loc> = SITE_URL, sem hreflang', async ({ request }, testInfo) => {
    rodaSoEm(testInfo, PROJETO_UNICO);
    const resposta = await request.get('sitemap.xml');
    expect(resposta.status()).toBe(200);
    const corpo = await resposta.text();
    expect(corpo.match(/<loc>/g)).toHaveLength(1);
    expect(corpo).toContain(`<loc>${SITE_URL}</loc>`);
    expect(corpo).not.toMatch(/hreflang|xhtml:link/);
  });
});

test.describe('JSON-LD `Person`', () => {
  test('JSON.parse sem erro; @context/@type; só as chaves permitidas; nenhuma proibida', async ({
    page,
  }, testInfo) => {
    rodaSoEm(testInfo, PROJETO_UNICO);
    await page.goto('./');
    const scripts = page.locator('script[type="application/ld+json"]');
    await expect(scripts).toHaveCount(1);
    const texto = await scripts.first().textContent();
    expect(texto).not.toBeNull();

    let pessoa: PessoaJsonLd;
    expect(() => {
      pessoa = JSON.parse(texto ?? '') as PessoaJsonLd;
    }).not.toThrow();
    pessoa = JSON.parse(texto ?? '') as PessoaJsonLd;

    expect(pessoa['@context']).toBe('https://schema.org');
    expect(pessoa['@type']).toBe('Person');

    for (const chave of Object.keys(pessoa)) {
      expect(
        CHAVES_JSON_LD_PERMITIDAS as readonly string[],
        `chave inesperada: ${chave}`,
      ).toContain(chave);
    }

    const proibidas = [
      'image',
      'jobTitle',
      'address',
      'birthDate',
      'alumniOf',
      'award',
      'hasCredential',
      'knowsAbout',
    ];
    for (const chave of proibidas) {
      expect(pessoa, `chave proibida presente: ${chave}`).not.toHaveProperty(chave);
    }

    expect(pessoa.name).toBe('Yanni Elyssa');
    expect(pessoa.url).toBe(SITE_URL);
    expect(pessoa.email).toBe('mailto:yannielyssa64@gmail.com');
  });

  // Prova de que o teste acima REALMENTE falharia se uma chave proibida fosse acrescentada ao
  // JSON-LD (critério de aceite do doc 06, linha 638). Em vez de editar o index.html/dist real
  // (o que exigiria reconstruir o build dentro do próprio teste, arriscando efeito colateral em
  // outros specs que rodam em paralelo contra o MESMO servidor de preview), a prova usa a função
  // de verificação em si, com uma cópia do objeto real + a chave proibida — exercitando o mesmo
  // `expect(...).not.toHaveProperty(...)` contra um dado deliberadamente violado. A prova "ao
  // vivo" contra o arquivo real (editar `dist/index.html`, rodar, reverter) foi feita manualmente
  // à parte e está registrada, com os comandos e o resultado, no checkpoint `cp/Q-21`.
  test('prova: a asserção de chave proibida acusa se "jobTitle" for acrescentada (sintético)', () => {
    const pessoaComViolacao = {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: 'Yanni Elyssa',
      jobTitle: 'Engenheira de Dados', // dado inventado de propósito, só para a prova
    };
    expect(() => {
      expect(pessoaComViolacao).not.toHaveProperty('jobTitle');
    }).toThrow();
  });
});

// Varredura de `dist/` (depois do build do webServer): nenhuma ocorrência de `localhost`, nenhuma
// URL absoluta fora de SITE_URL além dos destinos conhecidos e inofensivos encontrados de fato no
// bundle (lista documentada abaixo e no checkpoint — cada item foi conferido lendo o dist/ real,
// não suposto):
// - a lista branca de links do Q-10 (perfil LinkedIn, perfil/repositórios GitHub da Yanni,
//   e-mail — o Q-10 ainda não existe como spec próprio nesta V1, mas a lista de destinos é a mesma);
// - "https://schema.org": `@context` do JSON-LD, não é um link clicável;
// - "http://www.w3.org/...": namespaces XML/SVG/XLink/MathML que o React-DOM minificado cita
//   literalmente (técnico, de nenhuma biblioteca ou dado da Yanni);
// - "http://www.sitemaps.org/schemas/sitemap/0.9": namespace padrão do próprio sitemap.xml;
// - "https://react.dev/errors/": link de erro interno do React (minificado), não é dado do site;
// - as 4 URLs de atribuição das licenças OFL das fontes self-hosted (D4): scripts.sil.org/OFL,
//   github.com/rsms/inter, github.com/JetBrains/JetBrainsMono, github.com/tokotype/PlusJakartaSans.
const DIST_DIR = resolve(process.cwd(), 'dist');
const EXTENSOES_TEXTO = new Set(['.html', '.js', '.css', '.txt', '.xml', '.json', '.svg']);
const PREFIXOS_PERMITIDOS = [
  SITE_URL,
  'https://www.linkedin.com/in/yanni-elyssa-48171b349',
  'https://github.com/YanniMaia', // perfil + repositórios de projetos (ainda publicado:false)
  'https://schema.org',
  'http://www.w3.org/',
  'http://www.sitemaps.org/schemas/sitemap/0.9',
  'https://react.dev/errors/',
  'http://scripts.sil.org/OFL',
  'https://github.com/rsms/inter',
  'https://github.com/JetBrains/JetBrainsMono',
  'https://github.com/tokotype/PlusJakartaSans',
];

function arquivosDeTexto(dir: string): string[] {
  const resultado: string[] = [];
  for (const nome of readdirSync(dir)) {
    const caminho = join(dir, nome);
    const info = statSync(caminho);
    if (info.isDirectory()) resultado.push(...arquivosDeTexto(caminho));
    else if (EXTENSOES_TEXTO.has(extname(nome))) resultado.push(caminho);
  }
  return resultado;
}

test.describe('grep em dist/: sem localhost; URLs absolutas só das origens conhecidas', () => {
  test('nenhuma ocorrência de "localhost" em dist/', () => {
    rodaSoEm(test.info(), PROJETO_UNICO);
    const achados: string[] = [];
    for (const arquivo of arquivosDeTexto(DIST_DIR)) {
      const conteudo = readFileSync(arquivo, 'utf8');
      if (/localhost/i.test(conteudo)) achados.push(arquivo);
    }
    expect(achados).toEqual([]);
  });

  test('toda URL absoluta em dist/ começa com SITE_URL ou é uma origem conhecida', () => {
    rodaSoEm(test.info(), PROJETO_UNICO);
    const naoPermitidas: string[] = [];
    const regexUrl = /https?:\/\/[^\s"'`<>)]+/g;
    for (const arquivo of arquivosDeTexto(DIST_DIR)) {
      const conteudo = readFileSync(arquivo, 'utf8');
      for (const [url] of conteudo.matchAll(regexUrl)) {
        if (!PREFIXOS_PERMITIDOS.some((prefixo) => url.startsWith(prefixo))) {
          naoPermitidas.push(`${arquivo}: ${url}`);
        }
      }
    }
    expect(naoPermitidas).toEqual([]);
  });
});
