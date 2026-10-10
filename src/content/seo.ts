// SEO (C-11): metadados do `<head>`, Open Graph, JSON-LD `Person`, robots.txt e sitemap.xml.
// Fonte única dos valores. O `scripts/build-seo.mjs` carrega este módulo e grava o bloco do
// `index.html` (entre `seo:inicio` e `seo:fim`), `public/robots.txt` e `public/sitemap.xml`;
// `tests/unit/content/seo.test.ts` confere que os arquivos versionados batem com o que sai daqui.
//
// Regras (doc 05, C-11):
// - URL só de `SITE_URL` (`src/site.config.ts`, D-02). Com `SITE_URL` vazio, nada que dependa de
//   URL é publicado (og:url, og:image, canonical, linha Sitemap, `url` do JSON-LD).
// - Ícones com caminho absoluto a partir da raiz (`/favicon.svg`): o Vite prefixa o `base`
//   (`BASE_PATH`, e também o `--base` do build:pages-test).
// - Uma só `<meta name="theme-color">`, a da F-08 (fora deste bloco).
// - V1 (doc 09): só PT, sem `hreflang` e sem `og:locale:alternate` (C-03 adiada para a V2).
// - JSON-LD só com dados reais (regra de ouro): nome, URL, e-mail, LinkedIn/GitHub da capa,
//   UniCEUB e a descrição de `meta.description`. Nada de cargo, cidade, foto ou datas.
import { site } from '@/content/site';
import { pt } from '@/content/pt';
import { SITE_URL } from '@/site.config';

export interface TagSeo {
  tag: 'meta' | 'link' | 'script';
  attrs: Record<string, string>;
  /** Conteúdo de texto (só no `<script type="application/ld+json">`). */
  conteudo?: string;
}

/** Chaves permitidas no JSON-LD `Person` (passo 5 da C-11). */
export const CHAVES_JSON_LD_PERMITIDAS = [
  '@context',
  '@type',
  'name',
  'url',
  'email',
  'sameAs',
  'affiliation',
  'description',
] as const;

export type PessoaJsonLd = Partial<
  Record<(typeof CHAVES_JSON_LD_PERMITIDAS)[number], string | string[] | Record<string, string>>
>;

export function caminhoOgImage(siteUrl: string = SITE_URL): string | undefined {
  return siteUrl ? `${siteUrl}og-image.png` : undefined;
}

export function jsonLdPessoa(siteUrl: string = SITE_URL): PessoaJsonLd {
  const pessoa: PessoaJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: site.nome,
  };
  if (siteUrl) pessoa.url = siteUrl;
  pessoa.email = site.mailto;
  pessoa.sameAs = [site.linkedin, site.github];
  pessoa.affiliation = { '@type': 'CollegeOrUniversity', name: site.instituicao };
  pessoa.description = pt.meta.description;
  return pessoa;
}

/** Tags do bloco SEO do `<head>`, na ordem em que entram no `index.html`. */
export function tagsSeo(siteUrl: string = SITE_URL): TagSeo[] {
  const m = (attrs: Record<string, string>): TagSeo => ({ tag: 'meta', attrs });
  const og = (property: string, content: string): TagSeo => m({ property, content });
  const ogImage = caminhoOgImage(siteUrl);

  const tags: TagSeo[] = [m({ name: 'description', content: pt.meta.description })];
  if (siteUrl) tags.push({ tag: 'link', attrs: { rel: 'canonical', href: siteUrl } });
  tags.push(
    { tag: 'link', attrs: { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' } },
    {
      tag: 'link',
      attrs: { rel: 'icon', href: '/favicon-32.png', type: 'image/png', sizes: '32x32' },
    },
    { tag: 'link', attrs: { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' } },
    og('og:type', 'website'),
    og('og:title', pt.meta.title),
    og('og:description', pt.meta.description),
  );
  if (siteUrl) tags.push(og('og:url', siteUrl));
  if (ogImage) {
    tags.push(
      og('og:image', ogImage),
      og('og:image:width', '1200'),
      og('og:image:height', '630'),
      og('og:image:alt', pt.meta.ogAlt),
    );
  }
  tags.push(og('og:locale', 'pt_BR'), m({ name: 'twitter:card', content: 'summary_large_image' }));
  tags.push({
    tag: 'script',
    attrs: { type: 'application/ld+json' },
    conteudo: JSON.stringify(jsonLdPessoa(siteUrl)),
  });
  return tags;
}

function escaparAtributo(valor: string): string {
  return valor.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

/** HTML do bloco (sem formatação; o script passa pelo Prettier antes de gravar). */
export function htmlSeo(siteUrl: string = SITE_URL): string {
  return tagsSeo(siteUrl)
    .map(({ tag, attrs, conteudo }) => {
      const a = Object.entries(attrs)
        .map(([k, v]) => `${k}="${escaparAtributo(v)}"`)
        .join(' ');
      // `<` escapado no JSON para nunca fechar o <script> antes da hora.
      if (tag === 'script')
        return `<script ${a}>${(conteudo ?? '').replace(/</g, '\\u003c')}</script>`;
      return `<${tag} ${a} />`;
    })
    .join('\n');
}

export function robotsTxt(siteUrl: string = SITE_URL): string {
  const linhas = ['User-agent: *', 'Allow: /'];
  if (siteUrl) linhas.push(`Sitemap: ${siteUrl}sitemap.xml`);
  return `${linhas.join('\n')}\n`;
}

/** Sitemap com UMA URL (a página única). Sem `SITE_URL`, não há sitemap (`undefined`). */
export function sitemapXml(siteUrl: string = SITE_URL): string | undefined {
  if (!siteUrl) return undefined;
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    '  <url>',
    `    <loc>${siteUrl}</loc>`,
    '  </url>',
    '</urlset>',
    '',
  ].join('\n');
}

/**
 * Troca o `content` da `<meta name="description">` (chamado pelo `LanguageProvider` na troca de
 * idioma). Os metadados estáticos (OG, JSON-LD) continuam em PT.
 */
export function atualizarMetaDescription(descricao: string): void {
  // `getElementsByName` em vez de seletor com colchetes: o list-pendencias (C-12) trata qualquer
  // texto entre colchetes em src/content/ como placeholder.
  for (const el of document.getElementsByName('description')) {
    if (el.tagName === 'META') el.setAttribute('content', descricao);
  }
}
