// SHA curto do build (D-05, doc 07 linha 188): fonte única da regra "encurtar para 7 caracteres",
// usada tanto por `vite.config.ts` (grava `<meta name="version">` no build) quanto pelos testes de
// smoke (`tests/e2e/smoke-publico.spec.ts`) que calculam o valor esperado. Função pura, sem efeito
// colateral: quem chama decide a fonte do SHA bruto (env `GIT_SHA`/`SMOKE_SHA` do CI, ou
// `git rev-parse HEAD` localmente) — isso mantém os dois lados em sincronia sem duplicar a regra.
export function encurtarSha(shaBruto: string): string {
  const limpo = shaBruto.trim();
  if (!/^[0-9a-f]{7,40}$/i.test(limpo)) {
    throw new Error(
      `gitSha: SHA inválido (esperado hexadecimal de 7 a 40 caracteres): "${shaBruto}"`,
    );
  }
  return limpo.slice(0, 7).toLowerCase();
}
