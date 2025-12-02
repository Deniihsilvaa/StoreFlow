# Análise de Segurança: updateProfile

## 🔐 Informações de Extrema Importância

### 1. **IDs Críticos para Segurança**

#### 1.1. `userId` (auth_user_id) - ⚠️ CRÍTICO
```typescript
async updateProfile(userId: string, input: UpdateProfileInput)
```
- **Origem**: Vem do middleware `withAuth` através de `context.user.id`
- **Validação**: Deve ser validado pelo middleware antes de chegar ao service
- **Risco**: Se não validado, permite que um usuário atualize o perfil de outro
- **Proteção Atual**: ✅ Validado pelo `withAuth` middleware
- **Linha**: 487, 491

**Recomendação**: Garantir que o middleware `withAuth` sempre valide o token e extraia o `userId` corretamente.

---

#### 1.2. `existingCustomer.id` - ⚠️ CRÍTICO
```typescript
const existingCustomer = await prisma.customers.findFirst({
  where: {
    auth_user_id: userId,  // ← Validação de propriedade
    deleted_at: null,
  },
});
```
- **Uso**: Identifica o registro do cliente no banco
- **Validação**: Buscado usando `auth_user_id` (garante propriedade)
- **Risco**: Se `userId` estiver incorreto, pode buscar cliente errado
- **Proteção Atual**: ✅ Busca por `auth_user_id` garante que é o cliente correto
- **Linha**: 489-494, 538

**Recomendação**: Manter sempre a busca por `auth_user_id` para garantir que o cliente pertence ao usuário autenticado.

---

#### 1.3. `customer.id` - ⚠️ CRÍTICO
```typescript
const customer = await tx.customers.update({
  where: { id: existingCustomer.id },  // ← Usa ID do cliente encontrado
  data: updateData,
});
```
- **Uso**: Usado em todas as operações de endereços
- **Validação**: Derivado de `existingCustomer.id` (já validado)
- **Risco**: Se usado incorretamente, pode modificar endereços de outro cliente
- **Proteção Atual**: ✅ Sempre usa `existingCustomer.id` (já validado)
- **Linhas**: 538, 552, 566, 609, 620, 636, 688, 707, 729

**Recomendação**: NUNCA aceitar `customer.id` do input do usuário. Sempre usar o ID do cliente encontrado pela busca com `auth_user_id`.

---

### 2. **Validações de Propriedade de Endereços**

#### 2.1. Validação em `update` - ⚠️ CRÍTICO
```typescript
const existingAddressIds = await tx.customer_addresses.findMany({
  where: {
    id: { in: operations.update.map(a => a.id) },
    customer_id: customer.id,  // ← VALIDAÇÃO CRÍTICA
    deleted_at: null,
  },
});
```
- **Propósito**: Garante que os endereços pertencem ao cliente
- **Risco**: Sem essa validação, usuário poderia atualizar endereços de outros clientes
- **Proteção Atual**: ✅ Valida `customer_id` antes de atualizar
- **Linha**: 617-624

**Recomendação**: Manter SEMPRE a validação de `customer_id` em todas as operações de endereços.

---

#### 2.2. Validação em `remove` - ⚠️ CRÍTICO
```typescript
await tx.customer_addresses.deleteMany({
  where: {
    id: { in: operations.remove },
    customer_id: customer.id,  // ← VALIDAÇÃO CRÍTICA
  },
});
```
- **Propósito**: Garante que apenas endereços do cliente sejam removidos
- **Risco**: Sem essa validação, usuário poderia remover endereços de outros clientes
- **Proteção Atual**: ✅ Valida `customer_id` no `where`
- **Linha**: 606-611

**Recomendação**: Manter SEMPRE a validação de `customer_id` no `where` do `deleteMany`.

---

#### 2.3. Validação de Endereço Não Encontrado - ⚠️ IMPORTANTE
```typescript
if (!validIds.has(address.id)) {
  throw ApiError.notFound(`Endereço com ID ${address.id} não encontrado ou não pertence ao cliente`);
}
```
- **Propósito**: Informa ao usuário se tentou atualizar endereço inválido
- **Risco**: Sem essa validação, operação falharia silenciosamente ou com erro genérico
- **Proteção Atual**: ✅ Valida e retorna erro específico
- **Linha**: 648-650

**Recomendação**: Manter essa validação para melhor UX e segurança.

---

### 3. **Validações de Integridade de Dados**

#### 3.1. Telefone Único - ⚠️ IMPORTANTE
```typescript
if (input.phone && input.phone !== existingCustomer.phone) {
  const phoneExists = await prisma.customers.findFirst({
    where: {
      phone: input.phone,
      id: { not: existingCustomer.id },  // ← Exclui o próprio cliente
      deleted_at: null,
    },
  });
}
```
- **Propósito**: Garante que telefone seja único no sistema
- **Risco**: Sem essa validação, múltiplos clientes poderiam ter o mesmo telefone
- **Proteção Atual**: ✅ Valida antes de atualizar
- **Linha**: 501-516

**Recomendação**: Manter essa validação para garantir integridade dos dados.

---

#### 3.2. Validação de Cliente Existente - ⚠️ CRÍTICO
```typescript
if (!existingCustomer) {
  throw ApiError.notFound("Cliente não encontrado", "CUSTOMER_NOT_FOUND");
}
```
- **Propósito**: Garante que o cliente existe antes de tentar atualizar
- **Risco**: Sem essa validação, poderia tentar atualizar cliente inexistente
- **Proteção Atual**: ✅ Valida antes de prosseguir
- **Linha**: 496-498

**Recomendação**: Manter essa validação como primeira verificação.

---

### 4. **Transação para Consistência**

#### 4.1. Uso de Transação - ⚠️ IMPORTANTE
```typescript
const updatedCustomer = await prisma.$transaction(async (tx) => {
  // Todas as operações dentro da transação
});
```
- **Propósito**: Garante que todas as operações sejam atômicas
- **Risco**: Sem transação, operações parciais poderiam deixar dados inconsistentes
- **Proteção Atual**: ✅ Todas as operações estão dentro de uma transação
- **Linha**: 519-739

**Recomendação**: Manter todas as operações de escrita dentro da transação.

---

### 5. **Informações NÃO Críticas (mas importantes)**

#### 5.1. Email do Usuário
```typescript
const { data: authUser, error: authError } = await supabaseClient.auth.admin.getUserById(userId);
const email = authUser?.user?.email || null;
```
- **Propósito**: Busca email do Supabase Auth para retornar no response
- **Risco**: Baixo - se falhar, apenas não retorna email (não crítico)
- **Proteção Atual**: ✅ Tratamento de erro não bloqueia a operação
- **Linha**: 742-748

**Recomendação**: Manter como está - não crítico, mas útil para o frontend.

---

## 📋 Resumo de Pontos Críticos

### 🔴 **MÁXIMA PRIORIDADE** (Segurança)
1. ✅ `userId` validado pelo middleware `withAuth`
2. ✅ `existingCustomer.id` buscado usando `auth_user_id` (garante propriedade)
3. ✅ `customer.id` sempre derivado de `existingCustomer.id` (nunca do input)
4. ✅ Validação de `customer_id` em todas as operações de endereços (`update`, `remove`)

### 🟡 **ALTA PRIORIDADE** (Integridade)
1. ✅ Validação de telefone único
2. ✅ Validação de cliente existente
3. ✅ Uso de transação para atomicidade

### 🟢 **MÉDIA PRIORIDADE** (UX)
1. ✅ Validação de endereço não encontrado com mensagem clara
2. ✅ Busca de email do Supabase (não bloqueia se falhar)

---

## ⚠️ Pontos de Atenção

### 1. **NUNCA aceitar IDs do input do usuário**
```typescript
// ❌ ERRADO - NUNCA fazer isso
const customerId = input.customerId; // PERIGOSO!

// ✅ CORRETO - Sempre buscar do banco
const existingCustomer = await prisma.customers.findFirst({
  where: { auth_user_id: userId }
});
```

### 2. **SEMPRE validar propriedade em operações de endereços**
```typescript
// ✅ CORRETO - Sempre incluir customer_id no where
await tx.customer_addresses.deleteMany({
  where: {
    id: { in: operations.remove },
    customer_id: customer.id,  // ← CRÍTICO
  },
});
```

### 3. **SEMPRE usar transação para operações múltiplas**
```typescript
// ✅ CORRETO - Todas as operações em uma transação
await prisma.$transaction(async (tx) => {
  // Operações atômicas
});
```

---

## 🔍 Checklist de Segurança

- [x] `userId` validado pelo middleware
- [x] Cliente buscado usando `auth_user_id` (não aceita ID do input)
- [x] `customer.id` sempre derivado do cliente encontrado
- [x] Validação de `customer_id` em operações de endereços
- [x] Validação de telefone único
- [x] Uso de transação para consistência
- [x] Validação de endereço não encontrado
- [x] Tratamento de erros adequado

---

## 📝 Recomendações Adicionais

1. **Logging de Segurança**: Considerar adicionar logs quando:
   - Tentativa de atualizar endereço que não pertence ao cliente
   - Tentativa de usar telefone já cadastrado
   - Falhas na validação de propriedade

2. **Rate Limiting**: Considerar rate limiting para prevenir abuso

3. **Auditoria**: Considerar tabela de auditoria para rastrear mudanças em perfis

4. **Validação de Email**: Se email for atualizável no futuro, validar unicidade também

