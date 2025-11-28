# API de Pedidos

## Visão Geral

Endpoints para gerenciar e consultar informações sobre pedidos do sistema. O sistema utiliza **Supabase Real-time** para notificações em tempo real sobre mudanças de status dos pedidos.

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

#### Exemplo de Request

```
GET /api/orders?page=1&limit=20&status=pending&storeId=d3c3d99c-e221-4371-861b-d61743ffb09e
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

---

### POST /api/orders

Cria um novo pedido. O pedido é criado com status `pending` e aguarda confirmação da loja.

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
    "status": "pending",
    "total_amount": 89.90,
    "delivery_fee": 10.00,
    "payment_method": "credit_card",
    "payment_status": "pending",
    "created_at": "2025-11-19T10:00:00Z",
    "store_name": "Kampai Sushi",
    "store_slug": "kampai-sushi"
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

---

### GET /api/orders/[orderId]

Retorna os detalhes completos de um pedido específico, incluindo itens e customizações.

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
    "order": {
      "id": "d3c3d99c-e221-4371-861b-d61743ffb09e",
      "storeId": "45319ec5-7cb8-499b-84b0-896e812dfd2e",
      "customerId": "19bf8eff-14d9-468b-9a78-8908dcbf19da",
      "fulfillmentMethod": "delivery",
      "totalAmount": 135.80,
      "deliveryFee": 8.00,
      "status": "pending",
      "paymentMethod": "pix",
      "paymentStatus": "pending",
      "estimatedDeliveryTime": null,
      "observations": "Sem cebola",
      "createdAt": "2025-11-27T14:00:00.000Z",
      "updatedAt": "2025-11-27T14:00:00.000Z",
      "store": {
        "name": "Loja Exemplo",
        "slug": "loja-exemplo"
      },
      "customer": {
        "name": "João Silva",
        "phone": "11999999999"
      }
    },
    "items": [
      {
        "id": "item-uuid-1",
        "productId": "product-uuid-1",
        "productName": "Pizza Margherita",
        "quantity": 1,
        "unitPrice": 45.90,
        "totalPrice": 45.90,
        "customizations": []
      }
    ]
  },
  "timestamp": "2025-11-27T14:05:00.000Z"
}
```

#### Tratamento de Erros

- **401**: Não autenticado ou token inválido
- **403**: Sem permissão para acessar este pedido
- **404**: Pedido não encontrado
- **422**: Parâmetro orderId inválido ou ausente

---

### POST /api/orders/[orderId]/confirm

Confirma (aceita) um pedido pendente. Apenas a loja pode confirmar seus pedidos.

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
  "estimated_delivery_time": "2025-11-19T18:00:00Z",
  "observations": "Pedido confirmado, iniciando preparo"
}
```

**Campos:**
- `estimated_delivery_time` (opcional): Data/hora estimada de entrega/retirada
- `observations` (opcional): Observações sobre a confirmação

#### Exemplo de Response (200)

```json
{
  "success": true,
  "data": {
    "id": "d3c3d99c-e221-4371-861b-d61743ffb09e",
    "status": "confirmed",
    "estimated_delivery_time": "2025-11-19T18:00:00Z",
    "confirmed_at": "2025-11-19T10:05:00Z",
    "message": "Pedido confirmado com sucesso"
  },
  "timestamp": "2025-11-19T10:05:00Z"
}
```

#### Tratamento de Erros

- **401**: Não autenticado ou token inválido
- **403**: Sem permissão (não é dono da loja) ou pedido não está em `pending`
- **404**: Pedido não encontrado
- **409**: Pedido já foi confirmado ou cancelado
- **422**: Dados inválidos

#### Regras de Negócio

- ✅ Apenas pedidos com status `pending` podem ser confirmados
- ✅ Apenas o merchant dono da loja pode confirmar
- ✅ Ao confirmar, o status muda para `confirmed`
- ✅ Registra no histórico de status
- ✅ Cliente recebe notificação em tempo real via Supabase Real-time

---

### POST /api/orders/[orderId]/reject

Rejeita um pedido pendente. Apenas a loja pode rejeitar seus pedidos.

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
  "reason": "Produto fora de estoque",
  "observations": "Desculpe, não temos mais este produto disponível no momento"
}
```

**Campos:**
- `reason` (obrigatório): Motivo da rejeição (máximo 255 caracteres)
- `observations` (opcional): Observações adicionais

#### Exemplo de Response (200)

```json
{
  "success": true,
  "data": {
    "id": "d3c3d99c-e221-4371-861b-d61743ffb09e",
    "status": "cancelled",
    "cancellation_reason": "Produto fora de estoque",
    "rejected_at": "2025-11-19T10:03:00Z",
    "message": "Pedido rejeitado com sucesso"
  },
  "timestamp": "2025-11-19T10:03:00Z"
}
```

#### Tratamento de Erros

- **401**: Não autenticado ou token inválido
- **403**: Sem permissão (não é dono da loja) ou pedido não está em `pending`
- **404**: Pedido não encontrado
- **409**: Pedido já foi confirmado ou cancelado
- **422**: Dados inválidos (reason obrigatório)

#### Regras de Negócio

- ✅ Apenas pedidos com status `pending` podem ser rejeitados
- ✅ Apenas o merchant dono da loja pode rejeitar
- ✅ Ao rejeitar, o status muda para `cancelled`
- ✅ `cancellation_reason` é obrigatório
- ✅ Cliente recebe notificação em tempo real via Supabase Real-time

---

### POST /api/orders/[orderId]/confirm-delivery

Confirma o recebimento do pedido pelo cliente. Pode ser usado quando o pedido está em `out_for_delivery` ou `ready` (para pickup).

#### Parâmetros de URL

- `orderId` (obrigatório): UUID do pedido

#### Headers

```
Authorization: Bearer {token}
```

#### Exemplo de Request

```
POST /api/orders/d3c3d99c-e221-4371-861b-d61743ffb09e/confirm-delivery
Authorization: Bearer {token}
```

**Body (opcional):**
```json
{
  "rating": 5,
  "feedback": "Pedido entregue perfeitamente!"
}
```

#### Exemplo de Response (200)

```json
{
  "success": true,
  "data": {
    "id": "d3c3d99c-e221-4371-861b-d61743ffb09e",
    "status": "delivered",
    "delivered_at": "2025-11-19T18:15:00Z",
    "message": "Recebimento confirmado"
  },
  "timestamp": "2025-11-19T18:15:00Z"
}
```

#### Tratamento de Erros

- **401**: Não autenticado ou token inválido
- **403**: Sem permissão (não é dono do pedido) ou status inválido
- **404**: Pedido não encontrado
- **409**: Pedido já foi entregue ou cancelado
- **422**: Status do pedido não permite confirmação de recebimento

---

### PUT /api/orders/[orderId]

Atualiza o status de um pedido confirmado. Permite transições de status durante o processamento.

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
  "estimated_delivery_time": "2025-11-19T18:30:00Z",
  "observations": "Pedido em preparo, tempo estimado: 30 minutos"
}
```

**Campos:**
- `status` (obrigatório): Novo status do pedido (`preparing`, `ready`, `out_for_delivery`, `delivered`)
- `estimated_delivery_time` (opcional): Atualizar tempo estimado de entrega
- `observations` (opcional): Observações sobre a mudança de status

#### Exemplo de Response (200)

```json
{
  "success": true,
  "data": {
    "id": "d3c3d99c-e221-4371-861b-d61743ffb09e",
    "status": "preparing",
    "estimated_delivery_time": "2025-11-19T18:30:00Z",
    "updated_at": "2025-11-19T10:10:00Z",
    "message": "Status atualizado com sucesso"
  },
  "timestamp": "2025-11-19T10:10:00Z"
}
```

#### Tratamento de Erros

- **401**: Não autenticado ou token inválido
- **403**: Sem permissão para atualizar o pedido ou transição inválida
- **404**: Pedido não encontrado
- **409**: Transição de status não permitida
- **422**: Dados inválidos

#### Regras de Negócio

- ✅ Apenas loja pode atualizar status após confirmação
- ✅ Valida transições de status permitidas
- ✅ Registra todas as mudanças no histórico
- ✅ Cliente recebe notificação em tempo real via Supabase Real-time sobre mudanças

---

## Fluxo de Confirmação de Pedidos

### Visão Geral

Quando um pedido é criado, ele entra em um fluxo de confirmação onde a loja precisa aceitar ou rejeitar o pedido. O sistema implementa timeouts automáticos e utiliza **Supabase Real-time** para notificações instantâneas.

### Fase 1: Aguardando Confirmação da Loja (`pending`)

**Comportamento:**
- Pedido criado com status `pending`
- Loja recebe notificação em tempo real via Supabase Real-time sobre novo pedido
- Cliente aguarda confirmação

**Timeouts:**
- **Duração máxima**: **5 minutos** (300 segundos)
- **Ação após timeout**: Pedido é automaticamente cancelado pelo sistema
- **Alerta**: Loja recebe alerta quando pedido está há 4 minutos sem resposta

**Ações Disponíveis:**
- Loja pode **confirmar** (`POST /api/orders/[orderId]/confirm`)
- Loja pode **rejeitar** (`POST /api/orders/[orderId]/reject`)
- Sistema cancela automaticamente após 5 minutos sem resposta

**Notificações Real-time:**
- Cliente recebe notificação instantânea quando loja confirma/rejeita
- Loja recebe alerta de timeout próximo (4 minutos)
- Não é necessário polling - todas as atualizações são em tempo real

### Fase 2: Pedido Confirmado (`confirmed` → `delivered`)

**Comportamento:**
- Pedido confirmado pela loja
- Status muda para `confirmed`
- Loja atualiza status durante preparo e entrega

**Validação de Prazo:**
- Se `estimated_delivery_time` for ultrapassado em mais de **1 hora**, o sistema pode cancelar automaticamente
- Cliente e loja recebem notificações sobre atrasos

**Notificações Real-time:**
- Cliente recebe notificação instantânea em cada mudança de status:
  - `confirmed` → Pedido confirmado
  - `preparing` → Pedido em preparo
  - `ready` → Pedido pronto
  - `out_for_delivery` → Pedido saiu para entrega
  - `delivered` → Pedido entregue

### Timeouts Automáticos

#### Timeout de Confirmação (5 minutos)

**Regra:**
- Se pedido permanecer em `pending` por mais de **5 minutos** sem confirmação ou rejeição
- Sistema cancela automaticamente
- `cancellation_reason`: `"Pedido cancelado automaticamente: loja não respondeu em 5 minutos"`
- Status: `cancelled`
- Cliente recebe notificação em tempo real

#### Timeout de Prazo de Entrega

**Regra:**
- Se `estimated_delivery_time` for ultrapassado em mais de **1 hora**
- Sistema pode cancelar automaticamente (configurável)
- `cancellation_reason`: `"Pedido cancelado: prazo de entrega ultrapassado"`
- Status: `cancelled`
- Reembolso automático se pagamento já foi processado

---

## Supabase Real-time

O sistema utiliza **Supabase Real-time** para notificações instantâneas sobre mudanças nos pedidos, substituindo completamente a necessidade de polling.

### Funcionalidades

1. **Postgres Changes** - Escuta mudanças na tabela `orders.orders` em tempo real
2. **Broadcast** - Envia mensagens e alertas entre loja e cliente
3. **Presence** - Rastreamento de lojas online/offline

### Benefícios

- ✅ **Notificações instantâneas** (latência < 100ms)
- ✅ **Redução de 95%+ nas requisições** ao servidor
- ✅ **Melhor experiência do usuário** (atualizações instantâneas)
- ✅ **Menor carga no servidor** e banco de dados

### Como Funciona

**Para Clientes:**
- Subscription automática para mudanças em seus pedidos
- Notificações instantâneas quando status muda
- Não é necessário fazer polling

**Para Lojas:**
- Subscription automática para novos pedidos pendentes
- Notificações instantâneas quando novos pedidos chegam
- Alertas de timeout próximo em tempo real
- Dashboard atualizado automaticamente

**Detalhes técnicos de implementação:** Consulte a documentação técnica do Supabase Real-time no projeto.

---

## Estrutura de Dados

### Status de Pedido (order_status_enum)

- `pending` - **Aguardando Confirmação da Loja** - Pedido criado, aguardando loja aceitar ou rejeitar
- `confirmed` - **Confirmado** - Loja aceitou o pedido e está em processamento
- `preparing` - **Em Preparo** - Pedido está sendo preparado pela loja
- `ready` - **Pronto** - Pedido pronto para retirada/entrega
- `out_for_delivery` - **Saiu para Entrega** - Pedido em trânsito para o cliente
- `delivered` - **Entregue** - Pedido entregue ao cliente
- `cancelled` - **Cancelado** - Pedido cancelado (por loja, cliente ou timeout)
- `refunded` - **Reembolsado** - Pedido reembolsado

### Fluxo de Transições de Status

```
pending → confirmed → preparing → ready → out_for_delivery → delivered
   ↓           ↓           ↓
cancelled  cancelled  cancelled
```

**Regras de Transição:**
- `pending` → `confirmed`: Apenas loja pode confirmar
- `pending` → `cancelled`: Loja pode rejeitar OU timeout automático após 5 minutos
- `confirmed` → `preparing`: Apenas loja pode atualizar
- `preparing` → `ready`: Apenas loja pode atualizar
- `ready` → `out_for_delivery`: Apenas loja pode atualizar (apenas para delivery)
- `out_for_delivery` → `delivered`: Loja confirma entrega OU cliente confirma recebimento
- Qualquer status → `cancelled`: Com motivo obrigatório

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

---

## Notas Importantes

- Todas as rotas de pedidos requerem autenticação
- Clientes só podem acessar seus próprios pedidos
- Merchants podem acessar pedidos de suas lojas
- **Supabase Real-time** é utilizado para notificações em tempo real (não é necessário polling)
- **Timeouts automáticos** garantem que pedidos não fiquem travados
- **Validação de prazos** previne pedidos com prazo vencido

---

## Status de Implementação

### ✅ Implementado

- **GET /api/orders** - Listagem completa com filtros, ordenação e paginação
- **POST /api/orders** - Criação de pedido
- **GET /api/orders/[orderId]** - Detalhes do pedido

### 🚧 Em Desenvolvimento

- **POST /api/orders/[orderId]/confirm** - Confirmação de pedido
- **POST /api/orders/[orderId]/reject** - Rejeição de pedido
- **PUT /api/orders/[orderId]** - Atualização de status
- **POST /api/orders/[orderId]/confirm-delivery** - Confirmação de recebimento
- **Sistema de Timeouts Automáticos** - Jobs para cancelamento automático
- **Supabase Real-time** - Notificações em tempo real (Postgres Changes, Broadcast, Presence)
