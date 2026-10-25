// Copiar e-mail (S-15; doc de design §7.11, §3.4, §11; D11).
//
// - Endereço de `site.email` (C-04), texto selecionável (CSS `user-select: text`), 16 px.
// - Botão "Copiar"/"Copiado!" (`Button`, DS-11, `variant="secondary"` `size="compact"`: 44 px,
//   ≥ alvo de toque): ícone `Copy`/`Check` à esquerda. O comentário do próprio `Button.tsx` já
//   prevê este uso ("Copiar" enquanto copia, sem o foco sumir — por isso não troca para `<a>` nem
//   remonta o botão).
// - `navigator.clipboard.writeText`: sucesso → rótulo "Copiado!" por 2 s (`DURACAO_COPIADO_MS`,
//   timer reiniciado a cada clique via `window.clearTimeout`/`window.setTimeout`, mesmo padrão do
//   `ThemeProvider.tsx`) + anúncio em `aria-live="polite"` (`contato.copiadoAnuncio`). Falha (API
//   ausente ou `writeText` rejeitada): nenhum "Copiado!", nenhum erro no console (captura em
//   `try/catch` e verificação de `navigator.clipboard` antes de chamar); o endereço continua
//   selecionável por ser um `<span>` de texto comum, sem nenhum efeito especial de fallback.
// - Limpa o temporizador ao desmontar (sem classe nem estado presos).
// - "Sem e-mail, sem componente" (D11, mesmo espírito do `ButtonLink` com `href`): `site.email`
//   ausente/placeholder (`[…]`, F-15) → `null`, nada no DOM.
import { Check, Copy } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/Button';
import { site } from '@/content/site';
import { useLanguage } from '@/i18n/useLanguage';
import { isPlaceholder } from '@/lib/placeholder';
import styles from './CopyEmail.module.css';

/** 2 s (§7.11): tempo em que o rótulo fica "Copiado!" antes de voltar a "Copiar". */
const DURACAO_COPIADO_MS = 2000;

export interface CopyEmailProps {
  /** Classe extra do consumidor (posição no layout do `Contact`). */
  className?: string;
}

export function CopyEmail({ className }: CopyEmailProps) {
  const { dict } = useLanguage();
  const d = dict.contato;
  const [copiado, setCopiado] = useState(false);
  const temporizador = useRef<number | undefined>(undefined);

  // Ao desmontar, não deixa o temporizador nem o estado "Copiado!" presos (mesmo padrão do
  // `ThemeProvider.tsx` para a classe de transição).
  useEffect(
    () => () => {
      window.clearTimeout(temporizador.current);
    },
    [],
  );

  if (isPlaceholder(site.email)) return null;

  async function aoClicarCopiar() {
    if (!navigator.clipboard) return; // API ausente (contexto inseguro, navegador antigo): sem erro.
    try {
      await navigator.clipboard.writeText(site.email);
    } catch {
      return; // Permissão negada ou outra falha: nenhum "Copiado!", nenhum erro no console.
    }
    window.clearTimeout(temporizador.current);
    setCopiado(true);
    temporizador.current = window.setTimeout(() => setCopiado(false), DURACAO_COPIADO_MS);
  }

  return (
    <div className={[styles.wrap, className].filter(Boolean).join(' ')}>
      <span className={styles.endereco}>{site.email}</span>
      <Button
        variant="secondary"
        size="compact"
        iconLeft={copiado ? Check : Copy}
        aria-label={d.copiarAria}
        onClick={() => {
          void aoClicarCopiar();
        }}
      >
        {copiado ? d.copiado : d.copiar}
      </Button>
      <span className="visually-hidden" aria-live="polite">
        {copiado ? d.copiadoAnuncio : ''}
      </span>
    </div>
  );
}
