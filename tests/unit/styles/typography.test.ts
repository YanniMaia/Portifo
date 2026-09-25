// Tipografia (DS-03; doc 02 §4.5; doc de design §4). Lê os `.css` como texto e confere:
// (1) cada token --fs-* por faixa, --fw-*, --lh-* e --ls-* contra a tabela §4.5;
// (2) as classes .t-* usam os tokens certos; (3) body/h1-h3/button (passos 3 a 5);
// (4) varredura de pesos: Inter só 400/500/600, 700/800 só com --font-display, mono só 400/500;
// (5) caixa alta só no eyebrow; (6) ordem dos imports do global.css.
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const RAIZ = process.cwd();
const SRC = resolve(RAIZ, 'src');

const semComentarios = (css: string): string => css.replace(/\/\*[\s\S]*?\*\//g, '');
const ler = (caminho: string): string => semComentarios(readFileSync(caminho, 'utf8'));

const TOKENS_CSS = ler(resolve(SRC, 'styles/tokens/typography.css'));
const TIPO_CSS = ler(resolve(SRC, 'styles/typography.css'));

const TODOS_CSS = readdirSync(SRC, { recursive: true, encoding: 'utf8' })
  .filter((f) => f.endsWith('.css'))
  .map((f) => ({
    caminho: relative(RAIZ, join(SRC, f)).replaceAll('\\', '/'),
    css: ler(join(SRC, f)),
  }));

function declaracoes(trecho: string): Map<string, string> {
  const mapa = new Map<string, string>();
  for (const m of trecho.matchAll(/([-\w]+)\s*:\s*([^;]+);/g)) {
    mapa.set(m[1] as string, (m[2] as string).trim());
  }
  return mapa;
}

function faixas(css: string): Record<'base' | 'tablet' | 'desktop', Map<string, string>> {
  const media = (px: number): Map<string, string> => {
    const re = new RegExp(
      `@media\\s*\\(min-width:\\s*${px}px\\)\\s*\\{\\s*:root\\s*\\{([^}]*)\\}\\s*\\}`,
    );
    return declaracoes(re.exec(css)?.[1] ?? '');
  };
  const semMedia = css.replace(/@media[^{]*\{\s*:root\s*\{[^}]*\}\s*\}/g, '');
  return {
    base: declaracoes(/:root\s*\{([^}]*)\}/.exec(semMedia)?.[1] ?? ''),
    tablet: media(640),
    desktop: media(1024),
  };
}

/** Blocos "folha" `seletor { declarações }` (os de dentro de @media também aparecem). */
function blocos(css: string): { seletor: string; decl: Map<string, string> }[] {
  return [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({
    seletor: (m[1] as string).trim(),
    decl: declaracoes(m[2] as string),
  }));
}

const { base, tablet, desktop } = faixas(TOKENS_CSS);
const efetivo = (token: string, faixa: 0 | 1 | 2): string | undefined => {
  if (faixa === 2 && desktop.has(token)) return desktop.get(token);
  if (faixa >= 1 && tablet.has(token)) return tablet.get(token);
  return base.get(token);
};

/** papel → [celular, tablet, desktop, peso, entrelinha] (tabela §4.5). */
const TABELA: Record<string, [string, string, string, string, string]> = {
  h1: ['40px', '52px', '68px', '800', '1.05'],
  h2: ['30px', '38px', '44px', '800', '1.15'],
  h3: ['20px', '22px', '24px', '700', '1.3'],
  'hero-sub': ['17px', '19px', '20px', '400', '1.6'],
  body: ['16px', '16px', '17px', '400', '1.7'],
  button: ['16px', '16px', '16px', '600', '1'],
  chip: ['14px', '14px', '14px', '500', '1'],
  eyebrow: ['12px', '13px', '13px', '700', '1.2'],
  motto: ['30px', '38px', '48px', '800', '1.2'],
  'featured-title': ['24px', '28px', '32px', '800', '1.2'],
  stat: ['36px', '36px', '36px', '800', '1'],
  lead: ['18px', '18px', '18px', '400', '1.7'],
  nav: ['15px', '15px', '15px', '500', '1'],
  'nav-mobile': ['20px', '20px', '20px', '500', '1'],
  logo: ['18px', '18px', '18px', '700', '1'],
  'chip-lg': ['15px', '15px', '15px', '500', '1'],
  'chip-sm': ['13px', '13px', '13px', '500', '1'],
  'pill-hero': ['13px', '13px', '13px', '500', '1'],
  badge: ['12px', '12px', '12px', '600', '1'],
  caption: ['14px', '14px', '14px', '400', '1.5'],
  hint: ['14px', '14px', '14px', '400', '1.5'],
  signature: ['16px', '16px', '16px', '400', '1.6'],
  'footer-text': ['15px', '15px', '15px', '400', '1.6'],
  'deco-code': ['12px', '12px', '12px', '400', '1.4'],
};

describe('tokens/typography.css (§4.5)', () => {
  it('famílias com as pilhas de fallback do §4.5', () => {
    expect(base.get('--font-display')).toBe(
      "'Plus Jakarta Sans', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    );
    expect(base.get('--font-body')).toBe(
      "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    );
    expect(base.get('--font-mono')).toBe(
      "'JetBrains Mono', ui-monospace, 'Cascadia Code', Consolas, monospace",
    );
  });

  it('--font-* declarados só aqui (o fonts.css não os redefine)', () => {
    const fora = TODOS_CSS.filter(
      ({ caminho, css }) =>
        caminho !== 'src/styles/tokens/typography.css' &&
        /--font-(display|body|mono)\s*:/.test(css),
    ).map((a) => a.caminho);
    expect(fora).toEqual([]);
  });

  for (const [papel, [cel, tab, desk, peso, lh]] of Object.entries(TABELA)) {
    it(`${papel}: ${cel}/${tab}/${desk}, ${peso}, ${lh}`, () => {
      const fs = `--fs-${papel}`;
      expect([efetivo(fs, 0), efetivo(fs, 1), efetivo(fs, 2)]).toEqual([cel, tab, desk]);
      expect(base.get(`--fw-${papel}`)).toBe(peso);
      expect(base.get(`--lh-${papel}`)).toBe(lh);
    });
  }

  it('peso do item ativo do menu = 600 e letter-spacing de h1 e eyebrow', () => {
    expect(base.get('--fw-nav-active')).toBe('600');
    expect(base.get('--ls-h1')).toBe('-0.02em');
    expect(base.get('--ls-eyebrow')).toBe('0.12em');
  });

  it('--fs-hint = 14px nas 3 faixas e nenhum token de 13 px para a dica (D13, DV-17)', () => {
    expect([efetivo('--fs-hint', 0), efetivo('--fs-hint', 1), efetivo('--fs-hint', 2)]).toEqual([
      '14px',
      '14px',
      '14px',
    ]);
    const hints = [...base, ...tablet, ...desktop].filter(([t]) => /hint/.test(t));
    expect(hints.filter(([t, v]) => t.startsWith('--fs-') && v !== '14px')).toEqual([]);
  });

  it('nenhum token fora da tabela e nenhuma sobrescrita órfã', () => {
    const esperados = new Set([
      '--font-display',
      '--font-body',
      '--font-mono',
      '--fw-nav-active',
      '--ls-h1',
      '--ls-eyebrow',
      ...Object.keys(TABELA).flatMap((p) => [`--fs-${p}`, `--fw-${p}`, `--lh-${p}`]),
    ]);
    expect([...base.keys()].filter((t) => !esperados.has(t))).toEqual([]);
    expect([...esperados].filter((t) => !base.has(t))).toEqual([]);
    const orfaos = [...tablet.keys(), ...desktop.keys()].filter((t) => !base.has(t));
    expect(orfaos).toEqual([]);
    const soTamanho = [...tablet.keys(), ...desktop.keys()].filter((t) => !t.startsWith('--fs-'));
    expect(soTamanho).toEqual([]);
  });
});

describe('typography.css: classes .t-* e elementos (§4.5, passos 2 a 5)', () => {
  const regras = new Map(blocos(TIPO_CSS).map((b) => [b.seletor.replace(/\s+/g, ' '), b.decl]));
  const regra = (s: string): Record<string, string> => Object.fromEntries(regras.get(s) ?? []);

  it('body: Inter, --fs-body, 1,7, --color-text, suavização (passo 3)', () => {
    expect(regra('body')).toMatchObject({
      'font-family': 'var(--font-body)',
      'font-size': 'var(--fs-body)',
      'line-height': 'var(--lh-body)',
      color: 'var(--color-text)',
      '-webkit-font-smoothing': 'antialiased',
      'text-rendering': 'optimizeLegibility',
    });
  });

  it('h1, h2, h3: display, --color-text, text-wrap: balance (passo 4)', () => {
    expect(regra('h1, h2, h3')).toEqual({
      'font-family': 'var(--font-display)',
      color: 'var(--color-text)',
      'text-wrap': 'balance',
    });
  });

  it('button sem caixa alta (passo 5)', () => {
    expect(regra('button')).toEqual({ 'text-transform': 'none' });
  });

  const CLASSES: Record<string, Record<string, string>> = {
    '.t-h1': {
      'font-family': 'var(--font-display)',
      'font-size': 'var(--fs-h1)',
      'font-weight': 'var(--fw-h1)',
      'line-height': 'var(--lh-h1)',
      'letter-spacing': 'var(--ls-h1)',
    },
    '.t-h2': {
      'font-family': 'var(--font-display)',
      'font-size': 'var(--fs-h2)',
      'font-weight': 'var(--fw-h2)',
      'line-height': 'var(--lh-h2)',
    },
    '.t-h3': {
      'font-family': 'var(--font-display)',
      'font-size': 'var(--fs-h3)',
      'font-weight': 'var(--fw-h3)',
      'line-height': 'var(--lh-h3)',
    },
    '.t-hero-sub': {
      'max-width': 'var(--measure-hero-sub)',
      'font-family': 'var(--font-body)',
      'font-size': 'var(--fs-hero-sub)',
      'font-weight': 'var(--fw-hero-sub)',
      'line-height': 'var(--lh-hero-sub)',
    },
    '.t-body': {
      'max-width': 'var(--measure-body)',
      'font-family': 'var(--font-body)',
      'font-size': 'var(--fs-body)',
      'font-weight': 'var(--fw-body)',
      'line-height': 'var(--lh-body)',
    },
    '.t-lead': {
      'font-family': 'var(--font-body)',
      'font-size': 'var(--fs-lead)',
      'font-weight': 'var(--fw-lead)',
      'line-height': 'var(--lh-lead)',
    },
    '.t-caption': {
      'font-family': 'var(--font-body)',
      'font-size': 'var(--fs-caption)',
      'font-weight': 'var(--fw-caption)',
      'line-height': 'var(--lh-caption)',
    },
    '.t-eyebrow': {
      'font-family': 'var(--font-display)',
      'font-size': 'var(--fs-eyebrow)',
      'font-weight': 'var(--fw-eyebrow)',
      'line-height': 'var(--lh-eyebrow)',
      'letter-spacing': 'var(--ls-eyebrow)',
      'text-transform': 'uppercase',
      color: 'var(--color-eyebrow)',
    },
    '.t-mono': { 'font-family': 'var(--font-mono)' },
  };

  for (const [classe, esperado] of Object.entries(CLASSES)) {
    it(`${classe} usa os tokens da tabela`, () => {
      expect(regra(classe)).toEqual(esperado);
    });
  }

  it('só as 9 classes do §4.5 existem', () => {
    const classes = [...regras.keys()].filter((s) => s.startsWith('.t-')).sort();
    expect(classes).toEqual(Object.keys(CLASSES).sort());
  });
});

describe('varredura de pesos em src/**/*.css (critério: Inter só 400/500/600)', () => {
  const pesoToken = (v: string): string => {
    const m = /^var\((--fw-[\w-]+)\)$/.exec(v);
    return m ? (base.get(m[1] as string) ?? `indefinido ${m[1]}`) : v;
  };
  const NUMERO: Record<string, string> = { normal: '400', bold: '700' };

  it('todo font-weight fora de @font-face obedece à família', () => {
    const invalidos: string[] = [];
    for (const { caminho, css } of TODOS_CSS) {
      for (const { seletor, decl } of blocos(css)) {
        if (seletor.includes('@font-face')) continue;
        const bruto = decl.get('font-weight');
        if (bruto === undefined) continue;
        const peso = NUMERO[pesoToken(bruto)] ?? pesoToken(bruto);
        const familia = decl.get('font-family') ?? 'herdada (Inter)';
        const ok =
          familia === 'var(--font-display)'
            ? ['700', '800'].includes(peso)
            : familia === 'var(--font-mono)'
              ? ['400', '500'].includes(peso)
              : ['400', '500', '600'].includes(peso);
        if (!ok) invalidos.push(`${caminho} ${seletor}: ${bruto} (${peso}) com ${familia}`);
      }
    }
    expect(invalidos).toEqual([]);
  });

  it('tokens --fw-* só com 400/500/600/700/800', () => {
    const fora = [...base].filter(
      ([t, v]) => t.startsWith('--fw-') && !['400', '500', '600', '700', '800'].includes(v),
    );
    expect(fora).toEqual([]);
  });

  it('fonts.css só declara as faces de D4 + Inter 400 itálico (R13)', () => {
    const faces = blocos(ler(resolve(SRC, 'styles/fonts.css')))
      .filter((b) => b.seletor.includes('@font-face'))
      .map(
        (b) =>
          `${b.decl.get('font-family')} ${b.decl.get('font-weight')} ${b.decl.get('font-style')}`,
      );
    expect([...new Set(faces)].sort()).toEqual(
      [
        "'Inter' 400 italic",
        "'Inter' 400 normal",
        "'Inter' 500 normal",
        "'Inter' 600 normal",
        "'JetBrains Mono' 400 normal",
        "'JetBrains Mono' 500 normal",
        "'Plus Jakarta Sans' 700 normal",
        "'Plus Jakarta Sans' 800 normal",
      ].sort(),
    );
  });
});

describe('caixa alta e ordem dos imports', () => {
  it('text-transform: uppercase só no .t-eyebrow (botões sem caixa alta, §4)', () => {
    const usos = TODOS_CSS.flatMap(({ caminho, css }) =>
      blocos(css)
        .filter((b) => b.decl.get('text-transform') === 'uppercase')
        .map((b) => `${caminho} ${b.seletor}`),
    );
    expect(usos).toEqual(['src/styles/typography.css .t-eyebrow']);
  });

  it('global.css: fontes → tokens (… motion → typography) → base → typography.css', () => {
    const global = ler(resolve(SRC, 'styles/global.css'));
    const imports = [...global.matchAll(/@import\s+['"]([^'"]+)['"]/g)].map((m) => m[1]);
    // Ordem relativa (o A-01 ainda vai inserir motion-extra.css depois de motion.css).
    const ordem = [
      './fonts.css',
      './tokens/colors.css',
      './tokens/spacing.css',
      './tokens/shape.css',
      './tokens/motion.css',
      './tokens/typography.css',
      './base.css',
      './typography.css',
    ].map((i) => imports.indexOf(i));
    expect(ordem.every((i) => i >= 0)).toBe(true);
    expect([...ordem].sort((a, b) => a - b)).toEqual(ordem);
    expect(imports.at(-1)).toBe('./typography.css');
  });
});
