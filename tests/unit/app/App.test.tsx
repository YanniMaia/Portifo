// Teste de integração do App montado (S-17; doc 03 §S-17). Confere a montagem do shell com as
// 10 seções reais: ids únicos e na ordem do registro (F-12), um único H1, regiões header/main/
// footer, SkipLink para o `<main>` e o gancho `data-reveal` (A-02) em cada seção exceto o hero.
// Placeholders em produção: não duplicado aqui — o `postbuild` roda `check:placeholders` (C-01)
// sobre o `dist/` real; este teste de unidade roda com `SHOW_PLACEHOLDERS` do modo de teste (DEV).
//
// Atualizado pelo A-02 (decisão registrada no diário cp/A-02, opção (b) da pendência de S-17/S-06,
// CHECKPOINTS.md "Pendências"): a Frase (`#frase`) ganhou `data-reveal` no mesmo contêiner que já
// tinha `data-stagger="motto"` (meia linha em `Motto.tsx`), para participar do fade de entrada
// igual às outras 8. Ela deixa de ser excluída de `SECOES_COM_REVEAL`.
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from '@/App';
import { MAIN_CONTENT_ID } from '@/components/SkipLink';
import { SECTION_IDS } from '@/content/sections';
import { pt } from '@/content/pt';
import { renderWithProviders } from '../support/render';

// As 9 seções com `data-reveal` (A-02; doc 04 §4.4). Só `inicio` (hero) não anima (CC-6, D11: o H1
// não pode atrasar o LCP). `frase` (Motto) ganhou o gancho nesta task (ver nota acima).
const SECOES_COM_REVEAL = SECTION_IDS.filter((id) => id !== 'inicio');

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

  it('a frase (#frase) tem data-reveal e data-stagger="motto" no mesmo contêiner (A-02)', () => {
    renderWithProviders(<App />);
    const frase = document.getElementById('frase');
    const reveal = frase?.querySelectorAll('[data-reveal]');
    expect(reveal).toHaveLength(1);
    expect(reveal?.[0]).toBe(frase?.querySelector('[data-stagger="motto"]'));
  });

  it.each(['light', 'dark'] as const)(
    'renderiza sem erro com os provedores reais (igual ao main.tsx), tema %s',
    (tema) => {
      expect(() => renderWithProviders(<App />, { tema })).not.toThrow();
    },
  );
});
