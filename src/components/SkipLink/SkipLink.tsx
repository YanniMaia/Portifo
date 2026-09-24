// "Pular para o conteúdo" (F-14, D14; doc de design §11). ÚNICO SkipLink do site: o S-01 não cria
// outro. Precisa ser o primeiro elemento focável do <body> (o App o monta antes do cabeçalho).
// Leva ao `<main id="conteudo" tabIndex={-1}>`; o navegador move o foco para o alvo do hash.
// Texto do dicionário (`a11y.skipToContent`), nunca literal (D5).
import { useLanguage } from '@/i18n/useLanguage';
import styles from './SkipLink.module.css';

/** Id do `<main>` de destino. O App usa o mesmo valor no `<main>`. */
export const MAIN_CONTENT_ID = 'conteudo';

export function SkipLink() {
  const { dict } = useLanguage();
  return (
    <a className={styles.skipLink} href={`#${MAIN_CONTENT_ID}`}>
      {dict.a11y.skipToContent}
    </a>
  );
}
