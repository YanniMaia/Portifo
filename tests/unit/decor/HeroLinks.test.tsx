// Ligações do hero (A-14; doc de design §7.2; DV-8, DV-9; doc 03 S-04 passos 4 e 5). Confere:
// - prop `cards` com 3 ou 4 cartões: uma linha e dois nós de 8 px por cartão, nenhuma linha para
//   cartão ausente (o de código no celular);
// - SVG decorativo (`viewBox 0 0 520 520`, aria-hidden, focusable=false, data-decor="network");
// - ligações padrão: pontas na borda do cartão flutuante e do central, pelo espaço livre;
// - CSS: linhas de 1 px, cores por token, estático.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  CAIXAS_PROPOSTAS,
  CARTAO_CENTRAL,
  HeroLinks,
  LIGACOES_DO_HERO,
  ligacoesPara,
  type LigacaoDoHero,
} from '@/components/decor/HeroLinks';
import { FLUTUANTES_NO_CELULAR, NOMES_DE_FLUTUACAO } from '@/components/decor/float/presets';

const CSS = readFileSync(
  resolve(process.cwd(), 'src/components/decor/HeroLinks/HeroLinks.module.css'),
  'utf8',
).replace(/\/\*[\s\S]*?\*\//g, '');

type Caixa = { x: number; y: number; largura: number; altura: number };
const dentroEstrito = (p: { x: number; y: number }, c: Caixa) =>
  p.x > c.x && p.x < c.x + c.largura && p.y > c.y && p.y < c.y + c.altura;
const naBorda = (p: { x: number; y: number }, c: Caixa) => {
  const dentroFechado = p.x >= c.x && p.x <= c.x + c.largura && p.y >= c.y && p.y <= c.y + c.altura;
  return dentroFechado && !dentroEstrito(p, c);
};

describe('HeroLinks (DOM)', () => {
  it('4 cartões (desktop/tablet): 4 linhas e 8 nós de 8 px', () => {
    const { container } = render(<HeroLinks cards={LIGACOES_DO_HERO} />);
    const svg = container.querySelector('svg') as SVGSVGElement;
    expect(svg).toHaveAttribute('viewBox', '0 0 520 520');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('focusable', 'false');
    expect(svg).toHaveAttribute('data-decor', 'network');
    expect(svg.textContent).toBe('');
    expect(container.querySelectorAll('line')).toHaveLength(4);
    const nos = container.querySelectorAll('circle');
    expect(nos).toHaveLength(8);
    nos.forEach((no) => expect(Number(no.getAttribute('r')) * 2).toBe(8));
    expect(
      [...container.querySelectorAll('[data-card]')].map((g) => g.getAttribute('data-card')),
    ).toEqual(['lock', 'database', 'chart', 'code']);
  });

  it('3 cartões (celular, DV-9): nenhuma linha para o cartão de código ausente', () => {
    const { container } = render(<HeroLinks cards={ligacoesPara(FLUTUANTES_NO_CELULAR)} />);
    expect(container.querySelectorAll('line')).toHaveLength(3);
    expect(container.querySelectorAll('circle')).toHaveLength(6);
    expect(container.querySelector('[data-card="code"]')).toBeNull();
  });

  it('cartão repetido é desenhado uma vez; lista vazia não desenha nada', () => {
    const lock = LIGACOES_DO_HERO[0] as LigacaoDoHero;
    const { container, rerender } = render(<HeroLinks cards={[lock, lock]} />);
    expect(container.querySelectorAll('line')).toHaveLength(1);
    rerender(<HeroLinks cards={[]} />);
    expect(container.querySelectorAll('line')).toHaveLength(0);
  });

  it('as pontas da linha coincidem com os dois nós', () => {
    const { container } = render(<HeroLinks cards={LIGACOES_DO_HERO} />);
    for (const l of LIGACOES_DO_HERO) {
      const g = container.querySelector(`[data-card="${l.nome}"]`) as SVGGElement;
      const linha = g.querySelector('line') as SVGLineElement;
      const [a, b] = [...g.querySelectorAll('circle')];
      expect(linha.getAttribute('x1')).toBe(String(l.cartao.x));
      expect(linha.getAttribute('y2')).toBe(String(l.centro.y));
      expect(a?.getAttribute('cx')).toBe(String(l.cartao.x));
      expect(b?.getAttribute('cy')).toBe(String(l.centro.y));
    }
  });
});

describe('ligações padrão (disposição proposta no S-04)', () => {
  it('uma por cartão do A-11a, na mesma ordem; ligacoesPara filtra', () => {
    expect(LIGACOES_DO_HERO.map((l) => l.nome)).toEqual(NOMES_DE_FLUTUACAO);
    expect(ligacoesPara(['lock', 'chart']).map((l) => l.nome)).toEqual(['lock', 'chart']);
  });

  it('caixas dentro da área de 520 e sobrepondo levemente o cartão central', () => {
    for (const c of Object.values(CAIXAS_PROPOSTAS)) {
      expect(c.x).toBeGreaterThanOrEqual(0);
      expect(c.y).toBeGreaterThanOrEqual(0);
      expect(c.x + c.largura).toBeLessThanOrEqual(520);
      expect(c.y + c.altura).toBeLessThanOrEqual(520);
      const sobreX =
        Math.min(c.x + c.largura, CARTAO_CENTRAL.x + CARTAO_CENTRAL.largura) -
        Math.max(c.x, CARTAO_CENTRAL.x);
      const sobreY =
        Math.min(c.y + c.altura, CARTAO_CENTRAL.y + CARTAO_CENTRAL.altura) -
        Math.max(c.y, CARTAO_CENTRAL.y);
      expect(sobreX).toBeGreaterThan(0);
      expect(sobreY).toBeGreaterThan(0);
    }
    // DV-8: cartão de código 212 × 60.
    expect(CAIXAS_PROPOSTAS.code).toMatchObject({ largura: 212, altura: 60 });
  });

  it('cada ligação vai da borda do cartão à borda do central, sem passar por dentro de nenhum', () => {
    const caixas: Caixa[] = [...Object.values(CAIXAS_PROPOSTAS), CARTAO_CENTRAL];
    for (const l of LIGACOES_DO_HERO) {
      expect(naBorda(l.cartao, CAIXAS_PROPOSTAS[l.nome])).toBe(true);
      expect(naBorda(l.centro, CARTAO_CENTRAL)).toBe(true);
      for (let t = 0.05; t < 1; t += 0.05) {
        const p = {
          x: l.cartao.x + (l.centro.x - l.cartao.x) * t,
          y: l.cartao.y + (l.centro.y - l.cartao.y) * t,
        };
        for (const c of caixas) expect(dentroEstrito(p, c)).toBe(false);
      }
      const comprimento = Math.hypot(l.centro.x - l.cartao.x, l.centro.y - l.cartao.y);
      expect(comprimento).toBeGreaterThanOrEqual(40);
    }
  });
});

describe('HeroLinks (CSS Module)', () => {
  it('linha de 1 px em --deco-network-line que não escala; nó em --deco-node', () => {
    expect(CSS).toMatch(/\.linha\s*\{[^}]*stroke: var\(--deco-network-line\);/);
    expect(CSS).toMatch(/\.linha\s*\{[^}]*stroke-width: 1px;/);
    expect(CSS).toMatch(/\.linha\s*\{[^}]*vector-effect: non-scaling-stroke;/);
    expect(CSS).toMatch(/\.no\s*\{[^}]*fill: var\(--deco-node\);/);
    expect(CSS).toMatch(/\.links\s*\{[^}]*pointer-events: none;/);
  });

  it('estático e sem hex', () => {
    expect(CSS).not.toMatch(/animation|@keyframes|transition/);
    expect(CSS).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });
});
