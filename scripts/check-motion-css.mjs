// Checagem estática de CSS de movimento (A-20; doc 04 §4.2 R1/R5, §4.4 passo 4). Roda no
// `npm test` (ver package.json) e em `npm run check:motion-css`. Falha (exit 1) se, em algum
// arquivo `.css` de `src/`:
//   1. um `@keyframes` animar uma propriedade fora de `transform`/`opacity` (R1);
//   2. um `@keyframes` com `opacity` usado num `animation` com `infinite` (loop) tiver duração
//      resolvida < 1 s (R5 — "nada pisca mais de 3×/s"; período ≥ 1 s é a regra do doc, bem mais
//      folgada que o limite físico de 3 Hz, e é o valor que todo o resto do projeto já usa);
//   3. existir um token `--decor-*` (declaração ou `var()`) — o prefixo correto é `--deco-*`;
//   4. `scroll-padding-top` for DECLARADO (não só citado em comentário) em mais de 1 arquivo `.css`.
//
// Escopo da checagem de duração (item 2): é uma varredura estática e heurística, não um parser CSS
// completo. Resolve `var(--token)` procurando a declaração `--token: valor;` em qualquer `.css` de
// `src/` (com fallback de `var(--token, fallback)` quando a declaração não existe) e segue até 5
// níveis de indireção. Quando não consegue resolver com confiança, REGISTRA um aviso em vez de
// falhar (sem falso positivo) — a cobertura completa de cada loop já está nos specs e2e por feature
// (A-01/A-10/A-11b/A-14) e nos testes unitários (`tests/unit/decor/float.test.ts`).
//
// Uso: node scripts/check-motion-css.mjs [pasta]   (padrão: src)
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';
import process from 'node:process';

const PROPRIEDADES_PERMITIDAS = new Set(['opacity', 'transform']);
/** Palavras-chave de `animation`/`animation-*` que não são tempo nem nome de keyframe. */
const PALAVRAS_NAO_TEMPO = new Set([
  'infinite',
  'both',
  'forwards',
  'backwards',
  'normal',
  'alternate',
  'alternate-reverse',
  'reverse',
  'none',
  'running',
  'paused',
  'ease',
  'linear',
  'step-start',
  'step-end',
]);

function listarArquivos(pasta) {
  return readdirSync(pasta).flatMap((nome) => {
    const caminho = join(pasta, nome);
    return statSync(caminho).isDirectory() ? listarArquivos(caminho) : [caminho];
  });
}

/** Remove comentários `/* ... *\/` (para não confundir texto de comentário com CSS real). */
function semComentarios(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

/** Extrai os blocos `@keyframes <nome> { ... }`, respeitando chaves aninhadas (0%/50%/100%/from/to). */
function extrairKeyframes(css) {
  const blocos = [];
  const regexInicio = /@keyframes\s+([\w-]+)\s*\{/g;
  let m;
  while ((m = regexInicio.exec(css))) {
    let i = m.index + m[0].length;
    let profundidade = 1;
    const inicioCorpo = i;
    while (i < css.length && profundidade > 0) {
      if (css[i] === '{') profundidade++;
      else if (css[i] === '}') profundidade--;
      i++;
    }
    blocos.push({ nome: m[1], corpo: css.slice(inicioCorpo, i - 1) });
  }
  return blocos;
}

/** Propriedades declaradas dentro de um corpo de `@keyframes` (ex.: ['opacity', 'transform']). */
function propriedadesDoCorpo(corpo) {
  const props = new Set();
  const regex = /([a-zA-Z-]+)\s*:\s*[^;{}]+;/g;
  let m;
  while ((m = regex.exec(corpo))) props.add(m[1].toLowerCase());
  return props;
}

/** Extrai blocos de regra `seletor { declarações }` de todo o CSS (nível superior, sem @media/@keyframes). */
function extrairRegras(css) {
  const regras = [];
  let i = 0;
  while (i < css.length) {
    const abre = css.indexOf('{', i);
    if (abre === -1) break;
    const cabecalho = css.slice(i, abre).trim();
    let profundidade = 1;
    let j = abre + 1;
    while (j < css.length && profundidade > 0) {
      if (css[j] === '{') profundidade++;
      else if (css[j] === '}') profundidade--;
      j++;
    }
    const corpo = css.slice(abre + 1, j - 1);
    // Entra em @media/@supports (o corpo tem regras aninhadas); @keyframes já foi tratado antes.
    if (/^@(media|supports)/.test(cabecalho)) {
      regras.push(...extrairRegras(corpo));
    } else if (!cabecalho.startsWith('@')) {
      regras.push({ cabecalho, corpo });
    }
    i = j;
  }
  return regras;
}

/** Declarações `propriedade: valor;` de 1º nível dentro do corpo de uma regra (sem aninhamento). */
function declaracoesDoCorpo(corpo) {
  const decls = [];
  const regex = /([a-zA-Z-]+)\s*:\s*([^;]+);/g;
  let m;
  while ((m = regex.exec(corpo))) decls.push({ prop: m[1].toLowerCase(), valor: m[2].trim() });
  return decls;
}

/** Tokeniza um valor CSS por espaço, mantendo `var(...)`/`cubic-bezier(...)` como 1 token. */
function tokenizarValor(valor) {
  const tokens = [];
  const regex = /[a-zA-Z-]+\([^)]*\)|[^\s]+/g;
  let m;
  while ((m = regex.exec(valor))) tokens.push(m[0]);
  return tokens;
}

function ehTempoLiteral(token) {
  return /^-?\d*\.?\d+m?s$/.test(token);
}

function msDoLiteral(token) {
  const valor = Number.parseFloat(token);
  return token.endsWith('ms') ? valor : valor * 1000;
}

/** Resolve `var(--token[, fallback])` até 5 níveis, usando o mapa de tokens declarados em `src/`. */
function resolverToken(valor, tokens, profundidade = 0) {
  if (profundidade > 5) return null;
  const m = /^var\(\s*(--[\w-]+)\s*(?:,\s*([\s\S]+))?\)$/.exec(valor.trim());
  if (!m) return valor.trim();
  const [, nome, fallback] = m;
  if (tokens.has(nome)) {
    const resolvido = resolverToken(tokens.get(nome), tokens, profundidade + 1);
    if (resolvido !== null) return resolvido;
  }
  return fallback ? resolverToken(fallback, tokens, profundidade + 1) : null;
}

/** 1ª duração (tempo) presente num valor de `animation`/`animation-duration` já tokenizado. */
function extrairDuracaoMs(tokens, mapaTokens, ehShorthand, nomeKeyframe) {
  for (const token of tokens) {
    if (ehShorthand && token === nomeKeyframe) continue;
    if (PALAVRAS_NAO_TEMPO.has(token) || /^-?\d+$/.test(token)) continue;
    if (/^var\(--ease-/.test(token)) continue; // timing-function (convenção do projeto)
    if (ehTempoLiteral(token)) return msDoLiteral(token);
    if (token.startsWith('var(')) {
      const resolvido = resolverToken(token, mapaTokens);
      if (resolvido && ehTempoLiteral(resolvido)) return msDoLiteral(resolvido);
      // Não resolvido com confiança: não decide por este token, tenta o próximo.
      continue;
    }
  }
  return null;
}

function main() {
  const raiz = resolve(process.cwd(), process.argv[2] ?? 'src');
  let existe = false;
  try {
    existe = statSync(raiz).isDirectory();
  } catch {
    existe = false;
  }
  if (!existe) {
    process.stderr.write(`check-motion-css: pasta não encontrada: ${raiz}\n`);
    process.exit(2);
  }

  const arquivosCSS = listarArquivos(raiz).filter((a) => extname(a) === '.css');
  const brutos = new Map(arquivosCSS.map((a) => [a, readFileSync(a, 'utf8')]));
  const semComent = new Map([...brutos].map(([a, c]) => [a, semComentarios(c)]));

  const erros = [];
  const avisos = [];

  // ---------- Mapa de tokens `--nome: valor;` declarados em todo o src/ (p/ resolver var()) ----------
  const mapaTokens = new Map();
  for (const css of semComent.values()) {
    const regex = /(--[\w-]+)\s*:\s*([^;]+);/g;
    let m;
    while ((m = regex.exec(css))) {
      if (!mapaTokens.has(m[1])) mapaTokens.set(m[1], m[2].trim());
    }
  }

  // ---------- 1) @keyframes só opacity/transform; coleta quem é loop+opacity ----------
  /** nome do keyframe -> { arquivo, props } */
  const keyframesPorNome = new Map();
  for (const [arquivo, css] of semComent) {
    for (const { nome, corpo } of extrairKeyframes(css)) {
      const props = propriedadesDoCorpo(corpo);
      const foraDaLista = [...props].filter((p) => !PROPRIEDADES_PERMITIDAS.has(p));
      if (foraDaLista.length > 0) {
        erros.push(
          `[R1] ${relative(raiz, arquivo)}: @keyframes ${nome} anima ${foraDaLista.join(', ')} (só opacity/transform são permitidos).`,
        );
      }
      keyframesPorNome.set(nome, { arquivo, props });
    }
  }

  // ---------- 2) loops de opacity com duração < 1 s (R5) ----------
  for (const [arquivo, css] of semComent) {
    for (const { corpo } of extrairRegras(css)) {
      for (const { prop, valor } of declaracoesDoCorpo(corpo)) {
        if (prop !== 'animation' && prop !== 'animation-name') continue;
        const tokens = tokenizarValor(valor);
        const nomeKeyframe = tokens.find((t) => keyframesPorNome.has(t));
        if (!nomeKeyframe) continue;
        const info = keyframesPorNome.get(nomeKeyframe);
        if (!info.props.has('opacity')) continue; // R5 só vale para loop de opacidade.

        // "infinite" pode estar no shorthand ou numa declaração separada (mesmo corpo de regra).
        const ehLoop =
          /\binfinite\b/.test(valor) ||
          declaracoesDoCorpo(corpo).some(
            (d) => d.prop === 'animation-iteration-count' && /\binfinite\b/.test(d.valor),
          );
        if (!ehLoop) continue;

        let duracaoMs = extrairDuracaoMs(tokens, mapaTokens, prop === 'animation', nomeKeyframe);
        if (duracaoMs === null && prop === 'animation-name') {
          const durDecl = declaracoesDoCorpo(corpo).find((d) => d.prop === 'animation-duration');
          if (durDecl) {
            duracaoMs = extrairDuracaoMs(tokenizarValor(durDecl.valor), mapaTokens, false, '');
          }
        }

        if (duracaoMs === null) {
          avisos.push(
            `[R5] ${relative(raiz, arquivo)}: não foi possível resolver com confiança a duração do loop de opacity "${nomeKeyframe}" (${valor}); conferir manualmente.`,
          );
        } else if (duracaoMs < 1000) {
          erros.push(
            `[R5] ${relative(raiz, arquivo)}: loop de opacity "${nomeKeyframe}" com duração ${duracaoMs} ms (< 1000 ms).`,
          );
        }
      }
    }
  }

  // ---------- 3) token --decor-* (errado; o certo é --deco-*) ----------
  for (const [arquivo, css] of semComent) {
    const declarado = [...css.matchAll(/(--decor-[\w-]+)\s*:/g)].map((m) => m[1]);
    const usado = [...css.matchAll(/var\(\s*(--decor-[\w-]+)/g)].map((m) => m[1]);
    for (const nome of new Set([...declarado, ...usado])) {
      erros.push(
        `[token] ${relative(raiz, arquivo)}: token "${nome}" usa o prefixo errado (o certo é --deco-*).`,
      );
    }
  }

  // ---------- 4) scroll-padding-top em mais de 1 arquivo ----------
  const arquivosComScrollPadding = arquivosCSS.filter((a) =>
    /scroll-padding-top\s*:/.test(semComent.get(a)),
  );
  if (arquivosComScrollPadding.length > 1) {
    erros.push(
      `[dono único] scroll-padding-top declarado em ${arquivosComScrollPadding.length} arquivos (deveria ser 1): ${arquivosComScrollPadding
        .map((a) => relative(raiz, a))
        .join(', ')}.`,
    );
  }

  for (const aviso of avisos) process.stdout.write(`check-motion-css: aviso: ${aviso}\n`);

  if (erros.length > 0) {
    process.stderr.write(`check-motion-css: FALHOU (${erros.length}):\n  ${erros.join('\n  ')}\n`);
    process.exit(1);
  }
  process.stdout.write(
    `check-motion-css: OK (${arquivosCSS.length} arquivos CSS em ${relative(process.cwd(), raiz) || '.'}, ${keyframesPorNome.size} @keyframes, ${avisos.length} aviso(s)).\n`,
  );
}

main();
