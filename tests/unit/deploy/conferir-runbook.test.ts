// D-08: `scripts/conferir-runbook.mjs` compara a tabela do runbook dos 4 repositórios com
// `src/content/projects.ts` e com o documento de design (§12 e §12.5). Os casos negativos rodam numa
// cópia temporária dos 3 arquivos, alterada de propósito.
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { PROJECTS } from '@/content/projects';

const raiz = process.cwd();
const script = resolve(raiz, 'scripts/conferir-runbook.mjs');
const RUNBOOK = 'plano/runbooks/publicar-repositorios.md';
const ARQUIVOS = [RUNBOOK, 'src/content/projects.ts', 'plano/referencia/documento-design-v1.1.txt'];
const pastas: string[] = [];

function rodar(pastaRaiz: string) {
  return spawnSync(process.execPath, [script, '--raiz', pastaRaiz], { encoding: 'utf8' });
}

/** Cópia temporária dos 3 arquivos; `alterar` recebe o caminho relativo e o texto. */
function copia(alterar?: (relativo: string, texto: string) => string | null): string {
  const pasta = mkdtempSync(join(tmpdir(), 'conferir-runbook-'));
  pastas.push(pasta);
  for (const relativo of ARQUIVOS) {
    const destino = join(pasta, relativo);
    mkdirSync(dirname(destino), { recursive: true });
    cpSync(resolve(raiz, relativo), destino);
    if (alterar) {
      const novo = alterar(relativo, readFileSync(destino, 'utf8'));
      if (novo === null) rmSync(destino);
      else writeFileSync(destino, novo, 'utf8');
    }
  }
  return pasta;
}

afterEach(() => {
  for (const p of pastas.splice(0)) rmSync(p, { recursive: true, force: true });
});

describe('scripts/conferir-runbook.mjs', () => {
  it('imprime OK no repositório real (exit 0)', () => {
    const r = rodar(raiz);
    expect(r.stdout.trim()).toBe('OK');
    expect(r.status).toBe(0);
  });

  it('a tabela do runbook tem os 4 projetos de estudo de projects.ts, com nome e descrição', () => {
    const runbook = readFileSync(resolve(raiz, RUNBOOK), 'utf8');
    const estudo = PROJECTS.filter((p) => p.projetoDeEstudo);
    expect(estudo).toHaveLength(4);
    for (const p of estudo) {
      const nome = p.linkGithub?.split('/').pop() ?? '';
      expect(runbook).toContain(`| \`${nome}\` | "${p.descricao.pt}" |`);
    }
  });

  it('falha (exit 1) quando a descrição do runbook difere', () => {
    const pasta = copia((rel, t) =>
      rel === RUNBOOK ? t.replace('com resumo e gráficos', 'com resumo e painéis') : t,
    );
    const r = rodar(pasta);
    expect(r.status).toBe(1);
    expect(r.stdout).toContain('analise-de-dados-vendas: descrição do runbook ≠ projects.ts');
  });

  it('falha quando o nome do repositório no runbook difere do §12.5', () => {
    const pasta = copia((rel, t) =>
      rel === RUNBOOK ? t.replace('| `python-organizador-de-arquivos` |', '| `organizador` |') : t,
    );
    const r = rodar(pasta);
    expect(r.status).toBe(1);
    expect(r.stdout).toContain('python-organizador-de-arquivos: falta na tabela do runbook');
  });

  it('falha quando projects.ts diverge do documento §12', () => {
    const pasta = copia((rel, t) =>
      rel.endsWith('projects.ts') ? t.replace('com foco defensivo.', 'com foco ofensivo.') : t,
    );
    const r = rodar(pasta);
    expect(r.status).toBe(1);
    expect(r.stdout).toContain(
      'ciberseguranca-analisador-de-logs: descrição de projects.ts ≠ documento §12',
    );
  });

  it('falha quando a primeira linha não diz que só a Yanni faz o push', () => {
    const pasta = copia((rel, t) => (rel === RUNBOOK ? `# Guia\n${t}` : t));
    const r = rodar(pasta);
    expect(r.status).toBe(1);
    expect(r.stdout).toContain('primeira linha do runbook');
  });

  it('sai com exit 2 quando o runbook não existe', () => {
    const pasta = copia((rel, t) => (rel === RUNBOOK ? null : t));
    expect(rodar(pasta).status).toBe(2);
  });
});
