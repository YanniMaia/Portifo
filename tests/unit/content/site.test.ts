// C-04: dados de contato e perfil (src/content/site.ts), conferidos com o documento de design.
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { site } from '@/content/site';

const raiz = process.cwd();
const docDesign = readFileSync(resolve(raiz, 'plano/referencia/documento-design-v1.1.txt'), 'utf8');

/** Lê o valor de uma linha da tabela da capa do doc: `| Rótulo | valor |`. */
function valorDaCapa(rotulo: string): string {
  const linha = docDesign
    .split(/\r?\n/)
    .slice(0, 12)
    .find((l) => l.startsWith(`| ${rotulo} |`));
  if (!linha) throw new Error(`Linha "${rotulo}" não encontrada na capa do doc.`);
  return linha.split('|')[2]?.trim() ?? '';
}

describe('site.ts (C-04)', () => {
  it('nome, LinkedIn, GitHub e e-mail são idênticos à capa do doc', () => {
    expect(site.nome).toBe(valorDaCapa('Nome'));
    expect(site.linkedin).toBe(valorDaCapa('LinkedIn'));
    expect(site.github).toBe(valorDaCapa('GitHub'));
    expect(site.email).toBe(valorDaCapa('E-mail'));
  });

  it('valores exatos (independentes do arquivo do doc)', () => {
    expect(site.nome).toBe('Yanni Elyssa');
    expect(site.iniciais).toBe('YE');
    expect(site.linkedin).toBe('https://www.linkedin.com/in/yanni-elyssa-48171b349');
    expect(site.github).toBe('https://github.com/YanniMaia');
    expect(site.email).toBe('yannielyssa64@gmail.com');
    expect(site.mailto).toBe('mailto:yannielyssa64@gmail.com');
    expect(site.githubUsuario).toBe('YanniMaia');
    expect(site.curso).toBe('Ciência da Computação');
    expect(site.instituicao).toBe('UniCEUB');
    expect(site.situacao).toBe('em andamento');
  });

  it('URLs bem formadas e coerentes entre si', () => {
    const linkedin = new URL(site.linkedin);
    expect(linkedin.protocol).toBe('https:');
    expect(linkedin.hostname).toBe('www.linkedin.com');

    const github = new URL(site.github);
    expect(github.protocol).toBe('https:');
    expect(github.hostname).toBe('github.com');
    expect(github.pathname).toBe(`/${site.githubUsuario}`);

    expect(site.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    expect(site.mailto).toBe(`mailto:${site.email}`);
  });

  it('curso, instituição e situação aparecem no doc (§7.9)', () => {
    expect(docDesign).toContain(`${site.curso} — ${site.instituicao} (${site.situacao})`);
  });

  it('nenhum dado extra: só os campos previstos (sem siteUrl, cidade, telefone etc.)', () => {
    expect(Object.keys(site).sort()).toEqual(
      [
        'nome',
        'iniciais',
        'linkedin',
        'github',
        'email',
        'mailto',
        'githubUsuario',
        'curso',
        'instituicao',
        'situacao',
      ].sort(),
    );
  });

  it('nenhum valor é placeholder nem vazio', () => {
    for (const [campo, valor] of Object.entries(site)) {
      expect(valor.trim(), campo).not.toBe('');
      expect(/\[|\]/.test(valor), campo).toBe(false);
    }
  });

  it('não existe src/content/profile.ts (arquivo único de contatos, N10)', () => {
    expect(existsSync(resolve(raiz, 'src/content/profile.ts'))).toBe(false);
  });
});
