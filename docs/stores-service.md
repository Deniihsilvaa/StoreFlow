# 📚 Documentação - Stores Service

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Métodos Principais](#métodos-principais)
3. [Cálculo de Status da Loja](#cálculo-de-status-da-loja)
4. [Fluxo de Funcionamento](#fluxo-de-funcionamento)
5. [Exemplos de Uso](#exemplos-de-uso)
6. [Regras de Negócio](#regras-de-negócio)
7. [Tratamento de Erros](#tratamento-de-erros)

---

## 🎯 Visão Geral

O `StoresService` é responsável por gerenciar todas as operações relacionadas a lojas, incluindo:

- Busca de lojas por ID ou slug
- Atualização de informações da loja
- **Gerenciamento de status (aberta/fechada)**
- Cálculo de horários de funcionamento

### Arquivo

```
src/modules/stores/service/stores.service.ts
```

### Classe Principal

```typescript
export class StoresService {
  // Métodos públicos e privados
}
```

---

## 📊 Métodos Principais

### 1. `getStoreStatus(userId: string, storeId: string)`

Retorna o status atual da loja (aberta/fechada) com informações detalhadas.

#### Parâmetros

- `userId` (string): ID do usuário autenticado (auth_user_id)
- `storeId` (string): ID da loja (deve ser UUID válido)

#### Retorno

```typescript
{
  isOpen: boolean;                    // Se a loja está aberta no momento
  currentDay: string;                 // Nome do dia atual (ex: "Segunda-feira")
  currentDayHours: {                  // Horários do dia atual
    open: string;                     // Ex: "08:00"
    close: string;                    // Ex: "22:00"
    closed: boolean;                  // Se o dia está fechado
  } | null;
  nextOpenDay: string | null;         // Próximo dia que a loja abre
  nextOpenHours: {                    // Horários do próximo dia aberto
    open: string;
    close: string;
  } | null;
  isInactive: boolean;                // Se a loja está inativa
  lastUpdated: string;               // ISO timestamp da última atualização
}
```

#### Lógica de Cálculo

```typescript
// 1. Verifica se a loja está inativa
if (!store.is_active) {
  return { isOpen: false, isInactive: true, ... };
}

// 2. Calcula baseado nos horários de funcionamento
const isOpen = this.calculateIsOpen(store.store_working_hours);
return { isOpen, ... };
```

#### Exemplo de Uso

```typescript
const status = await storesService.getStoreStatus(userId, storeId);

if (status.isOpen) {
  console.log("Loja está aberta!");
} else if (status.isInactive) {
  console.log("Loja está inativa");
} else {
  console.log(`Loja abre ${status.nextOpenDay} às ${status.nextOpenHours?.open}`);
}
```

---

### 2. `getStoreById(storeId: string)`

Busca uma loja completa por ID, incluindo produtos e status.

#### Retorno

```typescript
StoreWithProducts {
  ...StoreComplete,
  products: ProductEnriched[],
  isOpen?: boolean,
}
```

#### Observação

Este método chama `addStoreStatus()` internamente para incluir `isOpen` no retorno.

---

### 3. `getStoreBySlug(storeSlug: string)`

Busca uma loja completa por slug, incluindo produtos e status.

#### Retorno

Mesmo formato de `getStoreById()`.

---

### 4. `updateStore(userId: string, storeId: string, input: UpdateStoreInput)`

Atualiza informações da loja.

---

## 🔄 Cálculo de Status da Loja

### Método Privado: `calculateIsOpen(workingHours)`

Calcula se a loja está aberta baseado nos horários de funcionamento.

#### Lógica

```typescript
1. Obtém dia atual (0 = Domingo, 6 = Sábado)
2. Busca horário do dia atual nos working_hours
3. Se não encontrar → retorna false (fechado)
4. Se is_closed = true → retorna false (fechado)
5. Se não tem opens_at ou closes_at → retorna false (fechado)
6. Compara hora atual com horário de abertura/fechamento
7. Retorna true se estiver dentro do horário
```

#### Exemplo

```typescript
// Horário: Segunda-feira, 14:30
// Configuração: Segunda-feira, 08:00 - 22:00
// Resultado: isOpen = true

// Horário: Segunda-feira, 23:00
// Configuração: Segunda-feira, 08:00 - 22:00
// Resultado: isOpen = false
```

---

### Método Privado: `addStoreStatus(store: StoreComplete, storeId: string)`

Adiciona informações de status (`isOpen`) à loja.

#### Lógica

```typescript
1. Busca working_hours e is_active do banco
2. Verifica se loja está inativa → isOpen = false
3. Se não estiver inativa:
   → Calcula isOpen baseado nos horários
4. Retorna loja com campo adicional:
   - isOpen
```

---

## 🔀 Fluxo de Funcionamento

### Cenário 1: Loja Normalmente Aberta

```
1. is_active = true
2. Horário atual: 14:00
3. Horário configurado: 08:00 - 22:00
4. Resultado: isOpen = true
```

### Cenário 2: Loja Inativa

```
1. is_active = false  ← LOJA DESATIVADA
2. Horário atual: 14:00
3. Horário configurado: 08:00 - 22:00
4. Resultado: isOpen = false, isInactive = true
```

### Cenário 3: Loja Fora do Horário

```
1. is_active = true
2. Horário atual: 23:00
3. Horário configurado: 08:00 - 22:00
4. Resultado: isOpen = false (fora do horário)
```

---

## 💡 Exemplos de Uso

### Exemplo 1: Verificar Status da Loja

```typescript
import { storesService } from "@/modules/stores/service/stores.service";

// Obter status
const status = await storesService.getStoreStatus(userId, storeId);

// Verificar diferentes estados
if (status.isInactive) {
  console.log("Loja está inativa");
} else if (status.isOpen) {
  console.log("Loja está aberta!");
  console.log(`Horário atual: ${status.currentDayHours?.open} - ${status.currentDayHours?.close}`);
} else {
  console.log("Loja está fechada (fora do horário)");
  console.log(`Próxima abertura: ${status.nextOpenDay} às ${status.nextOpenHours?.open}`);
}
```

### Exemplo 2: Obter Loja com Status

```typescript
// Buscar loja completa (inclui status)
const store = await storesService.getStoreById(storeId);

if (store) {
  console.log(`Loja: ${store.name}`);
  console.log(`Aberta: ${store.isOpen ? "Sim" : "Não"}`);
  console.log(`Produtos: ${store.products.length}`);
}
```

---

## 📋 Regras de Negócio

### Regra 1: Prioridade de Status

```
is_active = false          → SEMPRE FECHADA
is_active = true           → Calcula baseado nos horários de funcionamento
```

### Regra 2: Horários de Funcionamento

- Horários são calculados em **tempo real** baseado no horário atual do servidor
- Se não houver horário configurado para o dia atual, a loja é considerada fechada
- Se o dia estiver marcado como fechado (`is_closed = true`), a loja está fechada

---

## ⚠️ Tratamento de Erros

### Erros Comuns

#### 1. Loja Não Encontrada

```typescript
// Código: "STORE_NOT_FOUND"
// Status: 404
// Mensagem: "Loja não encontrada"
```

**Causas:**
- `storeId` inválido
- Loja foi deletada (soft delete)
- Loja não existe

#### 2. Merchant Não Encontrado

```typescript
// Código: "MERCHANT_NOT_FOUND"
// Status: 404
// Mensagem: "Merchant não encontrado"
```

**Causas:**
- `userId` não corresponde a um merchant
- Merchant foi deletado

#### 3. Sem Permissão

```typescript
// Código: "FORBIDDEN"
// Status: 403
// Mensagem: "Você não tem permissão para alterar status desta loja"
```

**Causas:**
- Merchant não é dono da loja
- Merchant não é membro da loja

#### 4. Loja Inativa

Quando uma loja está inativa (`is_active = false`), ela sempre retorna `isOpen = false` independente dos horários configurados.

#### 5. Formato Inválido

```typescript
// Código: "VALIDATION_ERROR"
// Status: 400
// Mensagem: "Formato de storeId inválido"
```

**Causas:**
- `storeId` não é um UUID válido

---

## 🔍 Detalhes Técnicos

### Estrutura de Dados

#### `StoreComplete`

```typescript
type StoreComplete = {
  // ... campos básicos
  is_active: boolean | null;
  isOpen?: boolean;                     // Calculado
  // ... outros campos
}
```

### Queries Otimizadas

O serviço utiliza queries otimizadas para buscar apenas os dados necessários:

```typescript
// Para getStoreStatus - busca apenas campos necessários
const store = await prisma.stores.findUnique({
  where: { id: storeId },
  select: {
    id: true,
    is_active: true,
    deleted_at: true,
    store_working_hours: { /* ... */ },
  },
});
```

### Timezone

⚠️ **Importante**: Os cálculos de horário são feitos no **timezone do servidor**. Certifique-se de que o servidor está configurado com o timezone correto.

---

## 📝 Resumo

### Prioridade de Status:

```
is_active = false → FECHADA (máxima prioridade)
Horários de funcionamento → ABERTA/FECHADA (baseado no horário)
```

---

**Última atualização**: 21 de Dezembro de 2025

