// App shell semântico (F-14; doc de design §11 e §2). Ordem fixa:
// SkipLink → Header (<header>) → <main id="conteudo"> com as 10 seções → Footer (<footer>).
// O S-17 trocou os stubs da F-14 pelas seções reais, com os MESMOS ids (vindos de cada seção,
// nunca escritos aqui).
// A-19 (D14: esta task só acrescenta as props `backdrop`): Hero e Contact recebem
// `<SectionBackdrop variant="…" />`. Interests/Goals NÃO recebem `backdrop` nesta rodada — a
// variante delas dependeria da marca-d'água do A-16 (⏭ V2, doc 09 §1); ver `plano/checkpoints/
// A-19.md`. As duas seções já funcionam sem a prop (contrato do doc 04 §4.4).
import { useEffect } from 'react';
import { SectionBackdrop } from '@/components/decor/SectionBackdrop';
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
        <Hero backdrop={<SectionBackdrop variant="hero" />} />
        <Highlights />
        <Motto />
        <About />
        <Interests />
        <Skills />
        <Projects />
        <Education />
        <Goals />
        <Contact backdrop={<SectionBackdrop variant="contato" />} />
      </main>
      <Footer />
    </>
  );
}

export default App;
