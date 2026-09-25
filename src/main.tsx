import { StrictMode, type ComponentType } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/global.css';
import App from './App.tsx';
import { LanguageProvider } from './i18n/LanguageProvider.tsx';
import { ThemeProvider } from './theme/ThemeProvider.tsx';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Elemento #root não encontrado no index.html');
}

const root = createRoot(rootElement);

function renderizar(Conteudo: ComponentType) {
  root.render(
    <StrictMode>
      <ThemeProvider>
        <LanguageProvider>
          <Conteudo />
        </LanguageProvider>
      </ThemeProvider>
    </StrictMode>,
  );
}

// DS-05: /__styleguide só em desenvolvimento, nos mesmos providers. Em produção o Vite troca
// `import.meta.env.DEV` por `false` e o ramo (com o import) sai do bundle.
if (import.meta.env.DEV && location.pathname.endsWith('/__styleguide')) {
  void import('@/dev/Styleguide').then(({ Styleguide }) => renderizar(Styleguide));
} else {
  renderizar(App);
}
