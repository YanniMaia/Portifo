// Testes da Frase de destaque (S-06). Medidas e cores computadas ficam no diário S-06 (navegador).
// Aqui: id e H2, eyebrow `tone="tint"`, 3 linhas com seta `aria-hidden` + conectivo oculto, gancho
// `data-stagger="motto"` (doc 04 §4.4, A-03), troca de idioma, ocultação do apoio e o contrato do CSS.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { en } from '@/content/en';
import { pt } from '@/content/pt';
import { SECTION_IDS } from '@/content/sections';
import { LanguageContext, type LanguageContextValue } from '@/i18n/LanguageContext';
import type { Dictionary } from '@/i18n/types';
import { Motto } from '@/sections/Motto/Motto';
import { renderWithProviders } from '../support/render';

const ler = (arquivo: string) =>
  readFileSync(resolve(process.cwd(), arquivo), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

const secao = () => document.getElementById('frase') as HTMLElement;
const linhas = () => [...secao().querySelectorAll('[data-stagger-item]')] as HTMLElement[];
const linha = (i: number) => linhas()[i] as HTMLElement;

/** Texto que o leitor de tela recebe: sem o que está em `aria-hidden="true"`. */
function textoAcessivel(el: HTMLElement): string {
  const copia = el.cloneNode(true) as HTMLElement;
  copia.querySelectorAll('[aria-hidden="true"]').forEach((n) => n.remove());
  return (copia.textContent ?? '').replace(/\s+/g, ' ').trim();
}

function montarComDicionario(dict: Dictionary) {
  const valor: LanguageContextValue = {
    lang: 'pt',
    dict,
    setLang: () => undefined,
    toggleLang: () => undefined,
    isSugerido: () => false,
  };
  return render(
    <LanguageContext.Provider value={valor}>
      <Motto />
    </LanguageContext.Provider>,
  );
}

describe('Motto (S-06): estrutura', () => {
  it('<section id="frase"> do registro, tom tint, padding motto, nomeada pelo H2', () => {
    renderWithProviders(<Motto />);
    expect(SECTION_IDS).toContain('frase');
    expect(secao().tagName).toBe('SECTION');
    expect(secao()).toHaveAttribute('data-tone', 'tint');
    const h2 = within(secao()).getByRole('heading', { level: 2 });
    expect(secao()).toHaveAttribute('aria-labelledby', h2.id);
    expect(screen.getByRole('region', { name: pt.frase.eyebrow })).toBe(secao());
    expect(within(secao()).getAllByRole('heading')).toHaveLength(1);
  });

  it('o eyebrow é o do DS-09 em tone="tint", dentro do H2', () => {
    renderWithProviders(<Motto />);
    const h2 = within(secao()).getByRole('heading', { level: 2 });
    const eyebrow = h2.querySelector('.t-eyebrow') as HTMLElement;
    expect(eyebrow).toHaveAttribute('data-tone', 'tint');
    expect(eyebrow).toHaveTextContent(pt.frase.eyebrow);
  });

  it('largura máxima de 900 px (Container size="motto")', () => {
    renderWithProviders(<Motto />);
    expect(secao().querySelector('[data-size="motto"]')).not.toBeNull();
  });
});

describe('Motto (S-06): linhas, seta e conectivo', () => {
  it('3 linhas com antes → depois do C-02; a palavra depois da seta em degradê', () => {
    renderWithProviders(<Motto />);
    const pares = [pt.frase.linha1, pt.frase.linha2, pt.frase.linha3];
    expect(linhas()).toHaveLength(3);
    pares.forEach((par, i) => {
      expect(linha(i)).toHaveTextContent(par.antes);
      const depois = within(linha(i)).getByText(par.depois);
      expect(depois.className).toMatch(/text/);
    });
  });

  it('a seta é aria-hidden; o leitor lê "Conhecimento em soluções."', () => {
    renderWithProviders(<Motto />);
    for (const linha of linhas()) {
      const seta = linha.querySelector('[aria-hidden="true"]') as HTMLElement;
      expect(seta.textContent).toBe('→');
      expect(linha.querySelector('.visually-hidden')).toHaveTextContent(pt.frase.conectivo);
    }
    expect(textoAcessivel(linha(0))).toBe(
      `${pt.frase.linha1.antes} ${pt.frase.conectivo} ${pt.frase.linha1.depois}`,
    );
    expect(textoAcessivel(linha(0))).toBe('Conhecimento em soluções.');
  });

  it('EN troca as linhas e o conectivo', () => {
    renderWithProviders(<Motto />, { idioma: 'en' });
    expect(textoAcessivel(linha(1))).toBe(
      `${en.frase.linha2.antes} ${en.frase.conectivo} ${en.frase.linha2.depois}`,
    );
    expect(screen.getByRole('region', { name: en.frase.eyebrow })).toBe(secao());
  });
});

describe('Motto (S-06): gancho da cascata (doc 04 §4.4, A-03) e apoio', () => {
  it('um contêiner data-stagger="motto" com exatamente 3 filhos data-stagger-item', () => {
    renderWithProviders(<Motto />);
    const contêineres = secao().querySelectorAll('[data-stagger]');
    expect(contêineres).toHaveLength(1);
    const c = contêineres[0] as HTMLElement;
    expect(c).toHaveAttribute('data-stagger', 'motto');
    expect(c.children).toHaveLength(3);
    for (const filho of c.children) expect(filho).toHaveAttribute('data-stagger-item');
    expect(secao().querySelectorAll('[data-stagger-item]')).toHaveLength(3);
    expect(secao().querySelector('[data-reveal], [data-draw], [data-bg-slot]')).toBeNull();
  });

  it('texto de apoio presente (18 px, cor secundária, no CSS)', () => {
    renderWithProviders(<Motto />);
    expect(within(secao()).getByText(pt.frase.apoio).tagName).toBe('P');
  });

  it('sem texto de apoio, o parágrafo não existe', () => {
    montarComDicionario({ ...pt, frase: { ...pt.frase, apoio: '' } });
    expect(screen.queryByText(pt.frase.apoio)).toBeNull();
    expect(secao().querySelectorAll('p')).toHaveLength(3);
  });

  it('nada focável nem interativo', () => {
    renderWithProviders(<Motto />);
    expect(within(secao()).queryAllByRole('link')).toHaveLength(0);
    expect(within(secao()).queryAllByRole('button')).toHaveLength(0);
  });
});

describe('CSS e JSX da Frase de destaque (S-06)', () => {
  const css = ler('src/sections/Motto/Motto.module.css');

  it('linhas 48/38/30 (--fs-motto), 800, entrelinha 1,2, cor do texto', () => {
    expect(css).toMatch(
      /\.linha \{[^}]*color: var\(--color-text\);[^}]*font-size: var\(--fs-motto\);[^}]*font-weight: var\(--fw-motto\);[^}]*line-height: var\(--lh-motto\);/,
    );
  });

  it('seta #F286B0 no claro (--color-deco) e #F58FB8 no escuro (--color-accent)', () => {
    expect(css).toMatch(/\.seta \{\s*color: var\(--color-deco\);/);
    expect(css).toMatch(/\[data-theme='dark'\] \.seta \{\s*color: var\(--color-accent\);/);
  });

  it('apoio 18 px, cor secundária, 32 px abaixo', () => {
    expect(css).toMatch(
      /\.apoio \{[^}]*margin: var\(--space-8\) 0 0;[^}]*color: var\(--color-text-secondary\);[^}]*font-size: var\(--fs-lead\);/,
    );
  });

  it('sem hex, sem animação, sem transição nem transform', () => {
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(css).not.toMatch(/animation|@keyframes|transition|transform|:hover/);
  });

  it('nenhum texto fixo no JSX (CC-1)', () => {
    const tsx = ler('src/sections/Motto/Motto.tsx').replace(/\/\/.*$/gm, '');
    expect(tsx).not.toMatch(/>\s*[A-Za-zÀ-ÿ0-9][^<{]*<\//);
    expect(tsx).not.toMatch(/Conhecimento|soluções|O que me move/i);
  });
});
