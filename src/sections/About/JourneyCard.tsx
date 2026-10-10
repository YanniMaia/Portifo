// Cartão "Minha trajetória" (S-07; doc de design §7.5, §3.4; doc 05 Anexo A.6; D11).
//
// - `Card` do DS-15 (variante padrão: superfície, borda 1 px, raio 24, sombra de repouso, padding
//   32/28/24) com H3 (`sobre.trajetoria.titulo`).
// - Marcos = a lista de strings `sobre.trajetoria.marcos`, na ordem. O estado vem só da POSIÇÃO
//   (Anexo A.6): posições 0 e 1 = bolinha preenchida; a última (posição 2, "próximo passo") =
//   bolinha vazada com borda tracejada. Não há campo de estado no conteúdo.
// - Linha vertical de 2 px (`--gradient-timeline`) ligando as bolinhas de 14 px (CSS).
// - Ano: um único valor, `sobre.trajetoria.ano` (hoje o placeholder `[ano]`, PH-04 ×3). Em DEV
//   aparece antes do texto de cada marco, marcado pelo `PlaceholderMark` (DS-21: 13 px mono,
//   `--color-text-pink-on-tint`); em produção não aparece nada. Nenhuma data inventada.
// - Sem marcos, o cartão não é renderizado (quem monta decide o layout).
import { Card } from '@/components/Card';
import { PlaceholderMark } from '@/components/PlaceholderMark';
import { resolveOptional } from '@/lib/placeholder';
import styles from './JourneyCard.module.css';

/** Estado visual pela posição: o último marco é o próximo passo (Anexo A.6). */
type EstadoDoMarco = 'feito' | 'proximo';

function estadoPelaPosicao(indice: number, total: number): EstadoDoMarco {
  return indice === total - 1 && total > 1 ? 'proximo' : 'feito';
}

export interface JourneyCardProps {
  titulo: string;
  marcos: readonly string[];
  ano?: string;
  /** Id do H3 (nome acessível da lista). */
  idTitulo: string;
}

export function JourneyCard({ titulo, marcos, ano, idTitulo }: JourneyCardProps) {
  const anoVisivel = resolveOptional(ano);
  if (marcos.length === 0) return null;

  return (
    <Card className={styles.cartao}>
      <h3 id={idTitulo} className={`t-h3 ${styles.titulo}`}>
        {titulo}
      </h3>
      <ol className={styles.marcos} aria-labelledby={idTitulo}>
        {marcos.map((marco, i) => (
          <li
            key={marco}
            className={styles.marco}
            data-estado={estadoPelaPosicao(i, marcos.length)}
          >
            {anoVisivel ? (
              <>
                <PlaceholderMark value={anoVisivel} />{' '}
              </>
            ) : null}
            {marco}
          </li>
        ))}
      </ol>
    </Card>
  );
}
