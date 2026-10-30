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
//   `try/catch` e verificação de `navigator.clipboard` antes de chamar); fallback literal do passo 6
//   da S-15 ("selecionar o texto do endereço"; Q-04 reencontrou essa frase no doc 03 e a implementou
//   aqui — a S-15 só tinha deixado o `<span>` selecionável pelo usuário, sem selecionar por conta
//   própria): `selecionarEndereco()` marca o texto do `<span>` com `window.getSelection()`, para o
//   usuário copiar manualmente (Ctrl/Cmd+C) mesmo sem a API de área de transferência.
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
  const enderecoRef = useRef<HTMLSpanElement>(null);

  // Ao desmontar, não deixa o temporizador nem o estado "Copiado!" presos (mesmo padrão do
  // `ThemeProvider.tsx` para a classe de transição).
  useEffect(
    () => () => {
      window.clearTimeout(temporizador.current);
    },
    [],
  );

  if (isPlaceholder(site.email)) return null;

  // Fallback da falha (doc 03 S-15, passo 6): marca o texto do endereço como selecionado, para o
  // usuário copiar manualmente. `window.getSelection`/`Range` sem suporte (navegador muito antigo):
  // não faz nada, sem lançar erro.
  function selecionarEndereco() {
    const elemento = enderecoRef.current;
    const selecao = window.getSelection?.();
    if (!elemento || !selecao) return;
    try {
      const intervalo = document.createRange();
      intervalo.selectNodeContents(elemento);
      selecao.removeAllRanges();
      selecao.addRange(intervalo);
    } catch {
      // Navegador sem suporte a Range/Selection: o endereço continua visível e selecionável à mão.
    }
  }

  async function aoClicarCopiar() {
    if (!navigator.clipboard) {
      selecionarEndereco(); // API ausente (contexto inseguro, navegador antigo): sem erro.
      return;
    }
    try {
      await navigator.clipboard.writeText(site.email);
    } catch {
      selecionarEndereco(); // Permissão negada ou outra falha: nenhum "Copiado!", nenhum erro no console.
      return;
    }
    window.clearTimeout(temporizador.current);
    setCopiado(true);
    temporizador.current = window.setTimeout(() => setCopiado(false), DURACAO_COPIADO_MS);
  }

  return (
    <div className={[styles.wrap, className].filter(Boolean).join(' ')}>
      <span ref={enderecoRef} className={styles.endereco}>
        {site.email}
      </span>
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
