// Dicionário pt-BR: FONTE DAS CHAVES do site (F-10 criou a infraestrutura; a C-02 preencheu).
// Esquema único de chaves: doc 05 §4.1 e Anexo A. Só escrevem aqui a F-10 (infraestrutura) e a C-02.
// Valores: só string, lista de strings ou função de interpolação que devolve string (doc 05 §4.1).
// Texto sugerido não é marcado aqui: vai no registro `SUGERIDOS` de `./sugeridos.ts` (R7), com a
// pendência em `PENDENCIA_POR_CHAVE` de `./metadados.ts`.
// Textos de projeto (nome, etiqueta, descrição, alt da imagem) NÃO ficam aqui: `projects.ts` (C-05).
//
// Placeholders (doc 05 §4.3, D11): o rótulo `[…]` só existe em desenvolvimento. Em produção o valor
// é `''`, que `isPlaceholder`/`resolveOptional`/`PlaceholderMark` (F-15, DS-21) tratam como
// "oculto", e o rótulo sai do bundle (checado pelo `postbuild`, C-01).
import type { DictionaryShape } from '@/i18n/types';
import { SHOW_PLACEHOLDERS } from '@/lib/flags';

export const pt = {
  // Anexo A.2 (doc de design §7.1).
  nav: {
    sobre: 'Sobre',
    interesses: 'Interesses',
    habilidades: 'Habilidades',
    projetos: 'Projetos',
    formacao: 'Formação',
    contato: 'Contato',
  },
  // Anexo A.1.
  a11y: {
    skipToContent: 'Pular para o conteúdo', // doc §11
    opensInNewTab: 'abre em nova aba', // doc §11
    themeToDark: 'Alternar para modo escuro', // doc §6
    themeToLight: 'Alternar para modo claro', // doc §6
    language: 'Idioma', // novo (a11y): prefixo oculto do nome acessível do botão PT/EN (DS-20)
    languageNamePt: 'Português', // novo (a11y): nome do idioma na própria língua
    languageNameEn: 'English', // novo (a11y): nome do idioma na própria língua
  },
  // Anexo A.1: menu do celular (novo, a11y).
  menu: {
    abrir: 'Abrir menu',
    fechar: 'Fechar menu',
    navAria: 'Navegação principal',
  },
  // Anexo A.2 (doc §7.1).
  marca: {
    monograma: 'YE',
    nome: 'Yanni Elyssa',
    aria: 'Yanni Elyssa — voltar ao topo', // novo (a11y)
  },
  // Anexo A.3 (doc §7.2).
  hero: {
    // sugerido (IA §3). original doc §7.2: "Dados · Cibersegurança · Desenvolvimento"
    pilula: 'Dados · Cibersegurança · IA',
    tituloLinha1: 'Olá, eu sou',
    tituloNome: 'Yanni Elyssa.',
    // sugerido (IA §3). original doc §7.2: "Estudante de Ciência da Computação apaixonada por
    // tecnologia, dados e cibersegurança."
    subtitulo:
      'Estudante de Ciência da Computação apaixonada por tecnologia, dados, cibersegurança e inteligência artificial.',
    assinatura:
      'Transformando conhecimento em soluções, dados em informação e desafios em aprendizado.',
    botaoProjetos: 'Ver meus projetos',
    botaoContato: 'Entre em contato',
    dicaMonograma: 'Clique no YE',
    monogramaAria: 'Soltar bits e cadeados', // novo (a11y)
  },
  // Anexo A.4 (doc §7.3). O número de projetos NÃO fica aqui: vem de `itensDaFaixa()` (C-06).
  destaques: {
    aria: 'Destaques', // novo (a11y)
    areas: {
      valor: '3', // sugerido (IA §3). original doc §7.3: "2"
      // sugerido (IA §3). original doc §7.3: "áreas de foco: Dados e Cibersegurança"
      legenda: 'áreas de estudo: Dados, Cibersegurança e IA',
    },
    linguagens: {
      valor: '2',
      legenda: 'linguagens em estudo: Python e SQL',
    },
    projetos: {
      // sugerido (DV-13; P-11): legenda única para qualquer contagem (o item some com 0).
      legenda: (n: number) =>
        n === 1 ? 'projeto publicado no GitHub' : 'projetos publicados no GitHub',
    },
    formacao: {
      valor: 'UniCEUB',
      legenda: 'Ciência da Computação, em andamento',
    },
  },
  // Anexo A.5 (doc §7.4). A seta "→" é desenhada pelo componente; o leitor de tela lê `conectivo`.
  frase: {
    eyebrow: 'O que me move',
    linha1: { antes: 'Conhecimento', depois: 'soluções.' },
    linha2: { antes: 'Dados', depois: 'informação.' },
    linha3: { antes: 'Desafios', depois: 'aprendizado.' },
    conectivo: 'em', // novo (a11y)
    apoio: 'Gosto de transformar conhecimentos acadêmicos em projetos práticos.',
  },
  // Anexo A.6 (doc §7.5).
  sobre: {
    eyebrow: 'Sobre',
    titulo: 'Sobre mim',
    texto:
      'Sou estudante de Ciência da Computação e estou construindo minha trajetória na área de Tecnologia da Informação. Tenho interesse especialmente em dados, bancos de dados, governança de dados e cibersegurança. Gosto de aprender novas tecnologias, resolver problemas e transformar conhecimentos acadêmicos em projetos práticos.',
    chips: ['Python', 'SQL', 'Git', 'GitHub', 'Excel', 'Trello'],
    verHabilidades: 'Ver habilidades →',
    trajetoria: {
      titulo: 'Minha trajetória',
      // [0] e [1] doc §7.5; [2] sugerido (doc) §7.5 ("texto sugerido, pode ser trocado"; P-10).
      marcos: [
        'Ciência da Computação — UniCEUB (em andamento)',
        'Primeiro projeto: Gerenciador de Estoque (Python, Git/GitHub)',
        'Próximo passo: aprofundar projetos em Dados e Cibersegurança',
      ],
      ano: SHOW_PLACEHOLDERS ? '[ano]' : '', // placeholder PH-04 (P-05)
    },
  },
  // Anexo A.7 (doc §7.6 + IA). Ordem dos cards: Dados, Cibersegurança, IA, Desenvolvimento.
  interesses: {
    eyebrow: 'Interesses',
    titulo: 'Áreas de interesse',
    subtitulo: 'Onde concentro meus estudos e minha curiosidade.',
    seloFoco: 'Foco principal',
    seloEstudo: 'Em estudo', // sugerido (IA §3)
    dados: {
      titulo: 'Dados',
      texto:
        'Banco de Dados, SQL, Análise de Dados, Governança de Dados, organização e qualidade dos dados.',
      // derivado (P-10). Alternativa do canvas (DV-14): SQL, Governança, Qualidade de dados.
      chips: ['SQL', 'Banco de Dados', 'Governança de Dados'],
    },
    ciber: {
      titulo: 'Cibersegurança',
      texto:
        'Segurança da Informação, segurança de aplicações, redes, proteção de dados e boas práticas de segurança.',
      chips: ['Segurança da Informação', 'Redes', 'Proteção de Dados'], // derivado (P-10)
    },
    ia: {
      titulo: 'Inteligência Artificial', // sugerido (IA §3)
      // sugerido (IA §3)
      texto:
        'Fundamentos de Inteligência Artificial e aprendizado de máquina, e como aplicá-los a dados e à segurança.',
      chips: [], // vazia até a resposta da Yanni (P-IA-1)
    },
    dev: {
      titulo: 'Desenvolvimento',
      texto: 'Python, Git/GitHub, desenvolvimento de sistemas e automação.',
      chips: ['Python', 'Git/GitHub', 'Automação'], // derivado (P-10)
    },
  },
  // Anexo A.8 (doc §7.7). Nenhuma tecnologia de IA (P-IA-1).
  habilidades: {
    eyebrow: 'Habilidades',
    titulo: 'Tecnologias e habilidades',
    subtitulo: 'Ferramentas e conceitos que estou estudando e praticando.',
    linguagens: {
      titulo: 'Linguagens',
      chips: ['Python', 'SQL'],
    },
    ferramentas: {
      titulo: 'Ferramentas',
      chips: ['Git', 'GitHub', 'Microsoft Excel', 'Trello'],
    },
    conceitos: {
      titulo: 'Conceitos',
      chips: [
        'Banco de Dados',
        'Governança de Dados',
        'Engenharia de Requisitos',
        'Metodologias Ágeis',
        'DevOps',
        'Segurança da Informação',
      ],
    },
  },
  // Anexo A.9 (doc §7.8, §12, IA). Textos de cada projeto ficam em `projects.ts` (C-05).
  projetos: {
    eyebrow: 'Projetos',
    titulo: 'Projetos',
    subtitulo: 'O que estou construindo enquanto aprendo.',
    emDestaque: 'Em destaque', // novo (UI, DV-7; P-10)
    botaoVer: 'Ver projeto',
    botaoGithub: 'GitHub',
    seloEstudo: 'Projeto de estudo',
    verTodos: 'Ver todos no GitHub →',
    // placeholder PH-03 (P-03)
    legendaReserva: SHOW_PLACEHOLDERS ? '[substituir por print do projeto]' : '',
    ia: {
      titulo: 'Projeto de IA — em breve', // sugerido (IA §3)
    },
    alt: {
      // novo (a11y): `alt` das variantes da ilustração rosa (C-08).
      estoque:
        'Ilustração abstrata em rosa com uma tabela de estoque estilizada e um mini gráfico de barras.',
      padrao: 'Ilustração abstrata em rosa com uma grade e um mini gráfico de linha.',
    },
  },
  // Anexo A.10 (doc §7.9).
  formacao: {
    eyebrow: 'Formação',
    titulo: 'Formação Acadêmica',
    curso: 'Ciência da Computação',
    instituicao: 'UniCEUB',
    selo: 'Formação em andamento',
    anoInicio: SHOW_PLACEHOLDERS ? '[ano de início]' : '', // placeholder PH-05 (P-05)
    previsao: SHOW_PLACEHOLDERS ? '[previsão de conclusão]' : '', // placeholder PH-06 (P-05)
    futuro: 'Cursos, certificações e novas conquistas entrarão aqui.',
  },
  // Anexo A.11 (doc §7.10 + IA). A seta "→" entre etapas é desenhada pelo componente.
  objetivos: {
    eyebrow: 'Objetivos',
    titulo: 'Onde quero chegar',
    texto:
      'Meu objetivo é construir uma carreira na área de Tecnologia da Informação, desenvolvendo experiência principalmente em Dados e Cibersegurança. Quero continuar aprendendo, participar de projetos reais e transformar minha formação acadêmica em soluções que gerem valor para empresas e pessoas.',
    trilhaRotulo: (n: number) => `Trilha ${n}`, // novo (UI, DV-11; P-10)
    trilhaDados: {
      nome: 'Dados',
      etapas: ['Dados', 'Banco de Dados', 'Governança', 'Análise'],
    },
    trilhaCiber: {
      nome: 'Cibersegurança',
      etapas: [
        'Cibersegurança',
        'Segurança da Informação',
        'Segurança de Sistemas',
        'Cybersecurity',
      ],
    },
    trilhaIA: {
      nome: 'IA', // sugerido (IA §3)
      // sugerido (IA §3)
      etapas: [
        'Fundamentos de IA',
        'Machine Learning',
        'IA aplicada a Dados',
        'IA aplicada à Segurança',
      ],
    },
  },
  // Anexo A.12 (doc §7.11). Ordem dos botões (D21): E-mail, LinkedIn, GitHub.
  contato: {
    eyebrow: 'Contato',
    titulo: 'Vamos conversar?',
    texto:
      'Estou aberta a oportunidades, projetos, conexões e experiências que possam contribuir para minha evolução na área de tecnologia.',
    disponibilidade: 'Aberta a oportunidades de estágio em tecnologia.', // sugerido (doc) §7.11 (P-10)
    botaoEmail: 'E-mail',
    botaoLinkedin: 'LinkedIn',
    botaoGithub: 'GitHub',
    copiar: 'Copiar',
    copiado: 'Copiado!',
    copiarAria: 'Copiar endereço de e-mail', // novo (a11y)
    copiadoAnuncio: 'E-mail copiado.', // novo (a11y)
  },
  // Anexo A.13 (doc §7.12). Os links rápidos reutilizam `nav.*`.
  // `socialTitulo` (folha) e `social.*` (grupo) têm nomes diferentes: uma chave não pode ser folha
  // e grupo ao mesmo tempo (H5 do relatório de execução).
  rodape: {
    frase: 'Estudante de Ciência da Computação. Dados e Cibersegurança.', // doc §7.12 (P-IA-2 pergunta)
    linksRapidos: 'Links rápidos',
    navAria: 'Links rápidos do rodapé', // novo (a11y)
    socialTitulo: 'Social',
    social: {
      linkedinAria: 'LinkedIn de Yanni Elyssa', // novo (a11y)
      githubAria: 'GitHub de Yanni Elyssa', // novo (a11y)
      emailAria: 'Enviar e-mail para Yanni Elyssa', // novo (a11y)
    },
    copyright: '© 2026 Yanni Elyssa. Todos os direitos reservados.',
    feitoPor: 'Feito por Yanni Elyssa',
    voltarTopo: 'Voltar ao topo ↑',
  },
  // Anexo A.14 (doc §11).
  meta: {
    title: 'Yanni Elyssa | Portfólio',
    // sugerido (IA §3). original doc §11: "Yanni Elyssa é estudante de Ciência da Computação com
    // interesse em Dados e Cibersegurança."
    description:
      'Yanni Elyssa é estudante de Ciência da Computação com interesse em Dados, Cibersegurança e Inteligência Artificial.',
    ogFrase: 'Dados e Cibersegurança', // doc §11 (texto da imagem OG; P-IA-2 pergunta)
    ogAlt: 'Yanni Elyssa — Dados e Cibersegurança', // novo (a11y)
  },
  // Anexo A.15: textos da `public/404.html` (D-03 copia; aqui só como fonte única).
  erro404: {
    titulo: 'Página não encontrada', // novo (UI, D-03)
    voltar: 'Voltar ao início', // novo (UI, D-03)
  },
} as const satisfies DictionaryShape;
