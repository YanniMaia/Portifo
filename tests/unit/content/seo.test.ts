// SEO (C-11): o que src/content/seo.ts gera e os arquivos versionados que saem dele
// (bloco do index.html, public/robots.txt, public/sitemap.xml). Q-21 testa o dist/ depois.
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { act, renderHook } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { en } from '@/content/en';
import { pt } from '@/content/pt';
import {
  CHAVES_JSON_LD_PERMITIDAS,
  atualizarMetaDescription,
  jsonLdPessoa,
  robotsTxt,
  sitemapXml,
  tagsSeo,
} from '@/content/seo';
import { site } from '@/content/site';
import { LanguageProvider } from '@/i18n/LanguageProvider';
import { useLanguage } from '@/i18n/useLanguage';
import { SITE_URL } from '@/site.config';

const raiz = (p: string): string => resolve(process.cwd(), p);
const ler = (p: string): string => readFileSync(raiz(p), 'utf8');
const html = ler('index.html');
const doc = new DOMParser().parseFromString(html, 'text/html');

function seletor(tag: string, attrs: Record<string, string>): string {
  const chave = 'property' in attrs ? 'property' : 'name' in attrs ? 'name' : 'rel';
  const extra = attrs.type && tag === 'link' ? `[type="${attrs.type}"]` : '';
  return `${tag}[${chave}="${attrs[chave]}"]${extra}`;
}

describe('index.html: título, descrição e theme-color', () => {
  it('lang pt-BR, título exato e descrição exata de meta.description (Anexo A.14)', () => {
    expect(doc.documentElement.getAttribute('lang')).toBe('pt-BR');
    expect(doc.title).toBe('Yanni Elyssa | Portfólio');
    expect(doc.querySelectorAll('meta[name="description"]')).toHaveLength(1);
    expect(doc.querySelector('meta[name="description"]')?.getAttribute('content')).toBe(
      pt.meta.description,
    );
  });

  it('continua com UMA só meta theme-color (a da F-08), sem `media`', () => {
    const metas = doc.querySelectorAll('meta[name="theme-color"]');
    expect(metas).toHaveLength(1);
    expect(metas[0]?.hasAttribute('media')).toBe(false);
  });

  it('sem o favicon provisório `data:,` da F-04', () => {
    expect(doc.querySelector('link[href="data:,"]')).toBeNull();
  });
});

describe('index.html: bloco SEO igual ao que seo.ts gera (rode scripts/build-seo.mjs se falhar)', () => {
  const esperadas = tagsSeo();

  it.each(esperadas.filter((t) => t.tag !== 'script').map((t) => [seletor(t.tag, t.attrs), t]))(
    '%s',
    (sel, t) => {
      const achados = doc.querySelectorAll(sel);
      expect(achados).toHaveLength(1);
      for (const [k, v] of Object.entries(t.attrs)) {
        expect(achados[0]?.getAttribute(k), `${sel} ${k}`).toBe(v);
      }
    },
  );

  it('nenhuma meta og:/twitter: além das geradas', () => {
    const geradas = esperadas.map((t) => t.attrs.property ?? t.attrs.name).filter(Boolean);
    const presentes = [...doc.querySelectorAll('meta[property], meta[name^="twitter:"]')].map(
      (m) => m.getAttribute('property') ?? m.getAttribute('name'),
    );
    expect(presentes.sort()).toEqual(geradas.filter((n) => /^(og|twitter):/.test(n!)).sort());
  });

  it('JSON-LD do index.html = jsonLdPessoa()', () => {
    const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
    expect(scripts).toHaveLength(1);
    expect(JSON.parse(scripts[0]?.textContent ?? '')).toEqual(jsonLdPessoa());
  });

  it('URLs absolutas a partir de SITE_URL; ícones com caminho da raiz (o Vite põe o BASE_PATH)', () => {
    expect(SITE_URL).toBe('https://portfolio-yanni-elyssa.vercel.app/');
    expect(doc.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(SITE_URL);
    expect(doc.querySelector('meta[property="og:url"]')?.getAttribute('content')).toBe(SITE_URL);
    expect(doc.querySelector('meta[property="og:image"]')?.getAttribute('content')).toBe(
      `${SITE_URL}og-image.png`,
    );
    for (const link of doc.querySelectorAll('link[rel="icon"], link[rel="apple-touch-icon"]')) {
      const href = link.getAttribute('href') ?? '';
      expect(href).toMatch(/^\/[a-z0-9-]+\.(svg|png)$/);
      expect(existsSync(raiz(`public${href}`)), href).toBe(true);
    }
    expect(existsSync(raiz('public/og-image.png'))).toBe(true);
  });

  it('V1 só PT (doc 09): sem hreflang e sem og:locale:alternate', () => {
    expect(doc.querySelector('link[hreflang]')).toBeNull();
    expect(doc.querySelector('meta[property="og:locale:alternate"]')).toBeNull();
    expect(doc.querySelector('meta[property="og:locale"]')?.getAttribute('content')).toBe('pt_BR');
  });
});

describe('JSON-LD Person (regra de ouro)', () => {
  const texto = JSON.stringify(jsonLdPessoa());
  const pessoa = JSON.parse(texto) as Record<string, unknown>;

  it('JSON.parse sem erro e só com as chaves permitidas', () => {
    for (const chave of Object.keys(pessoa)) {
      expect(CHAVES_JSON_LD_PERMITIDAS as readonly string[]).toContain(chave);
    }
    for (const proibida of [
      'image',
      'jobTitle',
      'address',
      'birthDate',
      'alumniOf',
      'award',
      'hasCredential',
      'knowsAbout',
      'worksFor',
      'telephone',
    ]) {
      expect(pessoa).not.toHaveProperty(proibida);
    }
  });

  it('valores vêm de site.ts, site.config.ts e pt.ts', () => {
    expect(pessoa).toEqual({
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: site.nome,
      url: SITE_URL,
      email: site.mailto,
      sameAs: [site.linkedin, site.github],
      affiliation: { '@type': 'CollegeOrUniversity', name: 'UniCEUB' },
      description: pt.meta.description,
    });
  });
});

describe('robots.txt e sitemap.xml', () => {
  it('public/robots.txt = robotsTxt() (User-agent *, Allow /, Sitemap absoluto)', () => {
    expect(ler('public/robots.txt')).toBe(robotsTxt());
    expect(robotsTxt()).toBe(`User-agent: *\nAllow: /\nSitemap: ${SITE_URL}sitemap.xml\n`);
  });

  it('public/sitemap.xml = sitemapXml(), com UMA URL e sem hreflang', () => {
    const xml = ler('public/sitemap.xml');
    expect(xml).toBe(sitemapXml());
    expect(xml.match(/<loc>/g)).toHaveLength(1);
    expect(xml).toContain(`<loc>${SITE_URL}</loc>`);
    expect(xml).not.toMatch(/hreflang|xhtml:link/);
  });
});

describe('sem SITE_URL: nenhuma URL inventada', () => {
  const tags = tagsSeo('');

  it('sem og:url, canonical, og:image (nem relativo) e sem url no JSON-LD', () => {
    const props = tags.map((t) => t.attrs.property ?? t.attrs.rel ?? t.attrs.name);
    expect(props).not.toContain('og:url');
    expect(props).not.toContain('canonical');
    expect(props.filter((p) => p?.startsWith('og:image'))).toEqual([]);
    expect(jsonLdPessoa('')).not.toHaveProperty('url');
    for (const t of tags) {
      for (const v of Object.values(t.attrs)) expect(v).not.toMatch(/og-image/);
    }
  });

  it('robots sem a linha Sitemap e sem sitemap.xml', () => {
    expect(robotsTxt('')).toBe('User-agent: *\nAllow: /\n');
    expect(sitemapXml('')).toBeUndefined();
  });
});

describe('meta description acompanha o idioma (passo 7)', () => {
  let meta: HTMLMetaElement;

  function prepararHead(): void {
    meta = document.createElement('meta');
    meta.name = 'description';
    meta.content = pt.meta.description;
    document.head.append(meta);
  }

  afterEach(() => {
    meta?.remove();
    localStorage.clear();
    document.documentElement.lang = 'pt-BR';
  });

  it('atualizarMetaDescription troca o content e não falha sem a meta', () => {
    prepararHead();
    atualizarMetaDescription('x');
    expect(meta.content).toBe('x');
    meta.remove();
    expect(() => atualizarMetaDescription('y')).not.toThrow();
  });

  it('em EN a descrição é a EN; voltando a PT, restaura', () => {
    prepararHead();
    document.documentElement.lang = 'pt-BR';
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(LanguageProvider, null, children);
    const { result } = renderHook(() => useLanguage(), { wrapper });
    expect(meta.content).toBe(pt.meta.description);
    act(() => result.current.setLang('en'));
    expect(meta.content).toBe(en.meta.description);
    act(() => result.current.setLang('pt'));
    expect(meta.content).toBe(pt.meta.description);
  });

  it('montando já em EN (ye-lang=en aplicado pelo script), a descrição sai EN', () => {
    prepararHead();
    document.documentElement.lang = 'en';
    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(LanguageProvider, null, children);
    renderHook(() => useLanguage(), { wrapper });
    expect(meta.content).toBe(en.meta.description);
  });
});

describe('varredura: nenhuma URL vinda de variável de ambiente', () => {
  it.each(['src/content/seo.ts', 'scripts/build-seo.mjs', 'index.html'])('%s', (arquivo) => {
    expect(ler(arquivo)).not.toMatch(/VITE_SITE_URL|PAGES_BASE|import\.meta\.env|process\.env/);
  });
});
