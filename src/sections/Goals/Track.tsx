// Uma trilha de "Onde quero chegar" (S-14; doc de design §7.10, §3.4; DESIGN.md DV-11; D13).
//
// - `GlassPanel` (DS-17, variante padrão): vidro, raio 24 (padrão da variante), padding próprio
//   (`--card-padding`, 32/28/24) em vez do padding fixo do componente (`padding="none"` é o próprio
//   padrão do `GlassPanel`, então não precisa ser repassado).
// - Coluna da esquerda (`.cabecalho`): `IconBox` de 56 px (DS-16, tamanho padrão do componente) +
//   o rótulo "Trilha N" (`objetivos.trilhaRotulo`, vindo do `Goals.tsx`) + o nome da trilha (H3,
//   CC-10). No desktop (≥ 1024 px, DV-11) vira uma coluna fixa de 140 px à esquerda das etapas; no
//   celular e no tablet (< 1024 px — decisão de layout no diário da task) fica em cima, em linha.
// - Etapas (`<ol aria-label={nome}>`, C-02): pílulas de 44 px (`.pilula`); a 1ª etapa de cada
//   trilha recebe `data-primeira="true"` e a classe `.primeira` (`--gradient-primary`, D13).
// - Cada etapa é um `<li>` com a pílula (gancho `data-stagger-item`, A-03) e, se não for a última,
//   um conector decorativo (`aria-hidden`, gancho `data-draw="trail"`, A-05) com a ponta de seta
//   (`data-draw-tip`). Nada aqui é focável: nenhum `<button>`/`<a>`/`tabIndex`.
// - Gancho do A-03: a própria `<ol>` recebe `data-stagger="steps"`.
import type { LucideIcon } from 'lucide-react';
import { GlassPanel } from '@/components/GlassPanel';
import { IconBox } from '@/components/IconBox';
import styles from './Track.module.css';

export interface TrackProps {
  /** Ícone da trilha (mapa fixo do `Goals.tsx`: Dados = `Database`, Cibersegurança = `Shield`,
   * IA = `BrainCircuit`, índice §3). */
  icone: LucideIcon;
  /** Rótulo "Trilha N" / "Track N", já formatado por `objetivos.trilhaRotulo` (C-02). */
  rotulo: string;
  /** Nome da trilha (`objetivos.trilha*.nome`, C-02). Nomeia a `<ol>` das etapas. */
  nome: string;
  /** Etapas da trilha, na ordem (`objetivos.trilha*.etapas`, C-02). */
  etapas: readonly string[];
}

export function Track({ icone, rotulo, nome, etapas }: TrackProps) {
  return (
    <GlassPanel className={styles.painel}>
      <div className={styles.cabecalho}>
        <IconBox icon={icone} />
        <div className={styles.textos}>
          <p className={styles.rotulo}>{rotulo}</p>
          <h3 className={`t-h3 ${styles.nome}`}>{nome}</h3>
        </div>
      </div>
      <ol className={styles.etapas} aria-label={nome} data-stagger="steps">
        {etapas.map((etapa, indice) => {
          const primeira = indice === 0;
          const temConector = indice < etapas.length - 1;
          const classePilula = [styles.pilula, primeira && styles.primeira]
            .filter(Boolean)
            .join(' ');
          return (
            <li key={indice} className={styles.item}>
              <span
                className={classePilula}
                data-stagger-item=""
                data-primeira={primeira ? 'true' : undefined}
              >
                {etapa}
              </span>
              {temConector ? (
                <span className={styles.conector} aria-hidden="true" data-draw="trail">
                  <span className={styles.seta} data-draw-tip="" />
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </GlassPanel>
  );
}
