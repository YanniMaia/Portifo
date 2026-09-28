// Dicionário EN (F-10 criou; a C-02 acrescentou as chaves novas para manter a paridade com `pt.ts`).
// Tipado como `Dictionary`: o TypeScript acusa erro se faltar ou sobrar chave em relação a `pt.ts`.
// Valores = coluna EN do Anexo A do doc 05 (a V1 é só PT, doc 09; a revisão fina é da C-03, V2).
// Origem EN (doc 05 §4.5): `§15` = tradução do documento de design; `nova`/`nova-IA` = tradução
// proposta, registrada em `TRADUCAO_EN` (`./metadados.ts`) para a revisão P-12. Não entram em
// `SUGERIDOS` (doc 05 §4.2). Nomes de tecnologias e de projetos não se traduzem (§15).
import type { Dictionary } from '@/i18n/types';
import { SHOW_PLACEHOLDERS } from '@/lib/flags';

export const en: Dictionary = {
  // §15.
  nav: {
    sobre: 'About',
    interesses: 'Interests',
    habilidades: 'Skills',
    projetos: 'Projects',
    formacao: 'Education',
    contato: 'Contact',
  },
  a11y: {
    skipToContent: 'Skip to content', // nova
    opensInNewTab: 'opens in a new tab', // nova
    themeToDark: 'Switch to dark mode', // nova
    themeToLight: 'Switch to light mode', // nova
    language: 'Language', // nova
    languageNamePt: 'Português', // igual nos dois idiomas (nome do idioma na própria língua)
    languageNameEn: 'English', // igual nos dois idiomas (nome do idioma na própria língua)
  },
  menu: {
    abrir: 'Open menu', // nova
    fechar: 'Close menu', // nova
    navAria: 'Main navigation', // nova
  },
  marca: {
    monograma: 'YE',
    nome: 'Yanni Elyssa',
    aria: 'Yanni Elyssa — back to top', // nova
  },
  hero: {
    pilula: 'Data · Cybersecurity · AI', // nova-IA
    tituloLinha1: 'Hi, I’m', // §15
    tituloNome: 'Yanni Elyssa.', // §15
    // nova-IA (o §15 tem a versão sem IA)
    subtitulo:
      'Computer Science student passionate about technology, data, cybersecurity and artificial intelligence.',
    // §15
    assinatura:
      'Turning knowledge into solutions, data into information and challenges into learning.',
    botaoProjetos: 'View my projects', // §15
    botaoContato: 'Get in touch', // §15
    dicaMonograma: 'Click the YE', // nova
    monogramaAria: 'Release bits and padlocks', // nova
  },
  destaques: {
    aria: 'Highlights', // nova
    areas: {
      valor: '3',
      legenda: 'areas of study: Data, Cybersecurity and AI', // nova-IA
    },
    linguagens: {
      valor: '2',
      legenda: 'languages I am studying: Python and SQL', // nova
    },
    projetos: {
      // nova
      legenda: (n: number) =>
        n === 1 ? 'project published on GitHub' : 'projects published on GitHub',
    },
    formacao: {
      valor: 'UniCEUB',
      legenda: 'Computer Science, in progress', // nova
    },
  },
  frase: {
    eyebrow: 'What drives me', // nova
    linha1: { antes: 'Knowledge', depois: 'solutions.' }, // §15
    linha2: { antes: 'Data', depois: 'information.' }, // §15
    linha3: { antes: 'Challenges', depois: 'learning.' }, // §15
    conectivo: 'into', // nova
    apoio: 'I enjoy turning academic knowledge into practical projects.', // nova
  },
  sobre: {
    eyebrow: 'About', // nova
    titulo: 'About me', // §15
    // §15
    texto:
      'I am a Computer Science student building my path in Information Technology. I am especially interested in data, databases, data governance and cybersecurity. I enjoy learning new technologies, solving problems and turning academic knowledge into practical projects.',
    chips: ['Python', 'SQL', 'Git', 'GitHub', 'Excel', 'Trello'],
    verHabilidades: 'See skills →', // nova
    trajetoria: {
      titulo: 'My journey', // nova
      // nova
      marcos: [
        'Computer Science — UniCEUB (in progress)',
        'First project: Gerenciador de Estoque (Python, Git/GitHub)',
        'Next step: deepen projects in Data and Cybersecurity',
      ],
      ano: SHOW_PLACEHOLDERS ? '[year]' : '', // placeholder PH-04
    },
  },
  interesses: {
    eyebrow: 'Interests', // nova
    titulo: 'Areas of interest', // §15
    subtitulo: 'Where I focus my studies and my curiosity.', // nova
    seloFoco: 'Main focus', // nova
    seloEstudo: 'Currently studying', // nova-IA
    dados: {
      titulo: 'Data', // nova
      // nova
      texto: 'Databases, SQL, Data Analysis, Data Governance, data organization and data quality.',
      chips: ['SQL', 'Databases', 'Data Governance'], // nova
    },
    ciber: {
      titulo: 'Cybersecurity', // nova
      // nova
      texto:
        'Information Security, application security, networks, data protection and security best practices.',
      chips: ['Information Security', 'Networks', 'Data Protection'], // nova
    },
    ia: {
      titulo: 'Artificial Intelligence', // nova-IA
      // nova-IA
      texto:
        'Fundamentals of Artificial Intelligence and machine learning, and how to apply them to data and security.',
      chips: [],
    },
    dev: {
      titulo: 'Development', // nova
      texto: 'Python, Git/GitHub, systems development and automation.', // nova
      chips: ['Python', 'Git/GitHub', 'Automation'], // nova
    },
  },
  habilidades: {
    eyebrow: 'Skills', // nova
    titulo: 'Technologies and skills', // §15
    subtitulo: 'Tools and concepts I am studying and practicing.', // §15
    linguagens: {
      titulo: 'Languages', // nova
      chips: ['Python', 'SQL'],
    },
    ferramentas: {
      titulo: 'Tools', // nova
      chips: ['Git', 'GitHub', 'Microsoft Excel', 'Trello'],
    },
    conceitos: {
      titulo: 'Concepts', // nova
      // nova
      chips: [
        'Databases',
        'Data Governance',
        'Requirements Engineering',
        'Agile Methodologies',
        'DevOps',
        'Information Security',
      ],
    },
  },
  projetos: {
    eyebrow: 'Projects', // nova
    titulo: 'Projects', // §15 (menu)
    subtitulo: 'What I am building while I learn.', // nova
    emDestaque: 'Featured', // nova
    botaoVer: 'View project', // nova
    botaoGithub: 'GitHub',
    seloEstudo: 'Study project', // §15
    verTodos: 'See all on GitHub →', // nova
    legendaReserva: SHOW_PLACEHOLDERS ? '[replace with project screenshot]' : '', // placeholder PH-03
    ia: {
      titulo: 'AI project — coming soon', // nova-IA
    },
    alt: {
      // nova
      estoque: 'Abstract pink illustration with a stylized inventory table and a small bar chart.',
      padrao: 'Abstract pink illustration with a grid and a small line chart.', // nova
    },
  },
  formacao: {
    eyebrow: 'Education', // nova
    titulo: 'Education', // §15
    curso: 'Computer Science', // nova
    instituicao: 'UniCEUB',
    selo: 'Degree in progress', // §15
    anoInicio: SHOW_PLACEHOLDERS ? '[start year]' : '', // placeholder PH-05
    previsao: SHOW_PLACEHOLDERS ? '[expected graduation]' : '', // placeholder PH-06
    futuro: 'Courses, certifications and new achievements will appear here.', // nova
  },
  objetivos: {
    eyebrow: 'Goals', // nova
    titulo: 'Where I want to go', // §15
    // §15
    texto:
      'My goal is to build a career in Information Technology, gaining experience mainly in Data and Cybersecurity. I want to keep learning, take part in real projects and turn my academic background into solutions that create value for companies and people.',
    trilhaRotulo: (n: number) => `Track ${n}`, // nova
    trilhaDados: {
      nome: 'Data', // nova
      etapas: ['Data', 'Databases', 'Governance', 'Analysis'], // nova
    },
    trilhaCiber: {
      nome: 'Cybersecurity', // nova
      // nova (I-10: a trilha repete a mesma palavra no início e no fim)
      etapas: ['Cybersecurity', 'Information Security', 'Systems Security', 'Cybersecurity'],
    },
    trilhaIA: {
      nome: 'AI', // nova-IA
      // nova-IA
      etapas: [
        'AI Fundamentals',
        'Machine Learning',
        'AI applied to Data',
        'AI applied to Security',
      ],
    },
  },
  contato: {
    eyebrow: 'Contact', // nova
    titulo: 'Let’s talk?', // §15
    // §15
    texto:
      'I am open to opportunities, projects, connections and experiences that can contribute to my growth in technology.',
    disponibilidade: 'Open to internship opportunities in technology.', // §15
    botaoEmail: 'Email', // nova
    botaoLinkedin: 'LinkedIn',
    botaoGithub: 'GitHub',
    copiar: 'Copy', // nova
    copiado: 'Copied!', // nova
    copiarAria: 'Copy email address', // nova
    copiadoAnuncio: 'Email copied.', // nova
  },
  rodape: {
    frase: 'Computer Science student. Data and Cybersecurity.', // nova
    linksRapidos: 'Quick links', // nova
    navAria: 'Footer quick links', // nova
    socialTitulo: 'Social', // nova
    social: {
      linkedinAria: 'Yanni Elyssa on LinkedIn', // nova
      githubAria: 'Yanni Elyssa on GitHub', // nova
      emailAria: 'Email Yanni Elyssa', // nova
    },
    copyright: '© 2026 Yanni Elyssa. All rights reserved.', // nova
    feitoPor: 'Made by Yanni Elyssa', // §15
    voltarTopo: 'Back to top ↑', // nova
  },
  meta: {
    title: 'Yanni Elyssa | Portfolio', // nova
    // nova-IA
    description:
      'Yanni Elyssa is a Computer Science student interested in Data, Cybersecurity and Artificial Intelligence.',
    ogFrase: 'Dados e Cibersegurança', // imagem OG única, em PT (Anexo A.14): não traduz
    ogAlt: 'Yanni Elyssa — Data and Cybersecurity', // nova
  },
  erro404: {
    titulo: 'Page not found', // nova
    voltar: 'Back to home', // nova
  },
};
