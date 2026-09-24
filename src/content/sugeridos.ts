// Registro ÚNICO de "texto sugerido" do projeto (F-10, R7, 00-INDICE §3, doc 05 §4.2).
// Lista as chaves do dicionário cujo texto pt-BR é sugestão aguardando a Yanni. Chave inexistente
// não compila. A C-02 acrescenta as chaves de conteúdo sugeridas; a tradução EN nova NÃO entra
// aqui (fica em `TRADUCAO_EN`, doc 05 §4.4).
// As chaves de infraestrutura da F-10 são cópia literal do doc ou rótulo novo de a11y, que não
// entra neste registro (doc 05 §4.5): por isso a lista começa vazia.
import type { Dictionary, KeyPath } from '@/i18n/types';

export const SUGERIDOS: readonly KeyPath<Dictionary>[] = [];
