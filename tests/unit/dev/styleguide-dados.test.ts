// Funções puras do /__styleguide (DS-05): leitura dos tokens a partir dos próprios .css, tipo de
// medida, faixa da largura e descoberta de demos.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { ComponentType } from 'react';
import { describe, expect, it } from 'vitest';
import {
  faixaDaLargura,
  lerClassesUtilitarias,
  lerTokensDeTema,
  lerTokensDoRoot,
  listarDemos,
  medidaDoToken,
  paraKebab,
} from '@/dev/Styleguide/dados';

const ler = (caminho: string): string => readFileSync(resolve(process.cwd(), caminho), 'utf8');

describe('lerTokensDeTema (colors.css)', () => {
  const tokens = lerTokensDeTema(ler('src/styles/tokens/colors.css'));

  it('lê todos os tokens, cada um com valor claro e escuro', () => {
    expect(tokens.length).toBeGreaterThanOrEqual(55);
    for (const t of tokens) {
      expect(t.claro, t.nome).not.toBe('');
      expect(t.escuro, t.nome).not.toBe('');
    }
    const nomes = tokens.map((t) => t.nome);
    expect(new Set(nomes).size).toBe(nomes.length);
    expect(nomes[0]).toBe('--color-bg');
    expect(nomes).toContain('--deco-shape-stroke');
  });

  it('valores de várias linhas viram uma linha só', () => {
    const glow = tokens.find((t) => t.nome === '--hero-glow-1');
    expect(glow?.claro).toBe(
      'radial-gradient(circle 320px at 100% 0%, rgba(255, 220, 233, 0.7), transparent)',
    );
    expect(glow?.escuro).toBe(
      'radial-gradient(circle 320px at 100% 0%, rgba(74, 26, 51, 0.55), transparent)',
    );
  });

  it('CSS sem os blocos de tema → lista vazia', () => {
    expect(lerTokensDeTema(':root { --x: 1px; }')).toEqual([]);
  });
});

describe('lerTokensDoRoot', () => {
  it('spacing.css: só o :root de base (valores de celular)', () => {
    const tokens = lerTokensDoRoot(ler('src/styles/tokens/spacing.css'));
    const mapa = new Map(tokens.map((t) => [t.nome, t.valor]));
    expect(tokens.filter((t) => t.nome.startsWith('--space-'))).toHaveLength(10);
    expect(mapa.get('--gutter')).toBe('20px');
    expect(mapa.get('--section-py')).toBe('64px');
  });

  it('typography.css (tokens): famílias e tamanhos de celular', () => {
    const mapa = new Map(
      lerTokensDoRoot(ler('src/styles/tokens/typography.css')).map((t) => [t.nome, t.valor]),
    );
    expect(mapa.get('--fs-h1')).toBe('40px');
    expect(mapa.get('--font-mono')).toMatch(/^'JetBrains Mono'/);
  });
});

describe('lerClassesUtilitarias (typography.css)', () => {
  it('as 9 classes .t-* do §4.5, na ordem do arquivo', () => {
    expect(lerClassesUtilitarias(ler('src/styles/typography.css'))).toEqual([
      't-h1',
      't-h2',
      't-h3',
      't-hero-sub',
      't-body',
      't-lead',
      't-caption',
      't-eyebrow',
      't-mono',
    ]);
  });
});

describe('medidaDoToken', () => {
  it.each([
    ['--color-bg', '#ffffff', 'background-color'],
    ['--glass-bg', 'rgba(255, 255, 255, 0.65)', 'background-color'],
    ['--gradient-text', 'linear-gradient(135deg, #e0518a, #a82560)', 'background-image'],
    [
      '--hero-glow-2',
      'radial-gradient(circle 240px at 0% 100%, #ffeef4, transparent)',
      'background-image',
    ],
    ['--shadow-card', '0 8px 28px rgba(201, 58, 119, 0.08)', 'box-shadow'],
    ['--glass-blur', '16px', 'valor'],
    ['--dur-fast', '200ms', 'valor'],
  ])('%s → %s', (nome, valor, medida) => {
    expect(medidaDoToken(nome, valor)).toBe(medida);
  });
});

describe('faixaDaLargura (§4.3)', () => {
  it.each([
    [360, 'celular'],
    [639, 'celular'],
    [640, 'tablet'],
    [1023, 'tablet'],
    [1024, 'desktop'],
    [1439, 'desktop'],
    [1440, 'grande'],
  ])('%i px → %s', (largura, faixa) => {
    expect(faixaDaLargura(largura)).toBe(faixa);
  });
});

describe('descoberta de demos', () => {
  const Falso: ComponentType = () => null;

  it('paraKebab', () => {
    expect(paraKebab('Button')).toBe('button');
    expect(paraKebab('ButtonLink')).toBe('button-link');
    expect(paraKebab('GlassPanel')).toBe('glass-panel');
  });

  it('um módulo por *.demo.tsx com export default, em ordem alfabética', () => {
    const demos = listarDemos({
      '/src/components/Icon/Icon.demo.tsx': { default: Falso },
      '/src/components/Button/ButtonLink.demo.tsx': { default: Falso },
      '/src/components/Button/Button.demo.tsx': { default: Falso },
      '/src/components/Chip/Chip.demo.tsx': {},
    });
    expect(demos.map((d) => [d.nome, d.id])).toEqual([
      ['Button', 'button'],
      ['ButtonLink', 'button-link'],
      ['Icon', 'icon'],
    ]);
    expect(demos[0]?.caminho).toBe('/src/components/Button/Button.demo.tsx');
  });
});
