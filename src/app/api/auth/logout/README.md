# Rota de Logout - Documentação

## Endpoint

```
POST /api/auth/logout
```

## Autenticação

✅ **Requer autenticação** - Esta rota usa o middleware `withAuth`, então você precisa enviar um token JWT válido no header.

## Headers Obrigatórios

```
Authorization: Bearer <seu_token_jwt>
Content-Type: application/json
```

## Body

Esta rota **não requer body** (pode enviar um objeto vazio `{}` ou não enviar body).

## Resposta de Sucesso

**Status:** `200 OK`

```json
{
  "success": true,
  "data": {
    "success": true
  },
  "timestamp": "2025-01-17T..."
}
```

## Resposta de Erro

### Token ausente ou inválido
**Status:** `401 Unauthorized`

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Token de acesso ausente"
  }
}
```

---

## Exemplos de Uso

### 1. Postman

1. **Método:** `POST`
2. **URL:** `http://localhost:3000/api/auth/logout`
3. **Headers:**
   - `Authorization`: `Bearer seu_token_aqui`
   - `Content-Type`: `application/json`
4. **Body:** (opcional, pode deixar vazio)
   ```json
   {}
   ```
5. Clique em **Send**

### 2. cURL

```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer seu_token_aqui" \
  -H "Content-Type: application/json"
```

### 3. JavaScript/TypeScript (Fetch API)

```javascript
async function logout(token) {
  const response = await fetch('http://localhost:3000/api/auth/logout', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = await response.json();
  
  if (response.ok) {
    console.log('Logout realizado com sucesso:', data);
  } else {
    console.error('Erro no logout:', data);
  }
  
  return data;
}

// Uso
const token = 'seu_token_jwt_aqui';
logout(token);
```

### 4. Axios

```javascript
import axios from 'axios';

async function logout(token) {
  try {
    const response = await axios.post(
      'http://localhost:3000/api/auth/logout',
      {},
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    console.log('Logout realizado:', response.data);
    return response.data;
  } catch (error) {
    console.error('Erro no logout:', error.response?.data || error.message);
    throw error;
  }
}

// Uso
const token = 'seu_token_jwt_aqui';
logout(token);
```

### 5. React/Next.js (Frontend)

```typescript
// hooks/useAuth.ts
export function useLogout() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const logout = async (token: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Erro ao fazer logout');
      }

      // Limpar token do storage
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');

      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { logout, loading, error };
}

// Uso no componente
function LogoutButton() {
  const { logout, loading } = useLogout();
  const token = localStorage.getItem('token');

  const handleLogout = async () => {
    if (!token) {
      alert('Você não está logado');
      return;
    }

    try {
      await logout(token);
      // Redirecionar para login
      window.location.href = '/login';
    } catch (error) {
      alert('Erro ao fazer logout');
    }
  };

  return (
    <button onClick={handleLogout} disabled={loading}>
      {loading ? 'Saindo...' : 'Sair'}
    </button>
  );
}
```

---

## Fluxo Completo (Login → Logout)

### 1. Fazer Login

```javascript
// POST /api/auth/customer/login
const loginResponse = await fetch('http://localhost:3000/api/auth/customer/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'cliente@example.com',
    password: 'senha123',
  }),
});

const loginData = await loginResponse.json();
const token = loginData.data.token; // Salvar este token
```

### 2. Usar o Token em Requisições Autenticadas

```javascript
// Qualquer rota que precise de autenticação
const response = await fetch('http://localhost:3000/api/auth/profile', {
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});
```

### 3. Fazer Logout

```javascript
// POST /api/auth/logout
const logoutResponse = await fetch('http://localhost:3000/api/auth/logout', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
});

const logoutData = await logoutResponse.json();
// Token foi invalidado no Supabase
```

---

## Notas Importantes

1. ✅ **Token obrigatório**: Sem o token JWT válido, a rota retornará `401 Unauthorized`
2. ✅ **Método POST**: A rota aceita apenas requisições POST
3. ✅ **Body opcional**: Não é necessário enviar dados no body
4. ✅ **Invalidar sessão**: O logout invalida a sessão no Supabase Auth
5. ⚠️ **Token no frontend**: Após o logout, remova o token do localStorage/sessionStorage

---

## Testando no Postman

### Passo a passo:

1. **Primeiro, faça login:**
   - POST `http://localhost:3000/api/auth/customer/login`
   - Body: `{ "email": "seu@email.com", "password": "sua_senha" }`
   - Copie o `token` da resposta

2. **Depois, faça logout:**
   - POST `http://localhost:3000/api/auth/logout`
   - Header: `Authorization: Bearer <token_copiado>`
   - Body: (pode deixar vazio)

3. **Verificar:**
   - Se o logout funcionou, você receberá `{ "success": true, "data": { "success": true } }`
   - Se tentar usar o mesmo token novamente, receberá erro de autenticação

---

## Troubleshooting

### Erro: "Token de acesso ausente"
- Verifique se o header `Authorization` está presente
- Verifique se o formato está correto: `Bearer <token>`

### Erro: "Token de acesso inválido"
- O token pode ter expirado (tokens JWT expiram em 15 minutos)
- Use o endpoint `/api/auth/refresh` para renovar o token

### Erro: "Erro ao deslogar"
- Verifique se o token ainda é válido
- Verifique a conexão com o Supabase

