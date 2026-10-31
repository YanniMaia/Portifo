// Contrastes WCAG dos pares da DS-01 (doc 02, critérios da DS-01; doc de design §3.5 e §11).
// Os pares usam os fundos reais onde o texto aparece (RS-3): #FFEEF4, #1C0E16 e os dois extremos
// dos degradês primários. O Q-15 repete as medições na página montada.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { contrastRatio, hueSaturation, parseColor, relativeLuminance } from '../support/contrast';

interface Par {
  texto: string;
  fundo: string;
  minimo: number;
  uso: string;
}

const PARES: Par[] = [
  // ---------- Claro ----------
  { texto: '#2B1620', fundo: '#FFFFFF', minimo: 7, uso: 'texto principal sobre branco' },
  { texto: '#2B1620', fundo: '#FFF7FA', minimo: 7, uso: 'texto principal sobre rosa névoa' },
  { texto: '#6E4B5C', fundo: '#FFFFFF', minimo: 7, uso: 'texto secundário (§3.2 "cerca de 7:1")' },
  { texto: '#8C6A7A', fundo: '#FFFFFF', minimo: 4.5, uso: 'dica e legendas, ≥ 14 px (D13, DV-17)' },
  { texto: '#C93A77', fundo: '#FFFFFF', minimo: 4.5, uso: 'link e texto rosa pequeno (doc: 4,8)' },
  { texto: '#C93A77', fundo: '#FFF7FA', minimo: 4.5, uso: 'eyebrow padrão sobre rosa névoa' },
  { texto: '#A82560', fundo: '#FFEEF4', minimo: 4.5, uso: 'eyebrow tint e selos (D13)' },
  { texto: '#A82560', fundo: '#FFFFFF', minimo: 4.5, uso: 'selo "Em estudo" sobre card (DV-4)' },
  { texto: '#FFFFFF', fundo: '#C93A77', minimo: 4.5, uso: 'botão primário, início do degradê' },
  { texto: '#FFFFFF', fundo: '#A82560', minimo: 4.5, uso: 'botão primário e 1ª etapa, fim (D13)' },
  { texto: '#E0518A', fundo: '#FFFFFF', minimo: 3, uso: 'contorno de foco (§11, não texto)' },
  // ---------- Escuro ----------
  { texto: '#FDF0F5', fundo: '#150A10', minimo: 7, uso: 'texto principal sobre ameixa noite' },
  { texto: '#D8B4C4', fundo: '#251320', minimo: 4.5, uso: 'texto secundário sobre card' },
  { texto: '#A98496', fundo: '#251320', minimo: 4.5, uso: 'legendas sobre card' },
  { texto: '#A98496', fundo: '#150A10', minimo: 4.5, uso: 'dica "Clique no YE" no escuro' },
  { texto: '#FFB3D1', fundo: '#150A10', minimo: 4.5, uso: 'links e eyebrow no escuro' },
  { texto: '#FFB3D1', fundo: '#1C0E16', minimo: 4.5, uso: 'eyebrow tint sobre a Frase (DV-10)' },
  { texto: '#2A0A1A', fundo: '#F58FB8', minimo: 4.5, uso: 'botão primário escuro, início' },
  { texto: '#2A0A1A', fundo: '#F06CA3', minimo: 4.5, uso: 'botão primário escuro, fim do degradê' },
  { texto: '#F58FB8', fundo: '#150A10', minimo: 3, uso: 'contorno de foco escuro (§11)' },
];

const fmt = (n: number): string => n.toFixed(2).replace('.', ',');

describe('helper de contraste', () => {
  it('preto × branco = 21:1 e branco × branco = 1:1', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
    expect(contrastRatio('#FFFFFF', '#FFFFFF')).toBeCloseTo(1, 5);
  });

  it('é simétrico e aceita #rgb, rgb() e rgba()', () => {
    expect(contrastRatio('#C93A77', '#FFFFFF')).toBeCloseTo(contrastRatio('#FFFFFF', '#C93A77'));
    expect(parseColor('#fff')).toEqual({ r: 255, g: 255, b: 255, a: 1 });
    expect(parseColor('rgb(21, 10, 16)')).toEqual({ r: 21, g: 10, b: 16, a: 1 });
    expect(parseColor('rgba(245, 143, 184, 0.6)').a).toBeCloseTo(0.6);
    expect(relativeLuminance('#FFFFFF')).toBeCloseTo(1);
  });

  it('compõe texto com alfa sobre o fundo (alfa 0 = contraste 1)', () => {
    expect(contrastRatio('rgba(0, 0, 0, 0)', '#FFFFFF')).toBeCloseTo(1);
  });

  it('calcula matiz: rosa ~330°, azul 240°, cinza sem saturação', () => {
    expect(hueSaturation('#C93A77').hue).toBeGreaterThan(300);
    expect(hueSaturation('#0000FF').hue).toBeCloseTo(240);
    expect(hueSaturation('#808080').saturation).toBe(0);
  });
});

describe('contrastes da DS-01', () => {
  it.each(PARES)('$texto sobre $fundo ≥ $minimo:1 ($uso)', ({ texto, fundo, minimo }) => {
    const razao = contrastRatio(texto, fundo);
    console.info(`[DS-01] ${texto}/${fundo} = ${fmt(razao)}:1 (mín. ${fmt(minimo)})`);
    expect(razao).toBeGreaterThanOrEqual(minimo);
  });

  it('par registrado, não reprovado (DV-1, D13): borda #F286B0 sobre branco ≈ 2,4:1', () => {
    const razao = contrastRatio('#F286B0', '#FFFFFF');
    console.info(`[DS-01] #F286B0/#FFFFFF = ${fmt(razao)}:1 (registrado; DV-1, D13)`);
    expect(razao).toBeCloseTo(2.4, 1);
  });

  it('#C93A77 sobre #FFEEF4 reprova (≈ 4,3:1; o plano cita 4,39): por isso existe --color-eyebrow-on-tint (D13)', () => {
    const razao = contrastRatio('#C93A77', '#FFEEF4');
    console.info(`[DS-01] #C93A77/#FFEEF4 = ${fmt(razao)}:1 (reprova; D13)`);
    expect(razao).toBeLessThan(4.5);
  });
});

// =============================================================================================
// Q-15 — Contraste de cores nos dois temas (doc 06, linhas 448-502).
//
// Diferença do bloco acima (DS-01): aqui os hex NÃO são copiados à mão. O teste lê
// `src/styles/tokens/colors.css` como texto (mesma técnica de `tests/unit/styles/colors.test.ts`),
// extrai o valor de cada token nos blocos claro/escuro e só então calcula a razão de contraste.
// Isso prova que o TOKEN certo existe para cada uso da tabela do doc 06 (ex.: eyebrow sobre
// `--color-bg-tint` usa `--color-eyebrow-on-tint`, não `--color-eyebrow`) e falha se alguém trocar
// um token por outro (prova de mutação registrada no checkpoint `cp/Q-15`, revertida).
//
// Pares ❌ da tabela (linhas 5 e 9) são combinações PROIBIDAS: o teste confirma que elas reprovam
// (ratio < mínimo), isto é, confirma que a proibição é real e mensurável — não que elas apareçam
// na página (isso é papel do e2e `tests/e2e/contraste.spec.ts`).
// Pares ℹ️ (12, 14, 15, 17, 26, 27) são decorativos ou isentos (D13, logotipo WCAG 1.4.3, seta
// decorativa do cp/S-06): o teste fixa o valor medido (`toBeCloseTo`) como guarda de regressão,
// sem exigir o mínimo de texto.
describe('contrastes da tabela Q-15 (tokens de colors.css, não hex copiados)', () => {
  const caminhoCores = resolve(process.cwd(), 'src/styles/tokens/colors.css');
  const cssCores = readFileSync(caminhoCores, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

  /** Declarações `--token: valor;` de um bloco `:root/[data-theme]` como mapa bruto (sem normalizar). */
  function blocoDeTokens(regex: RegExp): Map<string, string> {
    const corpo = regex.exec(cssCores)?.[1];
    if (corpo === undefined) throw new Error(`Bloco não encontrado em colors.css: ${regex}`);
    const mapa = new Map<string, string>();
    for (const m of corpo.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
      mapa.set(m[1] as string, (m[2] as string).trim());
    }
    return mapa;
  }

  const CLARO = blocoDeTokens(/:root,\s*\[data-theme=['"]light['"]\]\s*\{([^}]*)\}/);
  const ESCURO = blocoDeTokens(/\[data-theme=['"]dark['"]\]\s*\{([^}]*)\}/);

  /** Extrai cada stop de cor (hex ou rgb/rgba) de um valor; um valor sólido devolve 1 item. */
  function paradas(valor: string): string[] {
    const achados = valor.match(/#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)/g);
    if (!achados || achados.length === 0) throw new Error(`Nenhuma cor em: ${valor}`);
    return achados;
  }

  /** Resolve um `--token` (claro ou escuro) nas cores que ele representa (1 para sólido, 2+ p/ degradê). */
  function cores(mapa: Map<string, string>, token: string): string[] {
    const valor = mapa.get(token);
    if (valor === undefined)
      throw new Error(`Token ausente em colors.css: ${token} (${[...mapa.keys()].join(', ')})`);
    return paradas(valor);
  }

  /** Pior razão (mínimo) entre todas as combinações texto × fundo — o caso mais exigente. */
  function piorRazao(textos: string[], fundos: string[]): number {
    let pior = Number.POSITIVE_INFINITY;
    for (const t of textos) {
      for (const f of fundos) {
        pior = Math.min(pior, contrastRatio(t, f));
      }
    }
    return pior;
  }

  interface LinhaQ15 {
    linha: number;
    tema: 'claro' | 'escuro';
    texto: string; // nome do token (resolvido em paradas de cor)
    fundos: string[]; // nomes dos tokens (resolvidos em paradas de cor)
    minimo: number;
    uso: string;
  }

  const PARES_ESPERADOS: LinhaQ15[] = [
    {
      linha: 1,
      tema: 'claro',
      texto: '--color-text',
      fundos: ['--color-bg', '--color-bg-alt', '--color-bg-tint'],
      minimo: 7,
      uso: 'corpo/títulos/chips sobre branco, névoa e rosa clarinho',
    },
    {
      linha: 2,
      tema: 'claro',
      texto: '--color-text-secondary',
      fundos: ['--color-bg', '--color-bg-alt'],
      minimo: 4.5,
      uso: 'texto secundário',
    },
    {
      linha: 3,
      tema: 'claro',
      texto: '--color-text-secondary',
      fundos: ['--color-bg-tint'],
      minimo: 4.5,
      uso: 'apoio da Frase de destaque / painel de contato',
    },
    {
      linha: 4,
      tema: 'claro',
      texto: '--color-text-muted',
      fundos: ['--color-bg'],
      minimo: 4.5,
      uso: 'legendas ≥14px, só sobre branco (D13/DV-17)',
    },
    {
      linha: 7,
      tema: 'claro',
      texto: '--color-eyebrow',
      fundos: ['--color-bg'],
      minimo: 4.5,
      uso: 'link/eyebrow padrão sobre branco',
    },
    {
      linha: 8,
      tema: 'claro',
      texto: '--color-eyebrow',
      fundos: ['--color-bg-alt'],
      minimo: 4.5,
      uso: 'eyebrow sobre rosa névoa',
    },
    {
      linha: 10,
      tema: 'claro',
      texto: '--color-eyebrow-on-tint',
      fundos: ['--color-bg-tint', '--color-bg', '--color-bg-alt'],
      minimo: 4.5,
      uso: 'eyebrow/selos sobre tint, branco e névoa (D13)',
    },
    {
      linha: 11,
      tema: 'claro',
      texto: '--color-on-primary',
      fundos: ['--gradient-primary'],
      minimo: 4.5,
      uso: 'botão primário / pular para o conteúdo / 1ª etapa das trilhas (D13)',
    },
    {
      linha: 13,
      tema: 'claro',
      texto: '--gradient-text',
      fundos: ['--color-bg'],
      minimo: 3,
      uso: 'nome no H1 e valores da faixa (degradê, texto grande, D19)',
    },
    {
      linha: 16,
      tema: 'claro',
      texto: '--color-focus',
      fundos: ['--color-bg', '--color-bg-tint'],
      minimo: 3,
      uso: 'contorno de foco',
    },
    {
      linha: 18,
      tema: 'escuro',
      texto: '--color-text',
      fundos: ['--color-bg', '--color-bg-alt', '--color-surface', '--gradient-contact'],
      minimo: 7,
      uso: 'corpo/títulos/chips (escuro)',
    },
    {
      linha: 19,
      tema: 'escuro',
      texto: '--color-text-secondary',
      fundos: ['--color-bg', '--color-bg-alt', '--color-surface'],
      minimo: 4.5,
      uso: 'secundário (escuro)',
    },
    {
      linha: 20,
      tema: 'escuro',
      texto: '--color-text-muted',
      fundos: ['--color-bg', '--color-bg-alt', '--color-surface'],
      minimo: 4.5,
      uso: 'legendas e dica "Clique no YE" (escuro)',
    },
    {
      linha: 21,
      tema: 'escuro',
      texto: '--color-link',
      fundos: ['--color-bg', '--color-bg-alt', '--color-surface', '--gradient-contact'],
      minimo: 4.5,
      uso: 'links, item ativo/hover do menu (D14), eyebrow (escuro)',
    },
    {
      linha: 22,
      tema: 'escuro',
      texto: '--color-accent',
      fundos: ['--color-bg', '--color-bg-alt', '--color-surface'],
      minimo: 3,
      uso: 'destaque não textual (ícones, pulsos; escuro)',
    },
    {
      linha: 23,
      tema: 'escuro',
      texto: '--color-on-primary',
      fundos: ['--gradient-primary'],
      minimo: 4.5,
      uso: 'botão primário e 1ª etapa (escuro)',
    },
    {
      linha: 24,
      tema: 'escuro',
      texto: '--color-focus',
      fundos: ['--color-bg'],
      minimo: 3,
      uso: 'contorno de foco (escuro)',
    },
    {
      linha: 25,
      tema: 'escuro',
      texto: '--color-border-hover',
      fundos: ['--color-bg'],
      minimo: 3,
      uso: 'borda do botão secundário (escuro, DV-1) — ✅ sem isenção',
    },
    {
      linha: 28,
      tema: 'claro',
      texto: '--color-text',
      fundos: ['--color-chip-bg', '--color-chip-bg-hover'],
      minimo: 4.5,
      uso: 'texto do chip, normal e hover (claro, D17)',
    },
    {
      linha: 28,
      tema: 'escuro',
      texto: '--color-text',
      fundos: ['--color-chip-bg'],
      minimo: 4.5,
      uso: 'texto do chip (escuro, D17)',
    },
  ];

  it.each(PARES_ESPERADOS)(
    'linha $linha ($tema): $texto sobre $fundos ≥ $minimo:1 ($uso)',
    ({ linha, tema, texto, fundos, minimo }) => {
      const mapa = tema === 'claro' ? CLARO : ESCURO;
      const textos = cores(mapa, texto);
      const fundosResolvidos = fundos.flatMap((f) => cores(mapa, f));
      const razao = piorRazao(textos, fundosResolvidos);
      console.info(
        `[Q-15] linha ${linha} (${tema}) ${texto}/${fundos.join('+')} = ${fmt(razao)}:1 (mín. ${fmt(minimo)})`,
      );
      expect(razao).toBeGreaterThanOrEqual(minimo);
    },
  );

  interface LinhaProibida {
    linha: number;
    texto: string;
    fundos: string[];
    minimo: number;
    uso: string;
  }

  const PARES_PROIBIDOS: LinhaProibida[] = [
    {
      linha: 5,
      texto: '--color-text-muted',
      fundos: ['--color-bg-alt', '--color-bg-tint'],
      minimo: 4.5,
      uso: '#8C6A7A fora do branco: proibido (usar --color-text-secondary)',
    },
    {
      linha: 9,
      texto: '--color-eyebrow',
      fundos: ['--color-bg-tint'],
      minimo: 4.5,
      uso: '--color-eyebrow sobre --color-bg-tint: proibido (usar --color-eyebrow-on-tint)',
    },
  ];

  it.each(PARES_PROIBIDOS)(
    'linha $linha: $texto sobre $fundos reprova < $minimo:1 — combinação proibida ($uso)',
    ({ linha, texto, fundos, minimo }) => {
      const textos = cores(CLARO, texto);
      const fundosResolvidos = fundos.flatMap((f) => cores(CLARO, f));
      const razao = piorRazao(textos, fundosResolvidos);
      console.info(
        `[Q-15] linha ${linha} (proibida) ${texto}/${fundos.join('+')} = ${fmt(razao)}:1`,
      );
      expect(razao).toBeLessThan(minimo);
    },
  );

  // ---- Linhas isentas/decorativas (12, 14, 15, 17, 26, 27): guarda de regressão do valor medido ----

  it('linha 12: --color-on-brand sobre --gradient-brand (monograma) — isenção WCAG 1.4.3, mesmo valor nos 2 temas', () => {
    const textoClaro = cores(CLARO, '--color-on-brand');
    const fundoClaro = cores(CLARO, '--gradient-brand');
    const textoEscuro = cores(ESCURO, '--color-on-brand');
    const fundoEscuro = cores(ESCURO, '--gradient-brand');
    const razaoClaro = piorRazao(textoClaro, fundoClaro);
    const razaoEscuro = piorRazao(textoEscuro, fundoEscuro);
    console.info(
      `[Q-15] linha 12 (isenção, logotipo) claro=${fmt(razaoClaro)}:1 escuro=${fmt(razaoEscuro)}:1`,
    );
    expect(razaoClaro).toBeCloseTo(3.68, 1);
    expect(razaoEscuro).toBeCloseTo(3.68, 1);
  });

  it('linha 14: --color-deco sobre --color-bg-tint (seta "→" da Frase) — decorativa, opção do cp/S-06', () => {
    const razao = piorRazao(cores(CLARO, '--color-deco'), cores(CLARO, '--color-bg-tint'));
    console.info(`[Q-15] linha 14 (cp/S-06: seta aria-hidden, decorativa) = ${fmt(razao)}:1`);
    expect(razao).toBeCloseTo(2.13, 1);
  });

  it('linha 15: --color-secondary-border sobre --color-bg/--color-bg-tint (claro) — aceita por D13 (texto identifica o botão)', () => {
    const razaoBranco = piorRazao(
      cores(CLARO, '--color-secondary-border'),
      cores(CLARO, '--color-bg'),
    );
    const razaoTint = piorRazao(
      cores(CLARO, '--color-secondary-border'),
      cores(CLARO, '--color-bg-tint'),
    );
    console.info(
      `[Q-15] linha 15 (isenção D13) branco=${fmt(razaoBranco)}:1 tint=${fmt(razaoTint)}:1`,
    );
    expect(razaoBranco).toBeCloseTo(2.38, 1);
    expect(razaoTint).toBeCloseTo(2.13, 1);
  });

  it('linha 17: --color-border sobre --color-bg (claro) — borda decorativa, não essencial', () => {
    const razao = piorRazao(cores(CLARO, '--color-border'), cores(CLARO, '--color-bg'));
    console.info(`[Q-15] linha 17 (decorativa) = ${fmt(razao)}:1`);
    expect(razao).toBeCloseTo(1.34, 1);
  });

  it('linha 26: --color-border sobre --color-bg (escuro) — borda decorativa, não essencial', () => {
    const razao = piorRazao(cores(ESCURO, '--color-border'), cores(ESCURO, '--color-bg'));
    console.info(`[Q-15] linha 26 (decorativa) = ${fmt(razao)}:1`);
    expect(razao).toBeCloseTo(1.33, 1);
  });

  it('linha 27: --color-deco sobre --color-bg (claro) — contorno tracejado do selo "Em estudo" (DV-4), texto da linha 10 identifica', () => {
    const razao = piorRazao(cores(CLARO, '--color-deco'), cores(CLARO, '--color-bg'));
    console.info(`[Q-15] linha 27 (decorativa) = ${fmt(razao)}:1`);
    expect(razao).toBeCloseTo(2.38, 1);
  });

  it('prova de mutação (revertida no checkpoint): trocar --color-eyebrow-on-tint por #C93A77 reprovaria a linha 10', () => {
    // Não altera o arquivo de verdade: só recalcula com o hex errado para provar que o teste pegaria o erro.
    const razaoErrada = contrastRatio('#C93A77', cores(CLARO, '--color-bg-tint')[0] as string);
    expect(razaoErrada).toBeLessThan(4.5);
    const razaoCorreta = piorRazao(
      cores(CLARO, '--color-eyebrow-on-tint'),
      cores(CLARO, '--color-bg-tint'),
    );
    expect(razaoCorreta).toBeGreaterThanOrEqual(4.5);
  });
});
