# Matéria Prima · Passo Fundo

Prévia estática e responsiva da loja, em modo de demonstração. Produtos, preços, opções e fotos vêm da loja Matéria Prima de Guaíba e aparecem como referência. Os dados comerciais de Passo Fundo ainda não foram confirmados, e a prévia não vende nada.

## Prévia local

Na pasta do projeto, execute:

```sh
python -m http.server 4173 --bind 127.0.0.1
```

Depois abra `http://127.0.0.1:4173`. Não há dependências para instalar.

## O que esta versão faz

- Cabeçalho na mesma superfície quente da página inicial, com o logotipo oficial quadrado, navegação centralizada e sacola. A mão segurando a creatina é a protagonista da página inicial: o pote é o maior elemento da tela, as pontas dos dedos chegam ao meio da seção no computador e o braço sai pelo canto inferior direito, sem caixa ou painel. A imagem aparece direto na posição final, sem animação. Há dois caminhos: **Ver creatina Matéria Prima**, que abre a ficha do produto da foto, e **Explorar produtos**, que leva ao catálogo.
- Vitrine com **100 produtos** em 7 categorias, visível sem cliques extras. As categorias filtram a lista, e a barra de categorias fica fixa durante a rolagem.
- Busca por nome, marca, descrição ou sabor, sem diferenciar acentos nem maiúsculas. Também há ordenação por preço ou nome, contagem de resultados e um botão para limpar os filtros.
- Combos em seção própria, com a lista "o que vem no combo" tirada da descrição cadastrada.
- Detalhe do produto com fotos, sabores e cores. As opções obrigatórias são validadas antes de adicionar. As opcionais aceitam "Sem preferência".
- Sacola com quantidades (de 1 a 99), remoção, botão de esvaziar com confirmação e subtotal. Ela fica salva no `localStorage` deste navegador.
- Ao adicionar um produto, uma miniatura voa até o ícone da sacola e o contador confirma a mudança. A sacola não abre sozinha.

A prévia **não** tem checkout, frete, pagamento, CPF, endereço nem envio de pedidos. O antigo passo de entrega e pagamento de demonstração foi retirado. A sacola é a revisão final.

## Arquivos

| Arquivo | Conteúdo |
| --- | --- |
| [`catalogo.json`](./catalogo.json) | Fonte original: 212 produtos da loja de Guaíba. **Não é alterado** pela vitrine. |
| [`catalogo.csv`](./catalogo.csv) | A mesma lista em formato de planilha. |
| [`vitrine.json`](./vitrine.json) | Seleção da vitrine: grupos, ordem, IDs dos 100 produtos, critérios e nomes de exibição opcionais. |
| `assets/catalog/` | Fotos originais em WebP. A subpasta `thumbs/` guarda as miniaturas de 240 px usadas nos cartões. |
| `assets/hero/` | Imagem da página inicial: a mão aprovada (`8.webp`) com o pote trocado pela foto oficial do produto 1987. `mao-creatina-oficial.webp` tem 1254 px; `mao-creatina-oficial-860.webp` é a versão menor. |
| `assets/marca/` | Logotipo oficial fornecido (`logo-materia-prima-original.jpg`, 150 × 150 px), usado sem nenhuma alteração: 52 px no cabeçalho, 44 px no celular e no rodapé, e também como ícone da aba. |
| [`scripts/gerar-miniaturas.py`](./scripts/gerar-miniaturas.py) | Gera as miniaturas a partir de `vitrine.json` (precisa de Pillow). |
| [`LEVANTAMENTO.md`](./LEVANTAMENTO.md) | Método da coleta, regras de Guaíba e pendências de Passo Fundo. |

### Como trocar produtos da vitrine

1. Edite `productIds` do grupo em `vitrine.json`, usando IDs existentes em `catalogo.json`. A ordem da lista é a "Ordem padrão" do site.
2. Rode `python scripts/gerar-miniaturas.py`. Se faltar alguma miniatura, o site usa a foto original.

## Seleção da vitrine

| Grupo | Produtos | Categorias de origem |
| --- | ---: | --- |
| Combos promocionais | 15 | Combos promocionais |
| Creatinas | 15 | Creatinas 100% puras |
| Whey protein | 20 | Whey concentrado/blends, isolado/hidrolisado, doses |
| Pré-treinos | 15 | Pré-treino, pré-treino sem cafeína |
| Vitaminas e saúde | 10 | Multivitamínicos, vitaminas, ômega 3, colágeno, melatonina |
| Barras e alimentos | 10 | Barras de proteína, pastas de amendoim |
| Outros suplementos e acessórios | 15 | BCAA, beta-alanina, arginina, ZMA, termogênico, cafeína, hipercalórico, endurance, coqueteleira, galão, acessórios |
| **Total** | **100** | |

Todos os grupos tinham itens suficientes, então não foi preciso redistribuir a contagem. Os critérios estão em `vitrine.json`. Em resumo:

- só entraram itens do cadastro com foto e preço;
- buscamos variedade de marcas e formatos;
- limitamos itens quase iguais;
- preferimos combos com descrição clara;
- preferimos fotos em fundo branco quando havia equivalentes;
- diuréticos e pré-hormonais ficaram de fora da vitrine.

Nenhum dado de vendas ou popularidade foi usado.

## Imagem da página inicial

A base é a última imagem aprovada da mão (`8.webp`, fornecida em 9/10/2026): mão aberta oferecendo o pote, braço mais curto e pote ocupando 60% da largura da foto. O rótulo dessa imagem foi gerado por IA e tem textos que não existem no pote real ("MG / % RDV / CARB", selo "Qualidade 100% garantida", "Suplemento alimentar em pó"). Por isso, **só o pote foi substituído** pela foto oficial do produto 1987, *Creatina Matéria Prima Pote 300g* (`assets/catalog/item-1987-1.webp`, a mesma foto da ficha do produto).

A montagem foi feita em camadas, sem gerar nem redesenhar nenhuma letra:

1. **Mão sem o pote da IA.** A área do pote antigo é removida linha a linha. A faixa escura entre o dedo e o pote fica, porque é a sombra da fresta.
2. **Palma por trás do pote.** Onde o pote oficial, de base mais reta, deixa à mostra a palma que estava escondida, ela é reconstruída com a cor dos vizinhos e a textura da própria palma logo abaixo.
3. **Sombra de contato.** É a silhueta do pote, deslocada 7 px para baixo e desfocada, escurecendo a palma em até 32%.
4. **Pote oficial.** Escala uniforme de 1,778 nos dois eixos: a largura do corpo é igual à da base do pote da IA (754 px), e a base fica apoiada na mesma linha da palma. O contorno da foto oficial recebe a cor do interior, para não deixar filete branco sobre a pele.
5. **Dedos da frente.** Os dedos à esquerda passam na frente da base e foram recortados da imagem original. Só entra pele ligada à mão, e eles projetam uma sombra leve no pote, que apenas escurece, sem mexer no desenho do rótulo.

O pote oficial é mais alto que o da IA, então a imagem ganhou espaço no topo para a tampa não ser cortada. As composições anteriores ficam no histórico do Git; os arquivos de trabalho ficam em `_referencia/work-v7/`, fora do Git.

**Resolução.** A foto oficial tem 720 px, e o pote ocupa 424 px de largura nela. Na montagem, ele foi ampliado 1,78 vez, sem nitidez artificial e sem ampliação generativa. Na tela de 1440 px o pote aparece com cerca de 445 px de largura, quase 1:1 com os pixels reais da foto. Em telas de alta densidade (2x) ele fica um pouco suave. Para ficar nítido também nelas, é preciso uma foto oficial do pote com pelo menos 1000 px de largura.

Arquivos: `mao-creatina-oficial.webp` (1254 × 1406 px, 131 KB) e `mao-creatina-oficial-860.webp` (74 KB, usada em telas comuns).

**Na página.** A imagem não tem painel nem moldura e não tem animação: ela carrega direto na posição final. A largura e a altura vêm do HTML e do `aspect-ratio`, então o layout não pula. A base da seção corta a imagem a 83% da altura, como foto sangrada. Nessa linha o braço ainda não toca a borda direita do arquivo, então a imagem é posicionada pela ponta dos dedos (`--tip`) sem mostrar corte reto no antebraço. A largura (`--hand-w`) acompanha a largura e a altura da tela:

| Tela | Largura do pote | Pontas dos dedos |
| --- | --- | --- |
| 1440 × 900 | ~445 px | 50% da largura |
| 1366 × 700 | ~370 px (limitada pela altura) | 50% |
| 1280 × 800 | ~395 px | 50% |
| 1024 × 768 | ~315 px | 54% (o texto ocupa mais da largura) |
| 1920 × 1080 | ~517 px (imagem no máximo de 860 px) | 50% |
| tablet 768 | ~335 px, centralizado | — |
| celular 390 | ~234 px, centralizado | — |

Abaixo de 900 px a página inicial empilha texto e imagem, com o pote centralizado. No celular de 390 × 844 o pote inteiro, apoiado na palma, cabe na primeira tela.

A animação de entrada da mão foi **removida**. Não há fade, deslize, zoom nem atraso, e não há mais o script que esperava a imagem carregar. A animação da miniatura que voa até a sacola continua.

## Identidade e cores

- O logotipo é o arquivo oficial fornecido, quadrado e sem alteração. Não há símbolo, monograma ou logotipo em texto criado para o site.
- A cor de destaque é o amarelo do próprio logotipo, `#FBC501` (mediana dos pixels amarelos do arquivo oficial; antes era `#F8C305`, praticamente igual, trocado para o quadrado do logo se fundir sem emenda ao rodapé amarelo).
- As superfícies são de uma única família quente, sem tom rosado (o verde nunca fica abaixo do vermelho):

  | Cor | Onde aparece |
  | --- | --- |
  | `#F5F3EC` | cabeçalho, página inicial, combos e informações |
  | `#FAF9F5` | catálogo, mais calmo |
  | `#F2F0E8` | fundo das fotos de produto |
  | `#E7E4DA` | linhas |
  | `#8C887D` | borda dos controles, com contraste de pelo menos 3:1 |
  | `#202020` | texto e faixa de aviso |
  | `#5F5F5C` | texto secundário |

- O rodapé é uma faixa amarela que encerra a página; nela o quadrado do logotipo se funde ao fundo.
- O CTA da creatina é amarelo; o do catálogo tem contorno preto.
- Contraste verificado com `contrast_check.py` da CodeMakers-Design. Texto principal: 14,7:1 em `#F5F3EC`. Texto secundário: 5,8:1. Texto sobre amarelo: 10,2:1. Aviso: 13,6:1.

## Endereço com filtros

A vitrine guarda categoria, busca e ordem no endereço, por exemplo `?categoria=whey&busca=chocolate&ordem=price-low`. Assim dá para compartilhar um link que já abre filtrado.

## Publicação

A prévia está publicada em **https://fernandaformigheri07-create.github.io/site-materia-prima/**. A publicação foi feita em 15/10/2026, a pedido.

O GitHub Pages está configurado para servir direto do branch `redesign-minimalista` (opção "deploy from a branch", pasta raiz). O arquivo `.nojekyll` faz os arquivos serem servidos como estão. **Cada push nesse branch atualiza o site público.**

A `main` não foi alterada. O fluxo `.github/workflows/pages.yml` (push na `main`) não é usado enquanto o Pages estiver configurado assim.

## Skills usadas no desenvolvimento

`codemakers-design` (Code Makers, pacote fornecido), `frontend-design` e `superpowers` (já instaladas), `web-design-guidelines` (vercel-labs/agent-skills), `cro` e `copywriting` (coreyhaines31/marketingskills).

A CodeMakers-Design foi instalada a partir do ZIP fornecido em `.claude/skills/codemakers-design/`. Os seus 27 testes passaram. As skills da Vercel e da Corey Haines foram instaladas com `npx skills add … -a claude-code`. Todas ficam em `.claude/skills/`, fora do Git.
