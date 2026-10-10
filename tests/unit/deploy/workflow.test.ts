// D-04: confere `.github/workflows/deploy.yml` (lint → test → build → e2e → deploy → smoke).
// Na V1 (doc 09 §3) não há Lighthouse nem regressão visual, e o `links.yml` (Q-11) é V2.
// O YAML é lido com o js-yaml que já vem com o ESLint e o Stylelint (sem dependência nova).
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const raiz = process.cwd();
const ARQUIVO = resolve(raiz, '.github/workflows/deploy.yml');
const texto = readFileSync(ARQUIVO, 'utf8');
const { load } = createRequire(import.meta.url)('js-yaml') as { load: (s: string) => unknown };

interface Passo {
  uses?: string;
  run?: string;
  if?: string;
  with?: Record<string, unknown>;
  env?: Record<string, string>;
}
interface Job {
  needs?: string | string[];
  if?: string;
  permissions?: Record<string, string>;
  concurrency?: { group?: string; 'cancel-in-progress'?: boolean };
  environment?: { name?: string; url?: string };
  container?: { image?: string } | string;
  env?: Record<string, string>;
  outputs?: Record<string, string>;
  steps: Passo[];
}
interface Workflow {
  on: {
    push?: { branches?: string[] };
    pull_request?: unknown;
    workflow_dispatch?: { inputs?: Record<string, { required?: boolean; type?: string }> };
  };
  permissions?: Record<string, string>;
  jobs: Record<string, Job>;
}

const wf = load(texto) as Workflow;
const pacote = JSON.parse(readFileSync(resolve(raiz, 'package.json'), 'utf8')) as {
  scripts: Record<string, string>;
  devDependencies: Record<string, string>;
};
const trava = JSON.parse(readFileSync(resolve(raiz, 'package-lock.json'), 'utf8')) as {
  packages: Record<string, { version: string }>;
};

const needs = (j: Job): string[] => (j.needs === undefined ? [] : [j.needs].flat());
const todosOsPassos = (): Passo[] => Object.values(wf.jobs).flatMap((j) => j.steps);
const imagem = (j: Job): string | undefined =>
  typeof j.container === 'string' ? j.container : j.container?.image;

/**
 * Avalia um `if:` no formato `(a == 'x' && b == 'y') || c == 'z'` (só `==`, `&&`, `||` e
 * parênteses externos). Qualquer outra forma lança erro: o teste não aceita o que não sabe ler.
 */
function avaliar(expr: string, ctx: Record<string, string>): boolean {
  return expr.split('||').some((termo) =>
    termo
      .trim()
      .replace(/^\(|\)$/g, '')
      .split('&&')
      .every((cmp) => {
        const m = /^\s*([\w.]+)\s*==\s*'([^']*)'\s*$/.exec(cmp);
        if (!m) throw new Error(`comparação não reconhecida no if: "${cmp}"`);
        const [, chave = '', valor] = m;
        if (!(chave in ctx)) throw new Error(`variável fora do contexto do teste: ${chave}`);
        return ctx[chave] === valor;
      }),
  );
}

describe('deploy.yml: gatilhos e permissões', () => {
  it('dispara em push na main, em pull_request e em workflow_dispatch com `ref` opcional', () => {
    expect(wf.on.push?.branches).toEqual(['main']);
    expect(wf.on).toHaveProperty('pull_request');
    const ref = wf.on.workflow_dispatch?.inputs?.ref;
    expect(ref).toBeDefined();
    expect(ref?.required).toBe(false);
    expect(ref?.type).toBe('string');
  });

  it('o workflow só lê; pages/id-token ficam apenas no job deploy', () => {
    expect(wf.permissions).toEqual({ contents: 'read' });
    for (const [nome, job] of Object.entries(wf.jobs)) {
      if (nome === 'deploy')
        expect(job.permissions).toEqual({ pages: 'write', 'id-token': 'write' });
      else expect(job.permissions).toBeUndefined();
    }
  });

  it('não usa nenhum segredo (`secrets.`) nem define base/URL por variável', () => {
    expect(texto).not.toMatch(/secrets\./);
    expect(texto).not.toMatch(/VITE_SITE_URL|PAGES_BASE|--base\b/);
  });
});

describe('deploy.yml: ordem dos jobs', () => {
  it('tem exatamente os jobs qualidade, build, e2e, deploy e smoke', () => {
    expect(Object.keys(wf.jobs)).toEqual(['qualidade', 'build', 'e2e', 'deploy', 'smoke']);
  });

  it('a ordem qualidade → build → e2e → deploy → smoke é garantida por needs:', () => {
    expect(needs(wf.jobs.qualidade!)).toEqual([]);
    expect(needs(wf.jobs.build!)).toContain('qualidade');
    expect(needs(wf.jobs.e2e!)).toContain('build');
    expect(needs(wf.jobs.deploy!)).toContain('e2e');
    expect(needs(wf.jobs.smoke!)).toContain('deploy');
  });

  it('o deploy nunca roda em pull_request; roda em push na main e no workflow_dispatch', () => {
    const se = wf.jobs.deploy!.if;
    expect(se).toBeDefined();
    const caso = (evento: string, ref: string) =>
      avaliar(se!, { 'github.event_name': evento, 'github.ref': ref });
    expect(caso('pull_request', 'refs/heads/main')).toBe(false);
    expect(caso('pull_request', 'refs/pull/1/merge')).toBe(false);
    expect(caso('push', 'refs/heads/main')).toBe(true);
    expect(caso('push', 'refs/heads/outra')).toBe(false);
    expect(caso('workflow_dispatch', 'refs/heads/main')).toBe(true);
  });

  it('o leitor de if: recusa formas que não conhece (o teste acima não passa por omissão)', () => {
    expect(() => avaliar("github.event_name != 'pull_request'", {})).toThrow();
    expect(() => avaliar("github.x == 'a'", {})).toThrow();
  });
});

describe('deploy.yml: passos de cada job', () => {
  const runs = (job: string) => wf.jobs[job]!.steps.map((p) => p.run ?? '');

  it('qualidade: npm ci → lint → typecheck → test, nessa ordem', () => {
    expect(runs('qualidade').filter(Boolean)).toEqual([
      'npm ci',
      'npm run lint',
      'npm run typecheck',
      'npm test',
    ]);
  });

  it('todo checkout usa o `ref` do workflow_dispatch', () => {
    const checkouts = todosOsPassos().filter((p) => p.uses?.startsWith('actions/checkout@'));
    expect(checkouts).toHaveLength(Object.keys(wf.jobs).length - 1); // o deploy não faz checkout
    for (const p of checkouts) expect(p.with?.ref).toBe('${{ inputs.ref }}');
  });

  it('todo setup-node lê a versão do .nvmrc e usa cache npm', () => {
    const setups = todosOsPassos().filter((p) => p.uses?.startsWith('actions/setup-node@'));
    expect(setups.length).toBeGreaterThan(0);
    for (const p of setups) expect(p.with).toEqual({ 'node-version-file': '.nvmrc', cache: 'npm' });
    expect(readFileSync(resolve(raiz, '.nvmrc'), 'utf8').trim()).toMatch(/^2[2-9]\./);
  });

  it('build: npm run build com GIT_SHA do commit construído e artefato do Pages com dist/', () => {
    const passos = wf.jobs.build!.steps;
    const build = passos.find((p) => p.run === 'npm run build');
    expect(build?.env?.GIT_SHA).toBe('${{ steps.sha.outputs.sha }}');
    expect(passos.find((p) => p.run?.includes('git rev-parse HEAD'))).toBeDefined();
    const artefato = passos.find((p) => p.uses?.startsWith('actions/upload-pages-artifact@'));
    expect(artefato?.with?.path).toBe('dist/');
  });

  it('e2e: roda só os projetos vp* (sem o styleguide do servidor dev), sem lhci nem visual', () => {
    const e2e = runs('e2e').find((r) => r.startsWith('npm run e2e')) ?? '';
    const filtro = /--project='([^']+)'/.exec(e2e)?.[1];
    expect(filtro).toBeDefined();
    // O Playwright aceita `*` no --project; converte para regex e aplica aos nomes do config.
    const escapar = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`^${filtro!.split('*').map(escapar).join('.*')}$`);
    const config = readFileSync(resolve(raiz, 'playwright.config.ts'), 'utf8');
    const vps = [...config.matchAll(/nome: '(vp[\w-]+)'/g)].map((m) => m[1] ?? '');
    expect(vps.length).toBeGreaterThanOrEqual(6);
    for (const nome of vps) expect(nome).toMatch(re);
    expect(config).toMatch(/name: 'styleguide'/);
    expect('styleguide').not.toMatch(re);
    // V1 (doc 09 §3): nenhum passo roda Lighthouse ou regressão visual.
    for (const p of todosOsPassos()) {
      expect(`${p.run ?? ''} ${p.uses ?? ''}`).not.toMatch(/lhci|e2e:visual|lighthouse/i);
    }
  });

  it('e2e: em falha, sobe playwright-report/, test-results/ e relatorios/', () => {
    const up = wf.jobs.e2e!.steps.find((p) => p.uses?.startsWith('actions/upload-artifact@'));
    expect(up?.if).toBe('failure()');
    const caminhos = String(up?.with?.path).trim().split('\n');
    expect(caminhos).toEqual(['playwright-report/', 'test-results/', 'relatorios/']);
  });

  it('deploy: ambiente github-pages, deploy-pages, concorrência `pages` sem cancelar', () => {
    const d = wf.jobs.deploy!;
    expect(d.environment?.name).toBe('github-pages');
    expect(d.steps.some((p) => p.uses?.startsWith('actions/deploy-pages@'))).toBe(true);
    expect(d.concurrency).toEqual({ group: 'pages', 'cancel-in-progress': false });
    expect(d.outputs?.page_url).toMatch(/steps\.\w+\.outputs\.page_url/);
  });

  it('smoke: SMOKE_URL vem da URL devolvida pelo deploy e há alerta de rollback em falha', () => {
    const s = wf.jobs.smoke!;
    expect(s.env?.SMOKE_URL).toBe('${{ needs.deploy.outputs.page_url }}');
    expect(s.env?.SMOKE_SHA).toBe('${{ needs.build.outputs.sha }}');
    expect(s.steps.some((p) => p.if === 'failure()' && p.run?.includes('::error'))).toBe(true);
    expect(s.steps.some((p) => p.run?.includes('npm run e2e:publico'))).toBe(true);
  });
});

describe('deploy.yml: versões', () => {
  it('a imagem do Playwright tem a mesma versão do @playwright/test (package.json e lock)', () => {
    const declarada = pacote.devDependencies['@playwright/test']?.replace(/^[\^~]/, '');
    const instalada = trava.packages['node_modules/@playwright/test']?.version;
    expect(instalada).toBe(declarada);
    const imagens = Object.values(wf.jobs)
      .map(imagem)
      .filter((i): i is string => i !== undefined);
    expect(imagens.length).toBe(2); // e2e e smoke
    for (const i of imagens) expect(i).toBe(`mcr.microsoft.com/playwright:v${instalada}-noble`);
  });

  it('toda ação está fixada por versão maior (`dono/acao@vN`)', () => {
    const usos = todosOsPassos()
      .map((p) => p.uses)
      .filter((u): u is string => u !== undefined);
    expect(usos.length).toBeGreaterThan(0);
    for (const u of usos) expect(u).toMatch(/^actions\/[\w-]+@v\d+$/);
  });

  it('todo `npm run X` existe no package.json, ou está protegido por `npm pkg get` (D-05)', () => {
    for (const passo of todosOsPassos()) {
      const run = passo.run ?? '';
      for (const [, script = ''] of run.matchAll(/npm run ([\w:-]+)/g)) {
        if (script in pacote.scripts) continue;
        expect(run, `script ${script} ausente e sem proteção`).toContain(
          `npm pkg get scripts.${script}`,
        );
      }
    }
  });
});
