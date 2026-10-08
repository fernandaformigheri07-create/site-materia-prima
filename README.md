# Matéria Prima · Passo Fundo

Primeira versão estática e responsiva da vitrine. O catálogo, os preços, as opções e as fotos vieram da loja de Guaíba e aparecem identificados como referência. Os dados comerciais de Passo Fundo continuam em confirmação.

## Prévia local

Na pasta `site-materia-prima`, execute:

```sh
python3 -m http.server 4173 --bind 127.0.0.1
```

Abra a prévia local no navegador da sessão na porta `4173`. O ambiente de desenvolvimento não precisa instalar dependências.

## O que funciona nesta versão

- Navegação responsiva e atalhos para destaques, catálogo e compra.
- Busca de produto e opção/sabor, filtro por categoria e ordenação por preço ou nome.
- Detalhe de produto com fotos, descrição e opções lidas da ficha C10.
- Sacola com quantidades e subtotal; conteúdo do carrinho permanece no `localStorage` deste navegador.
- Revisão demonstrativa de entrega ou retirada e escolha de uma forma de pagamento cadastrada em Guaíba.
- Campos de endereço são apenas para demonstração: use dados fictícios. Permanecem só na memória da página e limpam quando a revisão fecha.

O fluxo não envia pedido, não valida endereço ou cobertura, não calcula frete para Passo Fundo, não processa pagamento e não pede dados de cartão. As opções de Guaíba são referências separadas e não são assumidas como regras de Passo Fundo.

## Arquivos de dados

- [`catalogo.json`](./catalogo.json): 212 produtos, categorias, preços, opções, imagens locais e originais, links de origem, regras de recebimento e pagamentos da loja de referência.
- [`catalogo.csv`](./catalogo.csv): a mesma lista em formato de planilha.
- [`LEVANTAMENTO.md`](./LEVANTAMENTO.md): método, detalhes de checkout e regras de entrega/retirada/pagamento de Guaíba, estado das confirmações de Passo Fundo e perfis sociais.

A fonte consultada é [Matéria Prima Guaíba no C10](https://app.c10.site/301-materia-prima-guaiba). As 334 fotos do catálogo foram copiadas localmente e convertidas para WebP para carregar sem dependência do S3.
