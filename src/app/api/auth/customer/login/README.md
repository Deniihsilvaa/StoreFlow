# Rota de Login do Cliente - Documentação

## Endpoint

```
POST /api/auth/customer/login
```

## Autenticação

❌ **Não requer autenticação** - Esta é a rota de login.

## Body Obrigatório

```json
{
  "email": "cliente@example.com",
  "password": "senha123",
  "storeId": "uuid-da-loja"
}
```

### Campos

| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| `email` | string | ✅ Sim | Email do cliente |
| `password` | string | ✅ Sim | Senha do cliente (mínimo 6 caracteres) |
| `storeId` | UUID | ✅ Sim | ID da loja onde o cliente está fazendo login |

## Validações

1. ✅ **Email válido**: Formato de email correto
2. ✅ **Senha**: Mínimo 6 caracteres
3. ✅ **storeId**: Deve ser um UUID válido
4. ✅ **Cliente existe**: Cliente deve estar cadastrado no sistema
5. ✅ **Acesso à loja**: Cliente deve ter relação ativa com a loja especificada

## Resposta de Sucesso

**Status:** `200 OK`

```json
{
  "success": true,
  "data": {
    "identities": {
      "id": "uuid-do-usuario",
      "email": "cliente@example.com",
      "name": "Nome do Cliente",
      "phone": "11999999999",
      "deleted_at": null
    },
    "store_active": {
      "id": "uuid-da-relacao",
      "user_id": "uuid-do-usuario",
      "store": "uuid-da-loja",
      "active": true,
      "stores": {
        // Dados da loja
      }
    },
    "token": "jwt-token-do-supabase",
    "refreshToken": "refresh-token-do-supabase"
  },
  "timestamp": "2025-01-17T..."
}
```

## Respostas de Erro

### Email ou senha inválidos
**Status:** `200 OK` (erro retornado pelo Supabase)

```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Email ou senha inválidos"
  }
}
```

### Cliente não encontrado
**Status:** `200 OK`

```json
{
  "success": false,
  "error": {
    "code": "CUSTOMER_NOT_FOUND",
    "message": "Cliente não encontrado"
  }
}
```

### Cliente não tem acesso à loja
**Status:** `200 OK`

```json
{
  "success": false,
  "error": {
    "code": "STORE_ACCESS_DENIED",
    "message": "Cliente não tem acesso a esta loja ou a relação está inativa"
  }
}
```

### storeId inválido
**Status:** `400 Bad Request`

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "ID da loja deve ser um UUID válido"
  }
}
```

---

## Exemplos de Uso

### 1. Postman

```
POST http://localhost:3000/api/auth/customer/login

Headers:
  Content-Type: application/json

Body (raw JSON):
{
  "email": "cliente@example.com",
  "password": "senha123",
  "storeId": "123e4567-e89b-12d3-a456-426614174000"
}
```

### 2. cURL

```bash
curl -X POST http://localhost:3000/api/auth/customer/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "cliente@example.com",
    "password": "senha123",
    "storeId": "123e4567-e89b-12d3-a456-426614174000"
  }'
```

### 3. JavaScript/TypeScript (Fetch API)

```javascript
async function loginCustomer(email, password, storeId) {
  const response = await fetch('http://localhost:3000/api/auth/customer/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
      storeId,
    }),
  });

  const data = await response.json();
  
  if (data.success) {
    // Salvar tokens
    localStorage.setItem('token', data.data.token);
    localStorage.setItem('refreshToken', data.data.refreshToken);
    localStorage.setItem('storeId', storeId);
    
    return data.data;
  } else {
    throw new Error(data.error.message);
  }
}

// Uso
loginCustomer(
  'cliente@example.com',
  'senha123',
  '123e4567-e89b-12d3-a456-426614174000'
);
```

### 4. React/Next.js (Frontend)

```typescript
// hooks/useCustomerAuth.ts
export function useCustomerLogin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (email: string, password: string, storeId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/customer/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          storeId,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error?.message || 'Erro ao fazer login');
      }

      // Salvar tokens e informações
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('refreshToken', data.data.refreshToken);
      localStorage.setItem('storeId', storeId);
      localStorage.setItem('user', JSON.stringify(data.data.identities));

      return data.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { login, loading, error };
}

// Uso no componente
function LoginForm() {
  const { login, loading, error } = useCustomerLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [storeId, setStoreId] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await login(email, password, storeId);
      // Redirecionar para dashboard
      router.push('/dashboard');
    } catch (error) {
      // Erro já está no estado
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Senha"
        required
      />
      <input
        type="text"
        value={storeId}
        onChange={(e) => setStoreId(e.target.value)}
        placeholder="ID da Loja (UUID)"
        required
      />
      {error && <p className="error">{error}</p>}
      <button type="submit" disabled={loading}>
        {loading ? 'Entrando...' : 'Entrar'}
      </button>
    </form>
  );
}
```

---

## Fluxo de Autenticação

1. **Frontend envia**: email, password, storeId
2. **Backend valida**: 
   - Email e senha com Supabase Auth
   - Cliente existe no banco
   - Cliente tem acesso à loja especificada (relação ativa)
3. **Backend retorna**: tokens JWT do Supabase + dados do cliente + dados da loja

---

## Notas Importantes

1. ✅ **storeId obrigatório**: O frontend DEVE enviar o ID da loja
2. ✅ **Validação de acesso**: O sistema valida se o cliente pertence à loja
3. ✅ **Relação ativa**: Apenas relações com `active: true` são aceitas
4. ✅ **Tokens do Supabase**: Os tokens retornados são do Supabase (não customizados)
5. ⚠️ **Múltiplas lojas**: Um cliente pode ter acesso a várias lojas, mas deve especificar qual no login

---

## Casos de Uso

### Cliente com acesso a múltiplas lojas

Se um cliente tem acesso a 3 lojas diferentes, ele precisa fazer login especificando qual loja:

```javascript
// Login na Loja A
await loginCustomer('cliente@example.com', 'senha123', 'loja-a-uuid');

// Login na Loja B (mesmo cliente, loja diferente)
await loginCustomer('cliente@example.com', 'senha123', 'loja-b-uuid');
```

### Obter lojas disponíveis para o cliente

Para obter todas as lojas que um cliente tem acesso, você precisaria criar um endpoint separado:

```
GET /api/customers/{customerId}/stores
```

Isso retornaria todas as lojas onde o cliente tem relação ativa.

