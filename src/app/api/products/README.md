# 📦 API de Produtos - Guia Postman

Este documento mostra como testar as rotas de produtos no Postman.

## 🔗 Base URL

⚠️ **IMPORTANTE**: Use apenas `/api/products` (não `/api/api/products`)

```
http://localhost:3000/api/products
```

**❌ ERRADO:**
```
http://localhost:3000/api/api/products  ← URL duplicada!
```

**✅ CORRETO:**
```
http://localhost:3000/api/products
```

---

## 📋 Rotas Disponíveis

### 1. **GET /api/products** - Listar Produtos

Lista todos os produtos com filtros opcionais e paginação.

#### **URL Completa**
```
GET http://localhost:3000/api/products
```

#### **Query Parameters (Opcionais)**

| Parâmetro | Tipo | Descrição | Exemplo |
|-----------|------|-----------|---------|
| `storeId` | string (UUID) | Filtrar por loja específica | `?storeId=123e4567-e89b-12d3-a456-426614174000` |
| `category` | string | Filtrar por categoria | `?category=comida` |
| `isActive` | boolean | Filtrar por status ativo | `?isActive=true` |
| `search` | string | Buscar por nome ou descrição | `?search=pizza` |
| `page` | number | Número da página (padrão: 1) | `?page=2` |
| `limit` | number | Itens por página (padrão: 20, máx: 100) | `?limit=10` |

#### **Exemplos de Requisições**

**1. Listar todos os produtos:**
```
GET http://localhost:3000/api/products
```

**2. Filtrar por loja:**
```
GET http://localhost:3000/api/products?storeId=123e4567-e89b-12d3-a456-426614174000
```

**3. Buscar produtos:**
```
GET http://localhost:3000/api/products?search=pizza
```

**4. Filtrar por categoria e status:**
```
GET http://localhost:3000/api/products?category=comida&isActive=true
```

**5. Com paginação:**
```
GET http://localhost:3000/api/products?page=2&limit=10
```

**6. Combinando filtros:**
```
GET http://localhost:3000/api/products?storeId=123e4567-e89b-12d3-a456-426614174000&category=bebida&isActive=true&search=refrigerante&page=1&limit=20
```

#### **Headers**
```
Content-Type: application/json
```

#### **Resposta de Sucesso (200)**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "store_id": "987e6543-e21b-12d3-a456-426614174000",
        "name": "Pizza Margherita",
        "description": "Pizza tradicional italiana",
        "price": 29.90,
        "cost_price": 15.00,
        "family": "food",
        "image_url": "https://example.com/pizza.jpg",
        "category": "comida",
        "custom_category": null,
        "is_active": true,
        "preparation_time": 30,
        "nutritional_info": {
          "calories": 250,
          "protein": 12
        },
        "deleted_at": null,
        "created_at": "2024-01-15T10:30:00.000Z",
        "updated_at": "2024-01-15T10:30:00.000Z",
        "store_name": "Pizzaria do João",
        "store_slug": "pizzaria-joao",
        "store_category": "restaurant",
        "customizations_count": 5,
        "extra_lists_count": 2,
        "available_customizations": {
          "sizes": ["P", "M", "G"],
          "toppings": ["queijo", "tomate"]
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5,
      "hasNext": true,
      "hasPrev": false
    }
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

### 2. **GET /api/products/[productId]** - Buscar Produto por ID

Busca um produto específico pelo seu ID.

#### **URL Completa**
```
GET http://localhost:3000/api/products/{productId}
```

#### **Path Parameters**

| Parâmetro | Tipo | Descrição | Exemplo |
|-----------|------|-----------|---------|
| `productId` | string (UUID) | ID do produto | `123e4567-e89b-12d3-a456-426614174000` |

#### **Exemplo de Requisição**

```
GET http://localhost:3000/api/products/123e4567-e89b-12d3-a456-426614174000
```

#### **Headers**
```
Content-Type: application/json
```

#### **Resposta de Sucesso (200)**

```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "store_id": "987e6543-e21b-12d3-a456-426614174000",
    "name": "Pizza Margherita",
    "description": "Pizza tradicional italiana",
    "price": 29.90,
    "cost_price": 15.00,
    "family": "food",
    "image_url": "https://example.com/pizza.jpg",
    "category": "comida",
    "custom_category": null,
    "is_active": true,
    "preparation_time": 30,
    "nutritional_info": {
      "calories": 250,
      "protein": 12
    },
    "deleted_at": null,
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z",
    "store_name": "Pizzaria do João",
    "store_slug": "pizzaria-joao",
    "store_category": "restaurant",
    "customizations_count": 5,
    "extra_lists_count": 2,
    "available_customizations": {
      "sizes": ["P", "M", "G"],
      "toppings": ["queijo", "tomate"]
    }
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

#### **Resposta de Erro (404) - Produto não encontrado**

```json
{
  "success": false,
  "error": {
    "status": 404,
    "code": "NOT_FOUND",
    "message": "Produto não encontrado"
  }
}
```

---

## 🧪 Configuração no Postman

### **1. Criar Collection**

1. Abra o Postman
2. Clique em **"New"** → **"Collection"**
3. Nomeie como: **"StoreFlow - API Produtos"**

### **2. Criar Variáveis de Ambiente (Opcional)**

1. Clique em **"Environments"** → **"Create Environment"**
2. Adicione as variáveis:
   - `base_url`: `http://localhost:3000`
   - `api_url`: `{{base_url}}/api/products`

### **3. Criar Requisições**

#### **Requisição 1: Listar Todos os Produtos**

1. Na collection, clique em **"Add Request"**
2. Configure:
   - **Method**: `GET`
   - **URL**: `{{api_url}}` ou `http://localhost:3000/api/products`
   - **Headers**: 
     - `Content-Type: application/json`
3. Salve como: **"Listar Produtos"**

#### **Requisição 2: Listar Produtos com Filtros**

1. **Method**: `GET`
2. **URL**: `{{api_url}}?storeId=SEU_UUID&category=comida&isActive=true&page=1&limit=10`
3. Salve como: **"Listar Produtos (Filtros)"**

#### **Requisição 3: Buscar Produto por ID**

1. **Method**: `GET`
2. **URL**: `{{api_url}}/SEU_PRODUCT_ID`
   - Exemplo: `{{api_url}}/123e4567-e89b-12d3-a456-426614174000`
3. Salve como: **"Buscar Produto por ID"**

---

## 📸 Screenshots de Exemplo

### **Postman - Listar Produtos**

```
┌─────────────────────────────────────────────────────────┐
│ GET  http://localhost:3000/api/products                 │
├─────────────────────────────────────────────────────────┤
│ Params                                                   │
│ ┌──────────┬─────────────────────────────────────────┐  │
│ │ storeId  │ 123e4567-e89b-12d3-a456-426614174000    │  │
│ │ category │ comida                                   │  │
│ │ isActive │ true                                     │  │
│ │ page     │ 1                                        │  │
│ │ limit    │ 20                                       │  │
│ └──────────┴─────────────────────────────────────────┘  │
│                                                           │
│ Headers                                                   │
│ Content-Type: application/json                            │
└─────────────────────────────────────────────────────────┘
```

### **Postman - Buscar Produto por ID**

```
┌─────────────────────────────────────────────────────────┐
│ GET  http://localhost:3000/api/products/{productId}     │
├─────────────────────────────────────────────────────────┤
│ Params                                                   │
│ ┌────────────┬───────────────────────────────────────┐   │
│ │ productId  │ 123e4567-e89b-12d3-a456-426614174000 │   │
│ └────────────┴───────────────────────────────────────┘   │
│                                                           │
│ Headers                                                   │
│ Content-Type: application/json                            │
└─────────────────────────────────────────────────────────┘
```

---

## 🔍 Testes de Validação

### **Testes para Adicionar no Postman (Tests Tab)**

#### **Para Listar Produtos:**

```javascript
// Verificar status code
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

// Verificar estrutura da resposta
pm.test("Response has success field", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('success');
    pm.expect(jsonData.success).to.eql(true);
});

// Verificar estrutura de dados
pm.test("Response has data.items array", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data).to.have.property('items');
    pm.expect(jsonData.data.items).to.be.an('array');
});

// Verificar paginação
pm.test("Response has pagination", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data).to.have.property('pagination');
    pm.expect(jsonData.data.pagination).to.have.property('total');
});
```

#### **Para Buscar Produto por ID:**

```javascript
// Verificar status code
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

// Verificar que retorna um produto
pm.test("Response has product data", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.data).to.have.property('id');
    pm.expect(jsonData.data).to.have.property('name');
    pm.expect(jsonData.data).to.have.property('price');
});

// Verificar que o ID do produto corresponde
pm.test("Product ID matches", function () {
    var jsonData = pm.response.json();
    var productId = pm.variables.get("productId");
    pm.expect(jsonData.data.id).to.eql(productId);
});
```

---

## ⚠️ Possíveis Erros

### **404 - Produto não encontrado**
```json
{
  "success": false,
  "error": {
    "status": 404,
    "code": "NOT_FOUND",
    "message": "Produto não encontrado"
  }
}
```

### **422 - Erro de validação**
```json
{
  "success": false,
  "error": {
    "status": 422,
    "code": "VALIDATION_ERROR",
    "message": "Parâmetros inválidos",
    "details": {
      "productId": ["Parâmetro productId é obrigatório"]
    }
  }
}
```

---

## 💡 Dicas

1. **Use variáveis de ambiente** para facilitar a troca entre desenvolvimento e produção
2. **Salve exemplos de resposta** como exemplos na collection
3. **Use Pre-request Scripts** para gerar UUIDs dinâmicos se necessário
4. **Configure testes automáticos** para validar as respostas
5. **Use o Postman Collection Runner** para executar todos os testes de uma vez

---

## 📚 Próximos Passos

- Adicionar autenticação (se necessário)
- Implementar rotas de criação, atualização e exclusão
- Adicionar mais filtros e ordenação
- Implementar cache de respostas

