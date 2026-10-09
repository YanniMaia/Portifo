# Pendências para a Yanni

Esta lista mostra **só o que falta** para o portfólio ficar completo. Nada aqui foi inventado: onde
falta um dado seu, o site esconde o item (ou mostra um aviso só na versão de desenvolvimento).

**Como responder:** marque a caixa `[x]` quando resolver e escreva embaixo de "Resposta:". Itens com
"(opcional)" podem ficar sem resposta. As linhas "Onde isso aparece no site" e "Arquivo/campo" são
para quem vai aplicar a sua resposta no código; você não precisa mexer nelas.

Origem: doc de design §16 ("Só você pode fornecer") e §17, adaptação IA (00-INDICE §3), doc 05 §6 e
§7, e os textos que aguardam aprovação (`src/content/sugeridos.ts`). Para conferir que nada no código
ficou fora desta lista, rode `node scripts/list-pendencias.mjs`.

## A. Projetos

- [ ] **P-01 — Publicar os 4 projetos de estudo no GitHub**
  - O que preciso: publicar seguindo o capítulo 13 do documento de design, com os nomes exatos
    `banco-de-dados-biblioteca`, `ciberseguranca-analisador-de-logs`, `analise-de-dados-vendas` e
    `python-organizador-de-arquivos`. Antes de publicar, confira o que o §17 pede: cada projeto foi
    lido e rodado por você, e você consegue explicar como ele funciona.
  - Marque os que já estão publicados: ☐ Biblioteca ☐ Logs ☐ Vendas ☐ Organizador
  - Resposta: (escreva aqui)
  - Onde isso aparece no site: botão "GitHub" de cada card de projeto (os cards já aparecem, só o
    botão espera a publicação); número de projetos na faixa de destaques (o item só aparece quando
    houver pelo menos 1 publicado); o painel em destaque pode passar para o projeto de Vendas.
  - Arquivo/campo: `src/content/projects.ts` → `publicado` de `banco-de-dados-biblioteca`,
    `ciberseguranca-analisador-de-logs`, `analise-de-dados-vendas` e
    `python-organizador-de-arquivos` (os links do §12.5 já estão em `linkGithub`). Tasks D-09a…e.

- [ ] **P-02 — Link do repositório do Gerenciador de Estoque**
  - O que preciso: o endereço do repositório no GitHub (copie da barra do navegador).
  - Resposta: (escreva aqui)
  - Onde isso aparece no site: botão "GitHub" do painel em destaque (Gerenciador de Estoque). Hoje
    o botão não aparece.
  - Arquivo/campo: `src/content/projects.ts` → `gerenciador-de-estoque.linkGithub` (troca o
    placeholder `https://github.com/YanniMaia/[repositório]`; no §12.5 do documento de design ele
    aparece como `[colocar o link do seu repositório]`) e
    `gerenciador-de-estoque.publicado` → `true`. O campo `gerenciador-de-estoque.placeholder` sai
    quando a P-02 e a P-04 estiverem resolvidas.

- [ ] **P-03 — Print (captura de tela) do Gerenciador de Estoque rodando**
  - O que preciso: o arquivo da imagem. Até lá fica a ilustração rosa.
  - Resposta: (escreva aqui ou diga "enviei o arquivo")
  - Onde isso aparece no site: imagem do painel em destaque (Projetos). A legenda de reserva
    `[substituir por print do projeto]` só aparece na versão de desenvolvimento.
  - Arquivo/campo: arquivo em `public/projetos/gerenciador-de-estoque/` +
    `src/content/projects.ts` → `gerenciador-de-estoque.imagem` (`src` e `alt` pt/en). A legenda
    `projetos.legendaReserva` (`src/content/pt.ts`; em `src/content/en.ts` é
    `[replace with project screenshot]`) deixa de ser usada.

- [ ] **P-04 — (opcional) Link de demonstração online do Gerenciador de Estoque**
  - O que preciso: só se o projeto puder ser aberto na internet.
  - Resposta: (escreva aqui)
  - Onde isso aparece no site: botão "Ver projeto" do painel em destaque. Hoje o botão não aparece.
  - Arquivo/campo: `src/content/projects.ts` → `gerenciador-de-estoque.linkProjeto` (troca o
    placeholder `[link da demonstração]`).

- [ ] **P-14 — O Gerenciador de Estoque usa dados fictícios?**
  - O que preciso: sim ou não. Se sim, ele também recebe o selo "Projeto de estudo".
  - Resposta: ☐ Sim ☐ Não
  - Onde isso aparece no site: selo "Projeto de estudo" no painel em destaque.
  - Arquivo/campo: `src/content/projects.ts` → `gerenciador-de-estoque.projetoDeEstudo`.

- [ ] **P-15 — Arquivo `graficos/receita_por_mes.png` do projeto de Vendas**
  - O que preciso: o arquivo (está no ZIP dos projetos). Pode enviar o ZIP ou só o arquivo.
  - Resposta: (escreva aqui ou diga "enviei o arquivo")
  - Onde isso aparece no site: imagem do card "Análise de Dados de Vendas". Até lá fica a
    ilustração rosa (placeholder `[imagem receita_por_mes.png]`).
  - Arquivo/campo: arquivo em `public/projetos/analise-de-dados-vendas/` +
    `src/content/projects.ts` → `analise-de-dados-vendas.imagem` (`src` e `alt` pt/en). Task C-07.

## B. Formação e trajetória

- [ ] **P-05 — (opcional) Datas da graduação e da trajetória**
  - O que preciso: ano de início da graduação, previsão de conclusão e, se quiser, os anos dos
    marcos de "Minha trajetória".
  - Resposta: ano de início: (escreva aqui) · previsão de conclusão: (escreva aqui) · anos nos
    marcos? ☐ Não ☐ Sim: (escreva aqui)
  - Onde isso aparece no site: cartão da Formação (`[ano de início]`, `[previsão de conclusão]`) e
    marcos do cartão "Minha trajetória" (`[ano]`). Sem resposta, nenhuma data aparece.
  - Arquivo/campo: `src/content/pt.ts` → `formacao.anoInicio`, `formacao.previsao`,
    `sobre.trajetoria.ano` (e os mesmos campos em `src/content/en.ts`: `[start year]`,
    `[expected graduation]`, `[year]`).

- [ ] **P-06 — (só se existirem) Cursos e certificações concluídos**
  - O que preciso: para cada um, nome, instituição, ano e link do certificado. Não inventar: se não
    houver nenhum, deixe em branco.
  - Resposta: (escreva aqui)
  - Onde isso aparece no site: marco futuro da Formação (placeholder `[cursos e certificações]`). O
    texto "Cursos, certificações e novas conquistas entrarão aqui." continua visível enquanto isso.
  - Arquivo/campo: ainda não existe campo; com a resposta, entra uma chave nova no Anexo A.10 do
    doc 05 e em `src/content/pt.ts` → grupo `formacao` (o texto `formacao.futuro` continua).

## C. Arquivos pessoais

- [ ] **P-07 — (opcional) Currículo em PDF**
  - O que preciso: o PDF do seu currículo e onde você quer o botão "Baixar currículo".
  - Resposta: ☐ Hero ☐ Contato ☐ Não quero
  - Onde isso aparece no site: botão "Baixar currículo" (placeholder `[link do currículo em PDF]`).
    Hoje o botão não existe.
  - Arquivo/campo: arquivo em `public/` + campo novo `curriculoPdf` em `src/content/site.ts`
    (diário da C-04) + chave nova do rótulo do botão no Anexo A e em `src/content/pt.ts`.

- [ ] **P-08 — (opcional) Foto**
  - O que preciso: dizer se quer manter o monograma "YE" ou enviar uma foto.
  - Resposta: ☐ Quero manter o "YE" ☐ Vou enviar foto
  - Onde isso aparece no site: hero (no lugar do monograma "YE"; placeholder `[foto]`).
  - Arquivo/campo: arquivo em `public/` + campo novo `foto` em `src/content/site.ts` (diário da
    C-04).

- [ ] **P-09 — (opcional) Cidade e modalidade de trabalho**
  - O que preciso: cidade e modalidade (presencial, remoto ou híbrido). Hoje **não aparecem**.
  - Resposta: ☐ Manter sem ☐ Incluir: (escreva aqui)
  - Onde isso aparece no site: seção Contato (só se você pedir para incluir).
  - Arquivo/campo: campos novos `cidade` e `modalidade` em `src/content/site.ts` (diário da C-04)
    - chaves novas no Anexo A.12 e em `src/content/pt.ts` → grupo `contato`.

## D. Inteligência Artificial (novo)

- [ ] **P-IA-1 — Quais ferramentas ou tecnologias de IA você realmente estuda ou já usou?**
  - O que preciso: nomes de bibliotecas, cursos ou plataformas que você de fato estudou ou usou.
    Nada será listado em "Habilidades" sem a sua resposta.
  - Resposta: (escreva aqui)
  - Onde isso aparece no site: chips do card "Inteligência Artificial" em Áreas de interesse (hoje
    sem chips) e, se você quiser, um chip em Habilidades (placeholder
    `[ferramentas de IA que estuda]`, que hoje não aparece em lugar nenhum).
  - Arquivo/campo: `src/content/pt.ts` → `interesses.ia.chips` (lista vazia hoje; e o mesmo campo em
    `src/content/en.ts`). Para Habilidades ainda não existe chave: o Anexo A.8 do doc 05 não tem
    campo para o placeholder `[ferramentas de IA que estuda]`, então entra uma chave nova no grupo
    `habilidades` junto com a sua resposta.

- [ ] **P-IA-2 — Aprovar os textos sugeridos de IA**
  - O que preciso: marque ✔ para aprovar ou escreva a versão que prefere em cada linha.
    - [ ] Pílula do hero: "Dados · Cibersegurança · IA" (`hero.pilula`). Original do documento:
          "Dados · Cibersegurança · Desenvolvimento".
    - [ ] Subtítulo do hero: "Estudante de Ciência da Computação apaixonada por tecnologia, dados,
          cibersegurança e inteligência artificial." (`hero.subtitulo`)
    - [ ] Faixa de destaques: "3 — áreas de estudo: Dados, Cibersegurança e IA"
          (`destaques.areas.valor`, `destaques.areas.legenda`). Original: "2 — áreas de foco: Dados e
          Cibersegurança".
    - [ ] Card "Inteligência Artificial" com selo "Em estudo" e o texto "Fundamentos de
          Inteligência Artificial e aprendizado de máquina, e como aplicá-los a dados e à
          segurança." (`interesses.ia.titulo`, `interesses.seloEstudo`, `interesses.ia.texto`)
    - [ ] Trilha "IA": Fundamentos de IA → Machine Learning → IA aplicada a Dados → IA aplicada à
          Segurança (`objetivos.trilhaIA.nome`, `objetivos.trilhaIA.etapas`)
    - [ ] Card "Projeto de IA — em breve" (`projetos.ia.titulo`): ☐ manter ☐ remover
    - [ ] Descrição para o Google: "Yanni Elyssa é estudante de Ciência da Computação com interesse
          em Dados, Cibersegurança e Inteligência Artificial." (`meta.description`)
    - [ ] Imagem de compartilhamento: manter "Dados e Cibersegurança" ou trocar para "Dados ·
          Cibersegurança · IA"? (`meta.ogFrase`, `meta.ogAlt`) ☐ Manter ☐ Trocar
    - [ ] Frase do rodapé: manter "Estudante de Ciência da Computação. Dados e Cibersegurança." ou
          incluir IA? (`rodape.frase`) ☐ Manter ☐ Incluir IA
  - Resposta: (escreva aqui o que quiser mudar)
  - Onde isso aparece no site: hero, faixa de destaques, Áreas de interesse, Onde quero chegar,
    Projetos (card "em breve"), resultado do Google, imagem de compartilhamento e rodapé.
  - Arquivo/campo: `src/content/pt.ts` (as chaves entre parênteses acima) e
    `src/content/sugeridos.ts` (cada chave aprovada sai do registro `SUGERIDOS`). "Remover" o card de
    IA = `src/lib/flags.ts` → `SHOW_AI_COMING_SOON_CARD` = `false`. Trocar a imagem de
    compartilhamento = `meta.ogFrase` + `npm run build:og` (gera `public/og-image.png`).

- [ ] **P-IA-3 — Você já tem (ou vai fazer) um projeto de IA real?**
  - O que preciso: se sim, nome, descrição curta (1 a 3 frases), tecnologias e link do GitHub. Até
    lá fica o card "em breve" (ou nenhum, se preferir na P-IA-2).
  - Resposta: (escreva aqui)
  - Onde isso aparece no site: grade de Projetos (o projeto real entra no lugar do card "em breve").
  - Arquivo/campo: `src/content/projects.ts` → novo objeto no array `PROJECTS` (ficha do §14) e
    `CARD_IA` / `src/lib/flags.ts` → `SHOW_AI_COMING_SOON_CARD` = `false` quando ele entrar.

## E. Textos sugeridos do próprio documento e do design

- [ ] **P-10 — Aprovar ou ajustar os textos sugeridos**
  - O que preciso: marque ✔ para aprovar ou escreva a versão que prefere em cada linha.
    - [ ] "Próximo passo: aprofundar projetos em Dados e Cibersegurança", 3º marco da "Minha
          trajetória" (`sobre.trajetoria.marcos`, só o 3º item)
    - [ ] "Aberta a oportunidades de estágio em tecnologia." na seção Contato
          (`contato.disponibilidade`)
    - [ ] Chips dos cards de interesse, montados só com palavras do texto de cada card (DV-14).
          Hoje: Dados → SQL, Banco de Dados, Governança de Dados (`interesses.dados.chips`);
          Cibersegurança → Segurança da Informação, Redes, Proteção de Dados
          (`interesses.ciber.chips`); Desenvolvimento → Python, Git/GitHub, Automação
          (`interesses.dev.chips`). Para Dados, o design propõe SQL, Governança, Qualidade de dados.
          Escolha: ☐ a do plano ☐ a do design ☐ outra: (escreva aqui)
    - [ ] Selo "Em destaque" no painel do projeto principal (`projetos.emDestaque`, DV-7)
    - [ ] Rótulos "Trilha 1", "Trilha 2" e "Trilha 3" nas trilhas de "Onde quero chegar"
          (`objetivos.trilhaRotulo`, DV-11)
    - [ ] Página de erro (endereço que não existe): título "Página não encontrada"
          (`erro404.titulo`) e botão "Voltar ao início" (`erro404.voltar`)
  - Resposta: (escreva aqui o que quiser mudar)
  - Onde isso aparece no site: Sobre mim, Contato, Áreas de interesse, Projetos, Onde quero chegar
    e a página de erro 404.
  - Arquivo/campo: `src/content/pt.ts` (as chaves entre parênteses acima) e
    `src/content/sugeridos.ts` (cada chave aprovada sai do registro `SUGERIDOS`). Os textos da
    página de erro também são copiados para `public/404.html` (task D-03).

- [ ] **P-11 — Legenda do número de projetos na faixa de destaques**
  - O que preciso: aprovar "projetos publicados no GitHub" (e "projeto publicado no GitHub" quando
    for 1). Enquanto nenhum projeto estiver publicado, o item não aparece (DV-13).
  - Resposta: ☐ Aprovo ☐ Prefiro: (escreva aqui)
  - Onde isso aparece no site: faixa de destaques, logo abaixo do hero.
  - Arquivo/campo: `src/content/pt.ts` → `destaques.projetos.legenda` e `src/content/sugeridos.ts`.

- [ ] **P-12 — (opcional, versão 2) Revisar as traduções novas em inglês**
  - O que preciso: revisar as traduções que o documento (§15) não trazia. Na versão 1 o site é só
    em português e não mostra o botão PT/EN, então esta revisão fica para a versão 2 (task C-03).
  - Resposta: (escreva aqui)
  - Onde isso aparece no site: versão em inglês (só na versão 2).
  - Arquivo/campo: `src/content/en.ts` → as chaves marcadas `nova`/`nova-IA` em `TRADUCAO_EN`
    (`src/content/metadados.ts`); a lista completa sai em
    `node scripts/list-pendencias.mjs --traducoes`. Também
    as traduções "nova" das fichas (Anexo A.9), que ficam em `src/content/projects.ts` →
    `etiqueta.en` e `descricao.en` de cada projeto.

## F. Publicação do site

- [ ] **P-13 — Endereço do site**
  - O que preciso: confirmar o endereço escolhido na D-01 (24/09/2026): repositório
    `YanniMaia/Portifolio`, que gera `https://yannimaia.github.io/Portifolio/`.
  - Resposta: ☐ Confirmo ☐ Outro: (escreva aqui)
  - Onde isso aparece no site: endereço do site, link canônico, imagem de compartilhamento
    (`og:image`, `og:url`) e `sitemap.xml`.
  - Arquivo/campo: `src/site.config.ts` → `SITE_URL` e `BASE_PATH` (task D-02).
