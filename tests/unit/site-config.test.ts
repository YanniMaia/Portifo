// URL base do site (D-02, D14). `src/site.config.ts` é a ÚNICA fonte de `SITE_URL` e `BASE_PATH`:
// formato da URL, `BASE_PATH` = pathname da URL (opção A `/` ou B `/<repo>/`), sem variável de
// ambiente e sem outra fonte (`VITE_SITE_URL`, `PAGES_BASE`) no código, no Vite ou no CI.
// Nenhuma URL escrita à mão aqui: tudo é lido de `src/site.config.ts`.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { BASE_PATH, SITE_URL } from '@/site.config';

const raiz = process.cwd();
const ler = (relativo: string) => readFileSync(resolve(raiz, relativo), 'utf8');

function arquivos(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((nome) => {
    const caminho = join(dir, nome);
    return statSync(caminho).isDirectory() ? arquivos(caminho) : [caminho];
  });
}

describe('SITE_URL', () => {
  it('começa com https:// e termina com /', () => {
    expect(SITE_URL.startsWith('https://')).toBe(true);
    expect(SITE_URL.endsWith('/')).toBe(true);
  });

  it('é uma URL limpa: sem query, hash, usuário, porta nem localhost', () => {
    const url = new URL(SITE_URL);
    expect(url.protocol).toBe('https:');
    expect(url.search).toBe('');
    expect(url.hash).toBe('');
    expect(url.username).toBe('');
    expect(url.password).toBe('');
    expect(url.port).toBe('');
    expect(url.hostname).not.toMatch(/^(localhost|127\.|0\.0\.0\.0)/);
    // A URL é exatamente a forma normalizada (nada de espaço, maiúscula no host etc.).
    expect(url.href).toBe(SITE_URL);
  });
});

describe('BASE_PATH', () => {
  it('é igual a new URL(SITE_URL).pathname', () => {
    expect(BASE_PATH).toBe(new URL(SITE_URL).pathname);
  });

  it('é "/" (opção A) ou "/<repo>/" com um único segmento (opção B)', () => {
    expect(BASE_PATH).toMatch(/^\/(?:[A-Za-z0-9._-]+\/)?$/);
  });
});

describe('fonte única da URL', () => {
  it('src/site.config.ts não lê variável de ambiente nem importa outra fonte', () => {
    const fonte = ler('src/site.config.ts');
    expect(fonte).not.toMatch(/import\.meta\.env|process\.env/);
    expect(fonte).not.toMatch(/^\s*import\s/m);
  });

  it('o vite.config.ts usa base: BASE_PATH importado de src/site.config.ts', () => {
    const fonte = ler('vite.config.ts');
    expect(fonte).toMatch(
      /import\s*\{[^}]*\bBASE_PATH\b[^}]*\}\s*from\s*'\.\/src\/site\.config(\.ts)?'/,
    );
    expect(fonte).toMatch(/\bbase:\s*BASE_PATH\b/);
  });

  it('o playwright.config.ts importa BASE_PATH de src/site.config.ts', () => {
    const fonte = ler('playwright.config.ts');
    expect(fonte).toMatch(
      /import\s*\{[^}]*\bBASE_PATH\b[^}]*\}\s*from\s*'\.\/src\/site\.config(\.ts)?'/,
    );
  });

  it('nenhuma ocorrência de VITE_SITE_URL ou PAGES_BASE em src/, vite.config.ts e .github/', () => {
    const alvos = [
      ...arquivos(resolve(raiz, 'src')),
      resolve(raiz, 'vite.config.ts'),
      ...arquivos(resolve(raiz, '.github')),
    ];
    const achados = alvos
      .filter((f) => /VITE_SITE_URL|PAGES_BASE/.test(readFileSync(f, 'utf8')))
      .map((f) => f.slice(raiz.length + 1).replaceAll('\\', '/'));
    expect(achados).toEqual([]);
  });
});
