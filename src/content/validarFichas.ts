// Validação das fichas de projeto (§14) — task F-11.
// Confere se os DADOS respeitam o contrato. Não é regra de exibição: destaque, grade,
// botões e contagem são do C-06 (`src/content/selectors.ts`, D14).
// O teste da C-05 roda `validarFichas(PROJECTS)` e espera `[]`.
import type { Locale, Project } from './types';

/** Prefixo obrigatório de todo `linkGithub` que não é placeholder (§12.5). */
const PREFIXO_GITHUB = 'https://github.com/YanniMaia/';

const LOCALES: readonly Locale[] = ['pt', 'en'];

/**
 * Checagem local mínima da regra D23 (placeholder = string que contém `[` e `]`).
 * A API única de placeholder é `isPlaceholder`, de `src/lib/placeholder.ts` (F-15/C-06);
 * esta cópia existe só para a F-11 não depender da F-15. Quem consome fichas usa a F-15.
 */
function temPlaceholder(valor: string): boolean {
  return valor.includes('[') && valor.includes(']');
}

/**
 * Conta frases: trechos terminados em `.`, `!`, `?` ou `…` seguidos de espaço ou do fim do texto
 * (aspas ou parêntese de fechamento logo depois do sinal são aceitos). Um trecho final sem
 * pontuação também conta. "ex.:" e "1.5" não quebram frase. Texto vazio → 0.
 */
function contarFrases(texto: string): number {
  const limpo = texto.trim();
  if (limpo === '') return 0;
  return limpo.split(/[.!?…]+["'”’)]*(?=\s|$)/u).filter((trecho) => trecho.trim() !== '').length;
}

/**
 * Valida a lista de fichas e devolve a lista de erros (vazia = tudo certo).
 * Erros checados (F-11, passo 2):
 * 1. mais de 1 projeto com `destaque: true`;
 * 2. descrição com 0 ou mais de 3 frases (em qualquer idioma);
 * 3. `tecnologias` vazia;
 * 4. `linkGithub` fora de `https://github.com/YanniMaia/` (placeholder `[…]` é aceito);
 * 5. `id` duplicado;
 * 6. `imagem` sem `alt` nos dois idiomas.
 */
export function validarFichas(lista: readonly Project[]): string[] {
  const erros: string[] = [];

  // 1. Destaque único (§14).
  const emDestaque = lista.filter((p) => p.destaque).map((p) => p.id);
  if (emDestaque.length > 1) {
    erros.push(`mais de 1 projeto em destaque: ${emDestaque.join(', ')}`);
  }

  // 5. Ids únicos.
  const vistos = new Set<string>();
  const duplicados = new Set<string>();
  for (const { id } of lista) {
    if (vistos.has(id)) duplicados.add(id);
    vistos.add(id);
  }
  for (const id of duplicados) {
    erros.push(`id duplicado: "${id}"`);
  }

  for (const p of lista) {
    // 2. Descrição de 1 a 3 frases (§14), nos dois idiomas.
    for (const locale of LOCALES) {
      const frases = contarFrases(p.descricao[locale]);
      if (frases < 1 || frases > 3) {
        erros.push(`[${p.id}] descricao.${locale} tem ${frases} frase(s); o esperado é de 1 a 3`);
      }
    }

    // 3. Pelo menos um chip de tecnologia (§14).
    if (p.tecnologias.length === 0) {
      erros.push(`[${p.id}] tecnologias vazia`);
    }

    // 4. Link do GitHub no perfil oficial (§12.5) ou placeholder pendente (D11, D23).
    if (
      p.linkGithub !== undefined &&
      !temPlaceholder(p.linkGithub) &&
      !(p.linkGithub.startsWith(PREFIXO_GITHUB) && p.linkGithub.length > PREFIXO_GITHUB.length)
    ) {
      erros.push(`[${p.id}] linkGithub fora de ${PREFIXO_GITHUB}: "${p.linkGithub}"`);
    }

    // 6. Imagem com `alt` preenchido nos dois idiomas (§11).
    if (p.imagem !== undefined) {
      // Defensivo: dados montados fora do tipo (ex.: JSON) podem vir sem `alt`.
      const alt = p.imagem.alt as Partial<Record<Locale, string>> | undefined;
      const faltando = LOCALES.filter((locale) => (alt?.[locale] ?? '').trim() === '');
      if (faltando.length > 0) {
        erros.push(`[${p.id}] imagem sem alt em: ${faltando.join(', ')}`);
      }
    }
  }

  return erros;
}
