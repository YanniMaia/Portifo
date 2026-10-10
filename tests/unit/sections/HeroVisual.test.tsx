// Testes da composição visual do hero (S-04). Medidas e cores computadas ficam no diário S-04
// (navegador). Aqui: cartões por largura (DV-9) e o cartão de código só com texto (A-15 ⏭ V2),
// ganchos `data-float` (A-11a), ligações do A-14, as props do doc 04 §4.4 (monograma, dica,
// `burstLayer`), o padrão da V1 no `Hero.tsx` (doc 09), textos do dicionário e o contrato do CSS.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PRESETS_DE_FLUTUACAO } from '@/components/decor/float/presets';
import { CAIXAS_PROPOSTAS } from '@/components/decor/HeroLinks';
import { en } from '@/content/en';
import { pt } from '@/content/pt';
import { site } from '@/content/site';
import { Hero } from '@/sections/Hero/Hero';
import { HeroVisual } from '@/sections/Hero/HeroVisual';
import { renderWithProviders } from '../support/render';

const ler = (arquivo: string) =>
  readFileSync(resolve(process.cwd(), arquivo), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

/** Texto de teste do cartão de código (o real virá do `decorTexts.ts` do A-15, na V2). */
const CODIGO = 'SELECT 1;';

/** `matchMedia` que responde às queries de largura como uma janela de `px` de largura. */
function janela(px: number) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (query: string): MediaQueryList => {
      const min = /min-width:\s*(\d+)px/.exec(query);
      return {
        matches: min ? px >= Number(min[1]) : false,
        media: query,
        onchange: null,
        addListener: () => undefined,
        removeListener: () => undefined,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        dispatchEvent: () => false,
      };
    },
  });
}

const visual = () => document.querySelector('[data-hero-visual]') as HTMLElement;
const nomesFlutuantes = () =>
  [...document.querySelectorAll('[data-float]')].map((el) => el.getAttribute('data-float'));

describe('HeroVisual (S-04): cartões flutuantes e ganchos data-float', () => {
  it('≥ 640 px com o texto do código: 4 cartões (lock, database, chart, code) e 4 ligações', () => {
    janela(1280);
    renderWithProviders(<HeroVisual codeText={CODIGO} />);
    expect(nomesFlutuantes()).toEqual(['lock', 'database', 'chart', 'code']);
    const codigo = document.querySelector('[data-float="code"]') as HTMLElement;
    expect(codigo).toHaveTextContent(CODIGO);
    expect(codigo.style.width).toBe('212px'); // DV-8
    expect(codigo.style.height).toBe('60px');
    expect(document.querySelectorAll('[data-decor="network"] line')).toHaveLength(4);
  });

  it('tablet (768) com o texto do código: também 4 cartões', () => {
    janela(768);
    renderWithProviders(<HeroVisual codeText={CODIGO} />);
    expect(nomesFlutuantes()).toHaveLength(4);
  });

  it('celular (390): 3 cartões, sem o de código, e 3 ligações (DV-9)', () => {
    janela(390);
    renderWithProviders(<HeroVisual codeText={CODIGO} />);
    expect(nomesFlutuantes()).toEqual(['lock', 'database', 'chart']);
    expect(screen.queryByText(CODIGO)).toBeNull();
    expect(document.querySelector('[data-card="code"]')).toBeNull();
    expect(document.querySelectorAll('[data-decor="network"] line')).toHaveLength(3);
  });

  it('V1 (sem texto do A-15): o cartão de código não existe nem no desktop', () => {
    janela(1440);
    renderWithProviders(<HeroVisual />);
    expect(nomesFlutuantes()).toEqual(['lock', 'database', 'chart']);
    expect(document.querySelectorAll('[data-decor="network"] line')).toHaveLength(3);
  });

  it('os nomes do data-float são os presets do A-11a e nenhum cartão define duração/amplitude', () => {
    janela(1280);
    renderWithProviders(<HeroVisual codeText={CODIGO} />);
    for (const el of document.querySelectorAll<HTMLElement>('[data-float]')) {
      expect(Object.keys(PRESETS_DE_FLUTUACAO)).toContain(el.getAttribute('data-float'));
      expect(el.getAttribute('style')).not.toMatch(/--float|animation|transform/);
    }
  });

  it('posições = caixas propostas do A-14 (left/top, sem transform)', () => {
    janela(1280);
    renderWithProviders(<HeroVisual codeText={CODIGO} />);
    for (const nome of ['lock', 'database', 'chart', 'code'] as const) {
      const el = document.querySelector<HTMLElement>(`[data-float="${nome}"]`) as HTMLElement;
      const caixa = CAIXAS_PROPOSTAS[nome];
      expect(el.style.left).toBe(`${caixa.x}px`);
      expect(el.style.top).toBe(`${caixa.y}px`);
      expect(el.style.width).toBe(`${caixa.largura}px`);
      expect(el.style.height).toBe(`${caixa.altura}px`);
    }
  });

  it('ícones de 32 px (cadeado, banco de dados, gráfico), decorativos', () => {
    janela(1280);
    renderWithProviders(<HeroVisual />);
    for (const el of document.querySelectorAll('[data-float]')) {
      const svg = el.querySelector('svg') as SVGElement;
      expect(svg).toHaveAttribute('data-icon-size', '32');
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    }
  });
});

describe('HeroVisual (S-04): monograma, dica e burstLayer (doc 04 §4.4)', () => {
  it('sem props: o monograma é <button> focável com o aria-label do C-02 e a dica aparece', async () => {
    const usuario = userEvent.setup();
    renderWithProviders(<HeroVisual />);
    const botao = screen.getByRole('button', { name: pt.hero.monogramaAria });
    expect(botao).toHaveTextContent(site.iniciais);
    await usuario.tab();
    expect(botao).toHaveFocus();
    const dica = screen.getByText(pt.hero.dicaMonograma);
    expect(dica.tagName).toBe('P');
    expect(dica.closest('[aria-hidden="true"]')).toBeNull();
  });

  it('sem onMonogramActivate, o botão existe e o clique não quebra nada (gancho inerte)', async () => {
    const usuario = userEvent.setup();
    renderWithProviders(<HeroVisual />);
    await usuario.click(screen.getByRole('button', { name: pt.hero.monogramaAria }));
    expect(screen.getByRole('button', { name: pt.hero.monogramaAria })).toBeInTheDocument();
  });

  it('com onMonogramActivate: clique, Enter e Espaço chamam a função', async () => {
    const usuario = userEvent.setup();
    const ativar = vi.fn();
    renderWithProviders(<HeroVisual onMonogramActivate={ativar} />);
    const botao = screen.getByRole('button', { name: pt.hero.monogramaAria });
    await usuario.click(botao);
    expect(ativar).toHaveBeenCalledTimes(1);
    botao.focus();
    await usuario.keyboard('{Enter}');
    expect(ativar).toHaveBeenCalledTimes(2);
    await usuario.keyboard(' ');
    expect(ativar).toHaveBeenCalledTimes(3);
  });

  it('monogramInteractive={false}: sem botão, nada focável, monograma decorativo e sem dica', async () => {
    const usuario = userEvent.setup();
    renderWithProviders(<HeroVisual monogramInteractive={false} />);
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.queryByText(pt.hero.dicaMonograma)).toBeNull();
    const ye = within(visual()).getByText(site.iniciais);
    expect(ye.closest('[aria-hidden="true"]')).not.toBeNull();
    await usuario.tab();
    expect(document.body).toHaveFocus();
  });

  it('showHint={false}: só a dica some (o botão continua)', () => {
    renderWithProviders(<HeroVisual showHint={false} />);
    expect(screen.getByRole('button', { name: pt.hero.monogramaAria })).toBeInTheDocument();
    expect(screen.queryByText(pt.hero.dicaMonograma)).toBeNull();
  });

  it('burstLayer: aparece numa camada aria-hidden quando passada; sem ela, a camada não existe', () => {
    const { unmount } = renderWithProviders(<HeroVisual />);
    const camadasAntes = visual().querySelectorAll('[aria-hidden="true"]').length;
    unmount();
    renderWithProviders(<HeroVisual burstLayer={<div data-testid="explosao" />} />);
    const explosao = screen.getByTestId('explosao');
    expect(explosao.parentElement).toHaveAttribute('aria-hidden', 'true');
    expect(visual().querySelectorAll('[aria-hidden="true"]').length).toBe(camadasAntes + 1);
    expect(document.querySelector('[data-burst-origin]')).toBeNull();
  });

  it('tudo é aria-hidden, menos o botão do monograma e a dica', () => {
    janela(1280);
    renderWithProviders(<HeroVisual codeText={CODIGO} />);
    const palco = visual().firstElementChild?.firstElementChild as HTMLElement;
    for (const filho of palco.children) {
      if (filho.contains(screen.getByRole('button'))) continue;
      expect(
        filho.closest('[aria-hidden="true"]') ?? filho.getAttribute('aria-hidden'),
      ).toBeTruthy();
    }
    expect(within(visual()).getAllByRole('button')).toHaveLength(1);
    expect(within(visual()).queryAllByRole('img')).toHaveLength(0);
  });

  it('EN troca a dica e o aria-label; o texto do código é igual nos dois idiomas', () => {
    janela(1280);
    renderWithProviders(<HeroVisual codeText={CODIGO} />, { idioma: 'en' });
    expect(screen.getByText(en.hero.dicaMonograma)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: en.hero.monogramaAria })).toBeInTheDocument();
    expect(screen.getByText(CODIGO)).toBeInTheDocument();
  });

  it('o slot do monograma aceita um retrato (P-08) no lugar do "YE"', () => {
    renderWithProviders(
      <HeroVisual monogramInteractive={false} portrait={<span data-testid="foto" />} />,
    );
    expect(screen.getByTestId('foto')).toBeInTheDocument();
    expect(within(visual()).queryByText(site.iniciais)).toBeNull();
  });
});

describe('Hero + HeroVisual (S-04): padrão da V1 (doc 09)', () => {
  it('na V1 o monograma do hero não é clicável e a dica não aparece', () => {
    renderWithProviders(<Hero />);
    expect(visual()).not.toBeNull();
    expect(within(visual()).queryByRole('button')).toBeNull();
    expect(screen.queryByText(pt.hero.dicaMonograma)).toBeNull();
    expect(nomesFlutuantes()).not.toContain('code');
  });

  it('o Hero repassa as props do §4.4 ao HeroVisual', async () => {
    const usuario = userEvent.setup();
    const ativar = vi.fn();
    renderWithProviders(
      <Hero
        monogramInteractive
        showHint
        onMonogramActivate={ativar}
        burstLayer={<div data-testid="explosao" />}
      />,
    );
    await usuario.click(screen.getByRole('button', { name: pt.hero.monogramaAria }));
    expect(ativar).toHaveBeenCalledTimes(1);
    expect(screen.getByText(pt.hero.dicaMonograma)).toBeInTheDocument();
    expect(screen.getByTestId('explosao').parentElement).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('CSS do HeroVisual e do FloatingCard (S-04)', () => {
  const css = ler('src/sections/Hero/HeroVisual.module.css');
  const cartao = ler('src/sections/Hero/FloatingCard.module.css');

  it('caixa 320 → 420 → 520 com o palco de 520 escalado por igual', () => {
    expect(css).toMatch(/\.caixa \{[^}]*--hero-escala: calc\(320 \/ 520\);[^}]*width: 320px;/);
    expect(css).toMatch(
      /@media \(min-width: 640px\) \{\s*\.caixa \{\s*--hero-escala: calc\(420 \/ 520\);\s*width: 420px;\s*height: 420px;/,
    );
    expect(css).toMatch(
      /@media \(min-width: 1024px\) \{\s*\.caixa \{\s*--hero-escala: 1;\s*width: 520px;\s*height: 520px;/,
    );
    expect(css).toMatch(
      /\.palco \{[^}]*width: 520px;[^}]*transform: scale\(var\(--hero-escala\)\);/,
    );
  });

  it('dica 14 px na cor legenda (DV-17) e fora do palco (não escala)', () => {
    expect(css).toMatch(
      /\.dica \{[^}]*color: var\(--color-text-muted\);[^}]*font-size: var\(--fs-hint\);/,
    );
    const tsx = ler('src/sections/Hero/HeroVisual.tsx');
    expect(tsx.indexOf('styles.dica')).toBeGreaterThan(tsx.lastIndexOf('styles.palco'));
  });

  it('monograma interativo: escala ≤ 1,04 só com ponteiro e sem movimento reduzido', () => {
    expect(css).toMatch(
      /@media \(hover: hover\) and \(prefers-reduced-motion: no-preference\) \{\s*\.interativo:hover \{\s*transform: scale\(1\.04\);/,
    );
    expect(css).toMatch(/\.interativo \{[^}]*cursor: pointer;/);
  });

  it('halo com --glow-deco; cartões com ícone --color-accent 32 px e código mono 12 px numa linha', () => {
    expect(css).toMatch(/\.halo \{[^}]*var\(--glow-deco\)/);
    expect(cartao).toMatch(/\.icone \{[^}]*color: var\(--color-accent\);/);
    expect(cartao).toMatch(
      /\.codigo \{[^}]*font-family: var\(--font-mono\);[^}]*font-size: var\(--fs-deco-code\);[^}]*white-space: nowrap;/,
    );
  });

  it('sem hex, sem animação própria e nenhum transform nos cartões (é da flutuação)', () => {
    for (const texto of [css, cartao]) {
      expect(texto).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
      expect(texto).not.toMatch(/animation|@keyframes/);
    }
    expect(cartao).not.toMatch(/transform|transition/);
  });

  it('nenhum texto fixo no JSX nem gancho fora do §4.4 (CC-1, CC-6)', () => {
    for (const arquivo of ['HeroVisual.tsx', 'FloatingCard.tsx']) {
      const tsx = ler(`src/sections/Hero/${arquivo}`)
        .replace(/\/\/.*$/gm, '')
        .replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
      expect(tsx).not.toMatch(/>\s*[A-Za-zÀ-ÿ0-9][^<{]*<\//);
      expect(tsx).not.toMatch(/data-reveal|data-bg-slot|data-burst-origin|data-loop/);
    }
  });
});
