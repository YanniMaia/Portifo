// Registro ÚNICO de "texto sugerido" do projeto (F-10, R7, 00-INDICE §3, doc 05 §4.2).
// Lista as chaves do dicionário cujo texto pt-BR é sugestão aguardando a Yanni. Chave inexistente
// não compila. A tradução EN nova NÃO entra aqui (fica em `TRADUCAO_EN`, doc 05 §4.4).
// Cada chave tem a pendência correspondente em `PENDENCIA_POR_CHAVE` (`./metadados.ts`).
// Não entram: cópia literal do doc, rótulos `novo (a11y)` e placeholders (doc 05 §4.5).
import type { Dictionary, KeyPath } from '@/i18n/types';

export const SUGERIDOS: readonly KeyPath<Dictionary>[] = [
  // sugerido (IA §3) → P-IA-2
  'hero.pilula',
  'hero.subtitulo',
  'destaques.areas.valor',
  'destaques.areas.legenda',
  'interesses.seloEstudo',
  'interesses.ia.titulo',
  'interesses.ia.texto',
  'projetos.ia.titulo',
  'objetivos.trilhaIA.nome',
  'objetivos.trilhaIA.etapas',
  'meta.description',
  // sugerido (doc) → P-10 (em `sobre.trajetoria.marcos`, só o marco [2] "Próximo passo…")
  'sobre.trajetoria.marcos',
  'contato.disponibilidade',
  // derivado (chips dos cards de interesse, DV-14) → P-10
  'interesses.dados.chips',
  'interesses.ciber.chips',
  'interesses.dev.chips',
  // novo (UI) → P-10
  'projetos.emDestaque',
  'objetivos.trilhaRotulo',
  'erro404.titulo',
  'erro404.voltar',
  // novo (UI, DV-13) → P-11
  'destaques.projetos.legenda',
];
