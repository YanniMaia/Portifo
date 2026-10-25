// Teste de integração do App montado (S-17; doc 03 §S-17). Confere a montagem do shell com as
// 10 seções reais: ids únicos e na ordem do registro (F-12), um único H1, regiões header/main/
// footer, SkipLink para o `<main>` e o gancho `data-reveal` (A-02) em cada seção exceto o hero.
// Placeholders em produção: não duplicado aqui — o `postbuild` roda `check:placeholders` (C-01)
// sobre o `dist/` real; este teste de unidade roda com `SHOW_PLACEHOLDERS` do modo de teste (DEV).
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from '@/App';
import { MAIN_CONTENT_ID } from '@/components/SkipLink';
import { SECTION_IDS } from '@/content/sections';
import { pt } from '@/content/pt';
import { renderWithProviders } from '../support/render';

// As 8 seções com `data-reveal` (A-02; doc 04 §4.4). `inicio` (hero) não anima (CC-6) e `frase`
// (Motto) só tem `data-stagger="motto"` no código real do S-06 — divergência do doc 04 §4.4
// (linha 163, que listaria também o S-06) registrada no checkpoint desta task, sem alterar o S-06.
const SECOES_COM_REVEAL = SECTION_IDS.filter((id) => id !== 'inicio' && id !== 'frase');

describe('App (S-17: montagem final)', () => {
  it('renderiza os 10 ids do registro, cada um uma vez, na ordem do §2', () => {
    renderWithProviders(<App />);
    const secoes = document.querySelectorAll('main#conteudo > section');
    const ids = Array.from(secoes).map((secao) => secao.id);
    expect(ids).toEqual([...SECTION_IDS]);
    SECTION_IDS.forEach((id) => {
      expect(document.querySelectorAll(`#${id}`)).toHaveLength(1);
    });
  });

  it('tem um único <h1> na página inteira (o do Hero)', () => {
    renderWithProviders(<App />);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it('tem exatamente 1 <header> de topo (banner) e 1 <footer> (contentinfo)', () => {
    // `getByRole('banner')` não serve aqui: o jsdom/testing-library (aria-query) não aplica a regra
    // de contexto do <header> (só é "banner" fora de article/aside/main/nav/section) — cada
    // `SectionHeader` (DS-14) usado dentro das seções também renderiza um <header> e contaria como
    // banner. Por isso filtramos pelo contexto real do DOM (fora do <main>), que é o que o
    // navegador (e o e2e de shell.spec.ts, que roda em browser real) de fato aplica.
    renderWithProviders(<App />);
    const main = screen.getByRole('main');
    const headersDeTopo = Array.from(document.querySelectorAll('header')).filter(
      (header) => !main.contains(header),
    );
    expect(headersDeTopo).toHaveLength(1);
    expect(document.querySelectorAll('footer')).toHaveLength(1);
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('o SkipLink aponta para o <main id="conteudo">', () => {
    renderWithProviders(<App />);
    const link = screen.getByRole('link', { name: pt.a11y.skipToContent });
    expect(link).toHaveAttribute('href', `#${MAIN_CONTENT_ID}`);
    expect(screen.getByRole('main')).toHaveAttribute('id', MAIN_CONTENT_ID);
  });

  it.each(SECOES_COM_REVEAL)('a seção #%s tem exatamente um gancho data-reveal (A-02)', (id) => {
    renderWithProviders(<App />);
    const secao = document.getElementById(id);
    expect(secao).not.toBeNull();
    expect(secao?.querySelectorAll('[data-reveal]')).toHaveLength(1);
  });

  it('o hero (#inicio) não tem data-reveal (CC-6: aparece pronto, sem reveal)', () => {
    renderWithProviders(<App />);
    const hero = document.getElementById('inicio');
    expect(hero?.querySelectorAll('[data-reveal]')).toHaveLength(0);
  });

  it('a frase (#frase) usa data-stagger="motto", sem data-reveal próprio (divergência do S-06 registrada no checkpoint)', () => {
    renderWithProviders(<App />);
    const frase = document.getElementById('frase');
    expect(frase?.querySelectorAll('[data-reveal]')).toHaveLength(0);
    expect(frase?.querySelectorAll('[data-stagger="motto"]')).toHaveLength(1);
  });

  it.each(['light', 'dark'] as const)(
    'renderiza sem erro com os provedores reais (igual ao main.tsx), tema %s',
    (tema) => {
      expect(() => renderWithProviders(<App />, { tema })).not.toThrow();
    },
  );
});
