# 📡 Documentação - Realtime Sync para Pedidos

> **⚠️ NOTA IMPORTANTE**: Esta documentação é uma referência para implementação no **frontend**. 
> Este repositório contém apenas o **backend**. Os componentes React, hooks e configurações de frontend 
> devem ser implementados no projeto frontend separado.

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Instalação e Configuração](#instalação-e-configuração)
4. [Uso dos Hooks](#uso-dos-hooks)
5. [Uso dos Componentes](#uso-dos-componentes)
6. [Exemplos Práticos](#exemplos-práticos)
7. [Tratamento de Erros](#tratamento-de-erros)
8. [Performance e Otimizações](#performance-e-otimizações)
9. [Troubleshooting](#troubleshooting)
10. [Sugestões Futuras](#sugestões-futuras)

---

## 🎯 Visão Geral

O sistema de **Realtime Sync** permite que clientes e merchants visualizem pedidos atualizados em tempo real, sem necessidade de recarregar a página ou fazer polling manual.

### Funcionalidades Principais

- ✅ **Sincronização em Tempo Real**: Mudanças (INSERT, UPDATE, DELETE) são refletidas instantaneamente
- ✅ **Filtragem Automática**: Cada usuário vê apenas os pedidos que tem permissão (via RLS)
- ✅ **Reconexão Automática**: Sistema detecta desconexões e tenta reconectar
- ✅ **Debouncing e Rate Limiting**: Otimizações para evitar sobrecarga
- ✅ **TypeScript**: Totalmente tipado para melhor DX

### Fluxo de Funcionamento

```
1. Usuário faz login (Customer ou Merchant)
2. Sistema identifica o tipo de usuário
3. Hook busca customer_id ou merchant_id + store_ids
4. Inscreve-se no canal Realtime apropriado
5. Carrega pedidos iniciais via API REST
6. Escuta mudanças via Supabase Realtime
7. Atualiza UI automaticamente quando há mudanças
```

---

## 🏗️ Arquitetura

> **Nota**: Esta estrutura deve ser criada no projeto **frontend**, não no backend.

### Estrutura de Arquivos (Frontend)

```
frontend/src/
├── lib/
│   ├── supabase.ts              # Cliente Supabase para frontend
│   └── realtime.ts              # Gerenciador de conexões Realtime
├── hooks/
│   ├── useOrdersRealtime.ts     # Hook principal (auto-detecta tipo)
│   ├── useCustomerOrders.ts     # Hook específico para clientes
│   └── useMerchantOrders.ts     # Hook específico para merchants
├── components/
│   ├── OrdersLiveView.tsx       # Componente genérico
│   ├── CustomerOrders.tsx       # Componente para clientes
│   └── MerchantOrders.tsx       # Componente para merchants
└── utils/
    └── orderStatus.ts           # Utilitários de status
```

### Componentes Principais

#### 1. **RealtimeManager** (`src/lib/realtime.ts`)

Gerencia conexões Realtime com:
- Debouncing de eventos
- Limite de eventos por segundo
- Cleanup automático de canais
- Reconexão automática

#### 2. **Hooks React**

- `useOrdersRealtime`: Detecta automaticamente o tipo de usuário
- `useCustomerOrders`: Específico para clientes
- `useMerchantOrders`: Específico para merchants

#### 3. **Componentes React**

- `OrdersLiveView`: Componente genérico que funciona para ambos
- `CustomerOrders`: Componente otimizado para clientes
- `MerchantOrders`: Componente otimizado para merchants

---

## ⚙️ Instalação e Configuração

> **⚠️ IMPORTANTE**: Estas instruções são para o projeto **frontend**. 
> O backend já está configurado e não requer alterações.

### 1. Verificar Dependências (Frontend)

No projeto frontend, instale as dependências necessárias:
```bash
npm install @supabase/supabase-js react react-dom
```

Dependências necessárias:
- `@supabase/supabase-js`
- `react` e `react-dom`

### 2. Configurar Variáveis de Ambiente (Frontend)

No projeto frontend, configure as variáveis de ambiente em `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
```

> **Nota**: Use o prefixo `NEXT_PUBLIC_` para variáveis que precisam ser acessíveis no browser.

### 3. Habilitar Realtime no Supabase

No painel do Supabase:

1. Vá em **Database** → **Replication**
2. Encontre a tabela `orders` (schema: `orders`)
3. Habilite **Realtime** para:
   - ✅ INSERT
   - ✅ UPDATE
   - ✅ DELETE

### 4. Verificar Políticas RLS

As políticas RLS devem estar configuradas:

```sql
-- Para Customers
CREATE POLICY "customers_see_own_orders"
ON orders.orders
FOR SELECT
USING (
  customer_id IN (
    SELECT id FROM public.customers 
    WHERE auth_user_id = auth.uid()
  )
);

-- Para Merchants
CREATE POLICY "merchants_see_store_orders"
ON orders.orders
FOR SELECT
USING (
  store_id IN (
    SELECT store_id FROM public.store_merchant_members
    WHERE merchant_id IN (
      SELECT id FROM public.merchants
      WHERE auth_user_id = auth.uid()
    )
    AND deleted_at IS NULL
  )
);
```

---

## 🎣 Uso dos Hooks

### Hook Principal: `useOrdersRealtime`

Detecta automaticamente se o usuário é customer ou merchant.

```tsx
import { useOrdersRealtime } from "@/hooks/useOrdersRealtime";

function MyComponent() {
  const {
    orders,
    loading,
    error,
    isConnected,
    userType,
    refresh,
    reconnect,
  } = useOrdersRealtime({
    enabled: true,
    debounceMs: 100,
    maxEventsPerSecond: 10,
    onError: (error) => {
      console.error("Erro:", error);
    },
    onConnect: () => {
      console.log("Conectado!");
    },
  });

  if (loading) return <div>Carregando...</div>;
  if (error) return <div>Erro: {error.message}</div>;

  return (
    <div>
      <p>Status: {isConnected ? "🟢 Conectado" : "🔴 Desconectado"}</p>
      <p>Tipo: {userType}</p>
      <p>Pedidos: {orders.length}</p>
      <button onClick={refresh}>Atualizar</button>
      <button onClick={reconnect}>Reconectar</button>
    </div>
  );
}
```

### Hook para Clientes: `useCustomerOrders`

```tsx
import { useCustomerOrders } from "@/hooks/useCustomerOrders";

function CustomerDashboard() {
  const {
    orders,
    loading,
    error,
    isConnected,
    customerId,
    refresh,
    reconnect,
  } = useCustomerOrders({
    // customerId é opcional - será detectado automaticamente
    enabled: true,
  });

  return (
    <div>
      <h2>Meus Pedidos</h2>
      {orders.map((order) => (
        <div key={order.id}>
          <p>Pedido #{order.id.slice(0, 8)}</p>
          <p>Status: {order.status}</p>
          <p>Total: R$ {order.total_amount}</p>
        </div>
      ))}
    </div>
  );
}
```

### Hook para Merchants: `useMerchantOrders`

```tsx
import { useMerchantOrders } from "@/hooks/useMerchantOrders";

function MerchantDashboard() {
  const {
    orders,
    loading,
    error,
    isConnected,
    merchantId,
    storeIds,
    refresh,
    reconnect,
  } = useMerchantOrders({
    // merchantId e storeIds são opcionais - serão detectados automaticamente
    enabled: true,
  });

  return (
    <div>
      <h2>Pedidos das Lojas ({storeIds.length} lojas)</h2>
      {orders.map((order) => (
        <div key={order.id}>
          <p>Pedido #{order.id.slice(0, 8)}</p>
          <p>Loja: {order.store_name}</p>
          <p>Cliente: {order.customer_name}</p>
          <p>Status: {order.status}</p>
        </div>
      ))}
    </div>
  );
}
```

---

## 🧩 Uso dos Componentes

### Componente Genérico: `OrdersLiveView`

```tsx
import { OrdersLiveView } from "@/components/OrdersLiveView";

function OrdersPage() {
  return (
    <OrdersLiveView
      showStoreName={true}
      showCustomerName={false}
      filterByStatus={["pending", "confirmed", "preparing"]}
      onOrderClick={(order) => {
        console.log("Pedido clicado:", order);
        // Navegar para detalhes do pedido
      }}
    />
  );
}
```

### Componente para Clientes: `CustomerOrders`

```tsx
import { CustomerOrders } from "@/components/CustomerOrders";

function CustomerOrdersPage() {
  return (
    <CustomerOrders
      filterByStatus={["pending", "confirmed"]}
      onOrderClick={(order) => {
        router.push(`/orders/${order.id}`);
      }}
    />
  );
}
```

### Componente para Merchants: `MerchantOrders`

```tsx
import { MerchantOrders } from "@/components/MerchantOrders";

function MerchantOrdersPage() {
  const [selectedStoreId, setSelectedStoreId] = useState<string | undefined>();

  return (
    <div>
      <select
        value={selectedStoreId}
        onChange={(e) => setSelectedStoreId(e.target.value)}
      >
        <option value="">Todas as lojas</option>
        {/* Opções de lojas */}
      </select>

      <MerchantOrders
        filterByStatus={["pending", "confirmed", "preparing"]}
        filterByStoreId={selectedStoreId}
        onOrderClick={(order) => {
          router.push(`/merchant/orders/${order.id}`);
        }}
      />
    </div>
  );
}
```

---

## 💡 Exemplos Práticos

### Exemplo 1: Dashboard de Cliente

```tsx
"use client";

import { CustomerOrders } from "@/components/CustomerOrders";
import { OrderStatus } from "@/utils/orderStatus";

export default function CustomerDashboard() {
  return (
    <div className="customer-dashboard">
      <h1>Meus Pedidos</h1>
      
      <div className="tabs">
        <button>Pendentes</button>
        <button>Em Preparo</button>
        <button>Entregues</button>
      </div>

      <CustomerOrders
        filterByStatus={[OrderStatus.PENDING, OrderStatus.CONFIRMED]}
        onOrderClick={(order) => {
          window.location.href = `/orders/${order.id}`;
        }}
      />
    </div>
  );
}
```

### Exemplo 2: Dashboard de Merchant

```tsx
"use client";

import { useState } from "react";
import { MerchantOrders } from "@/components/MerchantOrders";
import { OrderStatus } from "@/utils/orderStatus";

export default function MerchantDashboard() {
  const [statusFilter, setStatusFilter] = useState<OrderStatus[]>([
    OrderStatus.PENDING,
    OrderStatus.CONFIRMED,
  ]);

  return (
    <div className="merchant-dashboard">
      <h1>Pedidos das Lojas</h1>

      <div className="filters">
        <label>
          <input
            type="checkbox"
            checked={statusFilter.includes(OrderStatus.PENDING)}
            onChange={(e) => {
              if (e.target.checked) {
                setStatusFilter([...statusFilter, OrderStatus.PENDING]);
              } else {
                setStatusFilter(statusFilter.filter((s) => s !== OrderStatus.PENDING));
              }
            }}
          />
          Pendentes
        </label>
        {/* Outros filtros */}
      </div>

      <MerchantOrders
        filterByStatus={statusFilter}
        onOrderClick={(order) => {
          window.location.href = `/merchant/orders/${order.id}`;
        }}
      />
    </div>
  );
}
```

### Exemplo 3: Notificações em Tempo Real

```tsx
"use client";

import { useEffect } from "react";
import { useOrdersRealtime } from "@/hooks/useOrdersRealtime";
import { OrderStatus } from "@/utils/orderStatus";

export function OrderNotifications() {
  const { orders } = useOrdersRealtime();

  useEffect(() => {
    // Verificar novos pedidos
    const newPendingOrders = orders.filter(
      (order) => order.status === OrderStatus.PENDING
    );

    if (newPendingOrders.length > 0) {
      // Mostrar notificação
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Novo pedido!", {
          body: `Você tem ${newPendingOrders.length} novo(s) pedido(s)`,
        });
      }
    }
  }, [orders]);

  return null;
}
```

---

## ⚠️ Tratamento de Erros

### Erros Comuns e Soluções

#### 1. **"Usuário não autenticado"**

```tsx
const { error } = useCustomerOrders();

if (error?.message === "Usuário não autenticado") {
  // Redirecionar para login
  router.push("/login");
}
```

#### 2. **"Customer ID não encontrado"**

Verifique se:
- O usuário está autenticado
- Existe um registro na tabela `customers` com `auth_user_id` correspondente

#### 3. **"Merchant ID ou lojas não encontradas"**

Verifique se:
- O usuário está autenticado como merchant
- Existe um registro na tabela `merchants` com `auth_user_id` correspondente
- O merchant possui lojas associadas via `store_merchant_members`

#### 4. **Conexão Realtime não estabelecida**

```tsx
const { isConnected, reconnect } = useOrdersRealtime();

if (!isConnected) {
  return (
    <div>
      <p>Desconectado. Tentando reconectar...</p>
      <button onClick={reconnect}>Reconectar Manualmente</button>
    </div>
  );
}
```

---

## 🚀 Performance e Otimizações

### Configurações Recomendadas

```tsx
useOrdersRealtime({
  debounceMs: 100,        // Debounce de 100ms
  maxEventsPerSecond: 10,  // Máximo 10 eventos/segundo
});
```

### Boas Práticas

1. **Limitar Filtros**: Use `filterByStatus` para reduzir o número de pedidos renderizados
2. **Memoização**: Use `useMemo` para cálculos pesados
3. **Virtualização**: Para listas grandes, considere usar `react-window` ou `react-virtualized`
4. **Cleanup**: Os hooks fazem cleanup automático, mas certifique-se de desmontar componentes quando não usar

### Exemplo com Virtualização

```tsx
import { FixedSizeList } from "react-window";
import { useCustomerOrders } from "@/hooks/useCustomerOrders";

function VirtualizedOrdersList() {
  const { orders } = useCustomerOrders();

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const order = orders[index];
    return (
      <div style={style}>
        <OrderCard order={order} />
      </div>
    );
  };

  return (
    <FixedSizeList
      height={600}
      itemCount={orders.length}
      itemSize={150}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
}
```

---

## 🔧 Troubleshooting

### Problema: Pedidos não aparecem em tempo real

**Soluções:**
1. Verifique se o Realtime está habilitado no Supabase
2. Verifique as políticas RLS
3. Verifique o console do navegador para erros
4. Verifique se `isConnected` é `true`

### Problema: Muitos eventos sendo disparados

**Soluções:**
1. Aumente `debounceMs` (ex: 200ms)
2. Reduza `maxEventsPerSecond` (ex: 5)
3. Verifique se há múltiplas inscrições no mesmo canal

### Problema: Performance degradada

**Soluções:**
1. Use `filterByStatus` para reduzir pedidos
2. Implemente paginação
3. Use virtualização para listas grandes
4. Considere usar `useMemo` para cálculos

---

## 🔮 Sugestões Futuras

### 1. **Notificações Push**

Implementar notificações push quando:
- Novo pedido é criado (para merchants)
- Status do pedido muda (para customers)
- Pedido está pronto para retirada

```tsx
// Exemplo futuro
useOrdersRealtime({
  enablePushNotifications: true,
  notificationSettings: {
    onNewOrder: true,
    onStatusChange: true,
  },
});
```

### 2. **Filtros Avançados**

Adicionar filtros por:
- Data de criação
- Valor mínimo/máximo
- Método de pagamento
- Método de entrega

```tsx
// Exemplo futuro
<MerchantOrders
  filters={{
    dateRange: { start: "2025-01-01", end: "2025-01-31" },
    minAmount: 50,
    paymentMethod: "pix",
  }}
/>
```

### 3. **Paginação e Lazy Loading**

Implementar paginação para listas grandes:

```tsx
// Exemplo futuro
const {
  orders,
  hasMore,
  loadMore,
} = useCustomerOrders({
  pagination: {
    pageSize: 20,
    loadMore: true,
  },
});
```

### 4. **Cache Local**

Implementar cache local para:
- Reduzir chamadas à API
- Funcionar offline
- Melhorar performance

```tsx
// Exemplo futuro
useOrdersRealtime({
  cache: {
    enabled: true,
    ttl: 5 * 60 * 1000, // 5 minutos
    strategy: "stale-while-revalidate",
  },
});
```

### 5. **Analytics e Métricas**

Adicionar métricas de:
- Tempo de resposta
- Taxa de reconexão
- Número de eventos processados

```tsx
// Exemplo futuro
const { metrics } = useOrdersRealtime({
  enableMetrics: true,
});

console.log(metrics);
// {
//   averageResponseTime: 120,
//   reconnectionCount: 2,
//   eventsProcessed: 150,
// }
```

### 6. **Suporte a Múltiplas Abas**

Sincronizar estado entre múltiplas abas usando BroadcastChannel:

```tsx
// Exemplo futuro
useOrdersRealtime({
  syncAcrossTabs: true,
});
```

### 7. **Modo Offline**

Implementar suporte offline com:
- Queue de eventos
- Sincronização quando voltar online
- Indicador de status offline

```tsx
// Exemplo futuro
const { isOnline, pendingEvents } = useOrdersRealtime({
  offlineMode: true,
});
```

### 8. **Webhooks Personalizados**

Permitir webhooks customizados para eventos específicos:

```tsx
// Exemplo futuro
useOrdersRealtime({
  webhooks: [
    {
      event: "ORDER_STATUS_CHANGED",
      url: "/api/webhooks/order-status",
    },
  ],
});
```

### 9. **Testes Automatizados**

Criar testes para:
- Hooks
- Componentes
- Realtime Manager
- Integração

```tsx
// Exemplo futuro
describe("useCustomerOrders", () => {
  it("should load orders on mount", async () => {
    const { result } = renderHook(() => useCustomerOrders());
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.orders.length).toBeGreaterThan(0);
  });
});
```

### 10. **Documentação de API**

Criar documentação OpenAPI/Swagger para:
- Endpoints de pedidos
- Webhooks
- Eventos Realtime

---

## 📚 Recursos Adicionais

- [Documentação Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [Documentação React Hooks](https://react.dev/reference/react)
- [Políticas RLS no Supabase](https://supabase.com/docs/guides/auth/row-level-security)

---

## ✅ Checklist de Implementação

- [x] Cliente Supabase configurado
- [x] RealtimeManager implementado
- [x] Hooks React criados
- [x] Componentes React criados
- [x] Utilitários de status criados
- [x] Documentação completa
- [ ] Testes unitários
- [ ] Testes de integração
- [ ] Deploy e validação em produção

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique esta documentação
2. Consulte os logs do console
3. Verifique as políticas RLS no Supabase
4. Entre em contato com a equipe de desenvolvimento

---

**Última atualização**: 21 de Dezembro de 2025

