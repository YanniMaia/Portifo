// Testes da validação das fichas (F-11). As fichas abaixo são FICTÍCIAS e existem só neste teste.
import { describe, expect, it } from 'vitest';

import type { Project } from '@/content/types';
import { validarFichas } from '@/content/validarFichas';

function ficha(sobrescrever: Partial<Project> = {}): Project {
  return {
    id: 'exemplo-completo',
    nome: 'Exemplo Completo',
    area: 'dados',
    etiqueta: { pt: 'Dados', en: 'Data' },
    descricao: {
      pt: 'Primeira frase de exemplo. Segunda frase de exemplo.',
      en: 'First sample sentence. Second sample sentence.',
    },
    tecnologias: ['Python', 'pandas'],
    imagem: {
      src: 'projetos/exemplo-completo/imagem.webp',
      alt: { pt: 'Texto alternativo de exemplo.', en: 'Sample alternative text.' },
    },
    projetoDeEstudo: true,
    linkProjeto: 'https://exemplo.invalid/demo',
    linkGithub: 'https://github.com/YanniMaia/exemplo-completo',
    publicado: false,
    destaque: false,
    ...sobrescrever,
  };
}

function fichaMinima(id: string): Project {
  return {
    id,
    nome: 'Exemplo Mínimo',
    area: 'desenvolvimento',
    descricao: { pt: 'Uma frase só.', en: 'Just one sentence.' },
    tecnologias: ['Python'],
    projetoDeEstudo: false,
    publicado: false,
    destaque: false,
  };
}

describe('validarFichas — fichas válidas', () => {
  it('aceita uma ficha completa', () => {
    expect(validarFichas([ficha({ destaque: true })])).toEqual([]);
  });

  it('aceita uma ficha sem linkProjeto, linkGithub e imagem', () => {
    const minima = fichaMinima('exemplo-minimo');
    expect(minima).not.toHaveProperty('linkProjeto');
    expect(minima).not.toHaveProperty('linkGithub');
    expect(minima).not.toHaveProperty('imagem');
    expect(validarFichas([minima])).toEqual([]);
  });

  it('aceita placeholder "[…]" no linkGithub e no linkProjeto (D11, D23)', () => {
    const lista = [
      ficha({
        id: 'exemplo-a',
        linkGithub: 'https://github.com/YanniMaia/[repositório]',
        linkProjeto: '[link da demonstração]',
      }),
      ficha({ id: 'exemplo-b', linkGithub: '[colocar o link do seu repositório]' }),
    ];
    expect(validarFichas(lista)).toEqual([]);
  });

  it('aceita lista vazia e várias fichas com no máximo 1 destaque', () => {
    expect(validarFichas([])).toEqual([]);
    const lista = [ficha({ id: 'a', destaque: true }), ficha({ id: 'b' }), fichaMinima('c')];
    expect(validarFichas(lista)).toEqual([]);
  });

  it('não conta "ex.:" nem número decimal como fim de frase', () => {
    const f = ficha({
      descricao: {
        pt: 'Usa bibliotecas (ex.: pandas) e mede 1.5 segundos. Mostra gráficos. Gera relatório!',
        en: 'Uses libraries (ex.: pandas) and takes 1.5 seconds. Shows charts. Builds a report?',
      },
    });
    expect(validarFichas([f])).toEqual([]);
  });
});

describe('validarFichas — os 6 erros', () => {
  it('erro 1: mais de 1 destaque', () => {
    const erros = validarFichas([
      ficha({ id: 'a', destaque: true }),
      ficha({ id: 'b', destaque: true }),
    ]);
    expect(erros).toEqual(['mais de 1 projeto em destaque: a, b']);
  });

  it('erro 2: descrição com 0 ou mais de 3 frases', () => {
    const vazia = ficha({ id: 'vazia', descricao: { pt: '   ', en: 'One sentence.' } });
    expect(validarFichas([vazia])).toEqual([
      '[vazia] descricao.pt tem 0 frase(s); o esperado é de 1 a 3',
    ]);

    const longa = ficha({
      id: 'longa',
      descricao: { pt: 'Uma frase.', en: 'One. Two. Three. Four.' },
    });
    expect(validarFichas([longa])).toEqual([
      '[longa] descricao.en tem 4 frase(s); o esperado é de 1 a 3',
    ]);
  });

  it('erro 3: tecnologias vazia', () => {
    expect(validarFichas([ficha({ id: 'sem-chips', tecnologias: [] })])).toEqual([
      '[sem-chips] tecnologias vazia',
    ]);
  });

  it('erro 4: linkGithub fora de https://github.com/YanniMaia/', () => {
    const invalidos = [
      'https://github.com/OutraPessoa/repositorio',
      'http://github.com/YanniMaia/repositorio',
      'https://github.com/YanniMaia',
      'https://github.com/YanniMaia/',
      '',
    ];
    for (const linkGithub of invalidos) {
      const erros = validarFichas([ficha({ id: 'link', linkGithub })]);
      expect(erros).toEqual([
        `[link] linkGithub fora de https://github.com/YanniMaia/: "${linkGithub}"`,
      ]);
    }
  });

  it('erro 5: id duplicado', () => {
    expect(validarFichas([ficha({ id: 'repetido' }), fichaMinima('repetido')])).toEqual([
      'id duplicado: "repetido"',
    ]);
  });

  it('erro 6: imagem sem alt nos dois idiomas', () => {
    const semEn = ficha({
      id: 'sem-alt-en',
      imagem: { src: 'projetos/sem-alt-en/imagem.webp', alt: { pt: 'Texto.', en: '' } },
    });
    expect(validarFichas([semEn])).toEqual(['[sem-alt-en] imagem sem alt em: en']);

    // Dado vindo de fora do tipo (sem `alt`): também é acusado, sem quebrar.
    const semAlt = ficha({
      id: 'sem-alt',
      imagem: { src: 'projetos/sem-alt/imagem.webp' } as unknown as Project['imagem'],
    });
    expect(validarFichas([semAlt])).toEqual(['[sem-alt] imagem sem alt em: pt, en']);
  });
});
