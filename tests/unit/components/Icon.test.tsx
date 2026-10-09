// Testes do Icon (DS-06). Tamanho, traço absoluto, acessibilidade e a regra D3 (só lucide-react).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { ReactElement } from 'react';
import { render, screen } from '@testing-library/react';
import { BrainCircuit, Database, Moon, Sun } from 'lucide-react';
import { describe, expect, it } from 'vitest';
import { Github, Icon, ICON_STROKE, Linkedin, type IconSize } from '@/components/Icon';

const svg = (ui: ReactElement) => render(ui).container.querySelector('svg') as SVGSVGElement;

describe('Icon: tamanho e traço (§5, D3)', () => {
  it.each<[IconSize, string]>([
    [20, '2.1'],
    [24, '1.75'],
    [28, '1.5'],
    [32, '1.3125'],
  ])('size=%i → width/height iguais e stroke-width = 1,75 × 24 / size (%s)', (size, stroke) => {
    const s = svg(<Icon icon={Database} size={size} />);
    expect(s).toHaveAttribute('width', String(size));
    expect(s).toHaveAttribute('height', String(size));
    expect(s).toHaveAttribute('viewBox', '0 0 24 24');
    expect(Number(s.getAttribute('stroke-width'))).toBeCloseTo(Number(stroke), 6);
    // Traço efetivo na tela: atributo × (size / 24) = 1,75 px em qualquer tamanho.
    expect((Number(s.getAttribute('stroke-width')) * size) / 24).toBeCloseTo(ICON_STROKE, 6);
  });

  it('padrão 24 px, stroke currentColor, sem preenchimento', () => {
    const s = svg(<Icon icon={Moon} />);
    expect(s).toHaveAttribute('width', '24');
    expect(s).toHaveAttribute('stroke', 'currentColor');
    expect(s).toHaveAttribute('fill', 'none');
    expect(s).toHaveAttribute('data-icon-size', '24');
  });

  it('className do consumidor chega ao <svg>', () => {
    expect(svg(<Icon icon={Sun} className="x" />).classList.contains('x')).toBe(true);
  });
});

describe('Icon: acessibilidade (§11)', () => {
  it('sem label: decorativo (aria-hidden, focusable=false, sem role)', () => {
    const s = svg(<Icon icon={BrainCircuit} />);
    expect(s).toHaveAttribute('aria-hidden', 'true');
    expect(s).toHaveAttribute('focusable', 'false');
    expect(s).not.toHaveAttribute('role');
    expect(s).not.toHaveAttribute('aria-label');
  });

  it('com label: role="img" e nome acessível', () => {
    render(<Icon icon={Database} label="Banco de dados" />);
    const s = screen.getByRole('img', { name: 'Banco de dados' });
    expect(s).not.toHaveAttribute('aria-hidden');
  });
});

describe('Ícones de marca (marcas.ts): lucide sem LinkedIn/GitHub na 1.x', () => {
  it.each([
    ['Linkedin', Linkedin],
    ['Github', Github],
  ])('%s é de linha, grade 24, traço do Icon', (_nome, marca) => {
    const s = svg(<Icon icon={marca} size={20} />);
    expect(s).toHaveAttribute('fill', 'none');
    expect(s).toHaveAttribute('viewBox', '0 0 24 24');
    expect(Number(s.getAttribute('stroke-width'))).toBeCloseTo(2.1, 6);
    expect(s.querySelectorAll('path, rect, circle').length).toBeGreaterThan(0);
  });
});

describe('D3: nenhum ícone fora do lucide-react em src/', () => {
  const arquivos = (dir: string): string[] =>
    readdirSync(dir).flatMap((n) => {
      const p = join(dir, n);
      return statSync(p).isDirectory() ? arquivos(p) : /\.(ts|tsx)$/.test(n) ? [p] : [];
    });

  it('todo import de pacote com "icon" ou "lucide" no nome é o lucide-react', () => {
    const suspeitos: string[] = [];
    for (const f of arquivos(resolve(process.cwd(), 'src'))) {
      const texto = readFileSync(f, 'utf8');
      for (const m of texto.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
        const pacote = m[1] ?? '';
        if (pacote.startsWith('.') || pacote.startsWith('@/')) continue;
        if (/icon|lucide|feather/i.test(pacote) && pacote !== 'lucide-react') {
          suspeitos.push(`${f}: ${pacote}`);
        }
      }
    }
    expect(suspeitos).toEqual([]);
  });
});
