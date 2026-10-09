# Matéria Prima · Passo Fundo

Prévia estática e responsiva da loja, em modo de demonstração. Produtos, preços, opções e fotos vêm da loja Matéria Prima de Guaíba e aparecem como referência. Os dados comerciais de Passo Fundo ainda não foram confirmados, e a prévia não vende nada.

## Prévia local

Na pasta do projeto, execute:

```sh
python -m http.server 4173 --bind 127.0.0.1
```

Depois abra `http://127.0.0.1:4173`. Não há dependências para instalar.

## O que esta versão faz

- Cabeçalho na mesma superfície quente da página inicial, com o logotipo oficial quadrado, navegação centralizada e sacola. A mão segurando a creatina é a protagonista da página inicial: o braço entra pela borda direita e pela base, sem caixa ou painel. Há dois caminhos: **Ver creatina Matéria Prima**, que abre a ficha do produto da foto, e **Explorar produtos**, que leva ao catálogo.
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
| `assets/hero/` | Imagem da página inicial: a nova mão (composição fornecida em 9/10/2026) com o pote trocado pela foto oficial do produto 1987. `mao-creatina.webp` tem 1223 px; `mao-creatina-760.webp` é a versão menor. |
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

A imagem usada é a nova composição da mão fornecida em 9/10/2026, que tem contato físico mais convincente: os dedos passam na frente da base do pote e a palma o sustenta. O rótulo dessa imagem foi gerado por IA e tinha textos inventados ("MG / % RDV / CARB", selo "Qualidade 100% garantida", "Suplemento alimentar em pó"). Por isso, **só o pote foi substituído** pela foto oficial do produto 1987, *Creatina Matéria Prima Pote 300g*.

A montagem foi feita em camadas:

1. mão sem o pote da IA;
2. pote oficial em escala proporcional (1,413 nos dois eixos, mesma largura do pote original), com a base atrás da borda da palma;
3. dedos e palma que ficam na frente da base, recortados da imagem original. Só entra pele ligada à mão, o que evita que letras do rótulo antigo sejam confundidas com pele.

Nenhum texto do rótulo foi inventado ou redesenhado. A composição anterior fica guardada no histórico do Git.

Na página, a imagem não tem painel nem moldura. Ela fica ancorada na borda direita (6% do antebraço passa da tela) e a base da seção corta o braço como uma foto sangrada. O tamanho vem de `--hand-w`, que acompanha a largura e a altura da tela:

- 741 px em 1440 × 900;
- 600 px em 1366 × 700;
- 820 px em telas acima de 1600 px;
- até 420 px no celular;
- abaixo de 900 px a página inicial empilha texto e imagem.

**Movimento:** a versão animada (mão subindo pela base) foi testada e descartada. Como o pote fica acima da palma, qualquer entrada vertical mostra o pote subindo sozinho por cerca de meio segundo antes de a mão aparecer, o que parece montagem. A imagem é estática e aparece imediatamente. A gravação do teste está em `_referencia/capturas-v5/versao-B-animada-descartada.gif`, fora do Git.

## Identidade e cores

- O logotipo é o arquivo oficial fornecido, quadrado e sem alteração. Não há símbolo, monograma ou logotipo em texto criado para o site.
- A cor de destaque é o amarelo do próprio logotipo, `#F8C305`.
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
- Contraste verificado com `contrast_check.py` da CodeMakers-Design. Texto principal: 14,7:1 em `#F5F3EC`. Texto secundário: 5,8:1. Texto sobre amarelo: 9,9:1. Aviso: 13,6:1.

## Endereço com filtros

A vitrine guarda categoria, busca e ordem no endereço, por exemplo `?categoria=whey&busca=chocolate&ordem=price-low`. Assim dá para compartilhar um link que já abre filtrado.

## Publicação

O fluxo `.github/workflows/pages.yml` só publica com push na `main`. A ação `upload-pages-artifact` aceita uma única pasta, então o fluxo agora junta os arquivos públicos em `_site` antes do upload. Nada foi publicado.

## Skills usadas no desenvolvimento

`codemakers-design` (Code Makers, pacote fornecido), `frontend-design` e `superpowers` (já instaladas), `web-design-guidelines` (vercel-labs/agent-skills), `cro` e `copywriting` (coreyhaines31/marketingskills).

A CodeMakers-Design foi instalada a partir do ZIP fornecido em `.claude/skills/codemakers-design/`. Os seus 27 testes passaram. As skills da Vercel e da Corey Haines foram instaladas com `npx skills add … -a claude-code`. Todas ficam em `.claude/skills/`, fora do Git.
