# API de Clientes

## Visão Geral

Endpoints para gerenciar e consultar informações sobre clientes do sistema.

## Endpoints

### GET /api/customers

Lista todos os clientes disponíveis (em desenvolvimento).

#### Headers

```
Authorization: Bearer {token}
```

#### Query Parameters

- `page` (opcional): Número da página (padrão: 1)
- `limit` (opcional): Itens por página (padrão: 20)

#### Exemplo de Request

```
GET /api/customers?page=1&limit=20
Authorization: Bearer {token}
```

#### Exemplo de Response (200)

```json
{
  "success": true,
  "data": {
    "items": [],
    "requestedBy": "uuid-do-usuario-autenticado",
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 0,
      "totalPages": 0,
      "hasNext": false,
      "hasPrev": false
    }
  }
}
```

#### Tratamento de Erros

- **401**: Não autenticado ou token inválido
- **403**: Usuário não tem permissão de merchant

#### Notas

- Esta rota requer autenticação com permissão de **merchant**
- A funcionalidade completa ainda está em desenvolvimento

---

### GET /api/customers/[customerId]

Retorna os detalhes de um cliente específico.

#### Parâmetros de URL

- `customerId` (obrigatório): UUID do cliente

#### Headers

```
Authorization: Bearer {token}
```

#### Exemplo de Request

```
GET /api/customers/d3c3d99c-e221-4371-861b-d61743ffb09e
Authorization: Bearer {token}
```

#### Exemplo de Response (200)

```json
{
  "success": true,
  "data": {
    "id": "d3c3d99c-e221-4371-861b-d61743ffb09e",
    "requestedBy": "uuid-do-usuario-autenticado"
  }
}
```

#### Tratamento de Erros

- **401**: Não autenticado ou token inválido
- **422**: Parâmetro customerId inválido ou ausente

#### Notas

- Esta rota requer autenticação
- A funcionalidade completa ainda está em desenvolvimento
- Atualmente retorna apenas o ID do cliente e quem fez a requisição

---

### POST /api/customers

Cria um novo cliente (em desenvolvimento).

#### Headers

```
Authorization: Bearer {token}
Content-Type: application/json
```

#### Exemplo de Request

```json
{
  "name": "Nome do Cliente",
  "phone": "11999999999",
  "email": "cliente@exemplo.com"
}
```

#### Exemplo de Response (201)

```json
{
  "success": true,
  "data": {
    "customer": {
      "name": "Nome do Cliente",
      "phone": "11999999999",
      "email": "cliente@exemplo.com"
    }
  }
}
```

#### Notas

- Esta funcionalidade ainda está em desenvolvimento
- A validação completa dos dados ainda não foi implementada

## Estrutura de Dados

### Modelo Customer

O modelo `customers` no banco de dados possui os seguintes campos:

- `id`: UUID único do cliente
- `auth_user_id`: UUID do usuário no Supabase Auth (opcional, único)
- `phone`: Telefone do cliente (único)
- `name`: Nome do cliente
- `deleted_at`: Data de exclusão (soft delete)
- `created_at`: Data de criação
- `updated_at`: Data de atualização

### Relacionamentos

- `store_costumer`: Relacionamento com lojas (N:N)
- `customer_addresses`: Endereços do cliente
- `users`: Relação com usuário do Supabase Auth

## Notas Importantes

- Todas as rotas de clientes requerem autenticação
- A rota de listagem (`GET /api/customers`) requer permissão de **merchant**
- A funcionalidade completa ainda está em desenvolvimento
- Os clientes são criados automaticamente durante o processo de signup (ver [Autenticação](./authentication.md))

## Próximos Passos

As seguintes funcionalidades estão planejadas:

- Busca completa de dados do cliente na rota `GET /api/customers/[customerId]`
- Filtros e busca na listagem de clientes
- Atualização de dados do cliente
- Histórico de pedidos do cliente
- Endereços do cliente

