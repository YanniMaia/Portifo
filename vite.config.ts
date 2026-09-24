import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
// URL base do GitHub Pages (F-07, D14): única fonte é src/site.config.ts. A extensão `.ts` é
// obrigatória porque o tsconfig.node.json usa `module: nodenext`.
import { BASE_PATH } from './src/site.config.ts';

// https://vite.dev/config/
export default defineConfig({
  // `vite build --base …` (script build:pages-test) sobrepõe este valor sem variável de ambiente.
  base: BASE_PATH,
  plugins: [react()],
  resolve: {
    // Alias `@/` → `src/` (F-05). Mesmo mapeamento do `paths` em tsconfig.app.json.
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    target: 'es2022',
    sourcemap: false,
    // assetsInlineLimit: padrão do Vite (4 KiB), de propósito.
  },
});
