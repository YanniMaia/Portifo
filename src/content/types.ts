// Tipos da "ficha" de projeto (doc de design §14) — task F-11.
// Só o contrato dos dados. As regras de exibição (destaque, grade, botões, contagem de
// publicados) ficam em `src/content/selectors.ts` (C-06, dono único — D14).
// As fichas de verdade ficam em `src/content/projects.ts` (C-05).

/** Idiomas do site (D6). PT é o padrão. */
export type Locale = 'pt' | 'en';

/** Texto nos dois idiomas (§15). */
export type LocalizedText = Record<Locale, string>;

/**
 * Enum ÚNICO de área do projeto (§14: Dados, Cibersegurança, Desenvolvimento ou Banco de Dados).
 * Define o ícone padrão. O rótulo exibido vem de `etiqueta` ou do dicionário, nunca daqui.
 */
export type ProjectArea = 'dados' | 'ciberseguranca' | 'desenvolvimento' | 'banco-de-dados';

/**
 * Imagem do card, em proporção 4:3 (§14). O `alt` é obrigatório nos dois idiomas (§11).
 * O arquivo fica em `public/projetos/<id>/`; `src` é relativo (o componente prefixa a base).
 */
export interface ProjectImage {
  src: string;
  alt: LocalizedText;
}

/**
 * Ficha de projeto (§14). A ordem do array `PROJECTS` é a ordem de exibição (não há campo `ordem`).
 * Links pendentes são strings de placeholder com o rótulo entre colchetes, ex. `'[link da demonstração]'`
 * (D11, D23), reconhecidas pela API única `isPlaceholder` de `src/lib/placeholder.ts` (F-15).
 */
export interface Project {
  /** Slug estável, ex. `'analise-de-dados-vendas'`. */
  id: string;
  /** §14 "Nome". Não traduz (§15). */
  nome: string;
  /** §14 "Área". Define o ícone padrão. */
  area: ProjectArea;
  /** Rótulo exibido, ex. "Banco de Dados / SQL" (§12). Sobrepõe o rótulo da área. */
  etiqueta?: LocalizedText;
  /** §14 "Descrição": de 1 a 3 frases. */
  descricao: LocalizedText;
  /** §14 "Tecnologias": chips. Não traduzem (§15). */
  tecnologias: string[];
  /** §14 "Imagem". Ausente → ilustração rosa padrão (C-08, §7.8). */
  imagem?: ProjectImage;
  /** §14 "Selo": "Projeto de estudo" quando os dados são fictícios (§7.8; estilo D17). */
  projetoDeEstudo: boolean;
  /** §14 "Link do projeto". Ausente ou placeholder → botão "Ver projeto" não aparece (D11). */
  linkProjeto?: string;
  /** §14 "Link do GitHub". Ausente ou placeholder → botão "GitHub" não aparece (D11). */
  linkGithub?: string;
  /** Campo ÚNICO (D14): o repositório existe de fato no GitHub (§7.3, §12.5). */
  publicado: boolean;
  /** §14 "Destaque": no máximo um projeto com `true`. */
  destaque: boolean;
  /** Algum texto da ficha é sugestão aguardando a Yanni (00-INDICE §3, R7). */
  sugerido?: boolean;
  /** A ficha tem campo pendente, ex. o link do Gerenciador de Estoque (§16). */
  placeholder?: boolean;
}
