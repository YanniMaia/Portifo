// Cabeçalho fixo e menu desktop (S-01; doc de design §7.1, §5, §6, §9; DV-12; D13, D14).
//
// - `<header>` fixo, largura total, vidro do DS-17 (`GlassPanel variant="header"`): branco 80% /
//   #150A10 75%, desfoque 14 px e borda inferior 1 px. Altura 72/68/64 px (`--header-height`).
// - Esquerda: link para `#inicio` com o `Monogram` 36 px (DS-18, decorativo) + o nome. O clique
//   simples chama `scrollToTop` (F-13), que limpa o hash e foca o H1 do hero.
// - `<nav>` com os 6 itens de `NAV_ITEMS` (F-12), rótulos de `nav.*` (C-02). O clique simples chama
//   `scrollToSection` (F-13): rola com o offset de 80 px, grava `#id` e foca o H2 da seção.
// - Item ativo pelo `useActiveSection` (F-12): `aria-current="location"` + `data-active` (gancho do
//   doc 04 §4.4, lido pelo A-07). `#objetivos` mantém "Formação" ativo; no hero e na faixa, nenhum.
// - Estado "rolado": `data-scrolled="true|false"` no `<header>` (gancho do doc 04 §4.4), ligado
//   quando `scrollY > 8`. A sombra é a camada `::after` do GlassPanel, acesa por `opacity`.
// - V1 (doc 09): sem `LanguageToggle` (DS-20 ⏭ V2). À direita só o `ThemeToggle` (DS-19) e,
//   abaixo de 1024 px, o hambúrguer do S-02 (tema primeiro, 8 px entre os dois).
// - Menu do celular e do tablet (S-02): `MenuButton` + `MobileMenu`, montados só abaixo de 1024 px
//   (`useMediaQuery`). Em ≥ 1024 px o botão e o painel não existem no DOM; passar de 1024 px com o
//   menu aberto fecha o menu (o painel desmonta e libera a página). O painel é irmão do `<header>`,
//   e não filho: o `backdrop-filter` do cabeçalho prenderia o `position: fixed` e o desfoque dele.
// - Sem texto fixo (D5): rótulos e `aria-label` vêm do dicionário; as iniciais, de `site`.
import { useCallback, useEffect, useId, useRef, useState, type MouseEvent } from 'react';
import { Container } from '@/components/Container';
import { GlassPanel } from '@/components/GlassPanel';
import { Monogram } from '@/components/Monogram';
import { ThemeToggle } from '@/components/ThemeToggle';
import { NAV_ITEMS, SECTION_IDS, type NavItem } from '@/content/sections';
import { site } from '@/content/site';
import { useActiveSection } from '@/hooks/useActiveSection';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useLanguage } from '@/i18n/useLanguage';
import { scrollToSection, scrollToTop } from '@/lib/scroll';
import { TABLET_MAX } from '@/styles/breakpoints';
import { liberarPagina, posicaoTravada } from './bloqueioDaPagina';
import styles from './Header.module.css';
import { MenuButton } from './MenuButton';
import { MobileMenu } from './MobileMenu';
import { eCliqueSimples } from './navegacao';

/** Rolagem (px) a partir da qual o cabeçalho ganha a sombra (§7.1). */
const LIMITE_ROLADO_PX = 8;

/** Destino da logo: a primeira seção do registro (o hero, `#inicio`), sem id escrito à mão. */
const ID_DO_TOPO = SECTION_IDS[0];

/** Celular e tablet (abaixo de 1024 px, DS-02): hambúrguer no lugar dos links (§7.1, §10). */
const CONSULTA_COMPACTO = `(max-width: ${TABLET_MAX}px)`;

/**
 * `true` depois de 8 px de rolagem. Ouvinte passivo; o React ignora valores repetidos. Com o menu
 * aberto o `<body>` fica fixo e o `scrollY` real vale 0: vale a posição guardada pela trava.
 */
function useRolado(): boolean {
  const [rolado, setRolado] = useState(false);
  useEffect(() => {
    const atualizar = () => setRolado((posicaoTravada() ?? window.scrollY) > LIMITE_ROLADO_PX);
    atualizar();
    window.addEventListener('scroll', atualizar, { passive: true });
    return () => window.removeEventListener('scroll', atualizar);
  }, []);
  return rolado;
}

export function Header() {
  const { dict } = useLanguage();
  const ativo = useActiveSection();
  const rolado = useRolado();
  const compacto = useMediaQuery(CONSULTA_COMPACTO);
  const [aberto, setAberto] = useState(false);
  const botaoRef = useRef<HTMLButtonElement>(null);
  const idDoPainel = useId();

  // Passou para ≥ 1024 px com o menu aberto: fecha (ajuste de estado durante o render).
  if (aberto && !compacto) setAberto(false);

  /** X, Esc ou clique fora: fecha e devolve o foco ao botão. */
  const fechar = useCallback(() => {
    setAberto(false);
    botaoRef.current?.focus();
  }, []);

  const alternar = () => {
    if (aberto) fechar();
    else setAberto(true);
  };

  const irAoTopo = (evento: MouseEvent<HTMLAnchorElement>) => {
    if (!eCliqueSimples(evento)) return;
    evento.preventDefault();
    scrollToTop();
  };

  const irPara = (item: NavItem) => (evento: MouseEvent<HTMLAnchorElement>) => {
    if (!eCliqueSimples(evento)) return;
    evento.preventDefault();
    scrollToSection(item.id);
  };

  /** Link do painel: libera a página ANTES, fecha e só então rola (o foco vai para o H2, F-13). */
  const irPeloMenu = (item: NavItem) => (evento: MouseEvent<HTMLAnchorElement>) => {
    if (!eCliqueSimples(evento)) return;
    evento.preventDefault();
    liberarPagina();
    setAberto(false);
    scrollToSection(item.id);
  };

  return (
    <>
      <GlassPanel as="header" variant="header" scrolled={rolado} className={styles.bar}>
        <Container className={styles.inner}>
          <a
            href={`#${ID_DO_TOPO}`}
            className={styles.logo}
            aria-label={dict.marca.aria}
            onClick={irAoTopo}
          >
            <Monogram size="sm" initials={site.iniciais} />
            <span className={styles.nome}>{dict.marca.nome}</span>
          </a>

          <nav aria-label={dict.menu.navAria} className={styles.nav}>
            <ul className={styles.lista}>
              {NAV_ITEMS.map((item) => {
                const eAtivo = ativo === item.id;
                return (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className={styles.link}
                      aria-current={eAtivo ? 'location' : undefined}
                      data-active={eAtivo ? 'true' : undefined}
                      onClick={irPara(item)}
                    >
                      {dict.nav[item.id]}
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className={styles.acoes}>
            <ThemeToggle />
            {compacto ? (
              <MenuButton ref={botaoRef} aberto={aberto} controla={idDoPainel} onClick={alternar} />
            ) : null}
          </div>
        </Container>
      </GlassPanel>

      {compacto ? (
        <MobileMenu
          id={idDoPainel}
          aberto={aberto}
          ativo={ativo}
          botaoRef={botaoRef}
          onFechar={fechar}
          onLinkClick={irPeloMenu}
        />
      ) : null}
    </>
  );
}
