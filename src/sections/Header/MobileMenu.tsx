// Painel do menu do celular e do tablet (S-02; doc de design §7.1, §10, §11; DV-12; D14, D20).
//
// - Fica logo abaixo do cabeçalho, em largura total, com o vidro `menu` do DS-17 (branco 96% /
//   #150A10 96%, desfoque 14 px) e padding de 24 px. Os 6 links vêm de `NAV_ITEMS` (F-12), com os
//   rótulos `nav.*` (C-02). O item ativo repete o do S-01: `aria-current="location"` + `data-active`.
// - Aparece e some só por `data-open` (gancho do doc 04 §4.4): fechado, o painel continua no DOM,
//   invisível e `inert`, para o A-07 poder animar a entrada e a saída. O deslize de −8 px e o fade de
//   250 ms são do A-07; aqui a troca é imediata.
// - Aberto: trava a rolagem do fundo e deixa `main`/`footer` inertes (`bloquearPagina`); o foco vai
//   para o 1º link e fica preso entre o botão X e os links (Tab/Shift+Tab circulam). Esc e clique
//   na camada transparente abaixo do cabeçalho chamam `onFechar` (o `Header` devolve o foco ao
//   botão). Fechar por link é do `Header` (libera a página e chama a rolagem do F-13).
// - V1 (doc 09): sem o `LanguageToggle` no fim da lista (DS-20 ⏭ V2, DV-12 na V2).
// - Sem texto fixo (D5).
import { useEffect, useRef, type MouseEvent, type RefObject } from 'react';
import { GlassPanel } from '@/components/GlassPanel';
import { NAV_ITEMS, type NavItem, type NavTarget } from '@/content/sections';
import { useLanguage } from '@/i18n/useLanguage';
import { bloquearPagina, liberarPagina } from './bloqueioDaPagina';
import styles from './MobileMenu.module.css';

export interface MobileMenuProps {
  /** Id do painel (alvo do `aria-controls` do botão). */
  id: string;
  aberto: boolean;
  /** Item ativo (`useActiveSection`, F-12), ou `null` (hero e faixa). */
  ativo: NavTarget | null;
  /** Botão hambúrguer/X: faz parte do ciclo de foco com o menu aberto. */
  botaoRef: RefObject<HTMLButtonElement | null>;
  /** Fechar por Esc ou por clique fora do painel. */
  onFechar: () => void;
  /** Clique num link do painel (o `Header` fecha, libera a página e rola). */
  onLinkClick: (item: NavItem) => (evento: MouseEvent<HTMLAnchorElement>) => void;
}

/** Elementos que recebem foco dentro do painel (links e, na V2, o botão PT/EN). */
const FOCAVEIS = 'a[href], button:not([disabled])';

export function MobileMenu({
  id,
  aberto,
  ativo,
  botaoRef,
  onFechar,
  onLinkClick,
}: MobileMenuProps) {
  const { dict } = useLanguage();
  const painelRef = useRef<HTMLDivElement>(null);
  const camadaRef = useRef<HTMLDivElement>(null);

  // Abrir: trava o fundo e leva o foco ao 1º link. Fechar (ou desmontar, ao passar de 1024 px):
  // libera a página e volta à posição exata. A liberação é idempotente.
  useEffect(() => {
    if (!aberto) return;
    bloquearPagina();
    painelRef.current?.querySelector<HTMLElement>(FOCAVEIS)?.focus();
    return () => liberarPagina();
  }, [aberto]);

  // Esc fecha; Tab e Shift+Tab circulam entre o botão X e os itens do painel.
  useEffect(() => {
    if (!aberto) return;
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') {
        evento.preventDefault();
        onFechar();
        return;
      }
      if (evento.key !== 'Tab') return;
      const painel = painelRef.current;
      if (!painel) return;
      const ciclo = [botaoRef.current, ...painel.querySelectorAll<HTMLElement>(FOCAVEIS)].filter(
        (el): el is HTMLElement => el !== null,
      );
      if (ciclo.length === 0) return;
      const atual = ciclo.indexOf(document.activeElement as HTMLElement);
      const passo = evento.shiftKey ? -1 : 1;
      const proximo =
        atual === -1
          ? evento.shiftKey
            ? ciclo.length - 1
            : 0
          : (atual + passo + ciclo.length) % ciclo.length;
      evento.preventDefault();
      ciclo[proximo]?.focus();
    };
    document.addEventListener('keydown', aoTeclar);
    return () => document.removeEventListener('keydown', aoTeclar);
  }, [aberto, onFechar, botaoRef]);

  // Clique fora: a camada transparente cobre a tela abaixo do cabeçalho enquanto o menu está aberto.
  useEffect(() => {
    const camada = camadaRef.current;
    if (!aberto || !camada) return;
    camada.addEventListener('click', onFechar);
    return () => camada.removeEventListener('click', onFechar);
  }, [aberto, onFechar]);

  return (
    <>
      {aberto ? <div ref={camadaRef} className={styles.camada} aria-hidden="true" /> : null}
      <div
        ref={painelRef}
        id={id}
        className={styles.painel}
        data-open={String(aberto)}
        inert={!aberto}
      >
        <GlassPanel variant="menu" padding="md" className={styles.vidro}>
          <nav aria-label={dict.menu.navAria}>
            <ul className={styles.lista}>
              {NAV_ITEMS.map((item) => {
                const eAtivo = ativo === item.id;
                return (
                  <li key={item.id} className={styles.item}>
                    <a
                      href={`#${item.id}`}
                      className={styles.link}
                      aria-current={eAtivo ? 'location' : undefined}
                      data-active={eAtivo ? 'true' : undefined}
                      onClick={onLinkClick(item)}
                    >
                      {dict.nav[item.id]}
                    </a>
                  </li>
                );
              })}
            </ul>
          </nav>
        </GlassPanel>
      </div>
    </>
  );
}
