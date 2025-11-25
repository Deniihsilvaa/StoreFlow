# API de Perfil do Usuário

## Visão Geral

Endpoints para gerenciar o perfil do usuário autenticado, incluindo dados básicos e endereços.

## Endpoints

### GET /api/auth/profile

Retorna o perfil completo do usuário autenticado, incluindo dados básicos e endereços.

#### Headers

```
Authorization: Bearer {token}
```

#### Exemplo de Request

```
GET /api/auth/profile
Authorization: Bearer {token}
```

#### Exemplo de Response (200)

```json
{
  "success": true,
  "data": {
    "id": "19bf8eff-14d9-468b-9a78-8908dcbf19da",
    "auth_user_id": "uuid-do-usuario-auth",
    "name": "João Silva",
    "phone": "35991612911",
    "email": "joao@example.com",
    "addresses": [
      {
        "id": "uuid-do-endereco",
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
        "createdAt": "2025-11-25T00:00:00.000Z",
        "updatedAt": "2025-11-25T00:00:00.000Z"
      }
    ],
    "createdAt": "2025-11-20T00:00:00.000Z",
    "updatedAt": "2025-11-25T00:00:00.000Z"
  },
  "timestamp": "2025-11-25T03:00:00.000Z"
}
```

#### Tratamento de Erros

- **401**: Não autenticado ou token inválido
- **404**: Cliente não encontrado

---

### PUT /api/auth/profile

Atualiza o perfil do usuário autenticado, incluindo dados básicos e endereços.

#### Headers

```
Authorization: Bearer {token}
Content-Type: application/json
```

#### Body

```json
{
  "name": "string (opcional, 2-100 caracteres)",
  "phone": "string (opcional, 10-15 caracteres)",
  "addresses": [
    {
      "label": "string (opcional)",
      "addressType": "home | work | other (opcional, padrão: other)",
      "street": "string (obrigatório)",
      "number": "string (obrigatório)",
      "neighborhood": "string (obrigatório)",
      "city": "string (obrigatório)",
      "state": "string (obrigatório, 2 caracteres)",
      "zipCode": "string (obrigatório, 8-12 caracteres)",
      "complement": "string (opcional)",
      "reference": "string (opcional)",
      "isDefault": "boolean (opcional)"
    }
  ]
}
```

#### Exemplo de Request

```json
{
  "name": "João Silva",
  "phone": "35991612911",
  "addresses": [
    {
      "label": "Casa",
      "addressType": "home",
      "street": "Rua Exemplo",
      "number": "123",
      "neighborhood": "Centro",
      "city": "São Paulo",
      "state": "SP",
      "zipCode": "01234567",
      "complement": "Apto 101",
      "reference": "Próximo ao mercado",
      "isDefault": true
    }
  ]
}
```

#### Exemplo de Response (200)

```json
{
  "success": true,
  "data": {
    "id": "19bf8eff-14d9-468b-9a78-8908dcbf19da",
    "auth_user_id": "uuid-do-usuario-auth",
    "name": "João Silva",
    "phone": "35991612911",
    "email": "joao@example.com",
    "addresses": [
      {
        "id": "uuid-do-endereco",
        "label": "Casa",
        "addressType": "home",
        "street": "Rua Exemplo",
        "number": "123",
        "neighborhood": "Centro",
        "city": "São Paulo",
        "state": "SP",
        "zipCode": "01234567",
        "complement": "Apto 101",
        "reference": "Próximo ao mercado",
        "isDefault": true,
        "createdAt": "2025-11-25T00:00:00.000Z",
        "updatedAt": "2025-11-25T00:00:00.000Z"
      }
    ],
    "createdAt": "2025-11-20T00:00:00.000Z",
    "updatedAt": "2025-11-25T00:00:00.000Z"
  },
  "timestamp": "2025-11-25T03:00:00.000Z"
}
```

#### Tratamento de Erros

- **401**: Não autenticado ou token inválido
- **404**: Cliente não encontrado
- **422**: Dados inválidos (validação Zod)
  - Campos obrigatórios faltando
  - Formato inválido (telefone, CEP, etc.)
  - Valores fora dos limites permitidos

#### Erros Comuns

- `"Cliente não encontrado"` - O usuário autenticado não possui registro na tabela `customers`
- `"Telefone já cadastrado"` - O telefone informado já está em uso por outro cliente
- `"Rua é obrigatória"` - Campo `street` não foi fornecido no endereço
- `"CEP deve ter no mínimo 8 caracteres"` - CEP inválido

#### Comportamento de Atualização

**Dados Básicos:**
- `name` e `phone` são opcionais e podem ser atualizados independentemente
- Se `phone` for atualizado, será validado para garantir unicidade

**Endereços:**
- Se `addresses` for fornecido (mesmo que vazio), **substitui** todos os endereços existentes
- Se `addresses` não for fornecido, **mantém** os endereços existentes
- Se `addresses` for um array vazio `[]`, **remove** todos os endereços
- Apenas o primeiro endereço marcado como `isDefault: true` será realmente default
- Endereços são ordenados por: default primeiro, depois por data de criação

#### Exemplos de Uso

**Atualizar apenas o nome:**
```json
{
  "name": "João Silva Santos"
}
```

**Atualizar apenas o telefone:**
```json
{
  "phone": "11999999999"
}
```

**Atualizar nome e telefone:**
```json
{
  "name": "João Silva",
  "phone": "11999999999"
}
```

**Adicionar/Atualizar endereços (substitui todos):**
```json
{
  "addresses": [
    {
      "label": "Casa",
      "addressType": "home",
      "street": "Rua Exemplo",
      "number": "123",
      "neighborhood": "Centro",
      "city": "São Paulo",
      "state": "SP",
      "zipCode": "01234567",
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
      "zipCode": "01310100",
      "isDefault": false
    }
  ]
}
```

**Remover todos os endereços:**
```json
{
  "addresses": []
}
```

**Manter endereços existentes e atualizar apenas nome:**
```json
{
  "name": "João Silva"
}
// Não incluir "addresses" no body
```

---

## Estrutura de Dados

### Profile Response

```typescript
type Profile = {
  id: string;                    // UUID do cliente
  auth_user_id: string | null;    // UUID do usuário no Supabase Auth
  name: string;                  // Nome completo
  phone: string;                 // Telefone (único)
  email: string | null;          // Email do Supabase Auth
  addresses: Address[];          // Array de endereços
  createdAt: Date;               // Data de criação
  updatedAt: Date;               // Data de última atualização
};
```

### Address

```typescript
type Address = {
  id: string;                    // UUID do endereço
  label: string | null;          // Rótulo do endereço (ex: "Casa", "Trabalho")
  addressType: "home" | "work" | "other";  // Tipo de endereço
  street: string;                 // Rua
  number: string;                // Número
  neighborhood: string;           // Bairro
  city: string;                  // Cidade
  state: string;                 // Estado (2 caracteres)
  zipCode: string;               // CEP (8-12 caracteres)
  complement: string | null;      // Complemento
  reference: string | null;       // Ponto de referência
  isDefault: boolean;            // Endereço padrão
  createdAt: Date;               // Data de criação
  updatedAt: Date;               // Data de última atualização
};
```

### UpdateProfileInput

```typescript
type UpdateProfileInput = {
  name?: string;                 // Nome (2-100 caracteres)
  phone?: string;                // Telefone (10-15 caracteres)
  addresses?: AddressInput[];     // Array de endereços (opcional)
};
```

### AddressInput

```typescript
type AddressInput = {
  label?: string;                // Rótulo (opcional)
  addressType?: "home" | "work" | "other";  // Tipo (padrão: "other")
  street: string;                // Rua (obrigatório)
  number: string;                // Número (obrigatório)
  neighborhood: string;          // Bairro (obrigatório)
  city: string;                  // Cidade (obrigatório)
  state: string;                 // Estado (obrigatório, 2 caracteres)
  zipCode: string;               // CEP (obrigatório, 8-12 caracteres)
  complement?: string;            // Complemento (opcional)
  reference?: string;             // Referência (opcional)
  isDefault?: boolean;           // Endereço padrão (opcional)
};
```

---

## Validações

### Nome
- **Obrigatório**: Não (pode ser omitido se não quiser atualizar)
- **Tamanho mínimo**: 2 caracteres
- **Tamanho máximo**: 100 caracteres

### Telefone
- **Obrigatório**: Não (pode ser omitido se não quiser atualizar)
- **Tamanho mínimo**: 10 caracteres
- **Tamanho máximo**: 15 caracteres
- **Unicidade**: Deve ser único no sistema (não pode estar em uso por outro cliente)

### Endereço

#### Campos Obrigatórios
- `street` - Rua
- `number` - Número
- `neighborhood` - Bairro
- `city` - Cidade
- `state` - Estado (2 caracteres)
- `zipCode` - CEP (8-12 caracteres)

#### Campos Opcionais
- `label` - Rótulo do endereço
- `addressType` - Tipo (padrão: "other")
- `complement` - Complemento
- `reference` - Ponto de referência
- `isDefault` - Endereço padrão (padrão: false)

#### Regras de Negócio
- Apenas um endereço pode ser marcado como `isDefault: true`
- Se múltiplos endereços forem marcados como default, apenas o primeiro será considerado
- Endereços são ordenados: default primeiro, depois por data de criação

---

## Exemplos de Uso

### Frontend React

```typescript
// Buscar perfil
const getProfile = async (token: string) => {
  const response = await fetch('http://localhost:3000/api/auth/profile', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  const data = await response.json();
  return data;
};

// Atualizar perfil
const updateProfile = async (token: string, profileData: UpdateProfileInput) => {
  const response = await fetch('http://localhost:3000/api/auth/profile', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(profileData),
  });
  
  const data = await response.json();
  return data;
};

// Exemplo de uso
const profile = await getProfile(token);
console.log(profile.data.name);

await updateProfile(token, {
  name: 'João Silva',
  phone: '11999999999',
  addresses: [
    {
      label: 'Casa',
      addressType: 'home',
      street: 'Rua Exemplo',
      number: '123',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234567',
      isDefault: true,
    },
  ],
});
```

### cURL

**Buscar perfil:**
```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json"
```

**Atualizar perfil:**
```bash
curl -X PUT http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
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
        "zipCode": "01234567",
        "isDefault": true
      }
    ]
  }'
```

### Postman

1. **Criar nova requisição:**
   - Método: `GET` ou `PUT`
   - URL: `http://localhost:3000/api/auth/profile`

2. **Headers:**
   - `Authorization`: `Bearer {seu_token}`
   - `Content-Type`: `application/json`

3. **Body (apenas para PUT):**
   - Selecionar "raw" e "JSON"
   - Inserir o JSON do exemplo acima

---

## Notas Importantes

- Todas as rotas requerem autenticação via JWT
- O `email` é obtido do Supabase Auth e não pode ser alterado via esta API
- Endereços são substituídos completamente quando `addresses` é fornecido
- Soft delete é utilizado (campo `deleted_at`)
- Apenas um endereço pode ser padrão por vez
- Telefone deve ser único no sistema

---

## Status de Implementação

### ✅ Implementado

- **GET /api/auth/profile** - Buscar perfil completo
  - Dados básicos do cliente
  - Endereços do cliente
  - Email do Supabase Auth

- **PUT /api/auth/profile** - Atualizar perfil
  - Atualização de nome
  - Atualização de telefone com validação de unicidade
  - Gerenciamento completo de endereços
  - Validação completa com Zod
  - Transações para garantir consistência

### 🚧 Melhorias Futuras

1. **Upload de Avatar**
   - Upload de imagem para avatar do perfil
   - Integração com Supabase Storage

2. **Verificação de Email**
   - Envio de email de confirmação após alteração
   - Verificação de email antes de atualizar

3. **Histórico de Alterações**
   - Log de todas as alterações no perfil
   - Auditoria de mudanças

4. **Validação de Endereço**
   - Integração com API de CEP (ViaCEP, etc.)
   - Validação de endereço real

5. **Preferências do Usuário**
   - Preferências de notificação
   - Configurações de privacidade

6. **Two-Factor Authentication**
   - Suporte a 2FA
   - Métodos alternativos de autenticação

