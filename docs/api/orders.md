# API de Pedidos

## Visão Geral

Endpoints para gerenciar e consultar informações sobre pedidos do sistema.

## Endpoints

### GET /api/orders

Lista todos os pedidos do usuário autenticado com filtros, ordenação e paginação.

#### Headers

```
Authorization: Bearer {token}
```

#### Query Parameters

- `page` (opcional): Número da página (padrão: 1)
- `limit` (opcional): Itens por página (padrão: 20)
- `status` (opcional): Filtrar por status do pedido (ex: `pending`, `confirmed`, `delivered`, `cancelled`)
- `storeId` (opcional): Filtrar por loja (UUID)
- `startDate` (opcional): Data inicial para filtro (formato ISO: `2025-11-01T00:00:00Z`)
- `endDate` (opcional): Data final para filtro (formato ISO: `2025-11-30T23:59:59Z`)
- `customerId` (opcional): Filtrar por cliente (apenas para merchants)

#### Comportamento por Tipo de Usuário

**Para Clientes (`type: "customer"`):**
- Retorna apenas pedidos do próprio cliente
- O `customerId` é obtido automaticamente do token
- Não é possível filtrar por outros clientes

**Para Merchants (`type: "merchant"`):**
- Pode filtrar por qualquer cliente usando `customerId`
- Pode filtrar por loja usando `storeId`
- Acesso a todos os pedidos das lojas associadas

#### Exemplo de Request (Cliente)

```
GET /api/orders?page=1&limit=20&status=pending&storeId=d3c3d99c-e221-4371-861b-d61743ffb09e
Authorization: Bearer {token}
```

#### Exemplo de Request (Merchant)

```
GET /api/orders?page=1&limit=20&customerId=uuid&storeId=uuid&status=delivered&startDate=2025-11-01T00:00:00Z&endDate=2025-11-30T23:59:59Z
Authorization: Bearer {token}
```

#### Exemplo de Response (200)

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "d3c3d99c-e221-4371-861b-d61743ffb09e",
        "store_id": "uuid",
        "customer_id": "uuid",
        "delivery_option_id": "uuid",
        "fulfillment_method": "delivery",
        "pickup_slot": null,
        "total_amount": 89.90,
        "delivery_fee": 10.00,
        "status": "pending",
        "payment_method": "credit_card",
        "payment_status": "paid",
        "estimated_delivery_time": "2025-11-19T18:00:00Z",
        "observations": "Entregar na portaria",
        "cancellation_reason": null,
        "deleted_at": null,
        "created_at": "2025-11-19T10:00:00Z",
        "updated_at": "2025-11-19T10:00:00Z",
        "store_name": "Kampai Sushi",
        "store_slug": "kampai-sushi",
        "customer_name": "João Silva",
        "customer_phone": "11999999999",
        "delivery_street": "Rua Exemplo",
        "delivery_number": "123",
        "delivery_neighborhood": "Centro",
        "delivery_city": "São Paulo",
        "delivery_state": "SP",
        "delivery_zip_code": "01234-567",
        "delivery_option_name": "Entrega Padrão",
        "delivery_option_fee": 10.00,
        "items_count": 3,
        "total_items": 5,
        "status_history": {
          "pending": "2025-11-19T10:00:00Z",
          "confirmed": "2025-11-19T10:05:00Z"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

#### Tratamento de Erros

- **401**: Não autenticado ou token inválido
- **500**: Erro interno do servidor

#### Funcionalidades Implementadas

✅ **Listagem completa de pedidos do usuário**
- Dados enriquecidos da view `orders_detailed`
- Inclui informações da loja, cliente e endereço de entrega

✅ **Filtros funcionais**
- Por status do pedido
- Por loja (`storeId`)
- Por período (`startDate` e `endDate`)
- Por cliente (`customerId` - apenas para merchants)

✅ **Ordenação**
- Ordenado por data de criação (mais recentes primeiro)
- `ORDER BY created_at DESC`

✅ **Paginação funcional**
- Suporte completo a paginação
- Retorna `hasNext` e `hasPrev` para navegação
- Calcula `totalPages` automaticamente

---

### POST /api/orders

Cria um novo pedido.

#### Headers

```
Authorization: Bearer {token}
Content-Type: application/json
```

#### Exemplo de Request

```json
{
  "store_id": "d3c3d99c-e221-4371-861b-d61743ffb09e",
  "delivery_option_id": "uuid-da-opcao-entrega",
  "fulfillment_method": "delivery",
  "payment_method": "credit_card",
  "items": [
    {
      "product_id": "uuid-do-produto",
      "quantity": 2,
      "unit_price": 29.90,
      "observations": "Sem cebola",
      "customizations": [
        {
          "customization_id": "uuid",
          "value": "valor ou quantidade"
        }
      ]
    }
  ],
  "delivery_address": {
    "street": "Rua Exemplo",
    "number": "123",
    "neighborhood": "Bairro",
    "city": "São Paulo",
    "state": "SP",
    "zip_code": "01234-567",
    "complement": "Apto 101"
  },
  "observations": "Entregar na portaria"
}
```

#### Exemplo de Response (201)

```json
{
  "success": true,
  "data": {
    "id": "d3c3d99c-e221-4371-861b-d61743ffb09e",
    "store_id": "d3c3d99c-e221-4371-861b-d61743ffb09e",
    "customer_id": "uuid-do-cliente",
    "delivery_option_id": "uuid-da-opcao-entrega",
    "fulfillment_method": "delivery",
    "pickup_slot": null,
    "total_amount": 89.90,
    "delivery_fee": 10.00,
    "status": "pending",
    "payment_method": "credit_card",
    "payment_status": "pending",
    "estimated_delivery_time": null,
    "observations": "Entregar na portaria",
    "cancellation_reason": null,
    "deleted_at": null,
    "created_at": "2025-11-19T10:00:00Z",
    "updated_at": "2025-11-19T10:00:00Z",
    "store_name": "Kampai Sushi",
    "store_slug": "kampai-sushi",
    "customer_name": "João Silva",
    "customer_phone": "11999999999",
    "delivery_street": "Rua Exemplo",
    "delivery_number": "123",
    "delivery_neighborhood": "Bairro",
    "delivery_city": "São Paulo",
    "delivery_state": "SP",
    "delivery_zip_code": "01234-567",
    "delivery_option_name": "Entrega Padrão",
    "delivery_option_fee": 10.00,
    "items_count": 3,
    "total_items": 5,
    "status_history": {
      "pending": "2025-11-19T10:00:00Z"
    }
  },
  "timestamp": "2025-11-19T10:00:00Z"
}
```

#### Tratamento de Erros

- **401**: Não autenticado ou token inválido
- **403**: Apenas clientes podem criar pedidos
- **400**: Dados inválidos, loja não encontrada ou não ativa
- **404**: Cliente não encontrado
- **422**: Validação de dados falhou (Zod validation)

#### Erros Comuns

- `"Loja não encontrada"` - A loja especificada não existe ou foi deletada
- `"Loja não está ativa"` - A loja existe mas não está ativa
- `"Loja não aceita entregas"` - A loja não tem delivery habilitado
- `"Loja não aceita retiradas"` - A loja não tem pickup habilitado
- `"Loja não aceita pagamento via {método}"` - O método de pagamento não é aceito pela loja
- `"Um ou mais produtos não foram encontrados"` - Produto(s) não existem ou foram deletados
- `"Produto não pertence à loja especificada"` - Produto não pertence à loja do pedido
- `"Um ou mais produtos não estão ativos"` - Produto(s) existem mas não estão ativos
- `"Valor mínimo do pedido é R$ X.XX"` - O subtotal não atinge o valor mínimo da loja

#### Status de Desenvolvimento

✅ **Esta funcionalidade está implementada e funcional**

Funcionalidades implementadas:

- ✅ Validação completa dos dados do pedido (Zod)
- ✅ Cálculo automático de totais
- ✅ Verificação de disponibilidade de produtos
- ✅ Criação de registro no banco de dados (transação)
- ✅ Criação de itens e customizações
- ✅ Criação de endereço de entrega
- ✅ Validação de métodos de pagamento e fulfillment
- ✅ Cálculo de taxa de entrega
- ✅ Aplicação de entrega grátis
- ✅ Validação de valor mínimo

Funcionalidades planejadas para o futuro:

- 🚧 Aplicação de descontos e promoções
- 🚧 Notificação para a loja
- 🚧 Integração com sistema de pagamento
- 🚧 Cálculo de tempo de preparo estimado
- 🚧 Verificação de estoque em tempo real

---

### GET /api/orders/[orderId]

Retorna os detalhes de um pedido específico (em desenvolvimento).

#### Parâmetros de URL

- `orderId` (obrigatório): UUID do pedido

#### Headers

```
Authorization: Bearer {token}
```

#### Exemplo de Request

```
GET /api/orders/d3c3d99c-e221-4371-861b-d61743ffb09e
Authorization: Bearer {token}
```

#### Exemplo de Response (200)

```json
{
  "success": true,
  "data": {
    "id": "d3c3d99c-e221-4371-861b-d61743ffb09e",
    "userId": "uuid-do-usuario-autenticado"
  }
}
```

#### Tratamento de Erros

- **401**: Não autenticado ou token inválido
- **404**: Pedido não encontrado ou sem permissão para acessar
- **422**: Parâmetro orderId inválido ou ausente

#### Status de Desenvolvimento

⚠️ **Esta funcionalidade está em desenvolvimento**

Atualmente, a rota retorna apenas o ID do pedido. As seguintes funcionalidades estão planejadas:

- Dados completos do pedido da view `orders_detailed`
- Itens do pedido da view `order_items_complete`
- Histórico de status do pedido
- Informações de entrega
- Dados de pagamento
- Tempo estimado de entrega atualizado
- Rastreamento do pedido

---

### PUT /api/orders/[orderId]

Atualiza um pedido existente (em desenvolvimento).

#### Parâmetros de URL

- `orderId` (obrigatório): UUID do pedido

#### Headers

```
Authorization: Bearer {token}
Content-Type: application/json
```

#### Exemplo de Request

```json
{
  "status": "preparing",
  "observations": "Pedido em preparo",
  "estimated_delivery_time": "2025-11-19T18:00:00Z"
}
```

#### Exemplo de Response (200)

```json
{
  "success": true,
  "data": {
    "id": "d3c3d99c-e221-4371-861b-d61743ffb09e",
    "payload": {
      "status": "preparing",
      "observations": "Pedido em preparo",
      "estimated_delivery_time": "2025-11-19T18:00:00Z"
    },
    "updatedBy": "uuid-do-usuario-autenticado"
  }
}
```

#### Tratamento de Erros

- **401**: Não autenticado ou token inválido
- **403**: Sem permissão para atualizar o pedido
- **404**: Pedido não encontrado
- **422**: Dados inválidos ou parâmetro orderId ausente

#### Status de Desenvolvimento

⚠️ **Esta funcionalidade está em desenvolvimento**

Atualmente, a rota apenas retorna os dados enviados sem processamento. As seguintes funcionalidades estão planejadas:

- Atualização de status do pedido
- Validação de transições de status permitidas
- Atualização de tempo estimado de entrega
- Adição de observações
- Cancelamento de pedido (com validações)
- Reembolso automático quando aplicável
- Notificação ao cliente sobre mudanças
- Histórico de alterações

## Estrutura de Dados

### View orders_detailed

A view `orders_detailed` fornece dados enriquecidos dos pedidos, incluindo:

- Dados básicos do pedido (id, store_id, customer_id)
- Informações de entrega (delivery_option_id, fulfillment_method)
- Status e pagamento (status, payment_method, payment_status)
- Dados da loja (store_name, store_slug)
- Dados do cliente (customer_name, customer_phone)
- Endereço de entrega completo
- Opção de entrega (delivery_option_name, delivery_option_fee)
- Estatísticas (items_count, total_items)
- Histórico de status (status_history)

### View order_items_complete

A view `order_items_complete` fornece dados enriquecidos dos itens do pedido:

- Dados do item (id, order_id, product_id)
- Informações do produto (product_name, product_family, product_image_url)
- Quantidade e preços (quantity, unit_price, unit_cost_price, total_price)
- Observações do item
- Status do pedido relacionado
- Customizações aplicadas (customizations)

### Status de Pedido (order_status_enum)

- `pending` - Pendente
- `confirmed` - Confirmado
- `preparing` - Em preparo
- `ready` - Pronto
- `out_for_delivery` - Saiu para entrega
- `delivered` - Entregue
- `cancelled` - Cancelado
- `refunded` - Reembolsado

### Método de Pagamento (payment_method_enum)

- `credit_card` - Cartão de crédito
- `debit_card` - Cartão de débito
- `pix` - PIX
- `cash` - Dinheiro

### Status de Pagamento (payment_status_enum)

- `pending` - Pendente
- `paid` - Pago
- `failed` - Falhou
- `refunded` - Reembolsado

### Método de Atendimento (fulfillment_method_enum)

- `delivery` - Entrega
- `pickup` - Retirada

## Funcionalidades Sugeridas para Implementação

### Filtros e Busca

- ✅ Filtro por status do pedido
- ✅ Filtro por loja
- ✅ Filtro por período (data inicial e final)
- ✅ Busca por número do pedido
- ✅ Filtro por método de pagamento
- ✅ Filtro por método de atendimento

### Ordenação

- ✅ Por data de criação (mais recente primeiro)
- ✅ Por valor total (maior/menor)
- ✅ Por status
- ✅ Por loja

### Relatórios e Estatísticas

- ✅ Total de pedidos por período
- ✅ Valor total de pedidos
- ✅ Pedidos por status
- ✅ Pedidos por loja
- ✅ Tempo médio de entrega
- ✅ Taxa de cancelamento

### Notificações

- ✅ Notificação ao cliente quando pedido é confirmado
- ✅ Notificação quando pedido sai para entrega
- ✅ Notificação quando pedido é entregue
- ✅ Notificação de cancelamento
- ✅ Notificação de mudança de status

### Integrações

- ✅ Integração com gateway de pagamento
- ✅ Integração com sistema de entrega
- ✅ Webhook para notificações externas
- ✅ Integração com sistema de avaliação

### Validações

- ✅ Validação de estoque antes de criar pedido
- ✅ Validação de valor mínimo do pedido
- ✅ Validação de horário de funcionamento da loja
- ✅ Validação de endereço de entrega
- ✅ Validação de método de pagamento aceito pela loja

## Notas Importantes

- Todas as rotas de pedidos requerem autenticação
- Clientes só podem acessar seus próprios pedidos
- Merchants podem acessar pedidos de suas lojas
- A view `orders_detailed` está disponível no schema `views`
- A view `order_items_complete` está disponível no schema `views`
- Soft delete é utilizado (campo `deleted_at`)

## Status de Implementação

### ✅ Implementado

- **GET /api/orders** - Listagem completa com filtros, ordenação e paginação
  - Filtros por status, loja, data e cliente
  - Ordenação por data de criação
  - Paginação funcional
  - Dados enriquecidos da view `orders_detailed`
  - Suporte para clientes e merchants

- **POST /api/orders** - Criação de Pedido
  - ✅ Validação completa de dados (Zod)
  - ✅ Validação de loja (existência, status, métodos aceitos)
  - ✅ Validação de produtos (existência, loja, status)
  - ✅ Cálculo automático de totais
  - ✅ Cálculo de taxa de entrega
  - ✅ Aplicação de entrega grátis
  - ✅ Validação de valor mínimo
  - ✅ Criação no banco de dados (transação)
  - ✅ Criação de itens e customizações
  - ✅ Criação de endereço de entrega
  - ✅ Retorno de dados enriquecidos

### 🚧 Em Desenvolvimento

1. **POST /api/orders** - Melhorias futuras
   - Verificação de estoque
   - Aplicação de descontos e promoções
   - Notificações para a loja
   - Integração com sistema de pagamento
   - Cálculo de tempo de preparo estimado

2. **GET /api/orders/[orderId]** - Detalhes do Pedido
   - Dados completos da view
   - Itens do pedido (view `order_items_complete`)
   - Histórico de status

3. **PUT /api/orders/[orderId]** - Atualização de Pedido
   - Mudança de status
   - Validação de transições
   - Notificações

