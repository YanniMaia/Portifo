// Confere o runbook da D-08 (`plano/runbooks/publicar-repositorios.md`) contra a fonte:
//   - `src/content/projects.ts` (C-05): projetos com `linkGithub` literal em github.com/YanniMaia/<nome>;
//   - documento de design §12 ("Repositório" + "Descrição do card") e §12.5 (links).
// Os 4 nomes e as 4 descrições da tabela do runbook precisam ser idênticos nas três fontes, e a
// primeira linha do runbook precisa dizer que só a Yanni faz o push.
// Lê os arquivos como texto (o projects.ts usa o alias `@/` e `import.meta.env`, que o Node não resolve).
// Uso: node scripts/conferir-runbook.mjs [--raiz <pasta>]. Saída: `OK` (exit 0), lista de diferenças
// (exit 1) ou arquivo ausente (exit 2).
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const args = process.argv.slice(2);
const iRaiz = args.indexOf('--raiz');
const raiz = resolve(iRaiz >= 0 && args[iRaiz + 1] ? args[iRaiz + 1] : process.cwd());

const ARQUIVOS = {
  runbook: 'plano/runbooks/publicar-repositorios.md',
  projetos: 'src/content/projects.ts',
  doc: 'plano/referencia/documento-design-v1.1.txt',
};
const QTD_ESPERADA = 4;

const textos = {};
for (const [chave, relativo] of Object.entries(ARQUIVOS)) {
  const caminho = resolve(raiz, relativo);
  if (!existsSync(caminho)) {
    console.error(`conferir-runbook: arquivo ausente: ${relativo}`);
    process.exit(2);
  }
  textos[chave] = readFileSync(caminho, 'utf8').replace(
    new RegExp('^' + String.fromCharCode(0xfeff)),
    '',
  );
}

/** Tabela do runbook: `| \`nome\` | "descrição" | topics |`. */
function doRunbook(md) {
  const mapa = new Map();
  for (const m of md.matchAll(/^\|\s*`([a-z0-9-]+)`\s*\|\s*"([^"]+)"\s*\|/gm)) {
    mapa.set(m[1], m[2]);
  }
  return mapa;
}

/** Projetos de `projects.ts` com link literal do GitHub da Yanni (sem placeholder). */
function doProjects(ts) {
  const mapa = new Map();
  const blocos = ts.split(/\n {2}\{\n/).slice(1);
  for (const bloco of blocos) {
    const link = /linkGithub:\s*'https:\/\/github\.com\/YanniMaia\/([a-z0-9-]+)'/.exec(bloco);
    const desc = /descricao:\s*\{\s*pt:\s*'([^']*)'/.exec(bloco);
    if (link && desc) mapa.set(link[1], desc[1]);
  }
  return mapa;
}

/** Documento de design: §12.x (Repositório + Descrição do card) e §12.5 (links). */
function doDocumento(txt) {
  const mapa = new Map();
  let nome = null;
  for (const linha of txt.split(/\r?\n/)) {
    const repo = /^\|\s*Repositório\s*\|\s*([a-z0-9-]+)\s*\|/.exec(linha);
    if (repo) nome = repo[1];
    const desc = /^\|\s*Descrição do card\s*\|\s*[“"](.+?)[”"]\s*\|/.exec(linha);
    if (desc && nome) {
      mapa.set(nome, desc[1]);
      nome = null;
    }
  }
  const links = new Set(
    [...txt.matchAll(/^\|[^|]+\|\s*https:\/\/github\.com\/YanniMaia\/([a-z0-9-]+)\s*\|/gm)].map(
      (m) => m[1],
    ),
  );
  return { mapa, links };
}

const runbook = doRunbook(textos.runbook);
const projetos = doProjects(textos.projetos);
const { mapa: documento, links } = doDocumento(textos.doc);

const diferencas = [];
const primeira = textos.runbook.split(/\r?\n/)[0] ?? '';
if (!/só a Yanni faz o push/i.test(primeira)) {
  diferencas.push('a primeira linha do runbook não diz que só a Yanni faz o push');
}

for (const [fonte, mapa] of [
  ['runbook', runbook],
  ['projects.ts', projetos],
  ['documento §12', documento],
]) {
  if (mapa.size !== QTD_ESPERADA) {
    diferencas.push(`${fonte}: ${mapa.size} repositórios (esperado ${QTD_ESPERADA})`);
  }
}
if (links.size !== QTD_ESPERADA) {
  diferencas.push(`documento §12.5: ${links.size} links (esperado ${QTD_ESPERADA})`);
}

const nomes = new Set([...runbook.keys(), ...projetos.keys(), ...documento.keys(), ...links]);
for (const nome of [...nomes].sort()) {
  if (!runbook.has(nome)) diferencas.push(`${nome}: falta na tabela do runbook`);
  if (!projetos.has(nome)) diferencas.push(`${nome}: falta em projects.ts (linkGithub literal)`);
  if (!documento.has(nome)) diferencas.push(`${nome}: falta no documento §12`);
  if (!links.has(nome)) diferencas.push(`${nome}: falta no documento §12.5`);
  const r = runbook.get(nome);
  const p = projetos.get(nome);
  const d = documento.get(nome);
  if (r !== undefined && p !== undefined && r !== p) {
    diferencas.push(
      `${nome}: descrição do runbook ≠ projects.ts\n    runbook: ${r}\n    projects.ts: ${p}`,
    );
  }
  if (p !== undefined && d !== undefined && p !== d) {
    diferencas.push(
      `${nome}: descrição de projects.ts ≠ documento §12\n    projects.ts: ${p}\n    documento: ${d}`,
    );
  }
}

if (diferencas.length > 0) {
  console.log(`Diferenças (${diferencas.length}):`);
  for (const d of diferencas) console.log(`  - ${d}`);
  process.exit(1);
}
console.log('OK');
