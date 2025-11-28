# Análise de Inconsistências - API de Pedidos

## 📋 Resumo Executivo

Este documento identifica inconsistências entre a **documentação** (`docs/api/orders.md`) e o **código implementado**, além de verificar se todas as **tabelas necessárias** existem no schema do Prisma.

**Data da Análise:** 2025-11-27  
**Última Atualização:** 2025-11-27  
**Documentação Analisada:** `docs/api/orders.md` (729 linhas)  
**Schema Analisado:** `prisma/schema.prisma`

### 📊 Resumo Rápido

- ✅ **3 endpoints críticos** - **IMPLEMENTADOS** (confirm, reject, confirm-delivery)
- ✅ **1 endpoint incompleto** - **RESOLVIDO** (PUT /api/stores/[storeId]/orders/[orderId])
- ✅ **2 inconsistências de dados** - **RESOLVIDAS** (status `refunded` adicionado aos enums)
- 🟡 **1 problema de permissões** - **PENDENTE** (GET não verifica merchants)
- ✅ **Todas as tabelas existem** no schema Prisma
- ✅ **Views SQL existem** no projeto (verificar se aplicadas no Supabase)

---

## 🔴 INCONSISTÊNCIAS CRÍTICAS

### 1. Endpoints Documentados mas NÃO Implementados

#### ❌ POST /api/orders/[orderId]/confirm
- **Status na Documentação:** 🚧 Em Desenvolvimento
- **Status no Código:** ❌ **NÃO EXISTE**
- **Localização Esperada:** `src/app/api/orders/[orderId]/confirm/route.ts`
- **Impacto:** Alto - Funcionalidade crítica para o fluxo de pedidos
- **Ação Necessária:** Criar rota e implementar lógica de confirmação

#### ❌ POST /api/orders/[orderId]/reject
- **Status na Documentação:** 🚧 Em Desenvolvimento
- **Status no Código:** ❌ **NÃO EXISTE**
- **Localização Esperada:** `src/app/api/orders/[orderId]/reject/route.ts`
- **Impacto:** Alto - Funcionalidade crítica para o fluxo de pedidos
- **Ação Necessária:** Criar rota e implementar lógica de rejeição

#### ❌ POST /api/orders/[orderId]/confirm-delivery
- **Status na Documentação:** 🚧 Em Desenvolvimento
- **Status no Código:** ❌ **NÃO EXISTE**
- **Localização Esperada:** `src/app/api/orders/[orderId]/confirm-delivery/route.ts`
- **Impacto:** Médio - Permite cliente confirmar recebimento
- **Ação Necessária:** Criar rota e implementar lógica de confirmação de entrega

---

### 2. ✅ Endpoint Implementado mas Incompleto - RESOLVIDO

#### ✅ PUT /api/stores/[storeId]/orders/[orderId]
- **Status na Documentação:** ✅ Implementado
- **Status no Código:** ✅ **IMPLEMENTADO E FUNCIONAL**
- **Localização:** `src/app/api/stores/[storeId]/orders/[orderId]/route.ts`
- **Solução Aplicada:** 
  - ✅ Rota movida para `/api/stores/[storeId]/orders/[orderId]` (seguindo padrão de separação merchants/customers)
  - ✅ Implementada lógica completa de atualização de status
  - ✅ Validação de transições de status permitidas
  - ✅ Verificação de permissões (apenas merchant dono da loja)
  - ✅ Registro no histórico de status
  - ✅ Suporte a `preparing`, `ready`, `out_for_delivery`, `delivered`
- **Impacto:** ✅ Resolvido - Status do pedido é atualizado corretamente
- **Data de Resolução:** 2025-11-27

---

### 5. Verificação de Permissões Incompleta no GET /api/orders/[orderId]

#### ⚠️ GET /api/orders/[orderId] - Permissões Apenas para Clientes
- **Problema:** O método `getOrderById` verifica permissões apenas para clientes
- **Código Atual:**
  ```typescript
  // Verifica se o usuário tem permissão (é o cliente do pedido)
  // Buscar customer pelo auth_user_id
  const customerQuery = `...`;
  // ❌ Não verifica se é merchant dono da loja
  ```
- **Documentação:** Diz que merchants podem acessar pedidos de suas lojas
- **Impacto:** Médio - Merchants não conseguem acessar pedidos de suas lojas via GET
- **Ação Necessária:** Adicionar verificação de permissão para merchants (verificar se é dono da loja)

---

## 🟡 INCONSISTÊNCIAS DE DADOS

### 3. Status `refunded` no Enum

#### ⚠️ Status `refunded` Documentado mas Não no Enum
- **Documentação:** Lista `refunded` como status possível
- **Schema Prisma:** Enum `orders_order_status_enum` NÃO contém `refunded`
- **Enum Atual:**
  ```prisma
  enum orders_order_status_enum {
    pending
    confirmed
    preparing
    ready
    out_for_delivery
    delivered
    cancelled
    // ❌ refunded está faltando
  }
  ```
- **Impacto:** Médio - Não é possível marcar pedido como reembolsado
- **Ação Necessária:** Adicionar `refunded` ao enum OU remover da documentação

### 4. Status `refunded` no Payment Status

#### ⚠️ Status `refunded` no Payment Status
- **Documentação:** Lista `refunded` como status de pagamento possível
- **Schema Prisma:** Enum `orders_payment_status_enum` NÃO contém `refunded`
- **Enum Atual:**
  ```prisma
  enum orders_payment_status_enum {
    pending
    paid
    failed
    // ❌ refunded está faltando
  }
  ```
- **Impacto:** Médio - Não é possível marcar pagamento como reembolsado
- **Ação Necessária:** Adicionar `refunded` ao enum OU remover da documentação

---

## 🟢 VERIFICAÇÕES DO SCHEMA PRISMA

### ✅ Tabelas Existentes e Corretas

#### Tabela `orders.orders`
- ✅ **Existe** no schema
- ✅ **Schema correto:** `orders`
- ✅ **Campos principais presentes:**
  - `id`, `store_id`, `customer_id`
  - `status` (enum: `orders_order_status_enum`)
  - `payment_method`, `payment_status`
  - `estimated_delivery_time`
  - `cancellation_reason`
  - `created_at`, `updated_at`, `deleted_at`

#### Tabela `orders.order_items`
- ✅ **Existe** no schema
- ✅ **Schema correto:** `orders`
- ✅ **Campos principais presentes**

#### Tabela `orders.order_item_customizations`
- ✅ **Existe** no schema
- ✅ **Schema correto:** `orders`

#### Tabela `orders.order_delivery_addresses`
- ✅ **Existe** no schema
- ✅ **Schema correto:** `orders`

#### Tabela `orders.order_status_history`
- ✅ **Existe** no schema
- ✅ **Schema correto:** `orders`
- ✅ **Campos presentes:**
  - `id`, `order_id`, `status`, `changed_by`, `note`, `created_at`

### ✅ Views Existentes

#### View `views.orders_detailed`
- ✅ **Existe** no schema
- ✅ **Usada no código** (`orders.service.ts`)

#### View `views.order_items_complete`
- ✅ **Existe** no schema
- ✅ **Usada no código** (`orders.service.ts`)

---

## 📊 RESUMO DE INCONSISTÊNCIAS

| Item | Tipo | Severidade | Status |
|------|------|------------|--------|
| POST /api/stores/[storeId]/orders/[orderId]/confirm | Endpoint faltando | 🔴 Crítica | ✅ **IMPLEMENTADO** |
| POST /api/stores/[storeId]/orders/[orderId]/reject | Endpoint faltando | 🔴 Crítica | ✅ **IMPLEMENTADO** |
| POST /api/orders/[orderId]/confirm-delivery | Endpoint faltando | 🟡 Média | ✅ **IMPLEMENTADO** |
| PUT /api/stores/[storeId]/orders/[orderId] | Implementação incompleta | 🔴 Crítica | ✅ **RESOLVIDO** |
| GET /api/orders/[orderId] | Permissões incompletas | 🟡 Média | ⚠️ Não verifica merchants |
| Status `refunded` em order_status | Enum faltando | 🟡 Média | ✅ Adicionado ao enum |
| Status `refunded` em payment_status | Enum faltando | 🟡 Média | ✅ Adicionado ao enum |

---

## 🔧 AÇÕES NECESSÁRIAS

### Prioridade ALTA 🔴 - ✅ RESOLVIDO

1. ✅ **Implementar POST /api/stores/[storeId]/orders/[orderId]/confirm** - **CONCLUÍDO**
   - ✅ Rota criada: `src/app/api/stores/[storeId]/orders/[orderId]/confirm/route.ts`
   - ✅ Lógica implementada no service (`confirmOrder`)
   - ✅ Validação de permissões (apenas merchant dono da loja)
   - ✅ Atualização de status para `confirmed`
   - ✅ Registro no histórico
   - ⏳ Integrar com Supabase Real-time (notificação) - Pendente

2. ✅ **Implementar POST /api/stores/[storeId]/orders/[orderId]/reject** - **CONCLUÍDO**
   - ✅ Rota criada: `src/app/api/stores/[storeId]/orders/[orderId]/reject/route.ts`
   - ✅ Lógica implementada no service (`rejectOrder`)
   - ✅ Validação de permissões (apenas merchant dono da loja)
   - ✅ Atualização de status para `cancelled`
   - ✅ Definição de `cancellation_reason` (obrigatório)
   - ✅ Registro no histórico
   - ⏳ Integrar com Supabase Real-time (notificação) - Pendente

3. ✅ **Completar PUT /api/stores/[storeId]/orders/[orderId]** - **CONCLUÍDO**
   - ✅ Rota movida e implementada: `src/app/api/stores/[storeId]/orders/[orderId]/route.ts`
   - ✅ Lógica de atualização de status implementada (`updateOrderStatus`)
   - ✅ Validação de transições de status permitidas
   - ✅ Registro no histórico
   - ⏳ Integrar com Supabase Real-time (notificação) - Pendente

### Prioridade MÉDIA 🟡 - ✅ RESOLVIDO

4. ✅ **Implementar POST /api/orders/[orderId]/confirm-delivery** - **CONCLUÍDO**
   - ✅ Rota criada: `src/app/api/orders/[orderId]/confirm-delivery/route.ts`
   - ✅ Lógica implementada no service (`confirmDelivery`)
   - ✅ Validação de permissões (apenas cliente dono do pedido)
   - ✅ Atualização de status para `delivered`
   - ✅ Registro no histórico
   - ✅ Suporte a avaliação e feedback opcionais

5. **Corrigir Permissões no GET /api/orders/[orderId]**
   - Adicionar verificação de permissão para merchants
   - Verificar se merchant é dono da loja do pedido
   - Permitir acesso se for cliente OU merchant dono da loja

6. **Decidir sobre status `refunded`**
   - **Opção A:** Adicionar `refunded` aos enums (recomendado se vai usar)
   - **Opção B:** Remover `refunded` da documentação (se não vai usar)

---

## 📝 SQL NECESSÁRIO (se optar por adicionar `refunded`)

### Adicionar `refunded` ao Enum `orders_order_status_enum`

```sql
-- Adicionar valor 'refunded' ao enum orders_order_status_enum
ALTER TYPE "orders"."order_status_enum" ADD VALUE 'refunded';
```

**⚠️ ATENÇÃO:** Uma vez adicionado um valor a um enum no PostgreSQL, ele **não pode ser removido**. Certifique-se de que realmente precisa deste status.

### Adicionar `refunded` ao Enum `orders_payment_status_enum`

```sql
-- Adicionar valor 'refunded' ao enum orders_payment_status_enum
ALTER TYPE "orders"."payment_status_enum" ADD VALUE 'refunded';
```

**⚠️ ATENÇÃO:** Uma vez adicionado um valor a um enum no PostgreSQL, ele **não pode ser removido**. Certifique-se de que realmente precisa deste status.

---

## ✅ VERIFICAÇÕES DE COMPATIBILIDADE

### Tabelas no Supabase

Todas as tabelas necessárias **existem no schema Prisma** e devem estar criadas no Supabase:

- ✅ `orders.orders` - Tabela principal de pedidos
- ✅ `orders.order_items` - Itens dos pedidos
- ✅ `orders.order_item_customizations` - Customizações dos itens
- ✅ `orders.order_delivery_addresses` - Endereços de entrega
- ✅ `orders.order_status_history` - Histórico de status

### Views no Supabase

- ✅ `views.orders_detailed` - View com dados enriquecidos
  - **Arquivo SQL:** `prisma/views/views/orders_detailed.sql`
  - **Status:** Arquivo existe no projeto
  - **Ação:** Verificar se a view está criada no Supabase

- ✅ `views.order_items_complete` - View com itens completos
  - **Arquivo SQL:** `prisma/views/views/order_items_complete.sql`
  - **Status:** Arquivo existe no projeto
  - **Ação:** Verificar se a view está criada no Supabase

**⚠️ IMPORTANTE:** As views SQL existem no projeto, mas é necessário verificar se foram aplicadas no banco de dados Supabase. Se não estiverem criadas, será necessário executar os arquivos SQL.

---

## 🎯 RECOMENDAÇÕES

1. **Implementar endpoints faltantes** antes de marcar como "Em Desenvolvimento" na documentação
2. **Decidir sobre `refunded`** - Se não vai usar, remover da documentação
3. **Completar PUT /api/orders/[orderId]** - Implementar lógica real
4. **Verificar views no Supabase** - Garantir que existem e estão atualizadas
5. **Implementar Supabase Real-time** - Configurar subscriptions para notificações

---

## 📌 PRÓXIMOS PASSOS

1. ✅ **Aprovar esta análise** - **CONCLUÍDO**
2. ✅ **Decidir sobre status `refunded`** - **RESOLVIDO** (adicionado aos enums)
3. ✅ **Implementar endpoints faltantes** - **CONCLUÍDO**
   - ✅ POST /api/stores/[storeId]/orders/[orderId]/confirm
   - ✅ POST /api/stores/[storeId]/orders/[orderId]/reject
   - ✅ POST /api/orders/[orderId]/confirm-delivery
4. ✅ **Completar PUT /api/stores/[storeId]/orders/[orderId]** - **CONCLUÍDO**
5. 🔄 **Corrigir permissões no GET /api/orders/[orderId]** - **PENDENTE**
   - Adicionar verificação de permissão para merchants
6. 🔄 **Verificar views no Supabase** (se necessário, aplicar SQL) - **PENDENTE**
7. ⏳ **Implementar Supabase Real-time** - **PENDENTE**
   - Configurar subscriptions para notificações em tempo real

---

**Data da Análise:** 2025-11-27  
**Última Atualização:** 2025-11-27  
**Versão da Documentação Analisada:** `docs/api/orders.md` (729 linhas)  
**Versão do Schema Analisado:** `prisma/schema.prisma`

---

## 📝 Histórico de Resoluções

### 2025-11-27 - Resolução da Inconsistência PUT /api/orders/[orderId]

**Problema Identificado:**
- PUT /api/orders/[orderId] existia mas não processava atualizações de status

**Solução Aplicada:**
- ✅ Rota movida para `/api/stores/[storeId]/orders/[orderId]` seguindo padrão de separação merchants/customers
- ✅ Implementada lógica completa de atualização de status no service (`updateOrderStatus`)
- ✅ Validação de transições de status permitidas
- ✅ Verificação de permissões (apenas merchant dono da loja)
- ✅ Registro no histórico de status
- ✅ Documentação atualizada

**Arquivos Modificados:**
- `src/app/api/stores/[storeId]/orders/[orderId]/route.ts` - Rota implementada
- `src/modules/orders/service/orders.service.ts` - Método `updateOrderStatus` implementado
- `src/modules/orders/controller/orders.controller.ts` - Controller `updateOrderStatus` implementado
- `src/modules/orders/schemas/update-order-status.schema.ts` - Schema de validação criado
- `docs/api/orders.md` - Documentação atualizada
- `docs/ANALISE_INCONSISTENCIAS_ORDERS.md` - Análise atualizada

