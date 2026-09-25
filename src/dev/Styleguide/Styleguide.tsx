// Página /__styleguide (DS-05; doc 02 §1 item 4). SÓ DESENVOLVIMENTO: o main.tsx carrega este
// módulo por `import()` dentro de `if (import.meta.env.DEV && …)`, e o ramo some do build.
// Gabarito visual: prancheta "Sistema visual" do canvas (plano/referencia/DESIGN.md).
//
// - Barra fixa: tema (useTheme, F-09), idioma (useLanguage, F-10), largura e faixa atuais (§4.3) e
//   "forçar movimento reduzido" (classe no <html> que zera --lift-*, --arrow-shift e animações).
// - Seções de tokens montadas a partir dos próprios .css (lidos com `?raw`): um token novo aparece
//   sozinho. Valores computados preenchidos por `atualizarMedicoes` (medir.ts).
// - Demos: todo `src/components/**/<Nome>.demo.tsx` com `export default` aparece sozinho, com
//   âncora `#<nome-em-kebab>` (ex.: `/__styleguide#button`). Não edite este arquivo para
//   acrescentar demo.
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentType,
} from 'react';
import { useLanguage } from '@/i18n/useLanguage';
import coresCss from '@/styles/tokens/colors.css?raw';
import formasCss from '@/styles/tokens/shape.css?raw';
import movimentoCss from '@/styles/tokens/motion.css?raw';
import espacamentoCss from '@/styles/tokens/spacing.css?raw';
import tipografiaTokensCss from '@/styles/tokens/typography.css?raw';
import tipografiaCss from '@/styles/typography.css?raw';
import { useTheme } from '@/theme/useTheme';
import {
  faixaDaLargura,
  lerClassesUtilitarias,
  lerTokensDeTema,
  lerTokensDoRoot,
  listarDemos,
  medidaDoToken,
} from './dados';
import { atualizarMedicoes } from './medir';
import styles from './Styleguide.module.css';
import { TEXTOS } from './textos';
import { TokenTable } from './TokenTable';

// Passo 4: descoberta automática das demos.
const MODULOS_DE_DEMO = import.meta.glob<{ default?: ComponentType }>(
  '/src/components/**/*.demo.tsx',
  { eager: true },
);
const DEMOS = listarDemos(MODULOS_DE_DEMO);

const TOKENS_DE_COR = lerTokensDeTema(coresCss);
const DEGRADES = TOKENS_DE_COR.filter((t) => medidaDoToken(t.nome, t.claro) === 'background-image');
const SOMBRAS = TOKENS_DE_COR.filter((t) => medidaDoToken(t.nome, t.claro) === 'box-shadow');

/** Superfícies translúcidas do §4.1 (fundo, desfoque, borda). Sem desfoque/borda: `null`. */
const VIDROS: readonly [fundo: string, desfoque: string | null, borda: string | null][] = [
  ['--glass-bg', '--glass-blur', '--glass-border'],
  ['--glass-bg-fallback', null, '--glass-border'],
  ['--header-bg', '--header-blur', '--header-border'],
  ['--mobile-menu-bg', null, null],
  ['--control-bg', null, '--control-border'],
];

const TOKENS_DE_ESPACO = lerTokensDoRoot(espacamentoCss);
const ESCALA = TOKENS_DE_ESPACO.filter((t) => t.nome.startsWith('--space-'));
const LAYOUT = TOKENS_DE_ESPACO.filter((t) => !t.nome.startsWith('--space-'));

const CLASSES_T = lerClassesUtilitarias(tipografiaCss);
const TOKENS_DE_TIPO = lerTokensDoRoot(tipografiaTokensCss);

const TOKENS_DE_FORMA = lerTokensDoRoot(formasCss);
const RAIOS = TOKENS_DE_FORMA.filter((t) => t.nome.startsWith('--radius-'));
const BORDAS = TOKENS_DE_FORMA.filter((t) => t.nome.startsWith('--border-width'));

const TOKENS_DE_MOVIMENTO = lerTokensDoRoot(movimentoCss);

/** Classe global do motion.css (DS-02) que zera --lift-* e --arrow-shift (D14: dono único). */
const CLASSE_TOKENS_REDUZIDOS = 'movimento-reduzido-forcado';

const PROPRIEDADES_DE_TIPO = 'font-size,font-weight,line-height,letter-spacing,font-family';

const SECOES = [
  { id: 'sg-cores', titulo: TEXTOS.secoes.cores },
  { id: 'sg-efeitos', titulo: TEXTOS.secoes.efeitos },
  { id: 'sg-tipografia', titulo: TEXTOS.secoes.tipografia },
  { id: 'sg-espacamento', titulo: TEXTOS.secoes.espacamento },
  { id: 'sg-formas', titulo: TEXTOS.secoes.formas },
  { id: 'sg-movimento', titulo: TEXTOS.secoes.movimento },
  { id: 'sg-demos', titulo: TEXTOS.secoes.demos },
] as const;

type SecaoId = (typeof SECOES)[number]['id'];

function titulo(id: SecaoId): string {
  return SECOES.find((s) => s.id === id)?.titulo ?? id;
}

// Largura da janela (a mesma das media queries), atualizada no `resize`.
function assinarResize(avisar: () => void): () => void {
  window.addEventListener('resize', avisar);
  return () => {
    window.removeEventListener('resize', avisar);
  };
}
const lerLargura = (): number => window.innerWidth;

function Saida({ token, medida }: { token: string; medida: string }) {
  return <output className={styles.computado} data-token={token} data-medida={medida} />;
}

export function Styleguide() {
  const { theme, toggleTheme } = useTheme();
  const { lang, dict, toggleLang } = useLanguage();
  const largura = useSyncExternalStore(assinarResize, lerLargura, () => 0);
  const faixa = faixaDaLargura(largura);
  const [reduzido, setReduzido] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);

  // Classe "forçar movimento reduzido" no <html> (antes da medição, que roda em seguida).
  useLayoutEffect(() => {
    const html = document.documentElement;
    const classes = [CLASSE_TOKENS_REDUZIDOS, styles.movimentoReduzido ?? ''].filter(Boolean);
    for (const classe of classes) html.classList.toggle(classe, reduzido);
    return () => {
      html.classList.remove(...classes);
    };
  }, [reduzido]);

  // Valores computados: refeitos a cada troca de tema, idioma, largura ou movimento.
  useLayoutEffect(() => {
    if (raiz.current) atualizarMedicoes(raiz.current);
  }, [theme, lang, largura, reduzido]);

  // Abertura com âncora (`/__styleguide#button`): o conteúdo só existe depois do import().
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (id) document.getElementById(id)?.scrollIntoView({ behavior: 'instant', block: 'start' });
  }, []);

  return (
    <div
      ref={raiz}
      className={styles.pagina}
      data-styleguide=""
      data-tema={theme}
      data-reduzido={reduzido ? '' : undefined}
    >
      <header className={styles.barra} aria-label={TEXTOS.barra.rotulo}>
        <p className={styles.marca}>{TEXTOS.titulo}</p>
        <div className={styles.controles}>
          <button type="button" className={styles.botao} onClick={toggleTheme} data-controle="tema">
            {theme === 'dark' ? dict.a11y.themeToLight : dict.a11y.themeToDark}
          </button>
          <button
            type="button"
            className={styles.botao}
            onClick={toggleLang}
            data-controle="idioma"
          >
            {dict.a11y.language}
            {': '}
            {lang === 'en' ? dict.a11y.languageNameEn : dict.a11y.languageNamePt}
          </button>
          <p className={styles.largura} data-largura={largura} data-faixa={faixa}>
            <span className={styles.rotuloBarra}>{TEXTOS.barra.largura}</span>{' '}
            <strong>{largura}</strong> {TEXTOS.barra.unidade} · {TEXTOS.faixas[faixa]}
          </p>
          <label className={styles.checagem}>
            <input
              type="checkbox"
              checked={reduzido}
              onChange={(e) => setReduzido(e.currentTarget.checked)}
              data-controle="movimento"
            />
            {TEXTOS.barra.movimento}
          </label>
        </div>
      </header>

      <main className={styles.conteudo}>
        <h1 className={styles.titulo}>{TEXTOS.titulo}</h1>
        <p className={styles.nota}>{TEXTOS.subtitulo}</p>

        <nav aria-label={TEXTOS.indice} className={styles.indice}>
          <ul>
            {SECOES.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`}>{s.titulo}</a>
              </li>
            ))}
            {DEMOS.map((d) => (
              <li key={d.id}>
                <a href={`#${d.id}`}>{d.nome}</a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Cores e decoração (§4.1): todas as linhas, inclusive --deco-*. */}
        <section id="sg-cores" aria-labelledby="sg-cores-titulo" className={styles.secao}>
          <h2 id="sg-cores-titulo" className={styles.tituloSecao}>
            {titulo('sg-cores')}
          </h2>
          <p className={styles.nota}>{TEXTOS.notas.cores}</p>
          <TokenTable modo="tema" tokens={TOKENS_DE_COR} tema={theme} titulo={titulo('sg-cores')} />
        </section>

        {/* Gradientes, sombras e vidro: cartões de 160 × 100 px. */}
        <section id="sg-efeitos" aria-labelledby="sg-efeitos-titulo" className={styles.secao}>
          <h2 id="sg-efeitos-titulo" className={styles.tituloSecao}>
            {titulo('sg-efeitos')}
          </h2>
          <p className={styles.nota}>{TEXTOS.notas.efeitos}</p>
          <ul className={styles.cartoes}>
            {DEGRADES.map(({ nome }) => (
              <li key={nome} className={styles.cartaoItem} data-efeito={nome}>
                <span className={styles.cartao} style={{ backgroundImage: `var(${nome})` }} />
                <code>{nome}</code>
                <Saida token={nome} medida="background-image" />
              </li>
            ))}
            {SOMBRAS.map(({ nome }) => (
              <li key={nome} className={styles.cartaoItem} data-efeito={nome}>
                <span
                  className={`${styles.cartao} ${styles.cartaoSombra}`}
                  style={{ boxShadow: `var(${nome})` }}
                />
                <code>{nome}</code>
                <Saida token={nome} medida="box-shadow" />
              </li>
            ))}
            {VIDROS.map(([fundo, desfoque, borda]) => (
              <li key={fundo} className={styles.cartaoItem} data-efeito={fundo}>
                <span className={styles.cartaoFundoVidro}>
                  <span
                    className={`${styles.cartao} ${styles.cartaoVidro}`}
                    style={{
                      backgroundColor: `var(${fundo})`,
                      backdropFilter: desfoque ? `blur(var(${desfoque}))` : undefined,
                      WebkitBackdropFilter: desfoque ? `blur(var(${desfoque}))` : undefined,
                      borderColor: borda ? `var(${borda})` : 'transparent',
                    }}
                  />
                </span>
                <code>{fundo}</code>
                <Saida token={fundo} medida="background-color" />
                {desfoque ? <code>{desfoque}</code> : null}
                {borda ? <code>{borda}</code> : null}
              </li>
            ))}
          </ul>
        </section>

        {/* Tipografia (§4.5): cada .t-* com a frase de amostra e o computado ao lado. */}
        <section id="sg-tipografia" aria-labelledby="sg-tipografia-titulo" className={styles.secao}>
          <h2 id="sg-tipografia-titulo" className={styles.tituloSecao}>
            {titulo('sg-tipografia')}
          </h2>
          <p className={styles.nota}>{TEXTOS.notas.tipografia}</p>
          <ul className={styles.listaTipo}>
            {CLASSES_T.map((classe) => (
              <li key={classe} className={styles.itemTipo} data-classe={classe}>
                <code>{`.${classe}`}</code>
                <p id={`sg-amostra-${classe}`} className={classe}>
                  {TEXTOS.amostraTipografica}
                </p>
                <output
                  className={styles.computado}
                  data-alvo={`sg-amostra-${classe}`}
                  data-propriedades={PROPRIEDADES_DE_TIPO}
                />
              </li>
            ))}
          </ul>
          <TokenTable modo="simples" tokens={TOKENS_DE_TIPO} titulo={titulo('sg-tipografia')} />
        </section>

        {/* Espaçamento (§4.2) e layout (§4.4). */}
        <section
          id="sg-espacamento"
          aria-labelledby="sg-espacamento-titulo"
          className={styles.secao}
        >
          <h2 id="sg-espacamento-titulo" className={styles.tituloSecao}>
            {titulo('sg-espacamento')}
          </h2>
          <p className={styles.nota}>{TEXTOS.notas.espacamento}</p>
          <ul className={styles.listaReguas}>
            {ESCALA.map(({ nome, valor }) => (
              <li key={nome} className={styles.itemRegua} data-espaco={nome}>
                <code>{nome}</code>
                <code>{valor}</code>
                <span
                  id={`sg-regua-${nome.slice(2)}`}
                  className={styles.regua}
                  style={{ width: `var(${nome})` }}
                />
                <output
                  className={styles.computado}
                  data-alvo={`sg-regua-${nome.slice(2)}`}
                  data-propriedades="width"
                />
              </li>
            ))}
          </ul>
          <TokenTable modo="simples" tokens={LAYOUT} titulo={titulo('sg-espacamento')} />
        </section>

        {/* Raios, bordas e foco (§4.6): amostras navegáveis por Tab. */}
        <section id="sg-formas" aria-labelledby="sg-formas-titulo" className={styles.secao}>
          <h2 id="sg-formas-titulo" className={styles.tituloSecao}>
            {titulo('sg-formas')}
          </h2>
          <p className={styles.nota}>{TEXTOS.notas.formas}</p>
          <ul className={styles.listaFormas}>
            {RAIOS.map(({ nome, valor }) => (
              <li key={nome}>
                <button
                  type="button"
                  className={styles.formaAmostra}
                  style={{ borderRadius: `var(${nome})` }}
                  data-raio={nome}
                >
                  <code>{nome}</code>
                  <code>{valor}</code>
                </button>
              </li>
            ))}
            {BORDAS.map(({ nome, valor }) => (
              <li key={nome}>
                <button
                  type="button"
                  className={styles.formaAmostra}
                  style={{ borderWidth: `var(${nome})` }}
                  data-borda={nome}
                >
                  <code>{nome}</code>
                  <code>{valor}</code>
                </button>
              </li>
            ))}
          </ul>
          <TokenTable modo="simples" tokens={TOKENS_DE_FORMA} titulo={titulo('sg-formas')} />
        </section>

        {/* Movimento (§4.7): valores atuais e uma amostra de lift e de animação. */}
        <section id="sg-movimento" aria-labelledby="sg-movimento-titulo" className={styles.secao}>
          <h2 id="sg-movimento-titulo" className={styles.tituloSecao}>
            {titulo('sg-movimento')}
          </h2>
          <p className={styles.nota}>{TEXTOS.notas.movimento}</p>
          <div className={styles.amostrasMovimento}>
            <p className={styles.liftDemo} data-lift-demo="">
              {TEXTOS.notas.liftDemo}
            </p>
            <span className={styles.animacaoDemo} data-animacao-demo="" aria-hidden="true" />
          </div>
          <TokenTable modo="simples" tokens={TOKENS_DE_MOVIMENTO} titulo={titulo('sg-movimento')} />
        </section>

        {/* Demos dos componentes (DS-06..DS-21), descobertas por import.meta.glob. */}
        <section id="sg-demos" aria-labelledby="sg-demos-titulo" className={styles.secao}>
          <h2 id="sg-demos-titulo" className={styles.tituloSecao}>
            {titulo('sg-demos')}
          </h2>
          {DEMOS.length === 0 ? <p className={styles.nota}>{TEXTOS.notas.semDemos}</p> : null}
          {DEMOS.map(({ id, nome, caminho, Componente }) => (
            <section
              key={id}
              id={id}
              aria-labelledby={`${id}-titulo`}
              className={styles.demo}
              data-demo={id}
            >
              <h3 id={`${id}-titulo`} className={styles.tituloDemo}>
                {nome}
              </h3>
              <p className={styles.nota}>
                <code>{caminho}</code>
              </p>
              <div className={styles.palcoDemo}>
                <Componente />
              </div>
            </section>
          ))}
        </section>
      </main>
    </div>
  );
}
