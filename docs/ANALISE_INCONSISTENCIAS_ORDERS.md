# Análise de Inconsistências - API de Pedidos

## 📋 Resumo Executivo

Este documento identifica inconsistências entre a **documentação** (`docs/api/orders.md`) e o **código implementado**, além de verificar se todas as **tabelas necessárias** existem no schema do Prisma.

**Data da Análise:** 2025-11-27  
**Documentação Analisada:** `docs/api/orders.md` (699 linhas)  
**Schema Analisado:** `prisma/schema.prisma`

### 📊 Resumo Rápido

- 🔴 **3 endpoints críticos faltando** (confirm, reject, confirm-delivery)
- 🔴 **1 endpoint incompleto** (PUT /api/orders/[orderId])
- 🟡 **2 inconsistências de dados** (status `refunded`)
- 🟡 **1 problema de permissões** (GET não verifica merchants)
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

### 2. Endpoint Implementado mas Incompleto

#### ⚠️ PUT /api/orders/[orderId]
- **Status na Documentação:** 🚧 Em Desenvolvimento
- **Status no Código:** ⚠️ **EXISTE MAS NÃO PROCESSA**
- **Localização:** `src/app/api/orders/[orderId]/route.ts` (linhas 114-141)
- **Problema:** A rota apenas retorna o body recebido sem processar:
  ```typescript
  return ApiResponse.success({
    id: resolvedParams.orderId,
    payload: body,  // ❌ Apenas retorna o body, não processa
    updatedBy: context.user.id,
  });
  ```
- **Impacto:** Alto - Não atualiza status do pedido
- **Ação Necessária:** Implementar lógica de atualização de status com validações

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
| POST /api/orders/[orderId]/confirm | Endpoint faltando | 🔴 Crítica | ❌ Não existe |
| POST /api/orders/[orderId]/reject | Endpoint faltando | 🔴 Crítica | ❌ Não existe |
| POST /api/orders/[orderId]/confirm-delivery | Endpoint faltando | 🟡 Média | ❌ Não existe |
| PUT /api/orders/[orderId] | Implementação incompleta | 🔴 Crítica | ⚠️ Existe mas não processa |
| GET /api/orders/[orderId] | Permissões incompletas | 🟡 Média | ⚠️ Não verifica merchants |
| Status `refunded` em order_status | Enum faltando | 🟡 Média | ⚠️ Documentado mas não existe |
| Status `refunded` em payment_status | Enum faltando | 🟡 Média | ⚠️ Documentado mas não existe |

---

## 🔧 AÇÕES NECESSÁRIAS

### Prioridade ALTA 🔴

1. **Implementar POST /api/orders/[orderId]/confirm**
   - Criar rota: `src/app/api/orders/[orderId]/confirm/route.ts`
   - Implementar lógica no service
   - Validar permissões (apenas merchant dono da loja)
   - Atualizar status para `confirmed`
   - Registrar no histórico
   - Integrar com Supabase Real-time (notificação)

2. **Implementar POST /api/orders/[orderId]/reject**
   - Criar rota: `src/app/api/orders/[orderId]/reject/route.ts`
   - Implementar lógica no service
   - Validar permissões (apenas merchant dono da loja)
   - Atualizar status para `cancelled`
   - Definir `cancellation_reason`
   - Registrar no histórico
   - Integrar com Supabase Real-time (notificação)

3. **Completar PUT /api/orders/[orderId]**
   - Implementar lógica de atualização de status
   - Validar transições de status permitidas
   - Registrar no histórico
   - Integrar com Supabase Real-time (notificação)

### Prioridade MÉDIA 🟡

4. **Implementar POST /api/orders/[orderId]/confirm-delivery**
   - Criar rota: `src/app/api/orders/[orderId]/confirm-delivery/route.ts`
   - Implementar lógica no service
   - Validar permissões (apenas cliente dono do pedido)
   - Atualizar status para `delivered`
   - Registrar no histórico

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

1. ✅ **Aprovar esta análise**
2. 🔄 **Decidir sobre status `refunded`** (adicionar ou remover da doc)
3. 🔄 **Implementar endpoints faltantes** (confirm, reject, confirm-delivery)
4. 🔄 **Completar PUT /api/orders/[orderId]**
5. 🔄 **Verificar views no Supabase** (se necessário, aplicar SQL)

---

**Data da Análise:** 2025-11-27
**Versão da Documentação Analisada:** `docs/api/orders.md` (699 linhas)
**Versão do Schema Analisado:** `prisma/schema.prisma`

