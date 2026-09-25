// Rótulos da ferramenta /__styleguide (DS-05). Só desenvolvimento: não é conteúdo do site e não vai
// para o build de produção. Fica aqui (e não em src/content/pt.ts) porque nenhuma task DS edita os
// dicionários (regra de posse da F-10, doc 02 §1). Os rótulos acessíveis do tema e do idioma vêm do
// dicionário do site (`dict.a11y.*`, F-10).

export const TEXTOS = {
  titulo: 'Styleguide',
  subtitulo: 'Tokens e componentes do portfólio (só em desenvolvimento).',
  barra: {
    rotulo: 'Controles do styleguide',
    temaClaro: 'Claro',
    temaEscuro: 'Escuro',
    largura: 'Largura',
    unidade: 'px',
    movimento: 'Forçar movimento reduzido',
  },
  faixas: {
    celular: 'celular',
    tablet: 'tablet',
    desktop: 'desktop',
    grande: 'tela grande',
  },
  indice: 'Índice',
  secoes: {
    cores: 'Cores e decoração',
    efeitos: 'Gradientes, sombras e vidro',
    tipografia: 'Tipografia',
    espacamento: 'Espaçamento e layout',
    formas: 'Raios, bordas e foco',
    movimento: 'Movimento',
    demos: 'Componentes',
  },
  colunas: {
    amostra: 'Amostra',
    token: 'Token',
    claro: 'Claro',
    escuro: 'Escuro',
    computado: 'Computado agora',
    valor: 'Valor atual',
  },
  notas: {
    cores:
      'Uma amostra por token do §4.1 (doc 02). "Computado agora" é lido com getComputedStyle no tema atual.',
    efeitos: 'Cartões de 160 × 100 px aplicando cada token.',
    tipografia: 'Cada classe .t-* com a frase de amostra e os valores computados.',
    espacamento: 'Barras da escala --space-* e tokens de layout na faixa atual.',
    formas: 'Amostras focáveis: use Tab para conferir o contorno de foco em cada raio.',
    movimento:
      'Valores lidos no elemento raiz. "Forçar movimento reduzido" zera os lifts, o deslize da seta e as animações.',
    semDemos: 'Nenhum *.demo.tsx encontrado em src/components/.',
    liftDemo: 'Passe o mouse: sobe var(--lift-card)',
  },
  // Frase de amostra tipográfica definida no plano (doc 02, DS-05 passo 3).
  amostraTipografica: 'Transformando conhecimento em soluções',
} as const;
