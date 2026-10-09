# Matéria Prima · Passo Fundo

Prévia estática e responsiva da loja, em modo de demonstração. Produtos, preços, opções e fotos vêm da loja Matéria Prima de Guaíba e aparecem como referência. Os dados comerciais de Passo Fundo ainda não foram confirmados, e a prévia não vende nada.

## Prévia local

Na pasta do projeto, execute:

```sh
python -m http.server 4173 --bind 127.0.0.1
```

Depois abra `http://127.0.0.1:4173`. Não há dependências para instalar.

## O que esta versão faz

- Cabeçalho compacto com o logotipo oficial quadrado. Página inicial clara, com a mão segurando a creatina integrada à seção: o braço entra pela borda direita e pela base, sem caixa ou painel. Há dois caminhos: **Ver creatina Matéria Prima**, que abre a ficha do produto da foto, e **Explorar produtos**, que leva ao catálogo.
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
| `assets/hero/` | Imagem da página inicial: a mão aprovada, com o pote trocado pela foto oficial do produto. |
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

A composição aprovada (mão, pose e enquadramento) foi mantida. O pote gerado por IA tinha textos errados no rótulo, como "Mhts la Prmg", "NICE / % REAL / CURE" e "PREMITY". Por isso, ele foi trocado pela foto oficial do produto 1987, *Creatina Matéria Prima Pote 300g*.

Na versão de 9/10/2026 o pote passou a ter **escala proporcional (1,35 nos dois eixos)**, sem o alargamento de 4% da versão anterior. Ele tem a mesma largura do pote da composição aprovada, cobre o pote antigo por inteiro e não precisa de palma reconstruída; só alguns pixels de contorno entre dedo e pote foram completados. A arte final ainda precisa da aprovação do cliente.

Na página, a imagem não tem painel nem moldura. Ela fica ancorada na borda direita da tela, e parte do antebraço passa da base da seção, que corta o braço como uma foto sangrada. O tamanho vem de `--hand-w`, que acompanha a largura e a altura da tela (600 px em 1440 × 900, 680 px em telas acima de 1600 px e até 340 px no celular). A altura da página inicial acompanha esse tamanho, para o catálogo aparecer na primeira tela de notebooks como 1366 × 700. O centro do pote fica na altura do título.

**Entrada da mão:** ela começa totalmente abaixo da seção, fora do quadro, e sobe até a posição final. A subida dura 1,6 s, com a curva `cubic-bezier(0.33, 0.1, 0.2, 1)`: acelera aos poucos, chega à velocidade máxima perto de 30% do tempo e desacelera de forma contínua. Ao mesmo tempo, a mão gira de −5° para 0° em 1,8 s, a partir do antebraço, o que forma um arco curto, como o pulso assentando. Não há fade, zoom nem quique. A entrada começa 150 ms depois do carregamento da imagem, acontece uma vez e é desligada quando o sistema pede menos movimento. Se o JavaScript falhar, a imagem aparece sozinha depois de 4 s.

## Identidade e cores

- O logotipo é o arquivo oficial fornecido. Não há símbolo, monograma ou logotipo em texto criado para o site.
- A cor de destaque é o amarelo do próprio logotipo, `#F8C305`, aprovado no lugar do `#FFE62D` do cadastro de Guaíba. Os neutros não puxam para o quente: branco, `#FAFAF8` (página inicial e informações), `#F5F5F3` (aviso e faixa dos combos), `#EAEAE5` (linhas), `#202020` (texto e contornos) e `#666666` (texto secundário). Tons creme ou pêssego foram retirados.
- O CTA da creatina é amarelo; o do catálogo tem contorno preto.
- O amarelo aparece no botão principal, na categoria ativa, no contador da sacola, no sabor escolhido, nos marcadores dos combos e no traço dos títulos de seção.

## Endereço com filtros

A vitrine guarda categoria, busca e ordem no endereço, por exemplo `?categoria=whey&busca=chocolate&ordem=price-low`. Assim dá para compartilhar um link que já abre filtrado.

## Publicação

O fluxo `.github/workflows/pages.yml` só publica com push na `main`. A ação `upload-pages-artifact` aceita uma única pasta, então o fluxo agora junta os arquivos públicos em `_site` antes do upload. Nada foi publicado.

## Skills usadas no desenvolvimento

`frontend-design` e `superpowers` (já instaladas), `web-design-guidelines` (vercel-labs/agent-skills), `cro` e `copywriting` (coreyhaines31/marketingskills). As três últimas foram instaladas no projeto com `npx skills add … -a claude-code` e ficam em `.claude/skills/`, fora do Git.
