// Fundo decorativo por seção (A-19; doc de design §3.4, §6, §7.2, §7.11, §8, §10; doc 04 §5 e a
// task A-19 (§6.2); referencia/DESIGN.md DV-9, DV-10).
//
// ESCOPO DA V1 (doc 09 §2: "A A-19 vale só com grade, brilhos e constelações"): só as variantes
// `hero` e `contato` existem aqui, montando só os componentes A-base já prontos — grade (A-12,
// `GridBackdrop`) e constelações (A-14, `Constellation`) — e os tokens de brilho do DS-01
// (`--hero-glow-1/2`, `--glow-deco`). NÃO existem nesta rodada (adiadas para a V2, doc 09 §1):
// partículas (A-13), linhas de código/bits (A-15) e marca-d'água/formas geométricas (A-16) — por
// isso as variantes `interesses`/`objetivos` (que dependeriam da marca-d'água do A-16) também não
// existem aqui ainda. `VARIANTES` é um `Record` por `variant` (não um `switch` solto) para a V2
// acrescentar `interesses`/`objetivos` sem reescrever esta estrutura. Ver `plano/checkpoints/A-19.md`.
//
// Z-INDEX/OVERFLOW: o Hero e o Contact já colocam esta camada dentro de um contêiner próprio
// (a classe `.backdrop` de cada um) com `position: absolute; inset: 0; z-index: 0; overflow:
// hidden; pointer-events: none;` — o conteúdo da seção fica em `z-index: 1` (D14: quem é dono
// dessas regras é o S-03/S-15, não esta task; confirmado lendo `Hero.module.css`/
// `Contact.module.css`, que já existiam assim antes desta task). Por isso `.camada` abaixo NÃO
// repete `z-index` (não há nenhum irmão dentro do `.backdrop` do pai para disputar pilha). Repete
// só `position: absolute; inset: 0; overflow: hidden; pointer-events: none` para o componente
// continuar funcionando sozinho, se um dia for montado fora desse wrapper (ex. um teste isolado).
//
// BRILHOS DO HERO: `--hero-glow-1` (640 px de diâmetro: `circle 320px`) e `--hero-glow-2` (480 px:
// `circle 240px`) já são pintados DIRETO no `background-image` de `section.hero` (ver o comentário
// "Fundo" em `Hero.module.css`), FORA da prop `backdrop` — decisão do S-03, anterior a esta task
// (confirmada lendo o arquivo real, não só o comentário do `Hero.tsx`). Por isso a variante `hero`
// abaixo NÃO cria divs de brilho: duplicar pintaria os dois brilhos duas vezes (contra D14, "um
// dono por artefato"). A variante `contato` cria os 2 brilhos de `--glow-deco`, porque
// `Contact.module.css` (confirmado lendo) não tinha nenhum brilho próprio antes desta task.
//
// CROSSFADE DE TEMA: o texto da task A-19 (doc 04) pede que os brilhos "façam crossfade de
// opacity" na troca de tema. Essa animação é dona da A-09 (Transição de tema, ⏭ V2, doc 09 §1),
// que DEPENDE desta A-19 — não o contrário. Nesta rodada a troca de tema é instantânea: os tokens
// de cor já mudam nos dois temas via `[data-theme='dark']` (DS-01, `colors.css`), sem transição. A
// A-09 anima essa troca depois, na V2.
import type { ReactNode } from 'react';
import { Constellation, CONSTELACOES } from '@/components/decor/Constellation';
import { GridBackdrop } from '@/components/decor/GridBackdrop';
import styles from './SectionBackdrop.module.css';

export type SectionBackdropVariant = 'hero' | 'contato';

/**
 * `hero`: grade (A-12) centrada na composição visual (não no hero inteiro — o `HeroVisual` fica
 * na coluna direita a partir de 1024 px e embaixo do texto, centralizado, abaixo disso; como o
 * `GridBackdrop` não tem posição responsiva própria (o `center`/`radius` são um valor CSS fixo, e
 * uma média query não vence o `style` inline sem `!important`), o centro escolhido (64% 48%) é uma
 * aproximação única que funciona nos dois layouts, sem criar essa exceção; não há critério de
 * aceite que meça a posição exata do centro da grade, só a atenuação radial em si — já coberta
 * pelo spec do A-12) e com `bleed` (§10: a partir de 1440 px a grade do hero chega às bordas da
 * janela). As 2 constelações do A-14 ficam nos cantos opostos dos 2 brilhos que o `Hero.module.css`
 * já pinta (brilho 1 no canto superior direito, brilho 2 no inferior esquerdo): por isso as
 * constelações vão no superior esquerdo e no inferior direito, para espalhar a decoração pelos 4
 * cantos sem acumular em 2.
 */
function VarianteHero(): ReactNode {
  return (
    <>
      <GridBackdrop center="64% 48%" radius={420} bleed />
      <Constellation
        desenho={CONSTELACOES.heroSuperiorEsquerdo}
        className={styles.cantoSuperiorEsquerdo}
      />
      <Constellation
        desenho={CONSTELACOES.heroInferiorDireito}
        className={styles.cantoInferiorDireito}
      />
    </>
  );
}

/**
 * `contato`: grade (A-12) mais sutil que a do hero (raio 220, sem `bleed`: o painel tem no máximo
 * 1000 px, então a grade não precisa alcançar a borda da janela) e os 2 brilhos de `--glow-deco`
 * (círculo de 280 px — dentro de 240–320 px — com `filter: blur(100px)` — dentro de 80–120 px),
 * um no canto superior esquerdo e outro no inferior direito. As 2 constelações do A-14 ficam no
 * superior direito e no inferior esquerdo: a mesma lógica de espalhar pelos 4 cantos da variante
 * `hero`, aqui dentro dos limites do painel (que tem `overflow: hidden` e cantos arredondados de
 * 32 px, `Contact.module.css`).
 */
function VarianteContato(): ReactNode {
  return (
    <>
      <GridBackdrop center="50% 50%" radius={220} />
      <div
        className={`${styles.glow} ${styles.glowSuperiorEsquerdo}`}
        aria-hidden="true"
        data-decor="glow"
      />
      <div
        className={`${styles.glow} ${styles.glowInferiorDireito}`}
        aria-hidden="true"
        data-decor="glow"
      />
      <Constellation
        desenho={CONSTELACOES.contatoSuperiorDireito}
        className={styles.cantoSuperiorDireito}
      />
      <Constellation
        desenho={CONSTELACOES.contatoInferiorEsquerdo}
        className={styles.cantoInferiorEsquerdo}
      />
    </>
  );
}

const VARIANTES: Record<SectionBackdropVariant, () => ReactNode> = {
  hero: VarianteHero,
  contato: VarianteContato,
};

export interface SectionBackdropProps {
  /** Só `hero` e `contato` nesta rodada (V1, doc 09 §2). */
  variant: SectionBackdropVariant;
}

export function SectionBackdrop({ variant }: SectionBackdropProps) {
  const Conteudo = VARIANTES[variant];
  return (
    <div className={styles.camada} aria-hidden="true" data-section-backdrop={variant}>
      <Conteudo />
    </div>
  );
}
