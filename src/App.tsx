// App shell semântico (F-14; doc de design §11 e §2). Ordem fixa:
// SkipLink → <header> (slot do Header, doc 03) → <main id="conteudo"> com as 10 seções → <footer>
// (slot do Footer, doc 03). O S-17 troca os stubs pelas seções reais, com os MESMOS ids.
// Ids e ordem das seções vêm só do registro da F-12 (`SECTIONS`); nenhum id escrito aqui.
import { useEffect } from 'react';
import { MAIN_CONTENT_ID, SkipLink } from '@/components/SkipLink';
import { SECTIONS } from '@/content/sections';
import { SHOW_PLACEHOLDERS } from '@/lib/flags';
import { scrollToInitialHash } from '@/lib/scroll';
import styles from './App.module.css';

function App() {
  // Abertura com hash (`./#contato`): rola até a seção depois do primeiro render (F-13, passo 3).
  // A limpeza cancela o reajuste em `document.fonts.ready` (StrictMode monta duas vezes).
  useEffect(() => scrollToInitialHash(), []);

  return (
    <>
      <SkipLink />
      <header />
      <main id={MAIN_CONTENT_ID} tabIndex={-1} className={styles.main}>
        {SECTIONS.map(({ id }) => (
          // Stub sem título: sem `aria-labelledby` (apontaria para um elemento inexistente).
          // O id só aparece como texto em dev (D11); em produção a seção fica vazia.
          <section key={id} id={id} className={styles.stub}>
            {SHOW_PLACEHOLDERS ? id : null}
          </section>
        ))}
      </main>
      <footer />
    </>
  );
}

export default App;
