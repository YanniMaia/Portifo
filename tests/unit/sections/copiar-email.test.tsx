// Testes unitários de "Copiar e-mail" (Q-04; doc 06 linhas 162-180). Depende de Q-01 (mocks/render
// com provedores), S-15 (`Contact`/`CopyEmail`) e C-04 (`site.email`).
//
// D14 ("um dono por artefato, sem duplicata"): este arquivo é o dono do comportamento de clique do
// `CopyEmail` (sucesso, falha, timers, `aria-live`, EN). `tests/unit/sections/Contact.test.tsx`
// (S-15) manteve só a presença estrutural do endereço no layout do painel, para não duplicar as
// mesmas asserções em dois arquivos.
//
// Os 5 cenários do passo a passo da Q-04:
// 1. Sucesso: `navigator.clipboard.writeText` chamado com exatamente `site.email` (C-04,
//    "yannielyssa64@gmail.com"); rótulo "Copiado!" até 1999 ms, "Copiar" aos 2000 ms exatos.
// 2. Cliques repetidos reiniciam o prazo de 2 s (o rótulo não "pisca").
// 3. Falha (`writeText` rejeitada OU `navigator.clipboard` ausente): nenhum erro não tratado,
//    nenhum "Copiado!", e o fallback do S-15 (doc 03, passo 6, "selecionar o texto do endereço")
//    acontece; o e-mail continua visível e o botão "E-mail" (`mailto:`) continua funcionando.
// 4. A troca de rótulo é anunciada pela região `aria-live="polite"` do S-15.
// 5. Em EN o rótulo usa o dicionário EN — mesmo a V1 não tendo botão de troca de idioma na
//    interface (DS-20/C-03 adiados, doc 09 §1): o `CopyEmail` lê `useLanguage()`/`LanguageContext`
//    sem saber se existe um seletor visível, então o teste troca o idioma pelo contexto
//    (`renderWithProviders(..., { idioma: 'en' })`, de Q-01), não por um clique de UI que não existe.
import { act, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { en } from '@/content/en';
import { pt } from '@/content/pt';
import { site } from '@/content/site';
import { Contact } from '@/sections/Contact/Contact';
import { mockClipboard } from '../support/mocks';
import { renderWithProviders } from '../support/render';

/** Mesmo valor de `CopyEmail.tsx` (§7.11): 2 s até o rótulo voltar a "Copiar"/"Copy". */
const DURACAO_COPIADO_MS = 2000;

const botaoCopiar = (rotuloAria: string) => screen.getByRole('button', { name: rotuloAria });
const anuncio = () => document.querySelector('[aria-live="polite"]') as HTMLElement;

// `fireEvent.click` (síncrono) + flush manual da fila de microtarefas da Promise do
// `navigator.clipboard.writeText`: o `userEvent.click` (assíncrono) trava com
// `vi.useFakeTimers()` (mesma decisão documentada no diário do S-15), porque parte da simulação de
// clique dele depende de temporizadores reais, que ficam "congelados" pelos timers falsos.
async function clicarEmCopiar(rotuloAria: string) {
  fireEvent.click(botaoCopiar(rotuloAria));
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe('Copiar e-mail (Q-04): sucesso — writeText com o e-mail exato, 2000 ms e aria-live', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('chama navigator.clipboard.writeText com exatamente o e-mail de C-04', async () => {
    const clipboard = mockClipboard('sucesso');
    renderWithProviders(<Contact />);

    await clicarEmCopiar(pt.contato.copiarAria);

    expect(site.email).toBe('yannielyssa64@gmail.com');
    expect(clipboard.writeText).toHaveBeenCalledTimes(1);
    expect(clipboard.writeText).toHaveBeenCalledWith(site.email);
  });

  it('rótulo "Copiado!" (ícone Check) até 1999 ms e "Copiar" (ícone Copy) em exatamente 2000 ms; aria-live anuncia e some', async () => {
    mockClipboard('sucesso');
    renderWithProviders(<Contact />);
    vi.useFakeTimers();

    await clicarEmCopiar(pt.contato.copiarAria);
    expect(botaoCopiar(pt.contato.copiarAria)).toHaveTextContent(pt.contato.copiado);
    expect(
      botaoCopiar(pt.contato.copiarAria).querySelector('svg')?.getAttribute('class'),
    ).toContain('lucide-check');
    expect(anuncio()).toHaveTextContent(pt.contato.copiadoAnuncio);

    act(() => {
      vi.advanceTimersByTime(1999);
    });
    expect(botaoCopiar(pt.contato.copiarAria)).toHaveTextContent(pt.contato.copiado);

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(botaoCopiar(pt.contato.copiarAria)).toHaveTextContent(pt.contato.copiar);
    expect(
      botaoCopiar(pt.contato.copiarAria).querySelector('svg')?.getAttribute('class'),
    ).toContain('lucide-copy');
    expect(anuncio()).toHaveTextContent('');
  });
});

describe('Copiar e-mail (Q-04): cliques repetidos reiniciam o prazo (o rótulo não pisca)', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('2º clique a 1500 ms reinicia os 2 s; o rótulo só volta a "Copiar" 2 s depois do ÚLTIMO clique', async () => {
    mockClipboard('sucesso');
    renderWithProviders(<Contact />);
    vi.useFakeTimers();

    await clicarEmCopiar(pt.contato.copiarAria);
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(botaoCopiar(pt.contato.copiarAria)).toHaveTextContent(pt.contato.copiado);

    await clicarEmCopiar(pt.contato.copiarAria); // reinicia o temporizador (sem "piscar" para "Copiar")
    expect(botaoCopiar(pt.contato.copiarAria)).toHaveTextContent(pt.contato.copiado);

    // Se o 2º clique não tivesse reiniciado o prazo, o 1º prazo (1500 + 600 = 2100 ms) já teria
    // vencido aqui; como reiniciou, ainda faltam 2000 - 1999 = 1 ms do 2º prazo.
    act(() => {
      vi.advanceTimersByTime(1999);
    });
    expect(botaoCopiar(pt.contato.copiarAria)).toHaveTextContent(pt.contato.copiado);

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(botaoCopiar(pt.contato.copiarAria)).toHaveTextContent(pt.contato.copiar);
  });
});

describe('Copiar e-mail (Q-04): falha sem erro não tratado e fallback do S-15 (e-mail + mailto)', () => {
  it('writeText rejeitada (permissão negada): sem "Copiado!", sem console.error, texto do endereço selecionado', async () => {
    mockClipboard('negado');
    const erro = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    renderWithProviders(<Contact />);

    await clicarEmCopiar(pt.contato.copiarAria);

    expect(botaoCopiar(pt.contato.copiarAria)).toHaveTextContent(pt.contato.copiar);
    expect(anuncio()).toHaveTextContent('');
    expect(erro).not.toHaveBeenCalled();

    // Fallback do S-15 (doc 03, passo 6): "selecionar o texto do endereço".
    expect(window.getSelection()?.toString()).toBe(site.email);

    // O e-mail continua visível e o botão "E-mail" (mailto:) continua funcionando.
    expect(screen.getByText(site.email)).toBeInTheDocument();
    const linkEmail = screen.getByRole('link', { name: pt.contato.botaoEmail });
    expect(linkEmail).toHaveAttribute('href', site.mailto);

    erro.mockRestore();
  });

  it('navigator.clipboard ausente (API inexistente): sem "Copiado!", sem console.error, texto do endereço selecionado', async () => {
    mockClipboard('ausente');
    const erro = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    renderWithProviders(<Contact />);

    await clicarEmCopiar(pt.contato.copiarAria);

    expect(botaoCopiar(pt.contato.copiarAria)).toHaveTextContent(pt.contato.copiar);
    expect(anuncio()).toHaveTextContent('');
    expect(erro).not.toHaveBeenCalled();

    expect(window.getSelection()?.toString()).toBe(site.email);

    expect(screen.getByText(site.email)).toBeInTheDocument();
    const linkEmail = screen.getByRole('link', { name: pt.contato.botaoEmail });
    expect(linkEmail).toHaveAttribute('href', site.mailto);

    erro.mockRestore();
  });
});

describe('Copiar e-mail (Q-04): EN usa o dicionário EN, mesmo sem seletor de idioma na UI da V1', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('rótulo "Copy" → "Copied!" → "Copy" em EN, via contexto (sem clicar em nenhum botão PT/EN)', async () => {
    mockClipboard('sucesso');
    renderWithProviders(<Contact />, { idioma: 'en' });
    vi.useFakeTimers();

    // Confirma que o idioma do contexto é mesmo EN (sem depender de um seletor que não existe na V1).
    expect(screen.queryByRole('button', { name: pt.contato.copiarAria })).not.toBeInTheDocument();
    expect(botaoCopiar(en.contato.copiarAria)).toHaveTextContent(en.contato.copiar);

    await clicarEmCopiar(en.contato.copiarAria);
    expect(botaoCopiar(en.contato.copiarAria)).toHaveTextContent(en.contato.copiado);
    expect(anuncio()).toHaveTextContent(en.contato.copiadoAnuncio);

    act(() => {
      vi.advanceTimersByTime(DURACAO_COPIADO_MS);
    });
    expect(botaoCopiar(en.contato.copiarAria)).toHaveTextContent(en.contato.copiar);
  });
});
