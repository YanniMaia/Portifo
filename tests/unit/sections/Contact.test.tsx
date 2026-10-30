// Testes de Contato (S-15). Medidas e cores computadas ficam no diário S-15 (navegador).
// Aqui: id, H2, eyebrow `tone="tint"`; parágrafo e disponibilidade (PulseDot); 3 botões
// (E-mail → LinkedIn → GitHub, D21) com `href` corretos, externos com `target="_blank"`/`rel` e
// aviso de nova aba, largura total no celular (`fullWidthOnMobile`); EN; `data-reveal` só na raiz;
// prop `backdrop`; contrato do CSS e do JSX.
// O comportamento do "Copiar" → "Copiado!" (timers, `aria-live`, falha/ausência do clipboard, EN)
// mudou de dono (D14, "um dono por artefato, sem duplicata") para
// `tests/unit/sections/copiar-email.test.tsx` (Q-04); aqui fica só a presença estrutural do
// endereço no layout do painel.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { en } from '@/content/en';
import { pt } from '@/content/pt';
import { SECTION_IDS } from '@/content/sections';
import { site } from '@/content/site';
import { LanguageContext, type LanguageContextValue } from '@/i18n/LanguageContext';
import type { Dictionary } from '@/i18n/types';
import { Contact } from '@/sections/Contact/Contact';
import { renderWithProviders } from '../support/render';

const ler = (arquivo: string) =>
  readFileSync(resolve(process.cwd(), arquivo), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

const secao = () => document.getElementById('contato') as HTMLElement;
const links = () => within(secao()).getAllByRole('link');

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
      <Contact />
    </LanguageContext.Provider>,
  );
}

describe('Contact (S-15): estrutura e texto', () => {
  it('<section id="contato"> do registro, nomeada pelo H2 "Vamos conversar?", com eyebrow tint', () => {
    renderWithProviders(<Contact />);
    expect(SECTION_IDS).toContain('contato');
    const h2 = within(secao()).getByRole('heading', { level: 2, name: pt.contato.titulo });
    expect(secao()).toHaveAttribute('aria-labelledby', h2.id);
    expect(secao()).toHaveAttribute('data-tone', 'base');
    const eyebrow = within(secao()).getByText(pt.contato.eyebrow);
    expect(eyebrow).toHaveClass('t-eyebrow');
    expect(eyebrow).toHaveAttribute('data-tone', 'tint');
  });

  it('parágrafo de `contato.texto` dentro do painel', () => {
    renderWithProviders(<Contact />);
    expect(within(secao()).getByText(pt.contato.texto)).toBeInTheDocument();
  });

  it('linha de disponibilidade: PulseDot de 8 px + texto de `contato.disponibilidade`', () => {
    renderWithProviders(<Contact />);
    expect(pt.contato.disponibilidade).not.toMatch(/^\[.*\]$/);
    const texto = within(secao()).getByText(pt.contato.disponibilidade);
    const linha = texto.closest('p') as HTMLElement;
    expect(linha.querySelector('[data-decor="pulse"][data-size="8"]')).not.toBeNull();
  });

  it('sem disponibilidade (valor vazio), a linha inteira não aparece', () => {
    montarComDicionario({ ...pt, contato: { ...pt.contato, disponibilidade: '' } });
    expect(secao().querySelector('[data-decor="pulse"]')).toBeNull();
    expect(secao().textContent).not.toMatch(/estágio/);
  });

  it('EN troca eyebrow, H2, parágrafo, disponibilidade e rótulos dos botões', () => {
    renderWithProviders(<Contact />, { idioma: 'en' });
    expect(within(secao()).getByRole('heading', { level: 2 })).toHaveTextContent(en.contato.titulo);
    expect(within(secao()).getByText(en.contato.eyebrow)).toBeInTheDocument();
    expect(within(secao()).getByText(en.contato.texto)).toBeInTheDocument();
    expect(within(secao()).getByText(en.contato.disponibilidade)).toBeInTheDocument();
    expect(within(secao()).getByRole('link', { name: en.contato.botaoEmail })).toBeInTheDocument();
    expect(
      within(secao()).getByRole('link', { name: new RegExp(en.contato.botaoLinkedin) }),
    ).toBeInTheDocument();
    expect(
      within(secao()).getByRole('link', { name: new RegExp(en.contato.botaoGithub) }),
    ).toBeInTheDocument();
  });
});

describe('Contact (S-15): botões — ordem, href e nova aba (D21)', () => {
  it('3 links na ordem E-mail → LinkedIn → GitHub, com os `href` do C-04', () => {
    renderWithProviders(<Contact />);
    const [emailLink, linkedinLink, githubLink] = links() as [
      HTMLAnchorElement,
      HTMLAnchorElement,
      HTMLAnchorElement,
    ];
    expect(links()).toHaveLength(3);
    expect(emailLink).toHaveAttribute('href', site.mailto);
    expect(linkedinLink).toHaveAttribute('href', site.linkedin);
    expect(githubLink).toHaveAttribute('href', site.github);
    expect(emailLink).toHaveTextContent(pt.contato.botaoEmail);
    expect(linkedinLink).toHaveTextContent(pt.contato.botaoLinkedin);
    expect(githubLink).toHaveTextContent(pt.contato.botaoGithub);
  });

  it('E-mail não abre em nova aba; LinkedIn e GitHub abrem (target/rel + aviso para leitor de tela)', () => {
    renderWithProviders(<Contact />);
    const [emailLink, linkedinLink, githubLink] = links() as [
      HTMLAnchorElement,
      HTMLAnchorElement,
      HTMLAnchorElement,
    ];
    expect(emailLink).not.toHaveAttribute('target');
    for (const linkExterno of [linkedinLink, githubLink]) {
      expect(linkExterno).toHaveAttribute('target', '_blank');
      expect(linkExterno).toHaveAttribute('rel', 'noopener noreferrer');
      expect(linkExterno).toHaveAccessibleName(new RegExp(`${pt.a11y.opensInNewTab}`, 'i'));
    }
  });

  it('variantes: E-mail primário, LinkedIn/GitHub secundários', () => {
    renderWithProviders(<Contact />);
    const [emailLink, linkedinLink, githubLink] = links() as [
      HTMLAnchorElement,
      HTMLAnchorElement,
      HTMLAnchorElement,
    ];
    expect(emailLink).toHaveAttribute('data-variant', 'primary');
    expect(linkedinLink).toHaveAttribute('data-variant', 'secondary');
    expect(githubLink).toHaveAttribute('data-variant', 'secondary');
  });

  it('largura total no celular (`fullWidthOnMobile`) nos 3 botões', () => {
    renderWithProviders(<Contact />);
    for (const link of links()) {
      expect(link).toHaveClass('fullWidthOnMobile');
    }
  });

  it('ícone de 20 px à esquerda de cada botão (Mail, Linkedin, Github), decorativo', () => {
    renderWithProviders(<Contact />);
    const [emailLink, linkedinLink, githubLink] = links() as [
      HTMLAnchorElement,
      HTMLAnchorElement,
      HTMLAnchorElement,
    ];
    const svgDe = (link: HTMLAnchorElement) => link.querySelector('svg') as SVGElement;
    expect(svgDe(emailLink).getAttribute('class')).toContain('lucide-mail');
    expect(svgDe(linkedinLink).getAttribute('class')).toContain('linkedin');
    expect(svgDe(githubLink).getAttribute('class')).toContain('github');
    for (const link of [emailLink, linkedinLink, githubLink]) {
      expect(svgDe(link)).toHaveAttribute('aria-hidden', 'true');
      expect(svgDe(link)).toHaveAttribute('data-icon-size', '20');
    }
  });

  it('ordem de foco (Tab) segue a ordem do DOM: E-mail, LinkedIn, GitHub, Copiar', async () => {
    renderWithProviders(<Contact />);
    const usuario = userEvent.setup();
    await usuario.tab();
    expect(document.activeElement).toHaveTextContent(pt.contato.botaoEmail);
    await usuario.tab();
    expect(document.activeElement).toHaveTextContent(pt.contato.botaoLinkedin);
    await usuario.tab();
    expect(document.activeElement).toHaveTextContent(pt.contato.botaoGithub);
    await usuario.tab();
    expect(document.activeElement).toHaveTextContent(pt.contato.copiar);
  });
});

describe('Contact (S-15): CopyEmail — presença estrutural no painel', () => {
  // Comportamento de clique (sucesso/falha/timers/aria-live/EN): tests/unit/sections/copiar-email.test.tsx (Q-04).
  it('endereço de `site.email` visível e selecionável, 24 px abaixo dos botões', () => {
    renderWithProviders(<Contact />);
    expect(within(secao()).getByText(site.email)).toBeInTheDocument();
  });
});

describe('Contact (S-15): prop `backdrop` (04 §4.4, escopado ao painel)', () => {
  it('sem `backdrop`, nenhum contêiner de fundo', () => {
    renderWithProviders(<Contact />);
    expect(secao().querySelector('[data-testid="bd"]')).toBeNull();
  });

  it('com `backdrop`, a camada fica atrás do conteúdo do painel, aria-hidden; sem `data-bg-slot`', () => {
    renderWithProviders(<Contact backdrop={<div data-testid="bd" />} />);
    const bd = screen.getByTestId('bd');
    const camada = bd.parentElement as HTMLElement;
    expect(camada).toHaveAttribute('aria-hidden', 'true');
    expect(camada.nextElementSibling?.querySelector('h2')).not.toBeNull();
    expect(secao().querySelector('[data-bg-slot]')).toBeNull();
  });
});

describe('Contact (S-15): gancho do A-02', () => {
  it('`data-reveal` presente uma única vez (na raiz do conteúdo do painel)', () => {
    renderWithProviders(<Contact />);
    expect(secao().querySelectorAll('[data-reveal]')).toHaveLength(1);
    for (const attr of ['data-stagger', 'data-stagger-item', 'data-countup', 'data-float']) {
      expect(secao().querySelector(`[${attr}]`)).toBeNull();
    }
  });
});

describe('CSS e JSX de Contato (S-15)', () => {
  const contactCss = ler('src/sections/Contact/Contact.module.css');
  const copyCss = ler('src/sections/Contact/CopyEmail.module.css');
  const contactTsx = ler('src/sections/Contact/Contact.tsx').replace(/\/\/.*$/gm, '');
  const copyTsx = ler('src/sections/Contact/CopyEmail.tsx').replace(/\/\/.*$/gm, '');

  it('painel: máx. 1000 px, raio 32, borda e degradê `--gradient-contact`, overflow hidden', () => {
    expect(contactCss).toMatch(
      /\.painel \{[^}]*max-width: var\(--measure-contact\);[^}]*overflow: hidden;[^}]*border: var\(--border-width\) solid var\(--color-border\);[^}]*border-radius: var\(--radius-panel\);[^}]*background-image: var\(--gradient-contact\);[^}]*padding: 40px;/,
    );
    expect(contactCss).toMatch(
      /@media \(min-width: 640px\) \{\s*\.painel \{\s*padding: var\(--space-12\);/,
    );
    expect(contactCss).toMatch(
      /@media \(min-width: 1024px\) \{\s*\.painel \{\s*padding: var\(--space-16\);/,
    );
  });

  it('backdrop atrás (z-index 0, overflow hidden), conteúdo na frente (z-index 1)', () => {
    expect(contactCss).toMatch(/\.backdrop \{[^}]*z-index: 0;[^}]*overflow: hidden;/);
    expect(contactCss).toMatch(/\.conteudo \{[^}]*z-index: 1;/);
  });

  it('parágrafo: até 640 px (`--measure-contact-text`), centralizado, cor secundária', () => {
    expect(contactCss).toMatch(
      /\.texto \{[^}]*max-width: var\(--measure-contact-text\);[^}]*margin: 0 auto;[^}]*color: var\(--color-text-secondary\);[^}]*text-align: center;/,
    );
  });

  it('disponibilidade: 16 px abaixo do parágrafo (`--space-4`), cor secundária', () => {
    expect(contactCss).toMatch(
      /\.disponibilidade \{[^}]*margin: var\(--space-4\) 0 0;[^}]*color: var\(--color-text-secondary\);/,
    );
  });

  it('botões: `--button-gap` entre eles (12/16 px), empilhados até 639 px, em linha a partir de 640 px', () => {
    expect(contactCss).toMatch(
      /\.botoes \{[^}]*flex-direction: column;[^}]*gap: var\(--button-gap\);/,
    );
    expect(contactCss).toMatch(
      /@media \(min-width: 640px\) \{\s*\.botoes \{\s*flex-direction: row;/,
    );
  });

  it('CopyEmail 24 px abaixo dos botões (`--space-6`)', () => {
    expect(contactCss).toMatch(/\.copiarEmail \{[^}]*margin-top: var\(--space-6\);/);
  });

  it('endereço do CopyEmail: 16 px, cor secundária, `user-select: text`', () => {
    expect(copyCss).toMatch(
      /\.endereco \{[^}]*color: var\(--color-text-secondary\);[^}]*font-size: 16px;[^}]*user-select: text;/,
    );
  });

  it('sem hex em nenhum dos dois arquivos de CSS da seção', () => {
    for (const texto of [contactCss, copyCss]) {
      expect(texto).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    }
  });

  it('nenhum texto fixo no JSX (CC-1)', () => {
    for (const tsx of [contactTsx, copyTsx]) {
      expect(tsx).not.toMatch(/Vamos conversar|estágio em tecnologia|"Copiado!"|>Copiado!</);
    }
  });

  it('"Baixar currículo", cidade ou modalidade não aparecem em nenhum lugar da seção', () => {
    expect(contactTsx).not.toMatch(/curr[ií]culo|cidade|modalidade/i);
    expect(copyTsx).not.toMatch(/curr[ií]culo|cidade|modalidade/i);
  });

  it('`site.email` ausente/placeholder: `CopyEmail` não renderiza nada (D11)', () => {
    expect(copyTsx).toMatch(/isPlaceholder\(site\.email\)/);
  });
});
