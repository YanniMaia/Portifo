// Testes da ProjectIllustration (C-08; doc de design §7.8, §14, §8, §11; D11, D14). Confere:
// - proporção 4:3 exata pelo viewBox e pelo CSS; vetorial (só SVG, sem <image>);
// - nenhum <text>, título, número ou eixo dentro do SVG (regra de ouro);
// - todo fill/stroke do SVG é `var(--…)` de uma lista permitida de tokens do DS-01, definidos
//   nos dois temas (garante a versão escura e a ausência de azul/roxo);
// - role="img" + aria-label com o `alt` do Anexo A.9 em pt e en;
// - legenda de reserva (PH-03) só em dev; em produção, nada no DOM;
// - não existe outra ilustração de projeto (D14), em especial `src/sections/Projects/…`.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { en } from '@/content/en';
import { pt } from '@/content/pt';

const RAIZ = process.cwd();
const html = document.documentElement;
const VARIANTES = ['estoque', 'padrao'] as const;
const LEGENDA = '[substituir por print do projeto]';

/** Tokens do DS-01 que a ilustração pode usar em `fill`/`stroke` (todos rosa, branco ou ameixa). */
const TOKENS_PERMITIDOS = [
  '--color-bg-alt',
  '--color-surface',
  '--color-border',
  '--color-fill-soft',
  '--color-deco-soft',
  '--color-deco',
  '--color-accent',
  '--glow-deco',
  '--deco-shape-stroke',
] as const;
const VALORES_PERMITIDOS = new Set<string>([...TOKENS_PERMITIDOS.map((t) => `var(${t})`), 'none']);

// `SHOW_PLACEHOLDERS` é lido de `import.meta.env.DEV` quando `flags.ts` carrega. Para simular
// dev e produção: troca o env, limpa o cache e reimporta componente e provedor juntos.
async function carregar(dev: boolean) {
  vi.stubEnv('DEV', dev);
  vi.stubEnv('PROD', !dev);
  vi.resetModules();
  const { ProjectIllustration } = await import('@/components/illustrations');
  const { LanguageProvider } = await import('@/i18n/LanguageProvider');
  const { pt: ptCarregado } = await import('@/content/pt');
  const montar = (ui: ReactElement) => render(<LanguageProvider>{ui}</LanguageProvider>);
  return { ProjectIllustration, montar, pt: ptCarregado };
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
  html.lang = 'pt-BR';
});

describe.each(VARIANTES)('ProjectIllustration variante="%s"', (variante) => {
  it('SVG 4:3 exato (viewBox 0 0 400 300), vetorial, sem <image>', async () => {
    const { ProjectIllustration, montar } = await carregar(true);
    const { container } = montar(<ProjectIllustration variante={variante} />);
    const svg = container.querySelector(':scope > div > svg') as SVGSVGElement;
    expect(svg).not.toBeNull();
    const [x, y, w, h] = (svg.getAttribute('viewBox') ?? '').split(' ').map(Number);
    expect([x, y]).toEqual([0, 0]);
    expect((w ?? 0) * 3).toBe((h ?? 0) * 4);
    expect(container.querySelector('image, img, foreignObject, canvas')).toBeNull();
  });

  it('nenhum <text>, título, número ou eixo dentro do SVG', async () => {
    const { ProjectIllustration, montar } = await carregar(true);
    const { container } = montar(<ProjectIllustration variante={variante} />);
    const svg = container.querySelector('svg') as SVGSVGElement;
    expect(svg.querySelector('text, tspan, textPath, title, desc, foreignObject')).toBeNull();
    expect(svg.querySelector('line')).toBeNull();
    expect(svg.textContent).toBe('');
    expect(container.textContent ?? '').not.toMatch(/\d/);
  });

  it('todo fill/stroke é var(--…) de token permitido do DS-01', async () => {
    const { ProjectIllustration, montar } = await carregar(true);
    const { container } = montar(<ProjectIllustration variante={variante} />);
    const svg = container.querySelector('svg') as SVGSVGElement;
    const usados = new Set<string>();
    let comCor = 0;
    for (const el of svg.querySelectorAll('*')) {
      for (const attr of ['fill', 'stroke', 'stop-color', 'color']) {
        const valor = el.getAttribute(attr);
        if (valor === null) continue;
        comCor += 1;
        expect(VALORES_PERMITIDOS, `${el.tagName} ${attr}="${valor}"`).toContain(valor);
        usados.add(valor);
      }
      expect(el.getAttribute('style') ?? '').not.toMatch(/#|rgb|hsl/i);
    }
    expect(comCor).toBeGreaterThan(5);
    // Os mini gráficos aninhados (A-17) não têm cor em atributo: vêm das classes com tokens.
    for (const el of svg.querySelectorAll('[data-decor="chart"] *')) {
      expect(el.getAttribute('fill')).toBeNull();
      expect(el.getAttribute('stroke')).toBeNull();
    }
    expect(usados.size).toBeGreaterThan(3);
  });

  it('role="img" + aria-label com o alt do Anexo A.9 (pt)', async () => {
    const { ProjectIllustration, montar } = await carregar(true);
    montar(<ProjectIllustration variante={variante} />);
    const img = screen.getByRole('img', { name: pt.projetos.alt[variante] });
    expect(img.tagName.toLowerCase()).toBe('svg');
    expect(img).not.toHaveAttribute('aria-hidden');
    expect(pt.projetos.alt[variante].trim()).not.toBe('');
  });

  it('alt em inglês quando o idioma é en', async () => {
    html.lang = 'en';
    const { ProjectIllustration, montar } = await carregar(true);
    montar(<ProjectIllustration variante={variante} />);
    expect(screen.getByRole('img', { name: en.projetos.alt[variante] })).toBeInTheDocument();
    expect(en.projetos.alt[variante]).not.toBe(pt.projetos.alt[variante]);
  });

  it('só um role="img" (os mini gráficos aninhados continuam decorativos)', async () => {
    const { ProjectIllustration, montar } = await carregar(true);
    montar(<ProjectIllustration variante={variante} />);
    expect(screen.getAllByRole('img')).toHaveLength(1);
  });
});

describe('composição das variantes', () => {
  it('estoque: tabela estilizada + mini gráfico de barras', async () => {
    const { ProjectIllustration, montar } = await carregar(true);
    const { container } = montar(<ProjectIllustration variante="estoque" />);
    expect(container.querySelectorAll('[data-linha-tabela]').length).toBeGreaterThanOrEqual(3);
    expect(container.querySelector('[data-chart="bar"]')).not.toBeNull();
    expect(container.querySelector('[data-chart="line"]')).toBeNull();
  });

  it('padrao: grade + formas + mini gráfico de linha', async () => {
    const { ProjectIllustration, montar } = await carregar(true);
    const { container } = montar(<ProjectIllustration variante="padrao" />);
    expect(container.querySelector('[data-chart="line"]')).not.toBeNull();
    expect(container.querySelector('[data-chart="bar"]')).toBeNull();
    expect(container.querySelectorAll('svg > circle').length).toBeGreaterThanOrEqual(3);
  });
});

describe('legenda de reserva (PH-03)', () => {
  it('em dev: PlaceholderMark em bloco abaixo do SVG', async () => {
    const { ProjectIllustration, montar, pt: ptDev } = await carregar(true);
    expect(ptDev.projetos.legendaReserva).toBe(LEGENDA);
    const { container } = montar(
      <ProjectIllustration variante="estoque" legendaReserva={ptDev.projetos.legendaReserva} />,
    );
    const marca = container.querySelector('[data-placeholder]');
    expect(marca).toHaveAttribute('data-placeholder', 'block');
    expect(marca).toHaveTextContent(LEGENDA);
    expect(marca?.previousElementSibling?.tagName.toLowerCase()).toBe('svg');
    expect(marca?.className).toContain('legenda');
  });

  it('sem a prop, nenhuma legenda', async () => {
    const { ProjectIllustration, montar } = await carregar(true);
    const { container } = montar(<ProjectIllustration variante="padrao" />);
    expect(container.querySelector('[data-placeholder]')).toBeNull();
  });

  it('em produção: nenhuma legenda de reserva no DOM', async () => {
    const { ProjectIllustration, montar, pt: ptProd } = await carregar(false);
    expect(ptProd.projetos.legendaReserva).toBe('');
    for (const valor of [ptProd.projetos.legendaReserva, LEGENDA]) {
      const { container, unmount } = montar(
        <ProjectIllustration variante="estoque" legendaReserva={valor} />,
      );
      expect(container.querySelector('[data-placeholder]')).toBeNull();
      expect(container.textContent).toBe('');
      expect(container.querySelector('div')?.children).toHaveLength(1);
      unmount();
    }
  });
});

describe('CSS e tokens', () => {
  const CSS = readFileSync(
    resolve(RAIZ, 'src/components/illustrations/ProjectIllustration.module.css'),
    'utf8',
  ).replace(/\/\*[\s\S]*?\*\//g, '');
  const CORES = readFileSync(resolve(RAIZ, 'src/styles/tokens/colors.css'), 'utf8');
  const [claro, escuro] = CORES.split("[data-theme='dark']");

  it('aspect-ratio 4 / 3 no SVG; nenhum hex no CSS Module', () => {
    expect(CSS).toMatch(/\.svg\s*\{[^}]*aspect-ratio: 4 \/ 3;/);
    expect(CSS).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });

  it('legenda sem a altura de 100% do bloco do DS-21 (pendência B-03)', () => {
    expect(CSS).toMatch(/\.ilustracao \.legenda\s*\{\s*min-block-size: auto;/);
  });

  it.each(TOKENS_PERMITIDOS)('%s existe no DS-01 nos temas claro e escuro', (token) => {
    expect(claro).toContain(`${token}:`);
    expect(escuro).toContain(`${token}:`);
  });
});

describe('dona única (D14)', () => {
  function listar(dir: string): string[] {
    if (!existsSync(dir)) return [];
    return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
      e.isDirectory() ? listar(join(dir, e.name)) : [join(dir, e.name)],
    );
  }

  it('não existe src/sections/Projects/ProjectIllustration.tsx', () => {
    expect(existsSync(resolve(RAIZ, 'src/sections/Projects/ProjectIllustration.tsx'))).toBe(false);
  });

  it('nenhum outro componente de ilustração de projeto em src/', () => {
    const outros = listar(resolve(RAIZ, 'src'))
      .map((f) => relative(RAIZ, f).replaceAll('\\', '/'))
      .filter((f) => /ProjectIllustration|IlustracaoProjeto/i.test(f))
      .filter((f) => !f.startsWith('src/components/illustrations/'));
    expect(outros).toEqual([]);
  });
});
