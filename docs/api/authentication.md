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

Retorna o perfil do usuário autenticado.

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
    "email": "cliente@exemplo.com",
    "name": "Nome do Cliente"
  }
}
```

## Estratégia de Tokens

O sistema utiliza tokens gerados pelo Supabase diretamente, sem geração manual de JWTs. Isso garante:

- Gerenciamento automático de expiração
- Refresh automático de tokens
- Invalidação centralizada
- Integração nativa com Supabase Auth

