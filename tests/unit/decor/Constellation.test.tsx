// Constelações (A-14; doc de design §8 "Nós de rede"; doc 04 §5 e §7). Confere o DOM (SVG
// decorativo, nós e linhas do desenho), os 4 desenhos (nós de 6–8 px, cintilar de 6–10 s com
// semente fixa) e o CSS (linhas de 1 px, só opacidade 1 → 0,5 → 1, cores por token, pausa e
// movimento reduzido). As cores computadas nos dois temas ficam no diário (prova no navegador).
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  CINTILAR_OPACIDADE_MIN,
  CONSTELACOES,
  Constellation,
  sortearCintilar,
  type DesenhoDeConstelacao,
} from '@/components/decor/Constellation';

const CSS = readFileSync(
  resolve(process.cwd(), 'src/components/decor/Constellation/Constellation.module.css'),
  'utf8',
).replace(/\/\*[\s\S]*?\*\//g, '');

const regra = (seletor: string): string => {
  const esc = seletor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?:^|\\n)${esc}\\s*\\{([^}]*)\\}`).exec(CSS)?.[1] ?? '';
};

const DESENHOS: DesenhoDeConstelacao[] = Object.values(CONSTELACOES);

describe('designs.ts', () => {
  it('2 desenhos para o hero e 2 para o contato', () => {
    expect(Object.keys(CONSTELACOES)).toEqual([
      'heroSuperiorEsquerdo',
      'heroInferiorDireito',
      'contatoSuperiorDireito',
      'contatoInferiorEsquerdo',
    ]);
    expect(new Set(DESENHOS.map((d) => d.id)).size).toBe(4);
  });

  it.each(DESENHOS.map((d) => [d.id, d] as const))(
    '%s: nós de 6–8 px dentro da caixa, ligações válidas, um cintilar por nó',
    (_id, d) => {
      expect(d.pontos.length).toBeGreaterThanOrEqual(3);
      for (const p of d.pontos) {
        expect([6, 8]).toContain(p.r * 2);
        expect(p.x - p.r).toBeGreaterThanOrEqual(0);
        expect(p.y - p.r).toBeGreaterThanOrEqual(0);
        expect(p.x + p.r).toBeLessThanOrEqual(d.largura);
        expect(p.y + p.r).toBeLessThanOrEqual(d.altura);
      }
      for (const [a, b] of d.ligacoes) {
        expect(a).not.toBe(b);
        expect(d.pontos[a]).toBeDefined();
        expect(d.pontos[b]).toBeDefined();
      }
      // Todo nó está ligado a pelo menos outro (constelação, não pontos soltos).
      const ligados = new Set(d.ligacoes.flat());
      expect(ligados.size).toBe(d.pontos.length);
      expect(d.cintilar).toHaveLength(d.pontos.length);
    },
  );

  it('cintilar: períodos entre 6 e 10 s e atraso entre −período e 0, em todos os nós', () => {
    const todos = DESENHOS.flatMap((d) => d.cintilar);
    for (const c of todos) {
      expect(c.periodoS).toBeGreaterThanOrEqual(6);
      expect(c.periodoS).toBeLessThanOrEqual(10);
      expect(c.atrasoS).toBeLessThanOrEqual(0);
      expect(c.atrasoS).toBeGreaterThanOrEqual(-c.periodoS);
    }
    // Sorteio de verdade: os nós não andam todos juntos.
    expect(new Set(todos.map((c) => c.periodoS)).size).toBeGreaterThan(todos.length / 2);
  });

  it('semente fixa: o mesmo sorteio sempre dá o mesmo resultado', () => {
    expect(sortearCintilar(42, 5)).toEqual(sortearCintilar(42, 5));
    expect(sortearCintilar(42, 5)).not.toEqual(sortearCintilar(43, 5));
    const d = CONSTELACOES.heroSuperiorEsquerdo;
    expect(sortearCintilar(1415, d.pontos.length)).toEqual(d.cintilar);
  });
});

describe('Constellation (DOM)', () => {
  const d = CONSTELACOES.contatoInferiorEsquerdo;

  it('SVG decorativo: aria-hidden, focusable=false, data-decor="network", sem texto', () => {
    const { container } = render(<Constellation desenho={d} className="extra" />);
    const svg = container.querySelector('svg') as SVGSVGElement;
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('focusable', 'false');
    expect(svg).toHaveAttribute('data-decor', 'network');
    expect(svg).toHaveAttribute('data-constellation', d.id);
    expect(svg).toHaveAttribute('viewBox', `0 0 ${d.largura} ${d.altura}`);
    expect(svg).toHaveAttribute('width', String(d.largura));
    expect(svg.getAttribute('class')?.split(' ')).toEqual(['constelacao', 'extra']);
    expect(svg.textContent).toBe('');
    expect(svg.querySelector('text, title, desc')).toBeNull();
  });

  it('uma linha por ligação e um nó por ponto, cada nó com data-loop e o próprio cintilar', () => {
    const { container } = render(<Constellation desenho={d} />);
    const linhas = container.querySelectorAll('line');
    const nos = container.querySelectorAll('circle');
    expect(linhas).toHaveLength(d.ligacoes.length);
    expect(nos).toHaveLength(d.pontos.length);
    nos.forEach((no, i) => {
      const p = d.pontos[i];
      const c = d.cintilar[i];
      expect(no).toHaveAttribute('r', String(p?.r));
      expect(no).toHaveAttribute('cx', String(p?.x));
      expect(no).toHaveAttribute('data-loop');
      expect(no.style.getPropertyValue('--twinkle-dur')).toBe(`${c?.periodoS}s`);
      expect(no.style.getPropertyValue('--twinkle-delay')).toBe(`${c?.atrasoS}s`);
    });
    const [a, b] = d.ligacoes[0] ?? [0, 0];
    expect(linhas[0]).toHaveAttribute('x1', String(d.pontos[a]?.x));
    expect(linhas[0]).toHaveAttribute('y2', String(d.pontos[b]?.y));
  });
});

describe('Constellation (CSS Module)', () => {
  const keyframes = /@keyframes\s+cintilar-no\s*\{([\s\S]*?)\n\}/.exec(CSS)?.[1] ?? '';

  it('linhas de 1 px em --deco-network-line; nós em --deco-node; sem ponteiro', () => {
    expect(regra('.ligacoes line')).toContain('stroke: var(--deco-network-line);');
    expect(regra('.ligacoes line')).toContain('stroke-width: 1px;');
    expect(regra('.no')).toContain('fill: var(--deco-node);');
    expect(regra('.constelacao')).toContain('pointer-events: none;');
  });

  it('cintilar: só opacity, 1 → 0,5 → 1', () => {
    const props = new Set([...keyframes.matchAll(/([a-z-]+)\s*:/g)].map((m) => m[1]));
    expect(props).toEqual(new Set(['opacity']));
    const valores = [...keyframes.matchAll(/opacity:\s*([\d.]+)/g)].map((m) => Number(m[1]));
    expect(Math.min(...valores)).toBe(CINTILAR_OPACIDADE_MIN);
    expect(Math.max(...valores)).toBe(1);
  });

  it('loop infinito com --ease-in-out e duração/atraso por variável com fallback (M3)', () => {
    const no = regra('.no');
    expect(no).toContain('animation-name: cintilar-no;');
    expect(no).toContain('animation-duration: var(--twinkle-dur, 8s);');
    expect(no).toContain('animation-timing-function: var(--ease-in-out);');
    expect(no).toContain('animation-delay: var(--twinkle-delay, 0s);');
    expect(no).toContain('animation-iteration-count: infinite;');
  });

  it('movimento reduzido desliga o cintilar; nenhum hex', () => {
    expect(CSS).toMatch(
      /@media \(prefers-reduced-motion: reduce\)\s*\{\s*\.no\s*\{\s*animation: none;/,
    );
    expect(CSS).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });
});
