// Lista as pendências da Yanni que existem no código e confere o checklist (C-12; doc 05 §6 e §7).
//
// Lê (como texto, sem executar TypeScript):
//   - `src/content/sugeridos.ts`  → chaves de `SUGERIDOS`;
//   - `src/content/metadados.ts`  → `PendenciaId`, `PENDENCIA_POR_CHAVE`, `PENDENCIA_POR_PROJETO`,
//                                   `TRADUCAO_EN`;
//   - `src/content/**/*.ts`       → strings entre aspas simples com rótulo `[…]` (placeholders);
//   - `src/content/projects.ts`   → traduções EN das fichas (`etiqueta.en`, `descricao.en`; P-12);
//   - `scripts/check-placeholders.mjs` → rótulos do doc 05 §6 (inclui os que ainda não têm chave);
//   - `PENDENCIAS-YANNI.md`       → o checklist.
// Regra: nenhum item do código pode ficar sem linha no checklist. Cada chave/projeto precisa
// aparecer (entre crases) no item da pendência a que pertence; cada rótulo `[…]` precisa aparecer
// no checklist; cada item precisa ter "Resposta:", "Onde isso aparece no site:" e "Arquivo/campo:".
//
// Uso: node scripts/list-pendencias.mjs [--raiz <pasta>] [--traducoes]
//   --raiz       pasta do repositório (padrão: diretório atual)
//   --traducoes  imprime a lista completa das traduções EN novas (P-12)
// Saída: exit 0 (0 pendências sem correspondência), 1 (há divergências), 2 (arquivo ausente).
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import process from 'node:process';

const CHECKLIST = 'PENDENCIAS-YANNI.md';
const CAMPOS_OBRIGATORIOS = ['Resposta:', 'Onde isso aparece no site:', 'Arquivo/campo:'];

/** Itens de código fora do dicionário que também dependem de uma pendência. */
const ITENS_FIXOS = [
  { item: 'SHOW_AI_COMING_SOON_CARD', pendencia: 'P-IA-2', origem: 'src/lib/flags.ts' },
  { item: 'CARD_IA', pendencia: 'P-IA-3', origem: 'src/content/projects.ts' },
  { item: 'meta.ogFrase', pendencia: 'P-IA-2', origem: 'src/content/pt.ts (imagem OG)' },
  { item: 'rodape.frase', pendencia: 'P-IA-2', origem: 'src/content/pt.ts (pergunta da P-IA-2)' },
  { item: 'SITE_URL', pendencia: 'P-13', origem: 'src/site.config.ts' },
  { item: 'BASE_PATH', pendencia: 'P-13', origem: 'src/site.config.ts' },
];

function argumentos() {
  const args = process.argv.slice(2);
  const i = args.indexOf('--raiz');
  return {
    raiz: resolve(process.cwd(), i >= 0 && args[i + 1] ? args[i + 1] : '.'),
    traducoes: args.includes('--traducoes'),
  };
}

function ler(raiz, caminho) {
  const completo = join(raiz, caminho);
  if (!existsSync(completo)) {
    process.stderr.write(`list-pendencias: arquivo não encontrado: ${completo}\n`);
    process.exit(2);
  }
  return readFileSync(completo, 'utf8');
}

/**
 * Divide uma linha em código e strings, ignorando o comentário `//` fora de aspas.
 * Devolve só o conteúdo das strings entre aspas simples (o Prettier do projeto usa aspas simples).
 */
function stringsDaLinha(linha) {
  const achadas = [];
  let aspas = null;
  let atual = '';
  for (let i = 0; i < linha.length; i += 1) {
    const c = linha[i];
    if (aspas) {
      if (c === '\\') {
        atual += linha[i + 1] ?? '';
        i += 1;
      } else if (c === aspas) {
        if (aspas === "'") achadas.push(atual);
        aspas = null;
        atual = '';
      } else {
        atual += c;
      }
    } else if (c === '/' && linha[i + 1] === '/') {
      break;
    } else if (c === "'" || c === '"' || c === '`') {
      aspas = c;
    }
  }
  return achadas;
}

/** Linhas de código (sem as que são só comentário). */
function linhasDeCodigo(texto) {
  return texto.split(/\r?\n/).filter((linha) => {
    const t = linha.trim();
    return !(t.startsWith('//') || t.startsWith('/*') || t.startsWith('*'));
  });
}

/** Trecho entre `inicio` e o fechamento `fim` seguinte. */
function bloco(texto, inicio, fim) {
  const a = texto.indexOf(inicio);
  if (a < 0) return '';
  const b = texto.indexOf(fim, a + inicio.length);
  return texto.slice(a + inicio.length, b < 0 ? undefined : b);
}

function paresChaveValor(trecho) {
  const pares = [];
  for (const linha of linhasDeCodigo(trecho)) {
    const m = /^\s*'([^']+)':\s*(.+?),?\s*(?:\/\/.*)?$/.exec(linha);
    if (!m) continue;
    pares.push([m[1], stringsDaLinha(m[2])]);
  }
  return pares;
}

function arquivosTs(pasta) {
  return readdirSync(pasta).flatMap((nome) => {
    const caminho = join(pasta, nome);
    if (statSync(caminho).isDirectory()) return arquivosTs(caminho);
    return /\.tsx?$/.test(nome) ? [caminho] : [];
  });
}

/** Itens do checklist: `- [ ] **P-xx — título**` até o próximo item ou título `##`. */
function itensDoChecklist(md) {
  const itens = new Map();
  let atual = null;
  for (const linha of md.split(/\r?\n/)) {
    const m = /^- \[([ xX])\] \*\*(P-(?:IA-)?\d+) — /.exec(linha);
    if (m) {
      atual = { id: m[2], marcado: m[1] !== ' ', texto: linha };
      if (itens.has(atual.id)) atual.duplicado = true;
      itens.set(atual.id, atual);
    } else if (/^#{1,6} /.test(linha)) {
      atual = null;
    } else if (atual) {
      atual.texto += `\n${linha}`;
    }
  }
  return itens;
}

function main() {
  const { raiz, traducoes } = argumentos();

  const sugeridosTs = ler(raiz, 'src/content/sugeridos.ts');
  const metadadosTs = ler(raiz, 'src/content/metadados.ts');
  const projectsTs = ler(raiz, 'src/content/projects.ts');
  const checkPlaceholders = ler(raiz, 'scripts/check-placeholders.mjs');
  const md = ler(raiz, CHECKLIST);

  // --- Código ---
  const sugeridos = linhasDeCodigo(bloco(sugeridosTs, 'export const SUGERIDOS', '];')).flatMap(
    stringsDaLinha,
  );

  const tipoPendencia = bloco(metadadosTs, 'export type PendenciaId', ';');
  const idsDoTipo = [...tipoPendencia.matchAll(/'(P-[\w-]+)'/g)].map((m) => m[1]);

  const objeto = (nome) => paresChaveValor(bloco(metadadosTs, `export const ${nome}`, '\n};'));
  const porChave = new Map(objeto('PENDENCIA_POR_CHAVE').map(([k, v]) => [k, v[0]]));
  const porProjeto = new Map(objeto('PENDENCIA_POR_PROJETO'));
  const traducaoEn = objeto('TRADUCAO_EN').map(([k, v]) => `${k} (${v[0]})`);

  const pastaContent = join(raiz, 'src/content');
  const placeholders = new Map();
  for (const arquivo of arquivosTs(pastaContent)) {
    for (const linha of linhasDeCodigo(readFileSync(arquivo, 'utf8'))) {
      for (const s of stringsDaLinha(linha)) {
        if (/\[[^[\]]*\p{L}[^[\]]*\]/u.test(s) && !s.includes('${')) {
          placeholders.set(s, relative(raiz, arquivo).replaceAll('\\', '/'));
        }
      }
    }
  }
  const rotulosDoc = ['ROTULOS_PT = [', 'ROTULOS_EN = ['].flatMap((inicio) =>
    linhasDeCodigo(bloco(checkPlaceholders, inicio, '];')).flatMap(stringsDaLinha),
  );

  const fichasEn = [];
  for (const trecho of projectsTs.split(/\bid: '/).slice(1)) {
    const id = trecho.slice(0, trecho.indexOf("'"));
    const corpo = trecho.slice(0, trecho.search(/\n {2}\},?\n/) + 1 || undefined);
    for (const campo of ['etiqueta', 'descricao']) {
      if (new RegExp(`\\b${campo}: \\{[^}]*\\ben:`).test(corpo)) fichasEn.push(`${id}.${campo}.en`);
    }
  }

  // --- Checklist ---
  const itens = itensDoChecklist(md);
  const problemas = [];
  const noItem = (pendencia, termo) => itens.get(pendencia)?.texto.includes(termo) ?? false;

  for (const id of idsDoTipo) {
    if (!itens.has(id)) problemas.push(`${id} (tipo PendenciaId) não tem item no checklist`);
  }
  for (const [id, item] of itens) {
    if (!idsDoTipo.includes(id))
      problemas.push(`item ${id} do checklist não existe em PendenciaId`);
    if (item.duplicado) problemas.push(`item ${id} aparece mais de uma vez no checklist`);
    for (const campo of CAMPOS_OBRIGATORIOS) {
      if (!item.texto.includes(campo)) problemas.push(`item ${id} sem "${campo}"`);
    }
  }
  for (const chave of sugeridos) {
    const p = porChave.get(chave);
    if (!p) problemas.push(`SUGERIDOS: ${chave} sem pendência em PENDENCIA_POR_CHAVE`);
  }
  for (const [chave, p] of porChave) {
    if (!noItem(p, `\`${chave}\``)) problemas.push(`${chave} (${p}) não aparece no item ${p}`);
  }
  for (const [projeto, lista] of porProjeto) {
    for (const p of lista) {
      if (!noItem(p, projeto)) problemas.push(`projeto ${projeto} não aparece no item ${p}`);
    }
  }
  for (const [rotulo, arquivo] of placeholders) {
    if (!md.includes(rotulo))
      problemas.push(`placeholder ${rotulo} (${arquivo}) fora do checklist`);
  }
  for (const rotulo of rotulosDoc) {
    if (!md.includes(rotulo)) problemas.push(`rótulo ${rotulo} (doc 05 §6) fora do checklist`);
  }
  for (const { item, pendencia, origem } of ITENS_FIXOS) {
    if (!noItem(pendencia, item))
      problemas.push(`${item} (${origem}) não aparece no item ${pendencia}`);
  }
  if (traducaoEn.length > 0 && !noItem('P-12', 'TRADUCAO_EN')) {
    problemas.push('TRADUCAO_EN não é citado no item P-12');
  }
  if (fichasEn.length > 0 && !noItem('P-12', 'projects.ts')) {
    problemas.push('traduções EN das fichas (projects.ts) não são citadas no item P-12');
  }

  // --- Relatório ---
  const abertos = [...itens.values()].filter((i) => !i.marcado).length;
  const linhas = [
    'Pendências da Yanni: código × PENDENCIAS-YANNI.md',
    `Checklist: ${itens.size} itens (${abertos} abertos, ${itens.size - abertos} marcados).`,
    'Código:',
    `  SUGERIDOS ............................ ${sugeridos.length} chaves`,
    `  PENDENCIA_POR_CHAVE .................. ${porChave.size} chaves`,
    `  PENDENCIA_POR_PROJETO ................ ${porProjeto.size} projetos`,
    `  strings com […] em src/content ....... ${placeholders.size}`,
    `  rótulos do doc 05 §6 (check-placeholders) ${rotulosDoc.length}`,
    `  itens fixos (flags, config, OG) ...... ${ITENS_FIXOS.length}`,
    `  TRADUCAO_EN (P-12, V2) ............... ${traducaoEn.length}`,
    `  traduções EN das fichas (P-12, V2) ... ${fichasEn.length}`,
    '',
    'Por pendência:',
  ];
  for (const id of idsDoTipo) {
    const chaves = [...porChave].filter(([, p]) => p === id).map(([k]) => k);
    const projetos = [...porProjeto].filter(([, l]) => l.includes(id)).map(([k]) => k);
    const fixos = ITENS_FIXOS.filter((f) => f.pendencia === id).map((f) => f.item);
    const tudo = [...chaves, ...projetos.map((p) => `projeto ${p}`), ...fixos];
    if (id === 'P-12') tudo.push(`${traducaoEn.length + fichasEn.length} traduções EN novas`);
    const marca = itens.get(id)?.marcado ? '[x]' : '[ ]';
    linhas.push(`  ${marca} ${id}: ${tudo.length > 0 ? tudo.join(', ') : '(sem chave no código)'}`);
  }
  linhas.push('', 'Placeholders [ … ] em src/content:');
  for (const [rotulo, arquivo] of placeholders) linhas.push(`  ${rotulo}  (${arquivo})`);
  if (traducoes) {
    linhas.push('', 'Traduções EN novas (P-12):');
    for (const t of [...traducaoEn, ...fichasEn]) linhas.push(`  ${t}`);
  }
  linhas.push('', `Pendências no código sem correspondência no checklist: ${problemas.length}`);
  for (const p of problemas) linhas.push(`  - ${p}`);
  process.stdout.write(`${linhas.join('\n')}\n`);
  process.exit(problemas.length > 0 ? 1 : 0);
}

main();
