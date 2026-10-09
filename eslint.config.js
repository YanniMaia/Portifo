// Configuração do ESLint (flat config) — task F-03.
// Regras de projeto: D1 (sem Tailwind), D3 (ícones só de lucide-react), D5 (texto só em src/content).
import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// D3: qualquer biblioteca de ícones que não seja lucide-react. D1: Tailwind.
const bibliotecasProibidas = [
  {
    group: [
      'react-icons',
      'react-icons/*',
      '@heroicons/*',
      '@fortawesome/*',
      '@mui/icons-material',
      '@mui/icons-material/*',
      '@tabler/icons',
      '@tabler/icons-react',
      '@phosphor-icons/*',
      'phosphor-react',
      'react-feather',
      'feather-icons',
      '@radix-ui/react-icons',
      '@iconify/*',
      '@iconify-icon/*',
      '@ant-design/icons',
      'react-bootstrap-icons',
      'bootstrap-icons',
      'ionicons',
      '@primer/octicons-react',
      'remixicon',
      '@remixicon/*',
      'lucide',
      'lucide-static',
    ],
    message: 'D3: use apenas lucide-react para ícones (strokeWidth={1.75}).',
  },
  {
    group: ['tailwindcss', 'tailwindcss/*', '@tailwindcss/*'],
    message: 'D1: o projeto não usa Tailwind. Use CSS Modules + tokens CSS.',
  },
];

// D5: texto visível só em src/content. Pega qualquer texto JSX que tenha letra ou dígito.
// Exceções: textos só com símbolos/pontuação (ex.: "→", "·", "↑", "|", "/") e espaços.
const letraOuDigito = '/[A-Za-z0-9\\u00C0-\\u024F]/';
const textoFixoEmJsx = [
  {
    selector: `JSXText[value=${letraOuDigito}]`,
    message: 'D5: texto fixo em JSX. Mova o texto para src/content (pt.ts/en.ts).',
  },
  {
    selector: `JSXExpressionContainer > Literal[value=${letraOuDigito}]`,
    message: 'D5: texto fixo em JSX. Mova o texto para src/content (pt.ts/en.ts).',
  },
];

export default defineConfig([
  globalIgnores(['dist', 'coverage', 'plano', '.claude', 'test-results', 'playwright-report']),
  {
    files: ['**/*.{js,mjs,cjs,ts,tsx}'],
    extends: [js.configs.recommended, tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      ecmaVersion: 2023,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      'no-restricted-imports': ['error', { patterns: bibliotecasProibidas }],
    },
  },
  {
    // Código da aplicação (navegador + React).
    files: ['src/**/*.{ts,tsx}'],
    extends: [
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      jsxA11y.flatConfigs.recommended,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    // D5 (aviso): componentes e seções não têm texto fixo.
    files: ['src/components/**/*.{ts,tsx}', 'src/sections/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': ['warn', ...textoFixoEmJsx],
    },
  },
  {
    // Arquivos de configuração em Node.
    files: ['*.{js,mjs,cjs,ts}'],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    // Scripts de geração (Node). `document`/`Image` aparecem dentro de `page.evaluate` do
    // Playwright, que roda no navegador (C-09, C-10).
    files: ['scripts/**/*.{js,mjs,cjs}'],
    languageOptions: {
      globals: { ...globals.node, ...globals.browser },
    },
  },
  {
    // Arquivos .js ficam fora dos tsconfig: lint sem informação de tipos.
    files: ['**/*.{js,mjs,cjs}'],
    extends: [tseslint.configs.disableTypeChecked],
  },
  // Por último: desliga regras de estilo que conflitam com o Prettier.
  eslintConfigPrettier,
]);
