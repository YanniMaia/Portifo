// Configuração do Vitest (F-04). Herda o vite.config.ts (plugins e alias `@/`) via mergeConfig.
// Arquivo separado do vite.config.ts para a F-07 poder mexer no `base` sem conflito.
// Convenção única de testes (doc 01 §3): testes de unidade só em tests/unit/<área>/<nome>.test.{ts,tsx}.
// O Q-01 estende o setup (tests/unit/setup.ts e tests/unit/support/), sem criar outro config.
import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config.ts';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      setupFiles: ['tests/unit/setup.ts'],
      include: ['tests/unit/**/*.test.{ts,tsx}'],
      css: {
        modules: {
          classNameStrategy: 'non-scoped',
        },
      },
      coverage: {
        provider: 'v8',
        include: ['src/**/*.{ts,tsx}'],
        reportsDirectory: 'coverage',
      },
    },
  }),
);
