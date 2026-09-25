// Tabela de tokens do /__styleguide (DS-05). Dois modos:
// - `tema`: amostra, token, valor claro, valor escuro e valor computado no tema atual (§4.1);
// - `simples`: token, valor declarado na base (celular) e valor computado agora (faixa atual).
// O valor computado é preenchido depois do render por `atualizarMedicoes` (medir.ts), que o
// Styleguide chama a cada troca de tema, idioma, largura ou movimento reduzido.
import type { CSSProperties } from 'react';
import type { Theme } from '@/theme/constants';
import { medidaDoToken, type TokenDeTema, type TokenSimples } from './dados';
import styles from './Styleguide.module.css';
import { TEXTOS } from './textos';

type TokenTableProps =
  | { modo: 'tema'; tokens: readonly TokenDeTema[]; tema: Theme; titulo: string }
  | { modo: 'simples'; tokens: readonly TokenSimples[]; titulo: string };

function estiloDaAmostra(nome: string, valorDeReferencia: string): CSSProperties | null {
  const medida = medidaDoToken(nome, valorDeReferencia);
  if (medida === 'background-color') return { backgroundColor: `var(${nome})` };
  if (medida === 'background-image') return { backgroundImage: `var(${nome})` };
  if (medida === 'box-shadow') return { boxShadow: `var(${nome})` };
  return null;
}

export function TokenTable(props: TokenTableProps) {
  const { colunas } = TEXTOS;

  if (props.modo === 'simples') {
    return (
      <table className={styles.tabela} data-modo="simples">
        <caption className="visually-hidden">{props.titulo}</caption>
        <thead>
          <tr>
            <th scope="col">{colunas.token}</th>
            <th scope="col">{colunas.valor}</th>
            <th scope="col">{colunas.computado}</th>
          </tr>
        </thead>
        <tbody>
          {props.tokens.map(({ nome, valor }) => (
            <tr key={nome} data-linha-token={nome}>
              <th scope="row" data-rotulo={colunas.token}>
                <code>{nome}</code>
              </th>
              <td data-rotulo={colunas.valor}>
                <code>{valor}</code>
              </td>
              <td data-rotulo={colunas.computado}>
                <output className={styles.computado} data-token={nome} data-medida="valor" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  const { tema } = props;
  return (
    <table className={styles.tabela} data-modo="tema">
      <caption className="visually-hidden">{props.titulo}</caption>
      <thead>
        <tr>
          <th scope="col">
            <span className="visually-hidden">{colunas.amostra}</span>
          </th>
          <th scope="col">{colunas.token}</th>
          <th scope="col">{colunas.claro}</th>
          <th scope="col">{colunas.escuro}</th>
          <th scope="col">{colunas.computado}</th>
        </tr>
      </thead>
      <tbody>
        {props.tokens.map(({ nome, claro, escuro }) => {
          const amostra = estiloDaAmostra(nome, claro);
          return (
            <tr key={nome} data-linha-token={nome}>
              <td className={styles.celulaAmostra}>
                <span className={styles.xadrez} aria-hidden="true">
                  {amostra ? <span className={styles.amostra} style={amostra} /> : null}
                </span>
              </td>
              <th scope="row" data-rotulo={colunas.token}>
                <code>{nome}</code>
              </th>
              <td
                data-rotulo={colunas.claro}
                data-valor-claro={claro}
                data-ativo={tema === 'light' ? '' : undefined}
              >
                <code>{claro}</code>
              </td>
              <td
                data-rotulo={colunas.escuro}
                data-valor-escuro={escuro}
                data-ativo={tema === 'dark' ? '' : undefined}
              >
                <code>{escuro}</code>
              </td>
              <td data-rotulo={colunas.computado}>
                <output
                  className={styles.computado}
                  data-token={nome}
                  data-medida={medidaDoToken(nome, claro)}
                />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
