// C-12: checklist de pendências da Yanni (`PENDENCIAS-YANNI.md`) × código (`scripts/list-pendencias.mjs`).
import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { PENDENCIA_POR_CHAVE, PENDENCIA_POR_PROJETO } from '@/content/metadados';
import { SUGERIDOS } from '@/content/sugeridos';
const raiz = process.cwd();
const idsDoChecklist = (
  JSON.parse(
    readFileSync(resolve(raiz, 'tests/unit/content/fixtures/pendencias-ids.json'), 'utf8'),
  ) as { ids: string[] }
).ids;
const script = resolve(raiz, 'scripts/list-pendencias.mjs');
const checklist = readFileSync(resolve(raiz, 'PENDENCIAS-YANNI.md'), 'utf8');

function rodar(pastaRaiz: string, ...extras: string[]) {
  return spawnSync(process.execPath, [script, '--raiz', pastaRaiz, ...extras], {
    encoding: 'utf8',
  });
}

/** Texto do item `P-xx` do checklist (do marcador até o próximo item ou título). */
function item(id: string): string {
  const linhas = checklist.split(/\r?\n/);
  const inicio = linhas.findIndex((l) => l.startsWith(`- [ ] **${id} — `));
  if (inicio < 0) return '';
  const fim = linhas.findIndex(
    (l, i) => i > inicio && (/^- \[[ xX]\] \*\*P-/.test(l) || /^#{1,6} /.test(l)),
  );
  return linhas.slice(inicio, fim < 0 ? undefined : fim).join('\n');
}

describe('PENDENCIAS-YANNI.md (doc 05 §7)', () => {
  it('tem um item para cada pendência do checklist-fonte (18), sem repetir', () => {
    const ids = [...checklist.matchAll(/^- \[[ xX]\] \*\*(P-(?:IA-)?\d+) — /gm)].map((m) => m[1]);
    expect([...ids].sort()).toEqual([...idsDoChecklist].sort());
  });

  it.each(idsDoChecklist)(
    '%s tem "Resposta:", "Onde isso aparece no site:" e "Arquivo/campo:"',
    (id) => {
      const texto = item(id);
      expect(texto).toContain('Resposta:');
      expect(texto).toContain('Onde isso aparece no site:');
      expect(texto).toContain('Arquivo/campo:');
    },
  );

  it('toda chave de SUGERIDOS aparece no item da sua pendência', () => {
    for (const chave of SUGERIDOS) {
      const p = PENDENCIA_POR_CHAVE[chave];
      expect(p, chave).toBeDefined();
      expect(item(p!), `${chave} em ${p}`).toContain(`\`${chave}\``);
    }
  });

  it('todo projeto aparece no item de cada pendência sua', () => {
    for (const [projeto, lista] of Object.entries(PENDENCIA_POR_PROJETO)) {
      for (const p of lista) expect(item(p), `${projeto} em ${p}`).toContain(projeto);
    }
  });

  it('os textos novos de interface (erro 404) estão na P-10', () => {
    expect(item('P-10')).toContain('`erro404.titulo`');
    expect(item('P-10')).toContain('`erro404.voltar`');
  });

  it('o placeholder PH-10 sem chave no Anexo A está na P-IA-1', () => {
    expect(item('P-IA-1')).toContain('[ferramentas de IA que estuda]');
  });

  it('a P-12 cita as traduções EN do dicionário e das fichas, como pendência da V2', () => {
    const p12 = item('P-12');
    expect(p12).toContain('TRADUCAO_EN');
    expect(p12).toContain('src/content/projects.ts');
    expect(p12).toMatch(/versão 2/);
  });
});

describe('scripts/list-pendencias.mjs', () => {
  const pastas: string[] = [];

  /** Cópia mínima do repositório para os testes negativos. */
  function copiaDoRepositorio(): string {
    const pasta = mkdtempSync(join(tmpdir(), 'c12-raiz-'));
    pastas.push(pasta);
    cpSync(resolve(raiz, 'src/content'), join(pasta, 'src/content'), { recursive: true });
    cpSync(
      resolve(raiz, 'scripts/check-placeholders.mjs'),
      join(pasta, 'scripts/check-placeholders.mjs'),
    );
    cpSync(resolve(raiz, 'PENDENCIAS-YANNI.md'), join(pasta, 'PENDENCIAS-YANNI.md'));
    return pasta;
  }

  afterEach(() => {
    for (const pasta of pastas.splice(0)) rmSync(pasta, { recursive: true, force: true });
  });

  it('no repositório real: 18 itens e 0 pendências sem correspondência (exit 0)', () => {
    const r = rodar(raiz);
    expect(r.status, r.stdout + r.stderr).toBe(0);
    expect(r.stdout).toContain('Checklist: 18 itens');
    expect(r.stdout).toContain('Pendências no código sem correspondência no checklist: 0');
  });

  it('--traducoes lista as traduções novas do dicionário e das fichas', () => {
    const r = rodar(raiz, '--traducoes');
    expect(r.status).toBe(0);
    expect(r.stdout).toContain('hero.pilula (nova-IA)');
    expect(r.stdout).toContain('analise-de-dados-vendas.descricao.en');
  });

  it('falha quando uma chave de SUGERIDOS some do checklist', () => {
    const pasta = copiaDoRepositorio();
    const md = join(pasta, 'PENDENCIAS-YANNI.md');
    writeFileSync(md, readFileSync(md, 'utf8').replaceAll('`erro404.voltar`', 'o botão'), 'utf8');
    const r = rodar(pasta);
    expect(r.status).toBe(1);
    expect(r.stdout).toContain('erro404.voltar (P-10) não aparece no item P-10');
  });

  it('falha quando aparece um placeholder novo no conteúdo sem linha no checklist', () => {
    const pasta = copiaDoRepositorio();
    const pt = join(pasta, 'src/content/pt.ts');
    writeFileSync(pt, readFileSync(pt, 'utf8').replace("'[ano]'", "'[rótulo de teste]'"), 'utf8');
    const r = rodar(pasta);
    expect(r.status).toBe(1);
    expect(r.stdout).toContain(
      'placeholder [rótulo de teste] (src/content/pt.ts) fora do checklist',
    );
  });

  it('falha quando um item perde o campo "Arquivo/campo:"', () => {
    const pasta = copiaDoRepositorio();
    const md = join(pasta, 'PENDENCIAS-YANNI.md');
    const texto = readFileSync(md, 'utf8');
    const p14 = texto.indexOf('**P-14 — ');
    const campo = texto.indexOf('Arquivo/campo:', p14);
    writeFileSync(md, texto.slice(0, campo) + 'Arquivo:' + texto.slice(campo + 14), 'utf8');
    const r = rodar(pasta);
    expect(r.status).toBe(1);
    expect(r.stdout).toContain('item P-14 sem "Arquivo/campo:"');
  });

  it('exit 2 quando falta o checklist', () => {
    const pasta = copiaDoRepositorio();
    rmSync(join(pasta, 'PENDENCIAS-YANNI.md'));
    expect(rodar(pasta).status).toBe(2);
  });
});
