# Levantamento: Matéria Prima Guaíba → primeira versão Passo Fundo

**Coleta:** 8 de outubro de 2026.  
**Estado:** catálogo e regras do cadastro de Guaíba consultados; dados da unidade Passo Fundo e perfis oficiais no Instagram continuam sem confirmação.  
**Fontes:** [loja C10 de Guaíba](https://app.c10.site/301-materia-prima-guaiba), API pública `api.c10.site` e imagens públicas em `storage-cardapio10.s3.amazonaws.com`.

## Acesso e método

A ferramenta disponível nesta sessão permitia abrir um endereço no painel Codex, mas não controlar o Chrome conectado. Para manter a consulta verificável, usei requisições **GET** com TLS validado para a página pública, os dados da loja, a lista e a ficha individual dos itens; também examinei o bundle JavaScript público para entender as rotas de produto, CEP e endereço. Não fiz requisições de criação de pedido, cobrança, pagamento ou alteração de cadastro. A página de produto da C10 segue o padrão `/301-materia-prima-guaiba/item/{nome-codificado}`; os links individuais estão no catálogo abaixo.

O checkout original não pôde ser percorrido visualmente no Chrome nesta sessão. Os detalhes de entrega, endereço e pagamento foram extraídos da API pública e do fluxo cliente estático; a etapa de revisão foi reproduzida nesta prévia sem enviar dados.

## Catálogo da referência

- A API retornou **32 categorias**, sendo **28 com itens**, e **212 produtos ativos** na lista consultada.
- Cada produto tem um preço base. A API não indicou preço promocional nos itens consultados.
- **107 produtos** têm um grupo de opções. Os grupos são sabores de whey, sabores disponíveis ou cores disponíveis; as opções cadastradas têm acréscimo `R$ 0,00`. As regras de escolha (mínimo, máximo e múltiplas opções) foram preservadas.
- A propriedade `brand` veio vazia (`null`) em todos os itens. O campo marca fica como “não informada no cadastro”; nomes que contêm uma marca continuam exatamente como a loja os publicou.
- O cadastro não fornece estoque. A disponibilidade fica como **não confirmada**.
- As fichas individuais incluem descrição, opções, preço, categoria, imagens e identificador. Cada produto em [`catalogo.json`](./catalogo.json) tem link para a página de origem, link para a fonte da API e a unidade de origem (`guaiba`). [`catalogo.csv`](./catalogo.csv) também facilita consultar a lista em planilha.
- Foram baixadas as **334 fotos** encontradas nas fichas dos 212 produtos e convertidas para WebP local (até 1000 px; mantendo a foto de origem). Assim a prévia não depende do carregamento do host externo para exibir o catálogo. As URLs originais permanecem no JSON.
- O logotipo disponível na API identifica especificamente a unidade Guaíba, então não foi usado na identidade de Passo Fundo. A loja confirmou no manifesto/API a cor amarela `#FFE62D`, aplicada junto ao preto, branco e Montserrat.

Quatro itens aparecem na seleção inicial para mostrar categorias distintas: creatina Matéria Prima refil 300 g, Uêvo Proteína refil 1 kg, Beast Kaos 3vs e Combo 20. Essa seleção é uma escolha de apresentação, **não** um ranking de vendas ou confirmação de preferência dos clientes.

## Entrega e retirada vistos em Guaíba

A configuração do C10 registra os seguintes dados para **Guaíba**. Eles são referência e não foram usados para calcular entrega em Passo Fundo:

- Formas ativas: **Entrega** e **Busca** (retirada); “Local” aparece inativa.
- Entrega por área/bairro (`deliveryType: area`) e validação de endereço ativada. O bundle consulta `GET /locations/cep/{CEP}`; para uma entrega por área, exige um bairro cadastrado e usa a taxa correspondente ao endereço.
- O cadastro traz `pickupTimeLimit: 15` e `deliveryTimeLimit: 60` minutos. São parâmetros do cadastro C10, não uma promessa de prazo para Passo Fundo.
- Os campos de endereço previstos no fluxo incluem CEP, rua, número, complemento, instruções e bairro/área. `demandCPF` está ativado em Guaíba; esse requisito não foi copiado como regra de Passo Fundo.
- Os valores de pedido mínimo configurados para entrega e retirada são `0`; o limite para entrega grátis também aparece como `0`. Isso significa que a API não informa um limite positivo; não foi interpretado como frete gratuito.
- O endereço de retirada cadastrado é **Rua Vinte de Setembro, 1435 – Centro, Guaíba – RS, CEP 92704-355**. Não é endereço da unidade Passo Fundo.
- A API traz horário de segunda a sexta, 09h–19h, e sábado, 10h–17h (`timezone: America/Sao_Paulo`). Não há horário de domingo. São os registros de Guaíba.
- Agendamento está habilitado na configuração do cadastro. A loja define intervalos de 60 a 2880 minutos.

### Taxas ativas em Guaíba

Há **44 áreas ativas**: 34 em Guaíba e 10 em Eldorado do Sul. A palavra **Passo Fundo** aparece em `area` de uma linha cuja cidade é **Guaíba**; é um bairro/área no cadastro da loja de Guaíba, não confirmação de atendimento na cidade de Passo Fundo.

| Cidade registrada na loja | Áreas ativas e valores cadastrados |
| --- | --- |
| Guaíba – RS | Centro R$ 4,00; Parque 35 R$ 5,00; São Jorge R$ 8,00; demais áreas listadas abaixo R$ 6,00 |
| Eldorado do Sul – RS | Centro, Centro Novo, Chácara, Medianeira, Picada, Progresso, Residencial, Sans Souci, Sol Nascente e Vila Paz — R$ 20,00 cada |

**Áreas de Guaíba com taxa de R$ 6,00:** Alegria; Altos da Alegria; Alvorada; Bom Fim; Chácara das Paineiras; Cohab/Santa Rita; Colina; Columbia City; Coronel Nassuca; Engenho; Ermo; Fátima; Florida; Ipê; Jardim dos Lagos; Loteamento Neiva; Malessa; Noli; Nova Guaíba; Passo Fundo (área cadastrada dentro de Guaíba); Parque Florida; Parque das Laranjeiras; Primavera; Ramada; Shell; São Franscisco; Vera Cruz; Vila Elza; Vila Iolanda; Vila Jardim; Vila Nova.

Há ainda **12 áreas inativas** no cadastro de Eldorado do Sul, todas com R$ 10,00 registrado: Arrozeira; Cidade Verde; Delta; Ilha da Pintada; Ilha das Flores; Ilhas Park; Industrial; Irga; Itaí; Loteamento Popular; Parque Florida; Parque Guaíba. As áreas e taxas ativas/inativas completas também estão em `catalogo.json`.

Os valores acima vieram do campo `deliveryFees` do cadastro da loja. Não usei banners ou exemplos promocionais do C10 para inferir taxas.

## Pagamentos vistos em Guaíba

O cadastro da loja tem ativos:

| Grupo | Formatos cadastrados |
| --- | --- |
| Dinheiro | Dinheiro |
| Pix | Pix |
| Cartão | Hipercard; American Express; Visa crédito; Visa débito; Mastercard débito; Mastercard crédito; Elo débito; Elo crédito; Banricompras débito; Verde Card; Refeisul |

Os dados da unidade de Passo Fundo não confirmam essas opções. A prévia permite selecionar um formato para mostrar a revisão, mas não contém integração de pagamento, coleta de cartão, chave Pix, transação ou envio de pedido. Uma integração real exige conta/credenciais e configuração de cobrança da unidade Passo Fundo.

## Instagram e confirmação de Passo Fundo

Nenhum perfil foi presumido oficial. A API da loja não retornou links de Instagram; a busca do Instagram limitou consultas públicas com resposta HTTP 429, e a página de busca do Google serviu uma etapa JavaScript que não expôs resultados confiáveis nesta sessão. Não consegui confirmar perfis oficiais de Guaíba ou Passo Fundo nem publicações recentes da unidade de Passo Fundo.

Por isso, **não há produtos, preços, disponibilidade, endereço, horários, taxas, áreas atendidas ou meios de pagamento confirmados para Passo Fundo**. O catálogo apresentado no site está rotulado como referência de Guaíba. Os valores e regras locais devem ser substituídos ou confirmados antes de ativar venda real.

## Prévia construída

O site em [`index.html`](./index.html) tem navegação responsiva, seleção inicial enxuta, busca, 28 filtros de categoria, ordenação por preço/nome, detalhe de produto com fotos e opções, sacola persistida apenas neste navegador e revisão demonstrativa com entrega/retirada, taxas não aplicadas e formas de pagamento de referência.

O endereço de demonstração só permanece na memória da página, não é consultado nem enviado; os campos limpam ao fechar a revisão. Não há integração com C10 para criar pedidos ou pagamentos. A prévia não foi publicada.

## Segunda versão da prévia (9 de outubro de 2026)

A prévia foi reestruturada na branch `redesign-minimalista`:

- a vitrine passou a mostrar 100 produtos selecionados (`vitrine.json`), em vez de 4 destaques e um catálogo escondido;
- o passo de entrega e pagamento de demonstração saiu, e a sacola virou a revisão final;
- os dados de Guaíba continuam completos em `catalogo.json`. Fretes e pagamentos de Guaíba deixaram de aparecer na página.

Referência visual: gravação da loja C10 de Guaíba, com cartões horizontais em duas colunas, catálogo inteiro dividido por categorias e seletor de categoria fixo no topo.

### Pendências para a versão comercial

- Confirmar em Passo Fundo: produtos, preços, estoque, endereço, horários, áreas e taxas de entrega e formas de pagamento.
- Aprovar a imagem da página inicial: a mão aprovada com o pote trocado pela foto oficial do produto 1987, em escala proporcional.
- Revisar erros de digitação do cadastro de origem, mantidos como estão: "Penuat"/"Peanut", "Protrein", "Atlhetica", "Gormert", "Concetrado".
- Logotipo em alta resolução: o arquivo fornecido tem 150 × 150 px. No formato quadrado e com 52 px, o nome "Matéria Prima" fica pequeno; a marca é reconhecida pelo quadrado amarelo. Um SVG ou PNG em alta resolução melhora a nitidez, mas não aumenta o nome dentro do quadrado.
- Perfis oficiais em redes sociais (continuam sem confirmação).
