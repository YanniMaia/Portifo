// Testes da Faixa de destaques (S-05). Medidas e cores computadas ficam no diário S-05 (navegador).
// Aqui: id e aria-label, itens vindos do C-06 (0, 1 e 5 projetos com repositório, por fixtures),
// gancho `data-countup` + `.visually-hidden` (doc 04 §4.4), nada focável, `data-reveal`, textos do
// dicionário e o contrato do CSS (divisórias por faixa, -48 px, sem hex nem animação).
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { PROJECTS } from '@/content/projects';
import { pt } from '@/content/pt';
import { SECTION_IDS } from '@/content/sections';
import type { Project } from '@/content/types';
import { Highlights } from '@/sections/Highlights/Highlights';
import { renderWithProviders } from '../support/render';

const ler = (arquivo: string) =>
  readFileSync(resolve(process.cwd(), arquivo), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

/** Os `n` primeiros projetos com repositório publicado (link falso, só no teste). */
function comPublicados(n: number): Project[] {
  return PROJECTS.map((p, i) =>
    i < n ? { ...p, publicado: true, linkGithub: `https://github.com/teste/repo-${i}` } : p,
  );
}

const secao = () => document.getElementById('destaques') as HTMLElement;
const itens = () => [...secao().querySelectorAll('li')];

describe('Highlights (S-05): estrutura e itens do C-06', () => {
  it('<section id="destaques"> do registro, com aria-label do C-02 e sem título visível', () => {
    renderWithProviders(<Highlights />);
    expect(SECTION_IDS).toContain('destaques');
    expect(secao().tagName).toBe('SECTION');
    expect(screen.getByRole('region', { name: pt.destaques.aria })).toBe(secao());
    expect(within(secao()).queryByRole('heading')).toBeNull();
  });

  it('dados reais de hoje (0 com repositório): 3 itens, sem o de projetos', () => {
    renderWithProviders(<Highlights />);
    expect(itens().map((li) => li.getAttribute('data-item'))).toEqual([
      'areas',
      'linguagens',
      'formacao',
    ]);
    expect(screen.queryByText(pt.destaques.projetos.legenda(2))).toBeNull();
    expect(screen.queryByText(pt.destaques.projetos.legenda(1))).toBeNull();
  });

  it('1 com repositório: 4 itens e a legenda no singular', () => {
    renderWithProviders(<Highlights projetos={comPublicados(1)} />);
    expect(itens()).toHaveLength(4);
    const projetos = secao().querySelector('[data-item="projetos"]') as HTMLElement;
    expect(projetos).toHaveTextContent(pt.destaques.projetos.legenda(1));
    expect(projetos.querySelector('[data-countup]')).toHaveAttribute('data-countup', '1');
  });

  it('5 com repositório: valor 5 e a legenda no plural, na 3ª posição', () => {
    renderWithProviders(<Highlights projetos={comPublicados(5)} />);
    expect(itens().map((li) => li.getAttribute('data-item'))).toEqual([
      'areas',
      'linguagens',
      'projetos',
      'formacao',
    ]);
    const projetos = itens()[2] as HTMLElement;
    expect(projetos.querySelector('[data-countup]')).toHaveTextContent('5');
    expect(projetos).toHaveTextContent(pt.destaques.projetos.legenda(5));
  });

  it('valores e legendas vêm do dicionário (C-02)', () => {
    renderWithProviders(<Highlights />);
    const [areas, linguagens, formacao] = itens() as unknown as [
      HTMLElement,
      HTMLElement,
      HTMLElement,
    ];
    expect(areas.querySelector('[data-countup]')).toHaveTextContent(pt.destaques.areas.valor);
    expect(areas).toHaveTextContent(pt.destaques.areas.legenda);
    expect(linguagens.querySelector('[data-countup]')).toHaveTextContent(
      pt.destaques.linguagens.valor,
    );
    expect(linguagens).toHaveTextContent(pt.destaques.linguagens.legenda);
    expect(formacao).toHaveTextContent(pt.destaques.formacao.valor);
    expect(formacao).toHaveTextContent(pt.destaques.formacao.legenda);
  });
});

describe('Highlights (S-05): gancho da contagem (doc 04 §4.4, A-04)', () => {
  it('cada valor numérico = <span aria-hidden data-countup="{n}">{n}</span> + .visually-hidden {n}', () => {
    renderWithProviders(<Highlights projetos={comPublicados(5)} />);
    for (const id of ['areas', 'linguagens', 'projetos']) {
      const li = secao().querySelector(`[data-item="${id}"]`) as HTMLElement;
      const visivel = li.querySelector('[data-countup]') as HTMLElement;
      const n = visivel.getAttribute('data-countup');
      expect(n).toMatch(/^\d+$/);
      expect(visivel.tagName).toBe('SPAN');
      expect(visivel).toHaveAttribute('aria-hidden', 'true');
      expect(visivel.textContent).toBe(n);
      const oculto = li.querySelector('.visually-hidden') as HTMLElement;
      expect(oculto.textContent).toBe(n);
      expect(oculto.closest('[aria-hidden="true"]')).toBeNull();
    }
  });

  it('o leitor de tela encontra cada número uma vez só por item', () => {
    renderWithProviders(<Highlights projetos={comPublicados(5)} />);
    for (const id of ['areas', 'linguagens', 'projetos']) {
      const li = secao().querySelector(`[data-item="${id}"]`) as HTMLElement;
      const n = (li.querySelector('[data-countup]') as HTMLElement).textContent;
      // Fora da árvore acessível: tudo o que está dentro de `aria-hidden="true"`.
      const acessiveis = within(li)
        .getAllByText(n, { exact: true })
        .filter((el) => !el.closest('[aria-hidden="true"]'));
      expect(acessiveis).toHaveLength(1);
    }
  });

  it('"UniCEUB" é texto estático: sem data-countup, sem aria-hidden, sem cópia oculta', () => {
    renderWithProviders(<Highlights />);
    const formacao = secao().querySelector('[data-item="formacao"]') as HTMLElement;
    expect(formacao.querySelector('[data-countup]')).toBeNull();
    expect(formacao.querySelector('.visually-hidden')).toBeNull();
    expect(formacao.querySelector('[aria-hidden]')).toBeNull();
    expect(within(formacao).getByText(pt.destaques.formacao.valor)).toBeInTheDocument();
  });

  it('data-countup só nos valores numéricos (3 com dados reais; 4 com projetos)', () => {
    const { unmount } = renderWithProviders(<Highlights />);
    expect(secao().querySelectorAll('[data-countup]')).toHaveLength(2);
    unmount();
    renderWithProviders(<Highlights projetos={comPublicados(3)} />);
    expect(secao().querySelectorAll('[data-countup]')).toHaveLength(3);
  });
});

describe('Highlights (S-05): interação, ganchos e textos', () => {
  it('nada focável e nenhum link ou botão', async () => {
    const usuario = userEvent.setup();
    renderWithProviders(<Highlights projetos={comPublicados(5)} />);
    expect(within(secao()).queryAllByRole('link')).toHaveLength(0);
    expect(within(secao()).queryAllByRole('button')).toHaveLength(0);
    await usuario.tab();
    expect(document.body).toHaveFocus();
  });

  it('data-reveal no contêiner de conteúdo (A-02) e nenhum gancho fora do §4.4', () => {
    renderWithProviders(<Highlights />);
    expect(secao().querySelectorAll('[data-reveal]')).toHaveLength(1);
    expect(secao().querySelector('[data-reveal] ul')).not.toBeNull();
    for (const attr of ['data-stagger', 'data-draw', 'data-bg-slot', 'data-float']) {
      expect(secao().querySelector(`[${attr}]`)).toBeNull();
    }
  });

  it('lista semântica com o vidro do DS-17', () => {
    renderWithProviders(<Highlights />);
    const lista = within(secao()).getByRole('list');
    expect(lista).toHaveAttribute('data-glass', 'glass');
    expect(within(lista).getAllByRole('listitem')).toHaveLength(3);
  });

  it('nenhum texto nem número fixo no JSX (CC-1)', () => {
    const tsx = ler('src/sections/Highlights/Highlights.tsx').replace(/\/\/.*$/gm, '');
    expect(tsx).not.toMatch(/>\s*[A-Za-zÀ-ÿ0-9][^<{]*<\//);
    expect(tsx).not.toMatch(/\b5\b/);
    expect(tsx).not.toMatch(/UniCEUB|GitHub|publicado/);
  });
});

describe('CSS da Faixa de destaques (S-05)', () => {
  const css = ler('src/sections/Highlights/Highlights.module.css');

  it('sobe 48 px sobre o hero, acima dele, sem padding superior', () => {
    expect(css).toMatch(
      /section\.highlights \{[^}]*z-index: 2;[^}]*margin-top: calc\(-1 \* var\(--space-12\)\);[^}]*padding-top: 0;/,
    );
  });

  it('valor 36 px/800 e legenda 14 px na cor secundária, 8 px abaixo', () => {
    expect(css).toMatch(
      /\.valor \{[^}]*font-size: var\(--fs-stat\);[^}]*font-weight: var\(--fw-stat\);/,
    );
    expect(css).toMatch(
      /\.legenda \{[^}]*margin-top: var\(--space-2\);[^}]*color: var\(--color-text-secondary\);[^}]*font-size: var\(--fs-caption\);/,
    );
  });

  it('padding do cartão = --card-padding (32/28/24)', () => {
    expect(css).toMatch(/\.painel \{[^}]*padding: var\(--card-padding\);/);
  });

  it('divisórias: horizontais no celular, 2 × 2 no tablet, verticais no desktop', () => {
    expect(css).toMatch(
      /@media \(max-width: 639px\) \{\s*\.item \+ \.item \{\s*border-top: var\(--border-width\) solid var\(--color-border\);/,
    );
    expect(css).toMatch(
      /@media \(min-width: 640px\) and \(max-width: 1023px\) \{\s*\.painel \{\s*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/,
    );
    expect(css).toMatch(/\.item:last-child:nth-child\(odd\) \{\s*grid-column: 1 \/ -1;/);
    expect(css).toMatch(
      /@media \(min-width: 1024px\) \{[\s\S]*grid-auto-flow: column;[\s\S]*\.item \+ \.item \{\s*border-left: var\(--border-width\) solid var\(--color-border\);/,
    );
  });

  it('sem hex, sem animação, sem transição nem hover', () => {
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(css).not.toMatch(/animation|@keyframes|transition|:hover|transform/);
  });
});
