// Testes do Sobre mim (S-07). Medidas e cores computadas ficam no diário S-07 (navegador).
// Aqui: id e H2, parágrafo, 6 chips não focáveis, botão de texto para #habilidades (rolagem do
// F-13), cartão "Minha trajetória" com 3 marcos e estado pela posição (Anexo A.6), `[ano]` só em
// DEV (D11), ocultações (chips vazios, cartão sem marcos), `data-reveal` e o contrato do CSS.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { en } from '@/content/en';
import { pt } from '@/content/pt';
import { SECTION_IDS } from '@/content/sections';
import { LanguageContext, type LanguageContextValue } from '@/i18n/LanguageContext';
import type { Dictionary } from '@/i18n/types';
import { About } from '@/sections/About/About';
import { renderWithProviders } from '../support/render';

const rolagem = vi.hoisted(() => ({ scrollToSection: vi.fn(), scrollToTop: vi.fn() }));

vi.mock('@/lib/scroll', () => rolagem);

const ler = (arquivo: string) =>
  readFileSync(resolve(process.cwd(), arquivo), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

const secao = () => document.getElementById('sobre') as HTMLElement;
const marcos = () => [...secao().querySelectorAll('ol > li')] as HTMLElement[];

beforeEach(() => {
  rolagem.scrollToSection.mockClear();
});

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
      <About />
    </LanguageContext.Provider>,
  );
}

describe('About (S-07): estrutura e texto', () => {
  it('<section id="sobre"> do registro, nomeada pelo H2 "Sobre mim", com eyebrow', () => {
    renderWithProviders(<About />);
    expect(SECTION_IDS).toContain('sobre');
    const h2 = within(secao()).getByRole('heading', { level: 2, name: pt.sobre.titulo });
    expect(secao()).toHaveAttribute('aria-labelledby', h2.id);
    expect(secao()).toHaveAttribute('data-tone', 'base');
    expect(within(secao()).getByText(pt.sobre.eyebrow)).toHaveClass('t-eyebrow');
  });

  it('parágrafo do C-02 com a tipografia de corpo (.t-body)', () => {
    renderWithProviders(<About />);
    const p = within(secao()).getByText(pt.sobre.texto);
    expect(p.tagName).toBe('P');
    expect(p).toHaveClass('t-body');
  });

  it('6 chips (Python, SQL, Git, GitHub, Excel, Trello) em lista, mono, não focáveis', async () => {
    renderWithProviders(<About />);
    const lista = within(secao()).getAllByRole('list')[0] as HTMLElement;
    const chips = within(lista).getAllByRole('listitem');
    expect(chips.map((c) => c.textContent)).toEqual([...pt.sobre.chips]);
    expect(chips).toHaveLength(6);
    for (const c of chips) {
      expect(c).toHaveAttribute('data-size', 'default');
      expect(c).not.toHaveAttribute('tabindex');
    }
    const usuario = userEvent.setup();
    await usuario.tab();
    expect(document.activeElement?.tagName).toBe('A');
  });

  it('"Ver habilidades →" é o único focável, vai para #habilidades e usa a rolagem do F-13', async () => {
    const usuario = userEvent.setup();
    renderWithProviders(<About />);
    const link = within(secao()).getByRole('link', { name: pt.sobre.verHabilidades });
    expect(link).toHaveAttribute('href', '#habilidades');
    expect(link).toHaveAttribute('data-variant', 'text');
    expect(link.querySelectorAll('svg')).toHaveLength(0); // a seta já está no texto
    await usuario.tab();
    expect(link).toHaveFocus();
    await usuario.tab();
    expect(link).not.toHaveFocus();
    await usuario.click(link);
    expect(rolagem.scrollToSection).toHaveBeenCalledWith('habilidades');
  });

  it('EN troca todos os textos da seção', () => {
    renderWithProviders(<About />, { idioma: 'en' });
    expect(within(secao()).getByRole('heading', { level: 2 })).toHaveTextContent(en.sobre.titulo);
    expect(within(secao()).getByText(en.sobre.texto)).toBeInTheDocument();
    expect(within(secao()).getByRole('link')).toHaveTextContent(en.sobre.verHabilidades);
    expect(within(secao()).getByRole('heading', { level: 3 })).toHaveTextContent(
      en.sobre.trajetoria.titulo,
    );
    expect(marcos()[0]).toHaveTextContent(en.sobre.trajetoria.marcos[0] as string);
  });
});

describe('About (S-07): cartão "Minha trajetória" (Anexo A.6)', () => {
  it('H3 + 3 marcos a partir da lista de strings, na ordem', () => {
    renderWithProviders(<About />);
    const h3 = within(secao()).getByRole('heading', { level: 3, name: pt.sobre.trajetoria.titulo });
    expect(h3.closest('[data-card="default"]')).not.toBeNull();
    expect(marcos()).toHaveLength(3);
    pt.sobre.trajetoria.marcos.forEach((texto, i) => expect(marcos()[i]).toHaveTextContent(texto));
    expect(secao().querySelector('ol')).toHaveAttribute('aria-labelledby', h3.id);
  });

  it('estado pela posição: 0 e 1 preenchidas, 2 (próximo passo) tracejada', () => {
    renderWithProviders(<About />);
    expect(marcos().map((li) => li.getAttribute('data-estado'))).toEqual([
      'feito',
      'feito',
      'proximo',
    ]);
  });

  it('em DEV, o único valor de ano ([ano]) aparece marcado antes de cada marco', () => {
    renderWithProviders(<About />);
    expect(pt.sobre.trajetoria.ano).toBe('[ano]');
    for (const li of marcos()) {
      const marca = li.querySelector('[data-placeholder="inline"]') as HTMLElement;
      expect(marca).toHaveTextContent('[ano]');
      expect(li.firstElementChild).toBe(marca);
    }
  });

  it('sem ano (o valor de produção do pt.ts é ""), nenhum [ano] e nenhuma marca', () => {
    montarComDicionario({
      ...pt,
      sobre: { ...pt.sobre, trajetoria: { ...pt.sobre.trajetoria, ano: '' } },
    });
    expect(secao().querySelector('[data-placeholder]')).toBeNull();
    expect(secao().textContent).not.toMatch(/\[ano\]/);
    expect(marcos()[0]?.textContent).toBe(pt.sobre.trajetoria.marcos[0]);
  });
});

describe('About (S-07): produção (DEV=false)', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('nenhum [ano] no DOM em produção', { timeout: 20000 }, async () => {
    vi.stubEnv('DEV', false);
    vi.stubEnv('PROD', true);
    vi.resetModules();
    const { About: AboutProd } = await import('@/sections/About/About');
    const { pt: ptProd } = await import('@/content/pt');
    const { LanguageContext: Ctx } = await import('@/i18n/LanguageContext');
    expect(ptProd.sobre.trajetoria.ano).toBe('');
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
        <AboutProd />
      </Ctx.Provider>,
    );
    expect(document.body.textContent).not.toMatch(/\[ano\]/);
    expect(document.querySelector('[data-placeholder]')).toBeNull();
    expect(document.querySelectorAll('#sobre ol > li')).toHaveLength(3);
  });
});

describe('About (S-07): ocultação e ganchos', () => {
  it('lista de chips vazia: o bloco de chips some (o botão continua)', () => {
    montarComDicionario({ ...pt, sobre: { ...pt.sobre, chips: [] } });
    expect(
      within(secao())
        .queryAllByRole('listitem')
        .filter((li) => !li.closest('ol')),
    ).toHaveLength(0);
    expect(secao().querySelectorAll('ul')).toHaveLength(0);
    expect(within(secao()).getByRole('link')).toBeInTheDocument();
  });

  it('sem marcos: o cartão some e a grade fica com uma coluna só', () => {
    montarComDicionario({
      ...pt,
      sobre: { ...pt.sobre, trajetoria: { ...pt.sobre.trajetoria, marcos: [] } },
    });
    expect(within(secao()).queryByRole('heading', { level: 3 })).toBeNull();
    expect(secao().querySelector('[data-card]')).toBeNull();
    const grade = secao().querySelector('p.t-body')?.parentElement?.parentElement as HTMLElement;
    expect(grade.className).toMatch(/semCartao/);
  });

  it('data-reveal no contêiner de conteúdo (A-02) e nenhum gancho fora do §4.4', () => {
    renderWithProviders(<About />);
    expect(secao().querySelectorAll('[data-reveal]')).toHaveLength(1);
    for (const attr of [
      'data-stagger',
      'data-draw',
      'data-countup',
      'data-float',
      'data-bg-slot',
    ]) {
      expect(secao().querySelector(`[${attr}]`)).toBeNull();
    }
  });
});

describe('CSS e JSX do Sobre mim (S-07)', () => {
  const css = ler('src/sections/About/About.module.css');
  const cartao = ler('src/sections/About/JourneyCard.module.css');

  it('grade: 1 coluna abaixo de 1024 (40 px no celular, 48 no tablet) e 7fr/5fr com 64 px', () => {
    expect(css).toMatch(
      /\.grade \{[^}]*grid-template-columns: minmax\(0, 1fr\);[^}]*gap: var\(--space-12\);/,
    );
    expect(css).toMatch(/@media \(max-width: 639px\) \{\s*\.grade \{\s*gap: 40px;/);
    expect(css).toMatch(
      /@media \(min-width: 1024px\) \{\s*\.grade \{\s*grid-template-columns: minmax\(0, 7fr\) minmax\(0, 5fr\);\s*gap: var\(--space-16\);/,
    );
  });

  it('parágrafo na cor secundária; chips e botão 24 px abaixo', () => {
    expect(css).toMatch(/\.paragrafo \{[^}]*color: var\(--color-text-secondary\);/);
    expect(css).toMatch(/\.chips \{\s*margin-top: var\(--space-6\);/);
    expect(css).toMatch(/\.acao \{\s*margin-top: var\(--space-6\);/);
  });

  it('linha do tempo de 2 px em --gradient-timeline e bolinhas de 14 px', () => {
    expect(cartao).toMatch(
      /\.marcos::before \{[^}]*width: 2px;[^}]*background-image: var\(--gradient-timeline\);/,
    );
    expect(cartao).toMatch(
      /\.marco::before \{[^}]*width: 14px;[^}]*height: 14px;[^}]*border-radius: 50%;[^}]*background-color: var\(--color-accent\);/,
    );
    expect(cartao).toMatch(
      /\.marco\[data-estado='proximo'\]::before \{\s*border: var\(--border-width-strong\) dashed var\(--color-accent\);/,
    );
  });

  it('sem hex, sem animação, sem transição', () => {
    for (const texto of [css, cartao]) {
      expect(texto).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
      expect(texto).not.toMatch(/animation|@keyframes|transition/);
    }
  });

  it('nenhum texto fixo no JSX (CC-1)', () => {
    for (const arquivo of ['About.tsx', 'JourneyCard.tsx']) {
      const tsx = ler(`src/sections/About/${arquivo}`).replace(/\/\/.*$/gm, '');
      expect(tsx).not.toMatch(/>\s*[A-Za-zÀ-ÿ0-9][^<{]*<\//);
      expect(tsx).not.toMatch(/Python|UniCEUB|Sobre mim|trajetória|\[ano\]/);
    }
  });
});
