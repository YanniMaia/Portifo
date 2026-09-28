// C-01: metadados de pendência/origem (doc 05 §4.4) e checagem de placeholders no build (§6).
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { pt } from '@/content/pt';
import { SUGERIDOS } from '@/content/sugeridos';
import {
  PENDENCIA_POR_CHAVE,
  PENDENCIA_POR_PROJETO,
  TRADUCAO_EN,
  type ChaveDicionario,
  type PendenciaId,
} from '@/content/metadados';

const fixture = JSON.parse(
  readFileSync(resolve(process.cwd(), 'tests/unit/content/fixtures/pendencias-ids.json'), 'utf8'),
) as { ids: string[] };
const IDS_DO_CHECKLIST = new Set<string>(fixture.ids);

function ehGrupo(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === 'object' && valor !== null && !Array.isArray(valor);
}

function chaves(obj: Record<string, unknown>, prefixo = ''): string[] {
  return Object.entries(obj).flatMap(([chave, valor]) => {
    const caminho = prefixo ? `${prefixo}.${chave}` : chave;
    return ehGrupo(valor) ? chaves(valor, caminho) : [caminho];
  });
}

describe('metadados de pendência (doc 05 §4.4)', () => {
  it('toda chave de SUGERIDOS tem pendência em PENDENCIA_POR_CHAVE', () => {
    for (const chave of SUGERIDOS) {
      expect(PENDENCIA_POR_CHAVE[chave], chave).toBeDefined();
    }
  });

  it('toda pendência citada existe no checklist do doc 05 §7', () => {
    const citadas: string[] = [
      ...Object.values(PENDENCIA_POR_CHAVE),
      ...Object.values(PENDENCIA_POR_PROJETO).flat(),
    ];
    for (const id of citadas) {
      expect(IDS_DO_CHECKLIST.has(id), id).toBe(true);
    }
  });

  it('o tipo PendenciaId e o fixture do checklist têm os mesmos IDs', () => {
    const todos: Record<PendenciaId, true> = {
      'P-01': true,
      'P-02': true,
      'P-03': true,
      'P-04': true,
      'P-05': true,
      'P-06': true,
      'P-07': true,
      'P-08': true,
      'P-09': true,
      'P-10': true,
      'P-11': true,
      'P-12': true,
      'P-13': true,
      'P-14': true,
      'P-15': true,
      'P-IA-1': true,
      'P-IA-2': true,
      'P-IA-3': true,
    };
    expect(Object.keys(todos).sort()).toEqual([...IDS_DO_CHECKLIST].sort());
  });

  it('as chaves dos metadados existem no dicionário pt', () => {
    const existentes = new Set(chaves(pt));
    for (const chave of [...Object.keys(PENDENCIA_POR_CHAVE), ...Object.keys(TRADUCAO_EN)]) {
      expect(existentes.has(chave), chave).toBe(true);
    }
  });

  it('TRADUCAO_EN só tem as origens "nova" e "nova-IA"', () => {
    for (const [chave, origem] of Object.entries(TRADUCAO_EN)) {
      expect(['nova', 'nova-IA'], chave).toContain(origem);
    }
  });

  it('as 6 traduções EN novas da F-10 estão registradas (pendência B-1)', () => {
    const f10: ChaveDicionario[] = [
      'a11y.skipToContent',
      'a11y.opensInNewTab',
      'a11y.themeToDark',
      'a11y.themeToLight',
      'a11y.language',
      'meta.title',
    ];
    for (const chave of f10) expect(TRADUCAO_EN[chave], chave).toBe('nova');
  });

  it('chave inexistente não compila', () => {
    // @ts-expect-error: 'nav.inexistente' não é caminho do dicionário.
    const invalida: ChaveDicionario = 'nav.inexistente';
    // @ts-expect-error: 'P-99' não é pendência do checklist.
    const pendencia: PendenciaId = 'P-99';
    expect([invalida, pendencia]).toHaveLength(2);
  });
});

describe('scripts/check-placeholders.mjs (doc 05 §6)', () => {
  const script = resolve(process.cwd(), 'scripts/check-placeholders.mjs');
  const pastas: string[] = [];

  function montarDist(arquivos: Record<string, string>): string {
    const pasta = mkdtempSync(join(tmpdir(), 'c01-dist-'));
    pastas.push(pasta);
    for (const [nome, conteudo] of Object.entries(arquivos)) {
      const caminho = join(pasta, nome);
      mkdirSync(join(caminho, '..'), { recursive: true });
      writeFileSync(caminho, conteudo, 'utf8');
    }
    return pasta;
  }

  function rodar(pasta: string) {
    return spawnSync(process.execPath, [script, pasta], { encoding: 'utf8' });
  }

  afterEach(() => {
    for (const pasta of pastas.splice(0)) rmSync(pasta, { recursive: true, force: true });
  });

  it('passa com um dist limpo', () => {
    const pasta = montarDist({
      'index.html': '<!doctype html><title>Yanni Elyssa | Portfólio</title>',
      'assets/index.js': 'const a=["Python","SQL"];console.log(a[0]);',
    });
    const r = rodar(pasta);
    expect(r.status, r.stderr).toBe(0);
    expect(r.stdout).toContain('OK');
  });

  it('não acusa a classe CSS do PlaceholderMark (vai para o CSS de produção)', () => {
    const pasta = montarDist({
      'assets/index.css': '._mark_1x2y3_11{border:1.5px dashed}._inline_1x2y3_29{display:inline}',
    });
    expect(rodar(pasta).status).toBe(0);
  });

  it.each([
    ['rótulo [ano]', 'assets/index.js', 'const t="[ano]";'],
    [
      'rótulo com acento escapado',
      'assets/index.js',
      'const t="[previs\\u00e3o de conclus\\u00e3o]";',
    ],
    [
      'URL com [repositório]',
      'assets/index.js',
      'const u="https://github.com/YanniMaia/[repositório]";',
    ],
    ['rótulo EN', 'assets/index.js', 'const t="[start year]";'],
    ['title do PlaceholderMark', 'assets/index.js', 'x.title="placeholder \\u2014 preencher";'],
    ['nó data-placeholder', 'index.html', '<span data-placeholder="inline">x</span>'],
    ['sonda __PLACEHOLDER', 'assets/index.js', 'console.info("__PLACEHOLDER_PROBE__")'],
  ])('falha com %s', (_nome, arquivo, conteudo) => {
    const r = rodar(montarDist({ [arquivo]: conteudo }));
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('FALHOU');
  });

  it('sai com código 2 quando a pasta não existe', () => {
    const r = rodar(join(tmpdir(), 'c01-pasta-que-nao-existe-xyz'));
    expect(r.status).toBe(2);
  });
});
