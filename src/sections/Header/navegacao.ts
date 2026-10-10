// Ajudante de navegação do cabeçalho (S-01, S-02). Os links do menu e a logo são `<a href="#id">`
// de verdade (funcionam sem JS e com o botão do meio do mouse). Um clique simples é interceptado e
// entregue à rolagem do F-13 (`scrollToSection`/`scrollToTop`), que grava o hash e move o foco
// para o título da seção. Clique com modificador (nova aba/janela) segue o comportamento nativo.
import type { MouseEvent } from 'react';

/** `true` para clique primário sem Ctrl/⌘/Shift/Alt, que a página pode tratar sozinha. */
export function eCliqueSimples(evento: MouseEvent<HTMLAnchorElement>): boolean {
  return (
    !evento.defaultPrevented &&
    evento.button === 0 &&
    !evento.metaKey &&
    !evento.ctrlKey &&
    !evento.shiftKey &&
    !evento.altKey
  );
}
