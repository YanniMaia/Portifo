// Leitor mínimo de WOFF 1.0 (TrueType) para converter texto em contorno SVG (C-09).
// Usado pelo `scripts/build-icons.mjs` para desenhar o "YE" do favicon sem depender de fonte
// (critério "SVG sem <text>"). Sem dependência nova: só `node:zlib` para descomprimir as tabelas.
// Suporta o necessário para as iniciais: cmap formato 4, glifos simples (quadráticos) e hmtx.
// Não aplica kerning (GPOS): o par é montado só com as larguras de avanço.
import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';

/** Lê as tabelas de um arquivo WOFF 1.0. */
function lerTabelasWoff(buf) {
  if (buf.toString('latin1', 0, 4) !== 'wOFF') {
    throw new Error('Arquivo não é WOFF 1.0');
  }
  const numTables = buf.readUInt16BE(12);
  const tabelas = new Map();
  for (let i = 0; i < numTables; i += 1) {
    const base = 44 + i * 20;
    const tag = buf.toString('latin1', base, base + 4);
    const offset = buf.readUInt32BE(base + 4);
    const compLength = buf.readUInt32BE(base + 8);
    const origLength = buf.readUInt32BE(base + 12);
    const bruto = buf.subarray(offset, offset + compLength);
    tabelas.set(tag, compLength < origLength ? inflateSync(bruto) : Buffer.from(bruto));
  }
  return tabelas;
}

/** cmap: devolve uma função código → índice do glifo (subtabela formato 4, Unicode BMP). */
function lerCmap(cmap) {
  const numSub = cmap.readUInt16BE(2);
  for (let i = 0; i < numSub; i += 1) {
    const plataforma = cmap.readUInt16BE(4 + i * 8);
    const codificacao = cmap.readUInt16BE(6 + i * 8);
    const off = cmap.readUInt32BE(8 + i * 8);
    const formato = cmap.readUInt16BE(off);
    const unicode = plataforma === 0 || (plataforma === 3 && codificacao === 1);
    if (!unicode || formato !== 4) continue;
    const segX2 = cmap.readUInt16BE(off + 6);
    const ends = off + 14;
    const starts = ends + segX2 + 2;
    const deltas = starts + segX2;
    const ranges = deltas + segX2;
    return (codigo) => {
      for (let s = 0; s < segX2; s += 2) {
        const fim = cmap.readUInt16BE(ends + s);
        if (codigo > fim) continue;
        const inicio = cmap.readUInt16BE(starts + s);
        if (codigo < inicio) return 0;
        const delta = cmap.readInt16BE(deltas + s);
        const rangeOff = cmap.readUInt16BE(ranges + s);
        if (rangeOff === 0) return (codigo + delta) & 0xffff;
        const pos = ranges + s + rangeOff + (codigo - inicio) * 2;
        const g = cmap.readUInt16BE(pos);
        return g === 0 ? 0 : (g + delta) & 0xffff;
      }
      return 0;
    };
  }
  throw new Error('cmap formato 4 (Unicode) não encontrado');
}

/** Lê os contornos de um glifo simples: lista de contornos, cada um com pontos {x, y, on}. */
function lerGlifo(glyf, inicio, fim) {
  if (fim === inicio) return [];
  const g = glyf.subarray(inicio, fim);
  const numContornos = g.readInt16BE(0);
  if (numContornos < 0) throw new Error('Glifo composto não suportado');
  let p = 10;
  const fins = [];
  for (let i = 0; i < numContornos; i += 1, p += 2) fins.push(g.readUInt16BE(p));
  const total = fins.length ? fins[fins.length - 1] + 1 : 0;
  p += 2 + g.readUInt16BE(p); // pula as instruções
  const flags = [];
  while (flags.length < total) {
    const f = g[p++];
    flags.push(f);
    if (f & 8) {
      const rep = g[p++];
      for (let r = 0; r < rep; r += 1) flags.push(f);
    }
  }
  const lerEixo = (curto, mesmo) => {
    const v = [];
    let atual = 0;
    for (const f of flags) {
      if (f & curto) {
        const d = g[p++];
        atual += f & mesmo ? d : -d;
      } else if (!(f & mesmo)) {
        atual += g.readInt16BE(p);
        p += 2;
      }
      v.push(atual);
    }
    return v;
  };
  const xs = lerEixo(2, 16);
  const ys = lerEixo(4, 32);
  const contornos = [];
  let ini = 0;
  for (const f of fins) {
    const pts = [];
    for (let i = ini; i <= f; i += 1) pts.push({ x: xs[i], y: ys[i], on: (flags[i] & 1) === 1 });
    contornos.push(pts);
    ini = f + 1;
  }
  return contornos;
}

/**
 * Carrega a fonte e devolve `contornar(texto)`: contornos de cada letra já posicionados
 * (unidades da fonte, eixo y para cima) e a largura total de avanço.
 */
export function carregarFonte(caminhoWoff) {
  const t = lerTabelasWoff(readFileSync(caminhoWoff));
  const head = t.get('head');
  const unitsPerEm = head.readUInt16BE(18);
  const locLongo = head.readInt16BE(50) === 1;
  const numHMetrics = t.get('hhea').readUInt16BE(34);
  const hmtx = t.get('hmtx');
  const loca = t.get('loca');
  const glyf = t.get('glyf');
  const glifoDe = lerCmap(t.get('cmap'));
  const offsetLoca = (i) => (locLongo ? loca.readUInt32BE(i * 4) : loca.readUInt16BE(i * 2) * 2);
  const avanco = (i) => hmtx.readUInt16BE(Math.min(i, numHMetrics - 1) * 4);

  function contornar(texto) {
    const contornos = [];
    let x = 0;
    for (const ch of texto) {
      const gi = glifoDe(ch.codePointAt(0));
      if (gi === 0) throw new Error(`Glifo ausente para "${ch}"`);
      for (const c of lerGlifo(glyf, offsetLoca(gi), offsetLoca(gi + 1))) {
        contornos.push(c.map((pt) => ({ ...pt, x: pt.x + x })));
      }
      x += avanco(gi);
    }
    return { contornos, avanco: x, unitsPerEm };
  }
  return { contornar, unitsPerEm };
}

/** Caixa (min/max) dos pontos de controle; nos glifos de "YE" (retos) coincide com a do desenho. */
export function caixaDe(contornos) {
  const todos = contornos.flat();
  return {
    xMin: Math.min(...todos.map((p) => p.x)),
    xMax: Math.max(...todos.map((p) => p.x)),
    yMin: Math.min(...todos.map((p) => p.y)),
    yMax: Math.max(...todos.map((p) => p.y)),
  };
}

/**
 * Converte contornos quadráticos em `d` de <path>, aplicando `mapear(x, y) → [x, y]`.
 * Números com até `casas` decimais, sem espaços desnecessários.
 */
export function paraPathD(contornos, mapear, casas = 2) {
  const fmt = (n) => {
    const s = Number(n.toFixed(casas)).toString();
    return s.startsWith('0.') ? s.slice(1) : s.startsWith('-0.') ? `-${s.slice(2)}` : s;
  };
  const par = (pt) => {
    const [x, y] = mapear(pt.x, pt.y);
    const sx = fmt(x);
    const sy = fmt(y);
    return `${sx}${sy.startsWith('-') ? '' : ' '}${sy}`;
  };
  let d = '';
  for (const c of contornos) {
    if (c.length === 0) continue;
    // Ponto inicial on-curve (ou o meio entre dois off-curve).
    let inicio = c.findIndex((p) => p.on);
    let pts;
    if (inicio === -1) {
      const m = { x: (c[0].x + c[1].x) / 2, y: (c[0].y + c[1].y) / 2, on: true };
      pts = [m, ...c.slice(1), c[0]];
      inicio = 0;
    } else {
      pts = [...c.slice(inicio), ...c.slice(0, inicio)];
    }
    d += `M${par(pts[0])}`;
    let controle = null;
    for (let i = 1; i <= pts.length; i += 1) {
      const pt = i === pts.length ? pts[0] : pts[i];
      if (i === pts.length && !controle) break; // o Z já fecha com uma reta
      if (pt.on) {
        d += controle ? `Q${par(controle)} ${par(pt)}` : `L${par(pt)}`;
        controle = null;
      } else if (controle) {
        const meio = { x: (controle.x + pt.x) / 2, y: (controle.y + pt.y) / 2, on: true };
        d += `Q${par(controle)} ${par(meio)}`;
        controle = pt;
      } else {
        controle = pt;
      }
    }
    d += 'Z';
  }
  return d;
}
