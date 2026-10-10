import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';

// Correção C-02/e2e: o Node do Playwright importa o pt.ts (e, por ele, o flags.ts) sem o Vite,
// então `import.meta.env` é `undefined`. O flags.ts não pode quebrar nesse cenário.
// O Vitest sempre injeta `import.meta.env`; por isso o teste roda o flags.ts num Node puro
// (Node ≥ 22.18 remove os tipos do .ts sozinho; o flags.ts não tem imports).
describe('flags.ts sem import.meta.env (Node puro, como no Playwright)', () => {
  it('carrega sem erro e SHOW_PLACEHOLDERS = false (comportamento de produção)', () => {
    const url = pathToFileURL(resolve(process.cwd(), 'src/lib/flags.ts')).href;
    const codigo = `const m = await import(${JSON.stringify(url)});
console.log(JSON.stringify({ env: typeof import.meta.env, ...m }));`;
    const saida = execFileSync(
      process.execPath,
      ['--no-warnings', '--input-type=module', '-e', codigo],
      { encoding: 'utf8' },
    );
    const flags = JSON.parse(saida.trim()) as Record<string, unknown>;
    expect(flags.env).toBe('undefined');
    expect(flags.SHOW_PLACEHOLDERS).toBe(false);
    expect(flags.SHOW_AI_COMING_SOON_CARD).toBe(true);
    expect(flags.SHOW_LANGUAGE_TOGGLE).toBe(true);
  });
});
