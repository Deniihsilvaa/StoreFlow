# Autenticação

## Visão Geral

O sistema de autenticação utiliza Supabase Auth para gerenciar usuários e tokens. Os tokens são gerados pelo Supabase e validados diretamente.

## Endpoints

### POST /api/auth/customer/login

Autentica um cliente e retorna tokens de acesso.

#### Parâmetros

```json
{
  "email": "string (obrigatório)",
  "password": "string (obrigatório, mínimo 6 caracteres)",
  "storeId": "string (obrigatório, UUID válido)"
}
```

#### Exemplo de Request

```json
{
  "email": "cliente@exemplo.com",
  "password": "senha123",
  "storeId": "45319ec5-7cb8-499b-84b0-896e812dfd2e"
}
```

#### Exemplo de Response (200)

```json
{
  "success": true,
  "data": {
    "identities": {
      "id": "uuid",
      "email": "cliente@exemplo.com",
      "name": "Nome do Cliente",
      "phone": "11999999999",
      "deleted_at": null
    },
    "store_active": {
      "id": "uuid",
      "costumer_id": "uuid",
      "store": "uuid",
      "active": true
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Tratamento de Erros

- **400**: Email ou senha inválidos
- **404**: Cliente não encontrado ou sem acesso à loja
- **422**: Dados de validação inválidos

---

### POST /api/auth/customer/signup

Registra um novo cliente na loja.

#### Parâmetros

```json
{
  "email": "string (obrigatório, email válido)",
  "password": "string (obrigatório, mínimo 6 caracteres)",
  "storeId": "string (obrigatório, UUID válido)",
  "name": "string (obrigatório, mínimo 2 caracteres)",
  "phone": "string (obrigatório, 10-15 caracteres)"
}
```

#### Exemplo de Request

```json
{
  "email": "novo@exemplo.com",
  "password": "senha123",
  "storeId": "45319ec5-7cb8-499b-84b0-896e812dfd2e",
  "name": "Novo Cliente",
  "phone": "11999999999"
}
```

#### Exemplo de Response (200)

```json
{
  "success": true,
  "data": {
    "success": true
  }
}
```

#### Tratamento de Erros

- **400**: Email ou telefone já cadastrado
- **422**: Dados de validação inválidos
- **500**: Cliente nao tem acesso a loja/falta de cadastrado na loja

---

### POST /api/auth/merchant/login

Autentica um merchant (lojista) e retorna tokens de acesso junto com todas as lojas confirmadas do merchant.

#### Parâmetros

```json
{
  "email": "string (obrigatório, email válido)",
  "password": "string (obrigatório, mínimo 6 caracteres)"
}
```

#### Exemplo de Request

```json
{
  "email": "merchant@exemplo.com",
  "password": "senha123"
}
```

#### Exemplo de Response (200)

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "merchant@exemplo.com",
      "role": "admin"
    },
    "stores": [
      {
        "id": "45319ec5-7cb8-499b-84b0-896e812dfd2e",
        "name": "Minha Loja",
        "slug": "minha-loja",
        "is_active": true,
        "merchant_role": "owner",
        "is_owner": true
      },
      {
        "id": "7cca8fed-7d28-4e5a-bdff-285414829733",
        "name": "Loja Parceira",
        "slug": "loja-parceira",
        "is_active": true,
        "merchant_role": "manager",
        "is_owner": false
      }
    ],
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Campos da Response

**user:**
- `id`: UUID do merchant
- `email`: Email do merchant
- `role`: Role do merchant (admin, manager, etc.)

**stores:** Array de lojas do merchant
- `id`: UUID da loja
- `name`: Nome da loja
- `slug`: Slug único da loja
- `is_active`: Se a loja está ativa
- `merchant_role`: Role do merchant na loja ("owner" se é dono, ou role do membro)
- `is_owner`: `true` se o merchant é dono da loja, `false` se é apenas membro

#### Tratamento de Erros

- **401**: Email ou senha inválidos
- **401**: Merchant não encontrado
- **422**: Dados de validação inválidos (email inválido, senha muito curta)

#### Como Usar

1. **Fazer Login:**
   ```bash
   curl -X POST https://api.exemplo.com/api/auth/merchant/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "merchant@exemplo.com",
       "password": "senha123"
     }'
   ```

2. **Armazenar Tokens:**
   - Salve o `token` para usar em requisições autenticadas
   - Salve o `refreshToken` para renovar o token quando expirar

3. **Usar Token em Requisições:**
   ```bash
   curl -X GET https://api.exemplo.com/api/stores/{storeId} \
     -H "Authorization: Bearer {token}"
   ```

4. **Selecionar Loja:**
   - Use o array `stores` para permitir que o merchant escolha qual loja gerenciar
   - O campo `is_owner` indica se o merchant tem controle total da loja
   - O campo `merchant_role` mostra o nível de permissão em cada loja

#### Observações Importantes

- O endpoint retorna **todas as lojas** onde o merchant tem acesso (como dono ou membro)
- Lojas deletadas (`deleted_at` não nulo) são automaticamente filtradas
- O `merchant_role` será `"owner"` para lojas onde o merchant é dono
- Para lojas onde o merchant é membro, o `merchant_role` será o role definido em `store_merchant_members`
- Use o `token` retornado no header `Authorization: Bearer {token}` para acessar endpoints protegidos

---

### POST /api/auth/merchant/signup

Registra um novo merchant (lojista) e cria automaticamente sua primeira loja.

#### Parâmetros

```json
{
  "email": "string (obrigatório, email válido)",
  "password": "string (obrigatório, mínimo 6 caracteres)",
  "storeName": "string (obrigatório, mínimo 2 caracteres)",
  "storeDescription": "string (opcional)",
  "storeCategory": "string (opcional, enum: hamburgueria, pizzaria, pastelaria, sorveteria, cafeteria, padaria, comida_brasileira, comida_japonesa, doces, mercado, outros)",
  "customCategory": "string (opcional)"
}
```

#### Exemplo de Request

```json
{
  "email": "merchant@exemplo.com",
  "password": "senha123",
  "storeName": "Minha Loja",
  "storeDescription": "A melhor loja da cidade",
  "storeCategory": "pizzaria",
  "customCategory": null
}
```

#### Exemplo de Response (201)

```json
{
  "success": true,
  "data": {
    "success": true,
    "merchant": {
      "id": "45319ec5-7cb8-499b-84b0-896e812dfd2e",
      "email": "merchant@exemplo.com"
    },
    "store": {
      "id": "7cca8fed-7d28-4e5a-bdff-285414829733",
      "name": "Minha Loja",
      "slug": "minha-loja"
    }
  },
  "timestamp": "2025-12-01T10:00:00Z"
}
```

#### Campos da Response

**merchant:**
- `id`: UUID do merchant criado
- `email`: Email do merchant

**store:**
- `id`: UUID da loja criada
- `name`: Nome da loja
- `slug`: Slug único gerado automaticamente (baseado no nome, normalizado e único)

#### Tratamento de Erros

- **400**: Erro ao criar usuário no Supabase ou dados inválidos
- **409**: Email já possui uma conta de merchant cadastrada
- **422**: Dados de validação inválidos (email inválido, senha muito curta, nome da loja muito curto)

#### Como Funciona

1. **Verificação de Email:**
   - Verifica se o email já existe no Supabase Auth
   - Se existir:
     - Verifica se já possui merchant cadastrado
     - Se não tiver merchant, cria o merchant para o usuário existente
     - Se já tiver merchant, retorna erro 409
   - Se não existir:
     - Cria novo usuário no Supabase Auth
     - Cria o merchant

2. **Criação da Loja:**
   - Gera slug único automaticamente baseado no nome da loja
   - Remove acentos e caracteres especiais
   - Verifica se o slug já existe e adiciona contador se necessário (`minha-loja`, `minha-loja-1`, etc.)
   - Cria a loja com valores padrão:
     - Cores: `#FF5733` (primary), `#33FF57` (secondary), `#3357FF` (accent)
     - Pagamentos: Todos habilitados por padrão
     - Delivery e Pickup: Habilitados por padrão
     - Valores numéricos: Zerados (rating, min_order_value, delivery_fee, etc.)

#### Como Usar

1. **Criar Conta de Merchant:**
   ```bash
   curl -X POST https://api.exemplo.com/api/auth/merchant/signup \
     -H "Content-Type: application/json" \
     -d '{
       "email": "merchant@exemplo.com",
       "password": "senha123",
       "storeName": "Minha Loja",
       "storeDescription": "A melhor loja da cidade",
       "storeCategory": "pizzaria"
     }'
   ```

2. **Após o Cadastro:**
   - O merchant pode fazer login usando `POST /api/auth/merchant/login`
   - A loja criada já estará disponível no array `stores` do login
   - O merchant terá role `"owner"` na loja criada

#### Categorias Disponíveis

- `hamburgueria` - Hamburgueria
- `pizzaria` - Pizzaria
- `pastelaria` - Pastelaria
- `sorveteria` - Sorveteria
- `cafeteria` - Cafeteria
- `padaria` - Padaria
- `comida_brasileira` - Comida Brasileira
- `comida_japonesa` - Comida Japonesa
- `doces` - Doces
- `mercado` - Mercado
- `outros` - Outros (padrão)

#### Observações Importantes

- **Slug Único:** O slug é gerado automaticamente e garantido como único. Se `"Minha Loja"` já existir, será criado como `"minha-loja-1"`, `"minha-loja-2"`, etc.
- **Valores Padrão:** A loja é criada com todos os valores padrão configurados. O merchant pode atualizar essas configurações posteriormente.
- **Email Existente:** Se o email já existir no Supabase mas não tiver merchant, o sistema cria o merchant e a loja normalmente.
- **Role Padrão:** Todos os merchants criados recebem role `"admin"` por padrão.
- **Loja Ativa:** A loja é criada com `is_active: true` por padrão.

---

### POST /api/auth/refresh

Renova o token de acesso usando o refresh token.

#### Parâmetros

```json
{
  "refreshToken": "string (obrigatório)"
}
```

#### Exemplo de Request

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Exemplo de Response (200)

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### POST /api/auth/logout

Encerra a sessão do usuário.

#### Headers

```
Authorization: Bearer {token}
```

#### Exemplo de Response (200)

```json
{
  "success": true,
  "data": {
    "success": true
  }
}
```

---

### GET /api/auth/profile

Retorna o perfil completo do usuário autenticado, incluindo dados pessoais e endereços.

#### Headers

```
Authorization: Bearer {token}
```

#### Exemplo de Response (200)

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "auth_user_id": "uuid",
    "name": "Nome do Cliente",
    "phone": "11999999999",
    "email": "cliente@exemplo.com",
    "addresses": [
      {
        "id": "uuid",
        "label": "Casa",
        "addressType": "home",
        "street": "Rua Exemplo",
        "number": "123",
        "neighborhood": "Centro",
        "city": "São Paulo",
        "state": "SP",
        "zipCode": "01234-567",
        "complement": "Apto 101",
        "reference": "Próximo ao mercado",
        "isDefault": true,
        "createdAt": "2025-11-19T10:00:00Z",
        "updatedAt": "2025-11-19T10:00:00Z"
      }
    ],
    "createdAt": "2025-11-19T10:00:00Z",
    "updatedAt": "2025-11-19T10:00:00Z"
  }
}
```

#### Tratamento de Erros

- **401**: Não autenticado ou token inválido
- **404**: Cliente não encontrado

---

### PUT /api/auth/profile

Atualiza o perfil do usuário autenticado, incluindo dados pessoais e endereços. Aceita substituição total (array simples) ou operações parciais.

**Nota:** Para atualizações parciais, recomenda-se usar `PATCH /api/auth/profile` que aceita apenas operações parciais.

#### Headers

```
Authorization: Bearer {token}
Content-Type: application/json
```

#### Parâmetros

O campo `addresses` aceita dois formatos:

**Formato 1: Array simples (substituição total - compatibilidade)**
```json
{
  "name": "string (opcional, mínimo 2 caracteres, máximo 100)",
  "phone": "string (opcional, mínimo 10 caracteres, máximo 15)",
  "addresses": [
    {
      "label": "string (opcional)",
      "addressType": "home | work | other (opcional, padrão: other)",
      "street": "string (obrigatório)",
      "number": "string (obrigatório)",
      "neighborhood": "string (obrigatório)",
      "city": "string (obrigatório)",
      "state": "string (obrigatório)",
      "zipCode": "string (obrigatório, mínimo 8, máximo 12 caracteres)",
      "complement": "string (opcional)",
      "reference": "string (opcional)",
      "isDefault": "boolean (opcional)"
    }
  ]
}
```

**Formato 2: Operações parciais (recomendado)**
```json
{
  "name": "string (opcional, mínimo 2 caracteres, máximo 100)",
  "phone": "string (opcional, mínimo 10 caracteres, máximo 15)",
  "addresses": {
    "add": [
      {
        "label": "string (opcional)",
        "addressType": "home | work | other (opcional, padrão: other)",
        "street": "string (obrigatório)",
        "number": "string (obrigatório)",
        "neighborhood": "string (obrigatório)",
        "city": "string (obrigatório)",
        "state": "string (obrigatório)",
        "zipCode": "string (obrigatório, mínimo 8, máximo 12 caracteres)",
        "complement": "string (opcional)",
        "reference": "string (opcional)",
        "isDefault": "boolean (opcional)"
      }
    ],
    "update": [
      {
        "id": "string (obrigatório, UUID do endereço existente)",
        "label": "string (opcional)",
        "addressType": "home | work | other (opcional)",
        "street": "string (obrigatório)",
        "number": "string (obrigatório)",
        "neighborhood": "string (obrigatório)",
        "city": "string (obrigatório)",
        "state": "string (obrigatório)",
        "zipCode": "string (obrigatório, mínimo 8, máximo 12 caracteres)",
        "complement": "string (opcional)",
        "reference": "string (opcional)",
        "isDefault": "boolean (opcional)"
      }
    ],
    "remove": ["uuid1", "uuid2"]
  }
}
```

#### Exemplo de Request

**Formato 1: Substituição total (compatibilidade)**
```json
{
  "name": "João Silva",
  "phone": "11999999999",
  "addresses": [
    {
      "label": "Casa",
      "addressType": "home",
      "street": "Rua Exemplo",
      "number": "123",
      "neighborhood": "Centro",
      "city": "São Paulo",
      "state": "SP",
      "zipCode": "01234-567",
      "complement": "Apto 101",
      "reference": "Próximo ao mercado",
      "isDefault": true
    },
    {
      "label": "Trabalho",
      "addressType": "work",
      "street": "Av. Paulista",
      "number": "1000",
      "neighborhood": "Bela Vista",
      "city": "São Paulo",
      "state": "SP",
      "zipCode": "01310-100",
      "isDefault": false
    }
  ]
}
```

**Formato 2: Operações parciais (recomendado)**

Adicionar novo endereço:
```json
{
  "addresses": {
    "add": [
      {
        "label": "Casa",
        "addressType": "home",
        "street": "Rua Exemplo",
        "number": "123",
        "neighborhood": "Centro",
        "city": "São Paulo",
        "state": "SP",
        "zipCode": "01234-567",
        "isDefault": true
      }
    ]
  }
}
```

Atualizar endereço existente:
```json
{
  "addresses": {
    "update": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "street": "Rua Exemplo Atualizada",
        "number": "456",
        "neighborhood": "Centro",
        "city": "São Paulo",
        "state": "SP",
        "zipCode": "01234-567"
      }
    ]
  }
}
```

Remover endereço:
```json
{
  "addresses": {
    "remove": ["550e8400-e29b-41d4-a716-446655440000"]
  }
}
```

Operações combinadas:
```json
{
  "name": "João Silva",
  "addresses": {
    "add": [
      {
        "label": "Casa Nova",
        "addressType": "home",
        "street": "Rua Nova",
        "number": "789",
        "neighborhood": "Jardim",
        "city": "São Paulo",
        "state": "SP",
        "zipCode": "01234-567",
        "isDefault": true
      }
    ],
    "update": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "label": "Trabalho Atualizado"
      }
    ],
    "remove": ["660e8400-e29b-41d4-a716-446655440001"]
  }
}
```

#### Exemplo de Response (200)

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "auth_user_id": "uuid",
    "name": "João Silva",
    "phone": "11999999999",
    "email": "cliente@exemplo.com",
    "addresses": [
      {
        "id": "uuid",
        "label": "Casa",
        "addressType": "home",
        "street": "Rua Exemplo",
        "number": "123",
        "neighborhood": "Centro",
        "city": "São Paulo",
        "state": "SP",
        "zipCode": "01234-567",
        "complement": "Apto 101",
        "reference": "Próximo ao mercado",
        "isDefault": true,
        "createdAt": "2025-11-19T10:00:00Z",
        "updatedAt": "2025-11-19T10:05:00Z"
      },
      {
        "id": "uuid",
        "label": "Trabalho",
        "addressType": "work",
        "street": "Av. Paulista",
        "number": "1000",
        "neighborhood": "Bela Vista",
        "city": "São Paulo",
        "state": "SP",
        "zipCode": "01310-100",
        "complement": null,
        "reference": null,
        "isDefault": false,
        "createdAt": "2025-11-19T10:05:00Z",
        "updatedAt": "2025-11-19T10:05:00Z"
      }
    ],
    "createdAt": "2025-11-19T10:00:00Z",
    "updatedAt": "2025-11-19T10:05:00Z"
  },
  "timestamp": "2025-11-19T10:05:00Z"
}
```

#### Tratamento de Erros

- **400**: Content-Type inválido (deve ser `application/json`)
- **401**: Não autenticado ou token inválido
- **404**: Cliente não encontrado
- **404**: Endereço não encontrado ou não pertence ao cliente (ao usar operações parciais)
- **422**: Dados de validação inválidos (campos obrigatórios ausentes, formato inválido)
- **422**: Telefone já cadastrado para outro usuário

#### Exemplo de Erro 400 (Content-Type inválido)

```json
{
  "success": false,
  "error": {
    "message": "Content-Type deve ser application/json",
    "code": "BAD_REQUEST",
    "status": 400,
    "timestamp": "2025-12-01T10:00:00Z"
  }
}
```

#### Exemplo de Erro 404 (Endereço não encontrado)

```json
{
  "success": false,
  "error": {
    "message": "Endereço com ID 550e8400-e29b-41d4-a716-446655440000 não encontrado ou não pertence ao cliente",
    "code": "NOT_FOUND",
    "status": 404,
    "timestamp": "2025-12-01T10:00:00Z"
  }
}
```

#### Regras de Negócio

- ✅ Apenas o próprio usuário pode atualizar seu perfil
- ✅ Se `addresses` não for fornecido, **mantém os endereços existentes**

**Formato de Array Simples (Substituição Total):**
- ✅ Se `addresses` for um array (mesmo que vazio), **substitui todos os endereços existentes**
- ✅ Apenas o primeiro endereço com `isDefault: true` será marcado como padrão

**Formato de Operações Parciais (Recomendado):**
- ✅ `add`: Adiciona novos endereços sem substituir os existentes
- ✅ `update`: Atualiza endereços existentes por ID (valida que o endereço pertence ao cliente)
- ✅ `remove`: Remove endereços por ID (valida que o endereço pertence ao cliente)
- ✅ As operações são executadas na ordem: `remove` → `update` → `add`
- ✅ Apenas o primeiro endereço com `isDefault: true` (entre existentes e novos) será marcado como padrão
- ✅ Se um endereço não for encontrado em `update` ou `remove`, retorna erro 404

---

### PATCH /api/auth/profile

Atualiza parcialmente o perfil do usuário autenticado. Aceita **apenas operações parciais** de endereços (não aceita substituição total).

#### Headers

```
Authorization: Bearer {token}
Content-Type: application/json
```

#### Parâmetros

```json
{
  "name": "string (opcional, mínimo 2 caracteres, máximo 100)",
  "phone": "string (opcional, mínimo 10 caracteres, máximo 15)",
  "addresses": {
    "add": [
      {
        "label": "string (opcional)",
        "addressType": "home | work | other (opcional, padrão: other)",
        "street": "string (obrigatório)",
        "number": "string (obrigatório)",
        "neighborhood": "string (obrigatório)",
        "city": "string (obrigatório)",
        "state": "string (obrigatório)",
        "zipCode": "string (obrigatório, mínimo 8, máximo 12 caracteres)",
        "complement": "string (opcional)",
        "reference": "string (opcional)",
        "isDefault": "boolean (opcional)"
      }
    ],
    "update": [
      {
        "id": "string (obrigatório, UUID do endereço existente)",
        "label": "string (opcional)",
        "addressType": "home | work | other (opcional)",
        "street": "string (obrigatório)",
        "number": "string (obrigatório)",
        "neighborhood": "string (obrigatório)",
        "city": "string (obrigatório)",
        "state": "string (obrigatório)",
        "zipCode": "string (obrigatório, mínimo 8, máximo 12 caracteres)",
        "complement": "string (opcional)",
        "reference": "string (opcional)",
        "isDefault": "boolean (opcional)"
      }
    ],
    "remove": ["uuid1", "uuid2"]
  }
}
```

#### Exemplo de Request

Adicionar novo endereço:
```json
{
  "addresses": {
    "add": [
      {
        "label": "Casa",
        "addressType": "home",
        "street": "Rua Exemplo",
        "number": "123",
        "neighborhood": "Centro",
        "city": "São Paulo",
        "state": "SP",
        "zipCode": "01234-567",
        "isDefault": true
      }
    ]
  }
}
```

Atualizar endereço existente:
```json
{
  "addresses": {
    "update": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "street": "Rua Exemplo Atualizada",
        "number": "456"
      }
    ]
  }
}
```

Remover endereço:
```json
{
  "addresses": {
    "remove": ["550e8400-e29b-41d4-a716-446655440000"]
  }
}
```

Operações combinadas:
```json
{
  "name": "João Silva",
  "addresses": {
    "add": [
      {
        "label": "Casa Nova",
        "addressType": "home",
        "street": "Rua Nova",
        "number": "789",
        "neighborhood": "Jardim",
        "city": "São Paulo",
        "state": "SP",
        "zipCode": "01234-567",
        "isDefault": true
      }
    ],
    "update": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "label": "Trabalho Atualizado"
      }
    ],
    "remove": ["660e8400-e29b-41d4-a716-446655440001"]
  }
}
```

#### Exemplo de Response (200)

Mesmo formato de resposta do `PUT /api/auth/profile`.

#### Tratamento de Erros

- **400**: Content-Type inválido (deve ser `application/json`)
- **401**: Não autenticado ou token inválido
- **404**: Cliente não encontrado
- **404**: Endereço não encontrado ou não pertence ao cliente
- **422**: Dados de validação inválidos (campos obrigatórios ausentes, formato inválido)
- **422**: Array simples não é aceito em PATCH (use operações parciais)
- **422**: Telefone já cadastrado para outro usuário

#### Exemplo de Erro 422 (Array simples em PATCH)

```json
{
  "success": false,
  "error": {
    "message": "PATCH não aceita array simples. Use operações parciais: { add: [], update: [], remove: [] }",
    "code": "VALIDATION_ERROR",
    "status": 422,
    "timestamp": "2025-12-01T10:00:00Z",
    "details": {
      "addresses": ["PATCH não aceita array simples. Use operações parciais: { add: [], update: [], remove: [] }"]
    }
  }
}
```

#### Regras de Negócio

- ✅ Apenas o próprio usuário pode atualizar seu perfil
- ✅ PATCH aceita **apenas operações parciais** (não aceita array simples para substituição total)
- ✅ `add`: Adiciona novos endereços sem substituir os existentes
- ✅ `update`: Atualiza endereços existentes por ID (valida que o endereço pertence ao cliente)
- ✅ `remove`: Remove endereços por ID (valida que o endereço pertence ao cliente)
- ✅ As operações são executadas na ordem: `remove` → `update` → `add`
- ✅ Apenas o primeiro endereço com `isDefault: true` (entre existentes e novos) será marcado como padrão
- ✅ Se um endereço não for encontrado em `update` ou `remove`, retorna erro 404

#### Diferenças entre PUT e PATCH

| Característica | PUT | PATCH |
|----------------|-----|-------|
| Substituição total (array) | ✅ Aceita | ❌ Rejeita |
| Operações parciais | ✅ Aceita | ✅ Aceita |
| Uso recomendado | Substituição completa | Atualizações parciais |
- ✅ Telefone deve ser único no sistema
- ✅ Campos opcionais podem ser omitidos (não atualiza se não fornecido)

#### Observações Importantes

- **Substituição de Endereços:** Quando `addresses` é fornecido, todos os endereços antigos são **deletados permanentemente** e substituídos pelos novos. Use com cuidado!
- **Endereço Padrão:** Se múltiplos endereços tiverem `isDefault: true`, apenas o primeiro será marcado como padrão
- **Telefone Único:** Não é possível usar um telefone que já está cadastrado para outro cliente
- **Campos Ignorados:** Campos como `email`, `id`, `storeId`, `role` são ignorados silenciosamente (não causam erro)

---

## Estratégia de Tokens

O sistema utiliza tokens gerados pelo Supabase diretamente, sem geração manual de JWTs. Isso garante:

- Gerenciamento automático de expiração
- Refresh automático de tokens
- Invalidação centralizada
- Integração nativa com Supabase Auth

