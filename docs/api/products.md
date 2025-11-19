# API de Produtos

## Visão Geral

Endpoints para consultar e gerenciar produtos do sistema.

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

