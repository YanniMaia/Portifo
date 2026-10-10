// Testes do menu do celular e do tablet (S-02). Medidas, cores e a trava no navegador real (sem
// "pulo") ficam no diário S-02. Aqui: existência só abaixo de 1024 px, abrir/fechar pelas 5 vias,
// `aria-expanded`/`aria-label`/`data-open`, foco preso e devolvido, trava do `<body>`, `inert` em
// `main`/`footer`, item ativo, troca de idioma, ausência do PT/EN (V1) e o contrato dos CSS.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { en } from '@/content/en';
import { pt } from '@/content/pt';
import { NAV_ITEMS, type NavTarget } from '@/content/sections';
import { LanguageProvider } from '@/i18n/LanguageProvider';
import { Header } from '@/sections/Header/Header';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { scrollToEspiao } from '../support/mocks';

const estado = vi.hoisted(() => ({ ativo: null as NavTarget | null }));

vi.mock('@/hooks/useActiveSection', () => ({
  useActiveSection: () => estado.ativo,
}));

const rolagem = vi.hoisted(() => ({ scrollToSection: vi.fn(), scrollToTop: vi.fn() }));

vi.mock('@/lib/scroll', () => rolagem);

const ler = (arquivo: string) =>
  readFileSync(resolve(process.cwd(), arquivo), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

const html = document.documentElement;
const CONSULTA_COMPACTO = '(max-width: 1023px)';

// ---------------------------------------------------------------------------------------------
// Largura da janela: só a consulta "abaixo de 1024 px" é simulada; o resto vai ao mock padrão.
// ---------------------------------------------------------------------------------------------

type Ouvinte = (evento: MediaQueryListEvent) => void;
const largura = { compacto: true, ouvintes: new Set<Ouvinte>() };

function instalarLargura(compacto: boolean) {
  largura.compacto = compacto;
  largura.ouvintes = new Set();
  const original = window.matchMedia.bind(window);
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (query: string): MediaQueryList => {
      if (query.replace(/\s+/g, '') !== CONSULTA_COMPACTO.replace(/\s+/g, '')) {
        return original(query);
      }
      return {
        get matches() {
          return largura.compacto;
        },
        media: query,
        onchange: null,
        addListener: () => undefined,
        removeListener: () => undefined,
        addEventListener: (_t: string, fn: Ouvinte) => largura.ouvintes.add(fn),
        removeEventListener: (_t: string, fn: Ouvinte) => largura.ouvintes.delete(fn),
        dispatchEvent: () => false,
      } as unknown as MediaQueryList;
    },
  });
}

function redimensionar(compacto: boolean) {
  act(() => {
    largura.compacto = compacto;
    for (const fn of [...largura.ouvintes]) {
      fn({ matches: compacto, media: CONSULTA_COMPACTO } as MediaQueryListEvent);
    }
  });
}

function rolarPara(y: number) {
  Object.defineProperty(window, 'scrollY', { configurable: true, value: y });
  act(() => {
    window.dispatchEvent(new Event('scroll'));
  });
}

function montar(lang = 'pt-BR') {
  html.lang = lang;
  return render(
    <ThemeProvider>
      <LanguageProvider>
        <Header />
        <main>
          <section id="sobre">
            <h2 tabIndex={-1}>Sobre</h2>
          </section>
        </main>
        <footer>rodapé</footer>
      </LanguageProvider>
    </ThemeProvider>,
  );
}

const botao = (nome: string = pt.menu.abrir) => screen.getByRole('button', { name: nome });
const painelDe = (b: HTMLElement) => {
  const id = b.getAttribute('aria-controls');
  const painel = id ? document.getElementById(id) : null;
  if (!painel) throw new Error('painel do menu não encontrado');
  return painel;
};
const linksDoPainel = (painel: HTMLElement) => within(painel).getAllByRole('link');

beforeEach(() => {
  estado.ativo = null;
  rolagem.scrollToSection.mockClear();
  rolagem.scrollToTop.mockClear();
  instalarLargura(true);
  rolarPara(0);
});

afterEach(() => {
  html.lang = 'pt-BR';
  html.dataset.theme = 'light';
  localStorage.clear();
  document.body.removeAttribute('style');
});

describe('MobileMenu e MenuButton (S-02): existência por largura', () => {
  it('em ≥ 1024 px não há botão nem painel no DOM', () => {
    instalarLargura(false);
    montar();
    expect(screen.queryByRole('button', { name: pt.menu.abrir })).toBeNull();
    expect(document.querySelector('[data-open]')).toBeNull();
    expect(screen.getAllByRole('button')).toHaveLength(1); // só o tema
  });

  it('abaixo de 1024 px: tema e depois o hambúrguer, no mesmo grupo', () => {
    montar();
    const b = botao();
    const tema = screen.getByRole('button', { name: pt.a11y.themeToDark });
    expect(b.parentElement).toBe(tema.parentElement);
    expect(tema.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('fechado: aria-expanded=false, aria-controls do painel, data-open=false e painel inerte', () => {
    montar();
    const b = botao();
    expect(b).toHaveAttribute('type', 'button');
    expect(b).toHaveAttribute('aria-expanded', 'false');
    expect(b).toHaveAttribute('data-open', 'false');
    const painel = painelDe(b);
    expect(painel).toHaveAttribute('data-open', 'false');
    expect(painel).toHaveAttribute('inert');
    expect(b.querySelectorAll('span[aria-hidden="true"] > span')).toHaveLength(3);
  });
});

describe('MobileMenu (S-02): abrir', () => {
  it('clique abre: aria-expanded, rótulo "Fechar menu", data-open nos dois e foco no 1º link', async () => {
    const usuario = userEvent.setup();
    montar();
    const b = botao();
    await usuario.click(b);
    expect(b).toHaveAttribute('aria-expanded', 'true');
    expect(b).toHaveAccessibleName(pt.menu.fechar);
    expect(b).toHaveAttribute('data-open', 'true');
    const painel = painelDe(b);
    expect(painel).toHaveAttribute('data-open', 'true');
    expect(painel).not.toHaveAttribute('inert');
    expect(linksDoPainel(painel)[0]).toHaveFocus();
  });

  it('painel: <nav> rotulado e os 6 links do registro, com rótulos do dicionário', async () => {
    const usuario = userEvent.setup();
    montar();
    await usuario.click(botao());
    const painel = painelDe(botao(pt.menu.fechar));
    const nav = within(painel).getByRole('navigation', { name: pt.menu.navAria });
    const links = within(nav).getAllByRole('link');
    expect(links.map((l) => l.getAttribute('href'))).toEqual(NAV_ITEMS.map((i) => `#${i.id}`));
    expect(links.map((l) => l.textContent)).toEqual(NAV_ITEMS.map((i) => pt.nav[i.id]));
  });

  it('trava o fundo (body fixo em -scrollY, largura 100%) e deixa main e footer inertes', async () => {
    const usuario = userEvent.setup();
    rolarPara(640);
    montar();
    await usuario.click(botao());
    expect(document.body.style.position).toBe('fixed');
    expect(document.body.style.top).toBe('-640px');
    expect(document.body.style.width).toBe('100%');
    expect(document.querySelector('main')).toHaveAttribute('inert');
    expect(document.querySelector('footer')).toHaveAttribute('inert');
  });

  it('com o menu aberto o cabeçalho continua "rolado" (scrollY real vira 0 com o body fixo)', async () => {
    const usuario = userEvent.setup();
    rolarPara(640);
    montar();
    await usuario.click(botao());
    rolarPara(0); // o navegador zera o scrollY ao fixar o body
    expect(screen.getByRole('banner')).toHaveAttribute('data-scrolled', 'true');
  });

  it('item ativo no painel: aria-current="location" e data-active só nele', async () => {
    const usuario = userEvent.setup();
    estado.ativo = 'projetos';
    montar();
    await usuario.click(botao());
    const ativos = linksDoPainel(painelDe(botao(pt.menu.fechar))).filter((l) =>
      l.hasAttribute('aria-current'),
    );
    expect(ativos).toHaveLength(1);
    expect(ativos[0]).toHaveAttribute('aria-current', 'location');
    expect(ativos[0]).toHaveAttribute('data-active', 'true');
    expect(ativos[0]).toHaveAttribute('href', '#projetos');
  });
});

describe('MobileMenu (S-02): fechar nas 5 situações', () => {
  async function abrir(y = 320) {
    const usuario = userEvent.setup();
    rolarPara(y);
    montar();
    await usuario.click(botao());
    scrollToEspiao().mockClear();
    return usuario;
  }

  function conferirFechadoELiberado(y: number) {
    const b = botao();
    expect(b).toHaveAttribute('aria-expanded', 'false');
    expect(b).toHaveAttribute('data-open', 'false');
    expect(painelDe(b)).toHaveAttribute('data-open', 'false');
    expect(painelDe(b)).toHaveAttribute('inert');
    expect(document.body.style.position).toBe('');
    expect(document.body.style.top).toBe('');
    expect(document.querySelector('main')).not.toHaveAttribute('inert');
    expect(document.querySelector('footer')).not.toHaveAttribute('inert');
    expect(scrollToEspiao()).toHaveBeenCalledWith({ top: y, left: 0, behavior: 'instant' });
  }

  it('1) clique no X: fecha, destrava na posição exata e devolve o foco ao botão', async () => {
    const usuario = await abrir(320);
    await usuario.click(botao(pt.menu.fechar));
    conferirFechadoELiberado(320);
    expect(botao()).toHaveFocus();
  });

  it('2) tecla Esc: fecha e devolve o foco ao botão', async () => {
    const usuario = await abrir(480);
    await usuario.keyboard('{Escape}');
    conferirFechadoELiberado(480);
    expect(botao()).toHaveFocus();
  });

  it('3) clique fora do painel (camada abaixo do cabeçalho): fecha e devolve o foco', async () => {
    await abrir(200);
    const painel = painelDe(botao(pt.menu.fechar));
    const camada = painel.previousElementSibling;
    expect(camada).toHaveAttribute('aria-hidden', 'true');
    expect(camada?.tagName).toBe('DIV');
    fireEvent.click(camada as Element);
    conferirFechadoELiberado(200);
    expect(botao()).toHaveFocus();
    expect(painel.previousElementSibling?.getAttribute('aria-hidden')).not.toBe('true');
  });

  it('4) clique num link: destrava ANTES e depois chama a rolagem do F-13 (scrollToSection)', async () => {
    const usuario = await abrir(900);
    const noMomento: { position: string; mainInerte: boolean }[] = [];
    rolagem.scrollToSection.mockImplementation(() => {
      noMomento.push({
        position: document.body.style.position,
        mainInerte: document.querySelector('main')?.hasAttribute('inert') ?? true,
      });
    });
    const link = within(painelDe(botao(pt.menu.fechar))).getByRole('link', {
      name: pt.nav.sobre,
    });
    await usuario.click(link);
    expect(rolagem.scrollToSection).toHaveBeenCalledWith('sobre');
    expect(noMomento).toEqual([{ position: '', mainInerte: false }]);
    conferirFechadoELiberado(900);
    rolagem.scrollToSection.mockReset();
  });

  it('5) redimensionar para ≥ 1024 px: o menu fecha, o botão some e a página é liberada', async () => {
    await abrir(150);
    redimensionar(false);
    expect(screen.queryByRole('button', { name: pt.menu.fechar })).toBeNull();
    expect(document.querySelector('[data-open]')).toBeNull();
    expect(document.body.style.position).toBe('');
    expect(document.querySelector('main')).not.toHaveAttribute('inert');
    expect(scrollToEspiao()).toHaveBeenCalledWith({ top: 150, left: 0, behavior: 'instant' });
    redimensionar(true);
    expect(botao()).toHaveAttribute('aria-expanded', 'false');
  });

  it('clique com Ctrl num link (nova aba) não intercepta nem fecha', async () => {
    await abrir();
    const link = within(painelDe(botao(pt.menu.fechar))).getByRole('link', {
      name: pt.nav.contato,
    });
    fireEvent.click(link, { ctrlKey: true });
    expect(rolagem.scrollToSection).not.toHaveBeenCalled();
    expect(botao(pt.menu.fechar)).toHaveAttribute('aria-expanded', 'true');
  });
});

describe('MobileMenu (S-02): foco preso', () => {
  it('Tab circula: 1º link → … → último link → botão X → 1º link; Shift+Tab volta', async () => {
    const usuario = userEvent.setup();
    montar();
    await usuario.click(botao());
    const x = botao(pt.menu.fechar);
    const links = linksDoPainel(painelDe(x));
    expect(links[0]).toHaveFocus();
    for (let i = 1; i < links.length; i++) {
      await usuario.tab();
      expect(links[i]).toHaveFocus();
    }
    await usuario.tab();
    expect(x).toHaveFocus();
    await usuario.tab();
    expect(links[0]).toHaveFocus();
    await usuario.tab({ shift: true });
    expect(x).toHaveFocus();
    await usuario.tab({ shift: true });
    expect(links[links.length - 1]).toHaveFocus();
  });

  it('o tema e a logo ficam fora do ciclo com o menu aberto', async () => {
    const usuario = userEvent.setup();
    montar();
    await usuario.click(botao());
    const tema = screen.getByRole('button', { name: pt.a11y.themeToDark });
    const logo = screen.getByRole('link', { name: pt.marca.aria });
    for (let i = 0; i < NAV_ITEMS.length + 2; i++) {
      await usuario.tab();
      expect(tema).not.toHaveFocus();
      expect(logo).not.toHaveFocus();
    }
  });

  it('Enter e Espaço no botão abrem e fecham (botão nativo)', async () => {
    const usuario = userEvent.setup();
    montar();
    botao().focus();
    await usuario.keyboard('{Enter}');
    expect(botao(pt.menu.fechar)).toHaveAttribute('aria-expanded', 'true');
    botao(pt.menu.fechar).focus();
    await usuario.keyboard(' ');
    expect(botao()).toHaveAttribute('aria-expanded', 'false');
  });
});

describe('MobileMenu (S-02): idioma e V1', () => {
  it('EN troca o rótulo do botão, do <nav> e dos links', async () => {
    const usuario = userEvent.setup();
    montar('en');
    await usuario.click(screen.getByRole('button', { name: en.menu.abrir }));
    const x = screen.getByRole('button', { name: en.menu.fechar });
    const painel = painelDe(x);
    expect(within(painel).getByRole('navigation', { name: en.menu.navAria })).toBeInTheDocument();
    expect(linksDoPainel(painel).map((l) => l.textContent)).toEqual(
      NAV_ITEMS.map((i) => en.nav[i.id]),
    );
  });

  it('V1: nenhum botão PT/EN dentro do painel (DS-20 ⏭ V2)', async () => {
    const usuario = userEvent.setup();
    montar();
    await usuario.click(botao());
    const painel = painelDe(botao(pt.menu.fechar));
    expect(within(painel).queryAllByRole('button')).toHaveLength(0);
    expect(screen.queryByText(/PT\s*\/\s*EN/)).toBeNull();
  });

  it('nenhum texto fixo no JSX nem id de seção escrito à mão (D5, D14)', () => {
    for (const arquivo of ['MobileMenu.tsx', 'MenuButton.tsx']) {
      const tsx = ler(`src/sections/Header/${arquivo}`).replace(/\/\/.*$/gm, '');
      expect(tsx).not.toMatch(/>\s*[A-Za-zÀ-ÿ0-9][^<{]*<\//);
      for (const item of NAV_ITEMS) expect(tsx).not.toMatch(new RegExp(`['"\`#]${item.id}['"\`]`));
    }
  });
});

describe('CSS do menu (S-02)', () => {
  const menu = ler('src/sections/Header/MobileMenu.module.css');
  const botaoCss = ler('src/sections/Header/MenuButton.module.css');

  it('sem transição própria (deslize, fade e X animado são do A-07) e sem hex', () => {
    for (const css of [menu, botaoCss]) {
      expect(css).not.toMatch(/transition|animation/);
      expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    }
  });

  it('painel fixo logo abaixo do cabeçalho, largura total, padding 24 pelo GlassPanel menu', () => {
    expect(menu).toMatch(/\.painel \{[^}]*position: fixed;/);
    expect(menu).toMatch(/\.painel \{[^}]*inset: var\(--header-height\) 0 auto;/);
    expect(menu).toMatch(/\.painel\[data-open='false'\] \{\s*visibility: hidden;/);
    const tsx = ler('src/sections/Header/MobileMenu.tsx');
    expect(tsx).toMatch(/<GlassPanel variant="menu" padding="md"/);
  });

  it('links 20 px com 56 px de altura e divisória de 1 px da borda do tema', () => {
    expect(menu).toMatch(/\.link \{[^}]*min-height: 56px;/);
    expect(menu).toMatch(/\.link \{[^}]*font-size: var\(--fs-nav-mobile\);/);
    expect(menu).toMatch(
      /\.item \+ \.item \{\s*border-top: var\(--border-width\) solid var\(--color-border\);/,
    );
    expect(menu).toMatch(
      /\.link\[aria-current='location'\] \{[^}]*color: var\(--color-link\);[^}]*font-weight: var\(--fw-nav-active\);/,
    );
  });

  it('botão 44 × 44, linhas 20 × 2 na cor do texto, X com data-open e hover --color-fill-soft', () => {
    expect(botaoCss).toMatch(
      /\.botao \{[^}]*width: var\(--touch-min\);[^}]*height: var\(--touch-min\);/,
    );
    expect(botaoCss).toMatch(/\.botao \{[^}]*color: var\(--color-text\);/);
    expect(botaoCss).toMatch(/\.linha \{[^}]*width: 20px;[^}]*height: 2px;/);
    expect(botaoCss).toMatch(/\.botao\[data-open='true'\] \.linha:nth-child\(1\) \{\s*transform:/);
    expect(botaoCss).toMatch(/\.botao\[data-open='true'\] \.linha:nth-child\(2\) \{\s*opacity: 0;/);
    expect(botaoCss).toMatch(/\.botao:hover \{\s*background-color: var\(--color-fill-soft\);/);
  });
});
