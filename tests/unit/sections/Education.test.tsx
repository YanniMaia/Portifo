// Testes da Formação acadêmica (S-13). Medidas e cores computadas ficam no diário S-13 (navegador).
// Aqui: id, H2 e eyebrow; 2 marcos (principal + futuro) com os dados atuais do Anexo A.10; nó
// principal com o `PulseDot` de 20 px do DS-08 e selo com o de 8 px; sem porcentagem de conclusão;
// `[ano de início]`/`[previsão de conclusão]` só em DEV (D11); marco futuro tracejado
// (`Card variant="dashed"`), sem sombra e não interativo; `data-draw="y"` na linha, visível por
// completo sem o A-05; nada focável; EN; contrato do CSS e do JSX.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { en } from '@/content/en';
import { pt } from '@/content/pt';
import { SECTION_IDS } from '@/content/sections';
import { LanguageContext, type LanguageContextValue } from '@/i18n/LanguageContext';
import type { Dictionary } from '@/i18n/types';
import { Education } from '@/sections/Education/Education';
import { renderWithProviders } from '../support/render';

const ler = (arquivo: string) =>
  readFileSync(resolve(process.cwd(), arquivo), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

const secao = () => document.getElementById('formacao') as HTMLElement;
const marcos = () => [...secao().querySelectorAll('ol > li')] as HTMLElement[];
const principal = () => secao().querySelector('li[data-marco="principal"]') as HTMLElement;
const futuro = () => secao().querySelector('li[data-marco="futuro"]') as HTMLElement;

function montarComDicionario(dict: Dictionary) {
  const valor: LanguageContextValue = {
    lang: 'pt',
    dict,
    setLang: () => undefined,
    toggleLang: () => undefined,
    isSugerido: () => false,
  };
  return render(
    <LanguageContext.Provider value={valor}>
      <Education />
    </LanguageContext.Provider>,
  );
}

describe('Education (S-13): estrutura e texto', () => {
  it('<section id="formacao"> do registro, nomeada pelo H2 "Formação Acadêmica", com eyebrow', () => {
    renderWithProviders(<Education />);
    expect(SECTION_IDS).toContain('formacao');
    const h2 = within(secao()).getByRole('heading', { level: 2, name: pt.formacao.titulo });
    expect(secao()).toHaveAttribute('aria-labelledby', h2.id);
    expect(secao()).toHaveAttribute('data-tone', 'base');
    expect(within(secao()).getByText(pt.formacao.eyebrow)).toHaveClass('t-eyebrow');
  });

  it('2 marcos: o principal e o futuro, nessa ordem, dentro de uma única <ol>', () => {
    renderWithProviders(<Education />);
    expect(marcos()).toHaveLength(2);
    expect(marcos()[0]).toBe(principal());
    expect(marcos()[1]).toBe(futuro());
    expect(principal().closest('ol')).toBe(futuro().closest('ol'));
  });

  it('marco principal: ícone capelo, H3 do curso e instituição do C-02', () => {
    renderWithProviders(<Education />);
    const h3 = within(principal()).getByRole('heading', { level: 3 });
    expect(h3).toHaveTextContent(pt.formacao.curso);
    expect(within(principal()).getByText(pt.formacao.instituicao)).toBeInTheDocument();
    const svg = principal().querySelector('svg') as SVGElement;
    expect(svg.getAttribute('class')).toContain('lucide-graduation-cap');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });

  it('marco futuro: só o parágrafo do C-02, sem H3, botão ou link', () => {
    renderWithProviders(<Education />);
    expect(within(futuro()).queryByRole('heading')).toBeNull();
    expect(within(futuro()).queryAllByRole('link')).toHaveLength(0);
    expect(within(futuro()).queryAllByRole('button')).toHaveLength(0);
    expect(futuro()).toHaveTextContent(pt.formacao.futuro);
  });

  it('EN troca todos os textos da seção, inclusive o marco futuro', () => {
    renderWithProviders(<Education />, { idioma: 'en' });
    expect(within(secao()).getByRole('heading', { level: 2 })).toHaveTextContent(
      en.formacao.titulo,
    );
    expect(within(principal()).getByRole('heading', { level: 3 })).toHaveTextContent(
      en.formacao.curso,
    );
    expect(within(principal()).getByText(en.formacao.instituicao)).toBeInTheDocument();
    expect(within(principal()).getByText(en.formacao.selo)).toBeInTheDocument();
    expect(futuro()).toHaveTextContent(en.formacao.futuro);
  });
});

describe('Education (S-13): marco principal — selo, nó e sem porcentagem', () => {
  it('selo "Formação em andamento" preenchido, com o PulseDot de 8 px (D17)', () => {
    renderWithProviders(<Education />);
    const selo = within(principal()).getByText(pt.formacao.selo);
    expect(selo).toHaveAttribute('data-variant', 'filled');
    expect(selo.querySelector('[data-decor="pulse"][data-size="8"]')).not.toBeNull();
  });

  it('nó do marco principal: o único PulseDot de 20 px do DS-08 (nenhum componente de pulso próprio)', () => {
    renderWithProviders(<Education />);
    const no = principal().querySelector('[data-decor="pulse"][data-size="20"]');
    expect(no).not.toBeNull();
    expect(no?.closest('[aria-hidden="true"]')).not.toBeNull();
    // Só existe este e o de 8 px do selo: nenhum outro PulseDot na seção.
    expect(secao().querySelectorAll('[data-decor="pulse"]')).toHaveLength(2);
  });

  it('sem porcentagem de conclusão em nenhum lugar da seção', () => {
    renderWithProviders(<Education />);
    expect(secao().textContent).not.toMatch(/%/);
  });
});

describe('Education (S-13): datas — placeholders só em DEV, sem data inventada', () => {
  it('em DEV, "[ano de início]" e "[previsão de conclusão]" aparecem marcados, com separador decorativo', () => {
    renderWithProviders(<Education />);
    expect(pt.formacao.anoInicio).toBe('[ano de início]');
    expect(pt.formacao.previsao).toBe('[previsão de conclusão]');
    const marcas = principal().querySelectorAll('[data-placeholder]');
    expect(marcas).toHaveLength(2);
    expect(marcas[0]).toHaveTextContent('[ano de início]');
    expect(marcas[1]).toHaveTextContent('[previsão de conclusão]');
    const datas = principal().querySelector('p.datas') as HTMLElement;
    const separador = datas.querySelector('span[aria-hidden="true"]') as HTMLElement;
    expect(separador).not.toBeNull();
    expect(separador.textContent?.trim()).toBe('–');
  });

  it('sem início nem previsão (valor de produção do pt.ts é ""), nenhum placeholder e nenhum bloco de datas', () => {
    montarComDicionario({
      ...pt,
      formacao: { ...pt.formacao, anoInicio: '', previsao: '' },
    });
    expect(secao().querySelector('[data-placeholder]')).toBeNull();
    expect(secao().textContent).not.toMatch(/\[ano de início\]|\[previsão de conclusão\]/);
  });

  it('só um dos dois definido: mostra só aquele, sem o separador', () => {
    montarComDicionario({
      ...pt,
      formacao: { ...pt.formacao, previsao: '' },
    });
    const marcas = principal().querySelectorAll('[data-placeholder]');
    expect(marcas).toHaveLength(1);
    expect(marcas[0]).toHaveTextContent('[ano de início]');
    const datas = principal().querySelector('p.datas') as HTMLElement;
    expect(datas.querySelector('span[aria-hidden="true"]')).toBeNull();
  });
});

describe('Education (S-13): produção (DEV=false)', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('nenhum "[…]" de data no DOM em produção', { timeout: 20000 }, async () => {
    vi.stubEnv('DEV', false);
    vi.stubEnv('PROD', true);
    vi.resetModules();
    const { Education: EducationProd } = await import('@/sections/Education/Education');
    const { pt: ptProd } = await import('@/content/pt');
    const { LanguageContext: Ctx } = await import('@/i18n/LanguageContext');
    expect(ptProd.formacao.anoInicio).toBe('');
    expect(ptProd.formacao.previsao).toBe('');
    render(
      <Ctx.Provider
        value={{
          lang: 'pt',
          dict: ptProd,
          setLang: () => undefined,
          toggleLang: () => undefined,
          isSugerido: () => false,
        }}
      >
        <EducationProd />
      </Ctx.Provider>,
    );
    expect(document.body.textContent).not.toMatch(/\[ano de início\]|\[previsão de conclusão\]/);
    expect(document.querySelector('[data-placeholder]')).toBeNull();
    expect(document.querySelectorAll('#formacao ol > li')).toHaveLength(2);
  });
});

describe('Education (S-13): marco futuro tracejado (D21)', () => {
  it('`Card variant="dashed"` do DS-15 (data-card="dashed"), não interativo', () => {
    renderWithProviders(<Education />);
    expect(futuro().querySelector('[data-card="dashed"]')).not.toBeNull();
    expect(futuro().querySelector('[data-interactive]')).toBeNull();
  });

  it('marco principal usa o cartão padrão (data-card="default")', () => {
    renderWithProviders(<Education />);
    expect(principal().querySelector('[data-card="default"]')).not.toBeNull();
  });
});

describe('Education (S-13): linha do tempo (gancho do A-05) e foco', () => {
  it('`data-draw="y"` presente uma única vez, dentro de um invólucro `aria-hidden`', () => {
    renderWithProviders(<Education />);
    const linhas = secao().querySelectorAll('[data-draw="y"]');
    expect(linhas).toHaveLength(1);
    expect(linhas[0]?.closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it('a linha é um elemento próprio, sem altura/opacidade zeradas por atributo (aparece inteira sem o A-05)', () => {
    renderWithProviders(<Education />);
    const linha = secao().querySelector('[data-draw="y"]') as HTMLElement;
    expect(linha).not.toHaveAttribute('style');
    expect(linha.tagName).toBe('SPAN');
  });

  it('nada focável nos cartões (Tab passa direto para o próximo elemento da página)', async () => {
    renderWithProviders(
      <>
        <Education />
        <button type="button">depois</button>
      </>,
    );
    const usuario = userEvent.setup();
    await usuario.tab();
    expect(document.activeElement).toHaveTextContent('depois');
  });

  it('`data-reveal` só na raiz do conteúdo (A-02); nenhum outro gancho do §4.4 fora do data-draw', () => {
    renderWithProviders(<Education />);
    expect(secao().querySelectorAll('[data-reveal]')).toHaveLength(1);
    for (const attr of [
      'data-stagger',
      'data-stagger-item',
      'data-countup',
      'data-float',
      'data-bg-slot',
    ]) {
      expect(secao().querySelector(`[${attr}]`)).toBeNull();
    }
  });
});

describe('CSS e JSX da Formação acadêmica (S-13)', () => {
  const educacaoCss = ler('src/sections/Education/Education.module.css');
  const itemCss = ler('src/sections/Education/TimelineItem.module.css');

  it('`--linha-x`/`--linha-gap`: 16/28 px no celular e 0/28 px a partir de 640 px', () => {
    expect(educacaoCss).toMatch(/\.linhaDoTempo \{[^}]*--linha-x: 16px;[^}]*--linha-gap: 28px;/);
    expect(educacaoCss).toMatch(
      /@media \(min-width: 640px\) \{\s*\.linhaDoTempo \{\s*--linha-x: 0px;/,
    );
  });

  it('linha de 2 px em `--gradient-timeline`, posicionada por `--linha-x`', () => {
    expect(educacaoCss).toMatch(
      /\.linha \{[^}]*left: calc\(var\(--linha-x\) - 1px\);[^}]*width: 2px;[^}]*background-image: var\(--gradient-timeline\);/,
    );
  });

  it('coluna de marcos com `--card-gap` entre eles', () => {
    expect(educacaoCss).toMatch(/\.lista \{[^}]*gap: var\(--card-gap\);/);
  });

  it('"UniCEUB": 18 px (`--fs-lead`) e `--color-text-pink-on-tint` (#A82560 / #FFB3D1)', () => {
    expect(educacaoCss).toMatch(
      /\.instituicao \{[^}]*color: var\(--color-text-pink-on-tint\);[^}]*font-size: var\(--fs-lead\);/,
    );
  });

  it('marco futuro: texto em cor secundária', () => {
    expect(educacaoCss).toMatch(/\.futuro \{[^}]*color: var\(--color-text-secondary\);/);
  });

  it('nó de 20 px: alinhado ao centro do ícone no principal/comum e ao centro do cartão no futuro', () => {
    expect(itemCss).toMatch(/\.no \{[^}]*width: 20px;[^}]*height: 20px;[^}]*border-radius: 50%;/);
    expect(itemCss).toMatch(
      /\.futuro \{\s*top: calc\(50% - 10px\);\s*border: var\(--border-width-strong\) dashed var\(--color-deco\);/,
    );
  });

  it('sem hex, sem animação, sem transição, sem transform em nenhum dos dois arquivos', () => {
    for (const texto of [educacaoCss, itemCss]) {
      expect(texto).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
      expect(texto).not.toMatch(/animation|@keyframes|transition|transform/);
    }
  });

  it('nenhum texto fixo no JSX (CC-1)', () => {
    for (const arquivo of ['Education.tsx', 'TimelineItem.tsx']) {
      const tsx = ler(`src/sections/Education/${arquivo}`).replace(/\/\/.*$/gm, '');
      expect(tsx).not.toMatch(/>\s*[A-Za-zÀ-ÿ0-9][^<{]*<\//);
      expect(tsx).not.toMatch(/Ciência da Computação|UniCEUB|em andamento|Formação Acadêmica/);
    }
  });
});
