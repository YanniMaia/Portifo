// Checagem de placeholders no build de produção (C-01; doc 05 §4.3 e §6; D11, D23).
// Roda no `postbuild` (e em `npm run check:placeholders`). Falha (exit 1) se o `dist/` contiver:
//   - qualquer rótulo de placeholder da lista do doc 05 §6 (e os equivalentes EN do Anexo A);
//   - o `title` que o PlaceholderMark (DS-21) usa em dev;
//   - o atributo `data-placeholder` (nó do PlaceholderMark, que só existe em dev);
//   - o texto `__PLACEHOLDER`.
// A CLASSE CSS do PlaceholderMark NÃO é checada: o CSS Module entra no CSS de produção quando o
// componente é usado, mesmo com o ramo de dev eliminado do JS (pendência do diário DS-21).
//
// Uso: node scripts/check-placeholders.mjs [pasta]   (padrão: dist)
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';
import process from 'node:process';

/** Rótulos do doc 05 §6 (PH-01 a PH-13; PH-09 e PH-11 não têm rótulo). */
const ROTULOS_PT = [
  '[link da demonstração]',
  'https://github.com/YanniMaia/[repositório]',
  '[repositório]',
  '[substituir por print do projeto]',
  '[ano]',
  '[ano de início]',
  '[previsão de conclusão]',
  '[link do currículo em PDF]',
  '[foto]',
  '[ferramentas de IA que estuda]',
  '[cursos e certificações]',
  '[imagem receita_por_mes.png]',
  // Variante do §12.5 do doc de design para o link do repositório (aceita pelo validarFichas).
  '[colocar o link do seu repositório]',
];

/** Rótulos EN dos mesmos placeholders (Anexo A, coluna EN). */
const ROTULOS_EN = [
  '[year]',
  '[start year]',
  '[expected graduation]',
  '[replace with project screenshot]',
];

/** Marcas do PlaceholderMark (DS-21) e sondas de teste. */
const MARCAS = ['placeholder — preencher', 'data-placeholder', '__PLACEHOLDER'];

const PROIBIDOS = [...ROTULOS_PT, ...ROTULOS_EN, ...MARCAS];

/** Extensões de texto verificadas (binários como fontes e imagens ficam de fora). */
const EXTENSOES_TEXTO = new Set([
  '.html',
  '.js',
  '.mjs',
  '.css',
  '.json',
  '.webmanifest',
  '.xml',
  '.txt',
  '.svg',
  '.md',
  '.map',
]);

/** Desfaz escapes que o minificador pode gerar (`ã`, `\u{e3}`, `\xe3`, `&#227;`, `&#xe3;`). */
function desescapar(texto) {
  const deCodigo = (hex, base) => String.fromCodePoint(Number.parseInt(hex, base));
  return texto
    .replace(/\\u\{([0-9a-fA-F]+)\}/g, (_, h) => deCodigo(h, 16))
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => deCodigo(h, 16))
    .replace(/\\x([0-9a-fA-F]{2})/g, (_, h) => deCodigo(h, 16))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => deCodigo(h, 16))
    .replace(/&#(\d+);/g, (_, d) => deCodigo(d, 10));
}

function listarArquivos(pasta) {
  return readdirSync(pasta).flatMap((nome) => {
    const caminho = join(pasta, nome);
    return statSync(caminho).isDirectory() ? listarArquivos(caminho) : [caminho];
  });
}

function main() {
  const pasta = resolve(process.cwd(), process.argv[2] ?? 'dist');
  let existe = false;
  try {
    existe = statSync(pasta).isDirectory();
  } catch {
    existe = false;
  }
  if (!existe) {
    process.stderr.write(`check-placeholders: pasta não encontrada: ${pasta}\n`);
    process.exit(2);
  }

  const arquivos = listarArquivos(pasta).filter((arq) =>
    EXTENSOES_TEXTO.has(extname(arq).toLowerCase()),
  );
  const achados = [];
  for (const arquivo of arquivos) {
    const bruto = readFileSync(arquivo, 'utf8');
    const texto = `${bruto}\n${desescapar(bruto)}`;
    for (const proibido of PROIBIDOS) {
      if (texto.includes(proibido)) achados.push(`${relative(pasta, arquivo)}: ${proibido}`);
    }
  }

  if (achados.length > 0) {
    process.stderr.write(
      `check-placeholders: FALHOU. Placeholder no build de produção (D11):\n  ${[...new Set(achados)].join('\n  ')}\n`,
    );
    process.exit(1);
  }
  process.stdout.write(
    `check-placeholders: OK (${arquivos.length} arquivos de texto em ${relative(process.cwd(), pasta) || '.'}, nenhum placeholder).\n`,
  );
}

main();
