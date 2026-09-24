// Teste de tipos da ficha de projeto (F-11). Os `@ts-expect-error` são conferidos pelo
// `npm run typecheck` (tsconfig.test.json): se a linha abaixo deles compilar, o typecheck falha.
// As fichas abaixo são FICTÍCIAS e existem só neste teste.
import { describe, expectTypeOf, it } from 'vitest';

import type { Locale, LocalizedText, Project, ProjectArea, ProjectImage } from '@/content/types';

describe('tipos da ficha de projeto (§14)', () => {
  it('Locale, LocalizedText e ProjectArea têm os valores do plano', () => {
    expectTypeOf<Locale>().toEqualTypeOf<'pt' | 'en'>();
    expectTypeOf<LocalizedText>().toEqualTypeOf<{ pt: string; en: string }>();
    expectTypeOf<ProjectArea>().toEqualTypeOf<
      'dados' | 'ciberseguranca' | 'desenvolvimento' | 'banco-de-dados'
    >();
    expectTypeOf<ProjectImage>().toEqualTypeOf<{ src: string; alt: LocalizedText }>();
  });

  it('os 9 campos do §14 existem, com os tipos certos', () => {
    expectTypeOf<Project['nome']>().toEqualTypeOf<string>(); // Nome
    expectTypeOf<Project['area']>().toEqualTypeOf<ProjectArea>(); // Área
    expectTypeOf<Project['descricao']>().toEqualTypeOf<LocalizedText>(); // Descrição
    expectTypeOf<Project['tecnologias']>().toEqualTypeOf<string[]>(); // Tecnologias
    expectTypeOf<Pick<Project, 'imagem'>>().toEqualTypeOf<{ imagem?: ProjectImage }>(); // Imagem
    expectTypeOf<Project['projetoDeEstudo']>().toEqualTypeOf<boolean>(); // Selo
    expectTypeOf<Pick<Project, 'linkProjeto'>>().toEqualTypeOf<{ linkProjeto?: string }>(); // Link do projeto
    expectTypeOf<Pick<Project, 'linkGithub'>>().toEqualTypeOf<{ linkGithub?: string }>(); // Link do GitHub
    expectTypeOf<Project['destaque']>().toEqualTypeOf<boolean>(); // Destaque
  });

  it('publicado, sugerido e placeholder existem; ordem e repoPublicado não', () => {
    expectTypeOf<Project['publicado']>().toEqualTypeOf<boolean>();
    expectTypeOf<Pick<Project, 'sugerido'>>().toEqualTypeOf<{ sugerido?: boolean }>();
    expectTypeOf<Pick<Project, 'placeholder'>>().toEqualTypeOf<{ placeholder?: boolean }>();
    expectTypeOf<Project>().not.toHaveProperty('ordem');
    expectTypeOf<Project>().not.toHaveProperty('repoPublicado');
  });

  it('fichas fora do contrato não compilam', () => {
    const base = {
      id: 'exemplo',
      nome: 'Exemplo',
      area: 'dados',
      descricao: { pt: 'Frase.', en: 'Sentence.' },
      tecnologias: ['Python'],
      projetoDeEstudo: true,
      publicado: false,
      destaque: false,
    } satisfies Project;
    expectTypeOf(base).toExtend<Project>();

    const comRepoPublicado: Project = {
      ...base,
      // @ts-expect-error `repoPublicado` não existe: o campo único é `publicado` (D14).
      repoPublicado: true,
    };

    const areaComRotulo: Project = {
      ...base,
      // @ts-expect-error a área é o enum em minúsculas, não o rótulo exibido.
      area: 'Dados',
    };

    // @ts-expect-error ficha sem `publicado` não compila.
    const semPublicado: Project = {
      id: 'exemplo',
      nome: 'Exemplo',
      area: 'dados',
      descricao: { pt: 'Frase.', en: 'Sentence.' },
      tecnologias: ['Python'],
      projetoDeEstudo: true,
      destaque: false,
    };

    // @ts-expect-error a descrição precisa dos dois idiomas.
    const descricaoSoPt: Project['descricao'] = { pt: 'Frase.' };

    expectTypeOf([comRepoPublicado, areaComRotulo, semPublicado]).toExtend<Project[]>();
    expectTypeOf(descricaoSoPt).toEqualTypeOf<LocalizedText>();
  });
});
