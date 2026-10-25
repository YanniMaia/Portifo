// App shell semântico (F-14; doc de design §11 e §2). Ordem fixa:
// SkipLink → Header (<header>) → <main id="conteudo"> com as 10 seções → Footer (<footer>).
// O S-17 troca os stubs da F-14 pelas seções reais, com os MESMOS ids (vindos de cada seção,
// nunca escritos aqui). Nenhuma seção recebe `backdrop`: a A-integração ainda não existe (D15).
import { useEffect } from 'react';
import { MAIN_CONTENT_ID, SkipLink } from '@/components/SkipLink';
import { About } from '@/sections/About/About';
import { Contact } from '@/sections/Contact/Contact';
import { Education } from '@/sections/Education/Education';
import { Footer } from '@/sections/Footer/Footer';
import { Goals } from '@/sections/Goals/Goals';
import { Header } from '@/sections/Header/Header';
import { Hero } from '@/sections/Hero/Hero';
import { Highlights } from '@/sections/Highlights/Highlights';
import { Interests } from '@/sections/Interests/Interests';
import { Motto } from '@/sections/Motto/Motto';
import { Projects } from '@/sections/Projects/Projects';
import { Skills } from '@/sections/Skills/Skills';
import { scrollToInitialHash } from '@/lib/scroll';
import styles from './App.module.css';

function App() {
  // Abertura com hash (`./#contato`): rola até a seção depois do primeiro render (F-13, passo 3).
  // A limpeza cancela o reajuste em `document.fonts.ready` (StrictMode monta duas vezes).
  useEffect(() => scrollToInitialHash(), []);

  return (
    <>
      <SkipLink />
      <Header />
      <main id={MAIN_CONTENT_ID} tabIndex={-1} className={styles.main}>
        <Hero />
        <Highlights />
        <Motto />
        <About />
        <Interests />
        <Skills />
        <Projects />
        <Education />
        <Goals />
        <Contact />
      </main>
      <Footer />
    </>
  );
}

export default App;
