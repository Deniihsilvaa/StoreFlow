# API de Produtos

## Visão Geral

Endpoints para consultar e gerenciar produtos do sistema.

**Nota:** Endpoints de merchant (criação de produtos) estão em `/api/merchant/stores/[storeId]/products`.

### Status de Implementação

- ✅ `GET /api/products` - Listar produtos
- ✅ `GET /api/products/[productId]` - Detalhes do produto
- ✅ `POST /api/merchant/stores/[storeId]/products` - Criar produto (merchant)
- ✅ `PATCH /api/merchant/stores/[storeId]/products/[productId]` - Atualizar produto (merchant)
- ✅ `DELETE /api/merchant/stores/[storeId]/products/[productId]` - Deletar produto (soft delete, merchant)
- ✅ `PATCH /api/merchant/stores/[storeId]/products/[productId]/deactivate` - Desativar produto (merchant)
- ✅ `PATCH /api/merchant/stores/[storeId]/products/[productId]/activate` - Ativar produto (merchant)

## Endpoints

### GET /api/products

Lista produtos com filtros e paginação.

#### Query Parameters

- `storeId` (opcional): UUID da loja para filtrar produtos
- `category` (opcional): Filtrar por categoria
- `isActive` (opcional): Filtrar por status ativo (true/false)
- `search` (opcional): Buscar por nome ou descrição
- `page` (opcional): Número da página (padrão: 1)
- `limit` (opcional): Itens por página (padrão: 20)

#### Exemplo de Request

```
GET /api/products?storeId=45319ec5-7cb8-499b-84b0-896e812dfd2e&page=1&limit=20
```

#### Exemplo de Response (200)

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "store_id": "uuid",
        "name": "Produto Exemplo",
        "description": "Descrição do produto",
        "price": 29.90,
        "cost_price": 15.00,
        "family": "food",
        "image_url": "https://example.com/product.jpg",
        "category": "Bebidas",
        "is_active": true,
        "preparation_time": 10,
        "store_name": "Loja Exemplo",
        "store_slug": "loja-exemplo",
        "customizations_count": 3,
        "extra_lists_count": 2,
        "available_customizations": {
          "sizes": ["Pequeno", "Grande"],
          "additions": ["Queijo", "Bacon"]
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "totalPages": 3,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

#### Tratamento de Erros

- **500**: Erro interno do servidor

---

### GET /api/products/[productId]

Retorna os detalhes de um produto específico.

#### Parâmetros de URL

- `productId` (obrigatório): UUID do produto

#### Exemplo de Request

```
GET /api/products/d3c3d99c-e221-4371-861b-d61743ffb09e
```

#### Exemplo de Response (200)

```json
{
  "success": true,
  "data": {
    "id": "d3c3d99c-e221-4371-861b-d61743ffb09e",
    "store_id": "uuid",
    "name": "Produto Exemplo",
    "description": "Descrição completa do produto",
    "price": 29.90,
    "cost_price": 15.00,
    "family": "food",
    "image_url": "https://example.com/product.jpg",
    "category": "Bebidas",
    "custom_category": "Refrigerantes",
    "is_active": true,
    "preparation_time": 10,
    "nutritional_info": {
      "calories": 150,
      "protein": 2,
      "carbs": 35
    },
    "store_name": "Loja Exemplo",
    "store_slug": "loja-exemplo",
    "customizations_count": 3,
    "extra_lists_count": 2,
    "available_customizations": {
      "sizes": ["Pequeno", "Grande"],
      "additions": ["Queijo", "Bacon"]
    }
  }
}
```

#### Tratamento de Erros

- **404**: Produto não encontrado
- **422**: Parâmetro productId inválido

---

## Endpoints de Merchant

### POST /api/merchant/stores/[storeId]/products

Cria um novo produto na loja do merchant autenticado.

#### Headers

```
Authorization: Bearer {token}
Content-Type: application/json
```

#### Path Parameters

- `storeId` (string, UUID): ID da loja onde o produto será criado

#### Body Parameters

```json
{
  // Campos obrigatórios
  "name": "string (mínimo 1, máximo 200 caracteres)",
  "price": "number (deve ser maior que zero)",
  "family": "raw_material | finished_product | addon",
  "category": "string (mínimo 1, máximo 100 caracteres)",
  
  // Campos opcionais
  "description"?: "string (máximo 1000 caracteres)",
  "costPrice"?: "number (mínimo 0, padrão: 0)",
  "imageUrl"?: "string (URL válida, máximo 500 caracteres)",
  "customCategory"?: "string (máximo 100 caracteres)",
  "isActive"?: "boolean (padrão: true)",
  "preparationTime"?: "number (inteiro, mínimo 0, padrão: 0)",
  "nutritionalInfo"?: "object (JSON)",
  
  // Customizações do produto
  "customizations"?: [
    {
      "name": "string (mínimo 1, máximo 100 caracteres)",
      "customizationType": "extra | sauce | base | protein | topping",
      "price": "number (mínimo 0, padrão: 0)",
      "selectionType": "quantity | boolean (padrão: quantity)",
      "selectionGroup"?: "string (máximo 50 caracteres)"
    }
  ],
  
  // Listas extras aplicáveis ao produto
  "extraListIds"?: ["string (UUID válido)"]
}
```

#### Exemplo de Request

```json
{
  "name": "Hambúrguer Artesanal",
  "description": "Hambúrguer feito com carne artesanal, queijo cheddar, alface, tomate e molho especial",
  "price": 29.90,
  "costPrice": 12.50,
  "family": "finished_product",
  "category": "Hambúrgueres",
  "customCategory": "Gourmet",
  "imageUrl": "https://example.com/hamburger.jpg",
  "isActive": true,
  "preparationTime": 20,
  "nutritionalInfo": {
    "calories": 650,
    "protein": 35,
    "carbs": 45,
    "fat": 28
  },
  "customizations": [
    {
      "name": "Bacon Extra",
      "customizationType": "topping",
      "price": 3.50,
      "selectionType": "boolean",
      "selectionGroup": "Adicionais"
    },
    {
      "name": "Queijo Cheddar",
      "customizationType": "topping",
      "price": 2.00,
      "selectionType": "boolean",
      "selectionGroup": "Adicionais"
    },
    {
      "name": "Molho Especial",
      "customizationType": "sauce",
      "price": 1.50,
      "selectionType": "boolean"
    }
  ],
  "extraListIds": [
    "550e8400-e29b-41d4-a716-446655440000"
  ]
}
```

#### Exemplo de Response (201)

```json
{
  "success": true,
  "data": {
    "id": "92a30084-b2f1-4d97-9955-0830822d8e34",
    "store_id": "d3c3d99c-e221-4371-861b-d61743ffb09e",
    "name": "Hambúrguer Artesanal",
    "description": "Hambúrguer feito com carne artesanal, queijo cheddar, alface, tomate e molho especial",
    "price": 29.90,
    "cost_price": 12.50,
    "family": "finished_product",
    "image_url": "https://example.com/hamburger.jpg",
    "category": "Hambúrgueres",
    "custom_category": "Gourmet",
    "is_active": true,
    "preparation_time": 20,
    "nutritional_info": {
      "calories": 650,
      "protein": 35,
      "carbs": 45,
      "fat": 28
    },
    "deleted_at": null,
    "created_at": "2025-12-02T10:00:00Z",
    "updated_at": "2025-12-02T10:00:00Z",
    "store_name": "Kampai Sushi",
    "store_slug": "kampai-sushi",
    "store_category": "comida_japonesa",
    "customizations_count": 3,
    "extra_lists_count": 1,
    "available_customizations": null
  },
  "timestamp": "2025-12-02T10:00:00Z"
}
```

#### Tratamento de Erros

- **400**: Content-Type inválido (deve ser `application/json`)
- **401**: Não autenticado ou token inválido
- **403**: Apenas lojistas podem criar produtos
- **403**: Sem permissão para criar produtos nesta loja (loja não pertence ao merchant)
- **404**: Merchant não encontrado
- **404**: Loja não encontrada
- **422**: Dados inválidos (campos obrigatórios ausentes, formato inválido)
- **422**: Listas extras inválidas (não encontradas ou não pertencem à loja)

#### Exemplo de Erro 403 (Sem Permissão)

```json
{
  "success": false,
  "error": {
    "message": "Você não tem permissão para criar produtos nesta loja",
    "code": "STORE_NOT_OWNED",
    "status": 403,
    "timestamp": "2025-12-02T10:00:00Z"
  }
}
```

#### Exemplo de Erro 422 (Validação)

```json
{
  "success": false,
  "error": {
    "message": "Dados inválidos",
    "code": "VALIDATION_ERROR",
    "status": 422,
    "details": {
      "name": ["Nome do produto é obrigatório"],
      "price": ["Preço deve ser maior que zero"],
      "family": ["Família do produto inválida"]
    },
    "timestamp": "2025-12-02T10:00:00Z"
  }
}
```

#### Regras de Negócio

- ✅ Apenas merchants autenticados podem criar produtos
- ✅ Merchant deve ser dono da loja ou membro com permissão
- ✅ Valores monetários devem ser enviados em reais (ex: 29.90 para R$ 29,90)
- ✅ `family` deve ser um dos valores: `raw_material`, `finished_product`, `addon`
- ✅ `customizationType` deve ser um dos valores: `extra`, `sauce`, `base`, `protein`, `topping`
- ✅ `selectionType` deve ser `quantity` ou `boolean`
- ✅ Todas as operações são atômicas (transação)
- ✅ Customizações são criadas junto com o produto
- ✅ Listas extras são vinculadas ao produto na criação
- ✅ Validação de listas extras: devem existir e pertencer à loja

#### Validações de Segurança

- ✅ `userId` validado pelo middleware `withAuth` (do token JWT)
- ✅ Merchant buscado por `auth_user_id` (nunca aceita do payload)
- ✅ Propriedade da loja validada (verifica se é dono ou membro)
- ✅ `storeId` validado como UUID
- ✅ Todas as operações em transação para garantir consistência
- ✅ Validação de listas extras antes da criação

#### Otimizações de Performance

O endpoint foi otimizado para garantir execução rápida e evitar timeouts:

- **Transação atômica**: Todas as operações (criação de produto, customizações e listas extras) são executadas em uma única transação para garantir consistência
- **Validação prévia**: Listas extras são validadas antes da transação para evitar rollbacks desnecessários
- **Criação em lote**: Customizações e aplicabilidades de listas extras são criadas usando `createMany` para melhor performance

**Nota Técnica**: A transação usa o timeout padrão do Prisma (5 segundos). Com a otimização implementada, mesmo criando um produto com múltiplas customizações e listas extras, a operação completa em menos de 1 segundo.

---

### PATCH /api/merchant/stores/[storeId]/products/[productId]

Atualiza um produto existente na loja do merchant autenticado. Permite atualização parcial (apenas campos enviados serão atualizados).

#### Headers

```
Authorization: Bearer {token}
Content-Type: application/json
```

#### Path Parameters

- `storeId` (string, UUID): ID da loja
- `productId` (string, UUID): ID do produto a ser atualizado

#### Body Parameters

Todos os campos são opcionais (atualização parcial):

```json
{
  // Campos básicos (opcionais)
  "name"?: "string (mínimo 1, máximo 200 caracteres)",
  "price"?: "number (deve ser maior que zero)",
  "family"?: "raw_material | finished_product | addon",
  "category"?: "string (mínimo 1, máximo 100 caracteres)",
  
  // Campos opcionais
  "description"?: "string (máximo 1000 caracteres) | null",
  "costPrice"?: "number (mínimo 0)",
  "imageUrl"?: "string (URL válida, máximo 500 caracteres) | null | \"\" (para limpar)",
  "customCategory"?: "string (máximo 100 caracteres) | null",
  "isActive"?: "boolean",
  "preparationTime"?: "number (inteiro, mínimo 0)",
  "nutritionalInfo"?: "object (JSON) | null",
  
  // Customizações do produto (operações: adicionar, atualizar, remover)
  "customizations"?: {
    "add"?: [
      {
        "name": "string (mínimo 1, máximo 100 caracteres)",
        "customizationType": "extra | sauce | base | protein | topping",
        "price": "number (mínimo 0, padrão: 0)",
        "selectionType": "quantity | boolean (padrão: quantity)",
        "selectionGroup"?: "string (máximo 50 caracteres)"
      }
    ],
    "update"?: [
      {
        "id": "string (UUID válido, obrigatório)",
        "name": "string (mínimo 1, máximo 100 caracteres)",
        "customizationType": "extra | sauce | base | protein | topping",
        "price": "number (mínimo 0)",
        "selectionType": "quantity | boolean",
        "selectionGroup"?: "string (máximo 50 caracteres)"
      }
    ],
    "remove"?: ["string (UUID válido)"]
  },
  
  // Listas extras aplicáveis ao produto (substitui todas as existentes)
  "extraListIds"?: ["string (UUID válido)"]
}
```

#### Exemplo de Request

```json
{
  "name": "Hambúrguer Artesanal Premium",
  "price": 34.90,
  "description": "Hambúrguer premium com carne wagyu, queijo brie, rúcula e molho trufado",
  "preparationTime": 25,
  "nutritionalInfo": {
    "calories": 750,
    "protein": 42,
    "carbs": 38,
    "fat": 35
  },
  "customizations": {
    "add": [
      {
        "name": "Bacon Crocante",
        "customizationType": "topping",
        "price": 4.50,
        "selectionType": "boolean",
        "selectionGroup": "Adicionais Premium"
      }
    ],
    "update": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "Bacon Extra Premium",
        "customizationType": "topping",
        "price": 5.00,
        "selectionType": "boolean",
        "selectionGroup": "Adicionais Premium"
      }
    ],
    "remove": [
      "660e8400-e29b-41d4-a716-446655440001"
    ]
  },
  "extraListIds": [
    "550e8400-e29b-41d4-a716-446655440000",
    "770e8400-e29b-41d4-a716-446655440002"
  ]
}
```

#### Exemplo de Response (200)

```json
{
  "success": true,
  "data": {
    "id": "92a30084-b2f1-4d97-9955-0830822d8e34",
    "store_id": "d3c3d99c-e221-4371-861b-d61743ffb09e",
    "name": "Hambúrguer Artesanal Premium",
    "description": "Hambúrguer premium com carne wagyu, queijo brie, rúcula e molho trufado",
    "price": 34.90,
    "cost_price": 12.50,
    "family": "finished_product",
    "image_url": "https://example.com/hamburger.jpg",
    "category": "Hambúrgueres",
    "custom_category": "Gourmet",
    "is_active": true,
    "preparation_time": 25,
    "nutritional_info": {
      "calories": 750,
      "protein": 42,
      "carbs": 38,
      "fat": 35
    },
    "deleted_at": null,
    "created_at": "2025-12-02T10:00:00Z",
    "updated_at": "2025-12-02T10:30:00Z",
    "store_name": "Kampai Sushi",
    "store_slug": "kampai-sushi",
    "store_category": "comida_japonesa",
    "customizations_count": 4,
    "extra_lists_count": 2,
    "available_customizations": null
  },
  "timestamp": "2025-12-02T10:30:00Z"
}
```

#### Tratamento de Erros

- **400**: Content-Type inválido (deve ser `application/json`)
- **401**: Não autenticado ou token inválido
- **403**: Apenas lojistas podem atualizar produtos
- **403**: Sem permissão para atualizar produtos nesta loja (loja não pertence ao merchant)
- **403**: Produto não pertence a esta loja
- **404**: Merchant não encontrado
- **404**: Loja não encontrada
- **404**: Produto não encontrado
- **422**: Dados inválidos (formato inválido)
- **422**: Customizações inválidas (não encontradas ou não pertencem ao produto)
- **422**: Listas extras inválidas (não encontradas ou não pertencem à loja)

#### Exemplo de Erro 403 (Sem Permissão)

```json
{
  "success": false,
  "error": {
    "message": "Você não tem permissão para atualizar produtos nesta loja",
    "code": "STORE_NOT_OWNED",
    "status": 403,
    "timestamp": "2025-12-02T10:30:00Z"
  }
}
```

#### Exemplo de Erro 422 (Validação)

```json
{
  "success": false,
  "error": {
    "message": "Customizações inválidas",
    "code": "VALIDATION_ERROR",
    "status": 422,
    "details": {
      "customizations": ["Uma ou mais customizações não foram encontradas ou não pertencem a este produto"]
    },
    "timestamp": "2025-12-02T10:30:00Z"
  }
}
```

#### Regras de Negócio

- ✅ Apenas merchants autenticados podem atualizar produtos
- ✅ Merchant deve ser dono da loja ou membro com permissão
- ✅ Produto deve existir e pertencer à loja especificada
- ✅ Atualização parcial: apenas campos enviados serão atualizados
- ✅ Valores monetários devem ser enviados em reais (ex: 34.90 para R$ 34,90)
- ✅ `family` deve ser um dos valores: `raw_material`, `finished_product`, `addon`
- ✅ `customizationType` deve ser um dos valores: `extra`, `sauce`, `base`, `protein`, `topping`
- ✅ `selectionType` deve ser `quantity` ou `boolean`
- ✅ Todas as operações são atômicas (transação)
- ✅ **Customizações**: 
  - `add`: Cria novas customizações
  - `update`: Atualiza customizações existentes (requer ID)
  - `remove`: Remove customizações (soft delete, requer ID)
- ✅ **Listas extras**: Substitui todas as listas extras existentes pelas fornecidas
- ✅ Enviar `imageUrl: ""` ou `null` remove a URL da imagem
- ✅ Enviar `description: null` ou `customCategory: null` limpa o campo

#### Validações de Segurança

- ✅ `userId` validado pelo middleware `withAuth` (do token JWT)
- ✅ Merchant buscado por `auth_user_id` (nunca aceita do payload)
- ✅ Propriedade da loja validada (verifica se é dono ou membro)
- ✅ Produto validado como pertencente à loja
- ✅ `storeId` e `productId` validados como UUID
- ✅ Todas as operações em transação para garantir consistência
- ✅ Validação de customizações antes da atualização (verifica existência e propriedade)
- ✅ Validação de listas extras antes da atualização

#### Otimizações de Performance

O endpoint foi otimizado para garantir execução rápida e evitar timeouts:

- **Transação atômica**: Todas as operações (atualização de produto, customizações e listas extras) são executadas em uma única transação para garantir consistência
- **Validação prévia**: Customizações e listas extras são validadas antes da transação para evitar rollbacks desnecessários
- **Operações em lote**: Customizações são criadas usando `createMany` e atualizadas em paralelo com `Promise.all`
- **Atualização parcial**: Apenas campos fornecidos são atualizados, reduzindo processamento desnecessário

**Nota Técnica**: A transação usa o timeout padrão do Prisma (5 segundos). Com a otimização implementada, mesmo atualizando um produto com múltiplas customizações e listas extras, a operação completa em menos de 1 segundo.

---

### PATCH /api/merchant/stores/[storeId]/products/[productId]/deactivate

Desativa um produto definindo `is_active` como `false`. O produto permanece visível no sistema, mas não estará disponível para novos pedidos.

#### Headers

```
Authorization: Bearer {token}
```

#### Path Parameters

- `storeId` (string, UUID): ID da loja
- `productId` (string, UUID): ID do produto a ser desativado

#### Exemplo de Request

```
PATCH /api/merchant/stores/d3c3d99c-e221-4371-861b-d61743ffb09e/products/92a30084-b2f1-4d97-9955-0830822d8e34/deactivate
```

#### Exemplo de Response (200)

```json
{
  "success": true,
  "data": {
    "id": "92a30084-b2f1-4d97-9955-0830822d8e34",
    "store_id": "d3c3d99c-e221-4371-861b-d61743ffb09e",
    "name": "Hambúrguer Artesanal",
    "is_active": false,
    "deleted_at": null,
    "updated_at": "2025-12-02T11:00:00Z"
  },
  "timestamp": "2025-12-02T11:00:00Z"
}
```

#### Tratamento de Erros

- **401**: Não autenticado ou token inválido
- **403**: Apenas lojistas podem desativar produtos
- **403**: Sem permissão para desativar produtos nesta loja
- **403**: Produto não pertence a esta loja
- **404**: Merchant não encontrado
- **404**: Loja não encontrada
- **404**: Produto não encontrado

#### Regras de Negócio

- ✅ Apenas merchants autenticados podem desativar produtos
- ✅ Merchant deve ser dono da loja ou membro com permissão
- ✅ Produto deve existir e pertencer à loja especificada
- ✅ Produto não precisa estar ativo para ser desativado (idempotente)
- ✅ Produto desativado não aparece em listagens públicas, mas permanece no sistema

---

### PATCH /api/merchant/stores/[storeId]/products/[productId]/activate

Ativa um produto definindo `is_active` como `true`. O produto volta a aparecer nas listagens públicas e fica disponível para novos pedidos.

#### Headers

```
Authorization: Bearer {token}
```

#### Path Parameters

- `storeId` (string, UUID): ID da loja
- `productId` (string, UUID): ID do produto a ser ativado

#### Exemplo de Request

```
PATCH /api/merchant/stores/d3c3d99c-e221-4371-861b-d61743ffb09e/products/92a30084-b2f1-4d97-9955-0830822d8e34/activate
```

#### Exemplo de Response (200)

```json
{
  "success": true,
  "data": {
    "id": "92a30084-b2f1-4d97-9955-0830822d8e34",
    "store_id": "d3c3d99c-e221-4371-861b-d61743ffb09e",
    "name": "Hambúrguer Artesanal",
    "is_active": true,
    "deleted_at": null,
    "updated_at": "2025-12-02T11:15:00Z"
  },
  "timestamp": "2025-12-02T11:15:00Z"
}
```

#### Tratamento de Erros

- **401**: Não autenticado ou token inválido
- **403**: Apenas lojistas podem ativar produtos
- **403**: Sem permissão para ativar produtos nesta loja
- **403**: Produto não pertence a esta loja
- **404**: Merchant não encontrado
- **404**: Loja não encontrada
- **404**: Produto não encontrado

#### Regras de Negócio

- ✅ Apenas merchants autenticados podem ativar produtos
- ✅ Merchant deve ser dono da loja ou membro com permissão
- ✅ Produto deve existir e pertencer à loja especificada
- ✅ Produto não precisa estar desativado para ser ativado (idempotente)
- ✅ Produto ativado aparece em listagens públicas e fica disponível para pedidos

---

### DELETE /api/merchant/stores/[storeId]/products/[productId]

Deleta um produto permanentemente usando soft delete (define `deleted_at`). O produto não pode estar em pedidos ativos.

#### Headers

```
Authorization: Bearer {token}
```

#### Path Parameters

- `storeId` (string, UUID): ID da loja
- `productId` (string, UUID): ID do produto a ser deletado

#### Exemplo de Request

```
DELETE /api/merchant/stores/d3c3d99c-e221-4371-861b-d61743ffb09e/products/92a30084-b2f1-4d97-9955-0830822d8e34
```

#### Exemplo de Response (200)

```json
{
  "success": true,
  "data": {
    "id": "92a30084-b2f1-4d97-9955-0830822d8e34",
    "store_id": "d3c3d99c-e221-4371-861b-d61743ffb09e",
    "name": "Hambúrguer Artesanal",
    "deleted_at": "2025-12-02T11:30:00Z",
    "message": "Produto deletado com sucesso"
  },
  "timestamp": "2025-12-02T11:30:00Z"
}
```

#### Tratamento de Erros

- **401**: Não autenticado ou token inválido
- **403**: Apenas lojistas podem deletar produtos
- **403**: Sem permissão para deletar produtos nesta loja
- **403**: Produto não pertence a esta loja
- **404**: Merchant não encontrado
- **404**: Loja não encontrada
- **404**: Produto não encontrado
- **422**: Produto está em uso em pedidos ativos

#### Exemplo de Erro 422 (Produto em Pedidos Ativos)

```json
{
  "success": false,
  "error": {
    "message": "Produto em uso em pedidos ativos",
    "code": "VALIDATION_ERROR",
    "status": 422,
    "details": {
      "productId": [
        "Não é possível deletar o produto. Ele está presente em 3 pedido(s) ativo(s). Desative o produto primeiro ou aguarde a conclusão dos pedidos."
      ]
    },
    "timestamp": "2025-12-02T11:30:00Z"
  }
}
```

#### Regras de Negócio

- ✅ Apenas merchants autenticados podem deletar produtos
- ✅ Merchant deve ser dono da loja ou membro com permissão
- ✅ Produto deve existir e pertencer à loja especificada
- ✅ **Validação crítica**: Produto não pode estar em pedidos ativos
  - Pedidos ativos: `pending`, `confirmed`, `preparing`, `ready`, `out_for_delivery`
  - Pedidos inativos (permitem deleção): `delivered`, `cancelled`, `refunded`
- ✅ Soft delete: produto não é removido fisicamente, apenas marcado com `deleted_at`
- ✅ Produto deletado não aparece em nenhuma listagem
- ✅ Recomendação: Desative o produto primeiro (`is_active = false`) antes de deletar

#### Validações de Segurança

- ✅ `userId` validado pelo middleware `withAuth` (do token JWT)
- ✅ Merchant buscado por `auth_user_id` (nunca aceita do payload)
- ✅ Propriedade da loja validada (verifica se é dono ou membro)
- ✅ Produto validado como pertencente à loja
- ✅ `storeId` e `productId` validados como UUID
- ✅ Validação de pedidos ativos antes da deleção

#### Diferença entre Ativar, Desativar e Deletar

| Ação | Campo Alterado | Visibilidade | Pode Reverter | Uso em Pedidos |
|------|----------------|--------------|---------------|----------------|
| **Ativar** | `is_active = true` | Aparece em listagens públicas | Sim (pode desativar novamente) | Permite ativar a qualquer momento |
| **Desativar** | `is_active = false` | Não aparece em listagens públicas | Sim (reativar) | Permite desativar mesmo com pedidos ativos |
| **Deletar** | `deleted_at = now()` | Não aparece em nenhuma listagem | Não (soft delete permanente) | Bloqueia se houver pedidos ativos |

**Recomendação de Uso:**
1. Use **ativar** quando quiser disponibilizar o produto novamente (ex: voltou ao estoque)
2. Use **desativar** quando quiser temporariamente ocultar o produto (ex: fora de estoque)
3. Use **deletar** quando quiser remover permanentemente o produto (após garantir que não há pedidos ativos)

---

## Estrutura de Dados

### ProductEnriched

A view `products_enriched` retorna dados enriquecidos dos produtos, incluindo:

- Informações básicas do produto
- Dados da loja (nome, slug, categoria)
- Contadores de customizações e listas extras
- Customizações disponíveis em formato JSON

### Filtros Padrão

- Apenas produtos não deletados (`deleted_at IS NULL`)
- Ordenação por `created_at DESC`

## Notas Importantes

- A view `products_enriched` está no schema `views`
- Todos os valores numéricos (Decimal, BigInt) são convertidos para Number
- A busca por texto utiliza `ILIKE` (case-insensitive)
- O filtro `storeId` requer cast explícito para UUID (`::uuid`)

