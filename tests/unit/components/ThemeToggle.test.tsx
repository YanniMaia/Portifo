// Testes do ThemeToggle (DS-19). Medidas, cores, rotação e duração nos 2 temas são medidas no
// /__styleguide (diário DS-19). Aqui ficam o nome acessível, o teclado, a persistência (F-09) e o
// contrato do CSS.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ThemeToggle } from '@/components/ThemeToggle';
import { en } from '@/content/en';
import { pt } from '@/content/pt';
import { LanguageProvider } from '@/i18n/LanguageProvider';
import { THEME_STORAGE_KEY } from '@/theme/constants';
import { ThemeProvider } from '@/theme/ThemeProvider';

const ler = (arquivo: string) =>
  readFileSync(resolve(process.cwd(), arquivo), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

const html = document.documentElement;

function montar(tema: 'light' | 'dark', lang = 'pt-BR') {
  html.dataset.theme = tema;
  html.lang = lang;
  return render(
    <ThemeProvider>
      <LanguageProvider>
        <ThemeToggle />
      </LanguageProvider>
    </ThemeProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
  html.dataset.theme = 'light';
  html.lang = 'pt-BR';
});

describe('ThemeToggle', () => {
  it('claro: um <button type="button"> "Alternar para modo escuro", lua visível, sem aria-pressed', () => {
    montar('light');
    const b = screen.getByRole('button', { name: pt.a11y.themeToDark });
    expect(b).toHaveAccessibleName('Alternar para modo escuro');
    expect(b).toHaveAttribute('type', 'button');
    expect(b).not.toHaveAttribute('aria-pressed');
    expect(b.querySelector('[data-icone="lua"]')).toHaveAttribute('data-visivel', 'true');
    expect(b.querySelector('[data-icone="sol"]')).toHaveAttribute('data-visivel', 'false');
    const svgs = b.querySelectorAll('svg');
    expect(svgs).toHaveLength(2);
    for (const svg of svgs) {
      expect(svg).toHaveAttribute('width', '20');
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    }
  });

  it('escuro: "Alternar para modo claro" e sol visível', () => {
    montar('dark');
    const b = screen.getByRole('button', { name: 'Alternar para modo claro' });
    expect(b.querySelector('[data-icone="sol"]')).toHaveAttribute('data-visivel', 'true');
  });

  it('EN: rótulos equivalentes', () => {
    montar('light', 'en');
    expect(screen.getByRole('button')).toHaveAccessibleName(en.a11y.themeToDark);
  });

  it('clique alterna o tema, troca o rótulo e grava ye-theme', async () => {
    const usuario = userEvent.setup();
    montar('light');
    await usuario.click(screen.getByRole('button'));
    expect(html.dataset.theme).toBe('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(screen.getByRole('button')).toHaveAccessibleName(pt.a11y.themeToLight);
  });

  it('Tab + Enter e Tab + Espaço alternam', async () => {
    const usuario = userEvent.setup();
    montar('light');
    await usuario.tab();
    expect(screen.getByRole('button')).toHaveFocus();
    await usuario.keyboard('{Enter}');
    expect(html.dataset.theme).toBe('dark');
    await usuario.keyboard(' ');
    expect(html.dataset.theme).toBe('light');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
  });

  it('nenhum texto fixo no componente (D5)', () => {
    const tsx = ler('src/components/ThemeToggle/ThemeToggle.tsx').replace(/\/\/.*$/gm, '');
    expect(tsx).not.toMatch(/>\s*[A-Za-zÀ-ÿ0-9][^<{]*</);
  });
});

describe('CSS (DS-19, só tokens)', () => {
  const css = ler('src/components/ThemeToggle/ThemeToggle.module.css');
  const bloco = (sel: string) => {
    const i = css.indexOf(`${sel} {`);
    return i < 0 ? '' : css.slice(i, css.indexOf('}', i));
  };

  it('círculo de 44 px com --control-border, --control-bg e ícone --color-theme-icon', () => {
    const r = bloco('.toggle');
    expect(r).toContain('width: var(--touch-min);');
    expect(r).toContain('height: var(--touch-min);');
    expect(r).toContain('border-radius: 50%;');
    expect(r).toContain('border: var(--border-width) solid var(--control-border);');
    expect(r).toContain('background-color: var(--control-bg);');
    expect(r).toContain('color: var(--color-theme-icon);');
  });

  it('ícones: oculto com opacity 0 e rotate(-90deg); visível com 1 e 0deg; 250 ms', () => {
    const r = bloco('.icon');
    expect(r).toContain('opacity: 0;');
    expect(r).toContain('transform: rotate(-90deg);');
    expect(r).toMatch(
      /transform var\(--dur-base\) var\(--ease-out\),\s*opacity var\(--dur-base\) var\(--ease-out\);/,
    );
    const v = bloco(".icon[data-visivel='true']");
    expect(v).toContain('opacity: 1;');
    expect(v).toContain('transform: rotate(0deg);');
  });

  it('hover (D): --color-fill-soft dentro de @media (hover: hover)', () => {
    expect(css).toMatch(
      /@media \(hover: hover\) \{\s*\.toggle:hover \{\s*background-color: var\(--color-fill-soft\);/,
    );
  });

  it('movimento reduzido: sem rotação', () => {
    expect(css).toMatch(
      /@media \(prefers-reduced-motion: reduce\) \{\s*\.icon \{\s*transform: none;/,
    );
  });

  it('durante a troca de tema, a transição do ícone vence a regra global .theme-transition *', () => {
    const r = bloco("[class~='theme-transition'] .icon");
    expect(r).toMatch(/transform var\(--dur-base\) var\(--ease-out\)/);
    expect(r).toMatch(/opacity var\(--dur-base\) var\(--ease-out\)/);
    expect(r).toContain('!important');
  });

  it('sem hex', () => {
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });
});
