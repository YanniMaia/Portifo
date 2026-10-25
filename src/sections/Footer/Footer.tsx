// Rodapé (S-16; doc de design §7.12, §15, §11; referencia/DESIGN.md DV-2; D11, D13, D14, D22).
//
// - `<footer>` semântico, FORA do registro de seções (F-12): não usa o `Section` (DS-10), que é só
//   para `<section>` com id de âncora (comentário do próprio `sections.ts`).
// - 3 colunas (desktop): (1) `Monogram` 36 px (DS-18, decorativo) + nome + frase curta, sem link —
//   o monograma do rodapé NÃO volta ao topo (isso é só o botão "Voltar ao topo ↑" da linha final);
//   (2) "Links rápidos": os 6 `NAV_ITEMS` do registro único (F-12), mesmo padrão de âncora do
//   cabeçalho (`eCliqueSimples` + `scrollToSection`, F-13); (3) "Social": 3 ícones circulares
//   44 × 44 (LinkedIn, GitHub externos; E-mail `mailto:`), cada um "sem link, sem botão" (D11) via
//   `isPlaceholder` nas URLs/e-mail de `site` (C-04).
// - Título das colunas 2 e 3 em caixa alta: o teste global `tests/unit/styles/typography.test.ts`
//   só permite `text-transform: uppercase` na classe `.t-eyebrow` do projeto inteiro. Em vez de
//   criar uma 2ª regra de caixa alta (proibido) ou "fingir" caixa alta no texto do dicionário
//   (inventaria conteúdo), este rodapé reaproveita o `Eyebrow` (DS-09) já autorizado a usar
//   `.t-eyebrow`: 13 px (desktop) em vez dos 14 px do doc — dentro da tolerância de ± 1 px do V-00
//   (doc 08 §4.6). Conflito registrado no diário (`plano/checkpoints/S-16.md`).
// - Linha final (DV-2): © à esquerda; à direita, nesta ordem, "Feito por Yanni Elyssa" e depois o
//   botão "Voltar ao topo ↑", com 24 px entre os dois (`--space-6`, medido no CSS, não por acaso).
//   O "Voltar ao topo" é a mesma rolagem do logo do cabeçalho (`scrollToTop`, F-13): ela já move o
//   foco para o H1 do hero, então nada é duplicado aqui.
// - O ano "2026" vem de `dict.rodape.copyright` (nunca de `new Date()`).
// - Sem texto fixo (D5): todo texto vem do dicionário (C-02) ou de `site`/`NAV_ITEMS` (C-04/F-12).
import { Mail, type LucideIcon } from 'lucide-react';
import type { MouseEvent } from 'react';
import { Container } from '@/components/Container';
import { Eyebrow } from '@/components/Eyebrow';
import { Github, Icon, Linkedin } from '@/components/Icon';
import { Monogram } from '@/components/Monogram';
import { NAV_ITEMS, SECTION_IDS, type NavItem } from '@/content/sections';
import { site } from '@/content/site';
import { useLanguage } from '@/i18n/useLanguage';
import { isPlaceholder } from '@/lib/placeholder';
import { scrollToSection, scrollToTop } from '@/lib/scroll';
import { eCliqueSimples } from '../Header/navegacao';
import styles from './Footer.module.css';

/** Destino do botão "Voltar ao topo ↑": a 1ª seção do registro (F-12), sem id escrito à mão. */
const ID_DO_TOPO = SECTION_IDS[0];

interface RedeSocial {
  href: string | undefined;
  external: boolean;
  icon: LucideIcon;
  label: string;
}

export function Footer() {
  const { dict } = useLanguage();
  const d = dict.rodape;

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

  // URLs/e-mail de `site` (C-04): "sem link, sem botão" (D11) — cada ícone só existe se o valor
  // existir e não for placeholder (`isPlaceholder`, F-15), igual ao `ButtonLink` (DS-11).
  const redes: RedeSocial[] = [
    { href: site.linkedin, external: true, icon: Linkedin, label: d.social.linkedinAria },
    { href: site.github, external: true, icon: Github, label: d.social.githubAria },
    { href: site.mailto, external: false, icon: Mail, label: d.social.emailAria },
  ];

  return (
    <footer className={styles.rodape}>
      <Container>
        <div className={styles.colunas}>
          <div className={styles.marca}>
            <div className={styles.marcaLinha}>
              <Monogram size="sm" initials={site.iniciais} />
              <span className={styles.marcaNome}>{dict.marca.nome}</span>
            </div>
            <p className={styles.frase}>{d.frase}</p>
          </div>

          <div className={styles.coluna}>
            <Eyebrow as="p">{d.linksRapidos}</Eyebrow>
            <nav aria-label={d.navAria}>
              <ul className={styles.listaLinks}>
                {NAV_ITEMS.map((item) => (
                  <li key={item.id}>
                    <a href={`#${item.id}`} className={styles.link} onClick={irPara(item)}>
                      {dict.nav[item.id]}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div className={styles.coluna}>
            <Eyebrow as="p">{d.socialTitulo}</Eyebrow>
            <div className={styles.social}>
              {redes.map((rede) => {
                if (rede.href === undefined || isPlaceholder(rede.href)) return null;
                const novaAba = rede.external
                  ? ({ target: '_blank', rel: 'noopener noreferrer' } as const)
                  : {};
                const rotulo = rede.external
                  ? `${rede.label} (${dict.a11y.opensInNewTab})`
                  : rede.label;
                return (
                  <a
                    key={rede.label}
                    href={rede.href}
                    className={styles.socialLink}
                    aria-label={rotulo}
                    {...novaAba}
                  >
                    <Icon icon={rede.icon} size={20} />
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        <div className={styles.final}>
          <p className={styles.copyright}>{d.copyright}</p>
          <div className={styles.acoesFinais}>
            <span className={styles.feitoPor}>{d.feitoPor}</span>
            <a href={`#${ID_DO_TOPO}`} className={styles.voltarTopo} onClick={irAoTopo}>
              {d.voltarTopo}
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
}
