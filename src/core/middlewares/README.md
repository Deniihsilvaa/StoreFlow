# Middlewares - Documentação

## Tipos de Middlewares no Projeto

Este projeto usa **dois tipos diferentes de middlewares** com propósitos distintos:

### 1. Middleware Global do Next.js (`middleware.ts`)

**Localização:** ✅ **Raiz do projeto** (`middleware.ts`)

**Propósito:** 
- Executa **antes** de todas as requisições
- ✅ **CORS** - Headers de controle de origem
- ✅ **Logging** - Registro de requisições
- ✅ **Segurança** - Headers de proteção (XSS, clickjacking, etc.)
- Aplica-se automaticamente a todas as rotas que correspondem ao `matcher`

**Características:**
- Executa no **edge runtime** (mais rápido, mas limitado)
- Não pode acessar Node.js APIs completas
- Executa antes de qualquer rota handler

**Funcionalidades implementadas:**
- ✅ Validação de origens permitidas
- ✅ Tratamento de requisições OPTIONS (preflight)
- ✅ Logging de requisições (em desenvolvimento)
- ✅ Headers de segurança (X-Content-Type-Options, X-Frame-Options, etc.)
- ✅ Medição de performance (tempo de resposta)

**Exemplo de uso:**
```typescript
// middleware.ts (na raiz do projeto) - JÁ IMPLEMENTADO
export function middleware(request: NextRequest) {
  // CORS, logging, segurança - tudo automático!
  return NextResponse.next(request);
}

export const config = {
  matcher: '/api/:path*',
};
```

---

### 2. Middlewares de Rota (Wrappers)

**Localização:** `src/core/middlewares/`

**Propósito:**
- Wrappers de funções que envolvem handlers de rotas
- Ideal para: autenticação, tratamento de erros, validação
- Aplica-se **manualmente** em cada rota que precisa

**Características:**
- Executa no **Node.js runtime** completo
- Pode acessar todas as APIs do Node.js
- Executa **dentro** do handler da rota
- Pode ser combinado (composição)

**Middlewares disponíveis:**

#### `withErrorHandling`
Trata erros automaticamente e retorna respostas padronizadas.

```typescript
export const GET = withErrorHandling(async (request) => {
  // Seu código aqui
  // Erros são capturados automaticamente
});
```

#### `withAuth`
Valida token JWT e injeta `user` no contexto.

```typescript
export const GET = withErrorHandling(
  withAuth(async (request, context) => {
    // context.user está disponível aqui
    const userId = context.user.id;
  })
);
```

#### `withMerchant`
Garante que o usuário é um merchant e injeta `user` tipado.

```typescript
export const GET = withErrorHandling(
  withMerchant(async (request, context) => {
    // context.user.type === "merchant"
  })
);
```

---

## Comparação

| Característica | Middleware Global | Middlewares de Rota |
|---------------|-------------------|---------------------|
| **Execução** | Antes de todas as rotas | Dentro do handler |
| **Runtime** | Edge | Node.js |
| **Aplicação** | Automática (via matcher) | Manual (por rota) |
| **Uso ideal** | CORS, logging, rate limit | Auth, validação, erros |
| **Performance** | Mais rápido | Mais lento (mas mais flexível) |
| **Acesso a APIs** | Limitado | Completo |

---

## Recomendação de Uso

### ✅ Use Middleware Global (`middleware.ts`) para:
- ✅ CORS headers
- ✅ Logging de requisições
- ✅ Rate limiting
- ✅ Redirecionamentos baseados em path
- ✅ Headers globais

### ✅ Use Middlewares de Rota (`with*`) para:
- ✅ Autenticação (JWT)
- ✅ Autorização (roles, permissions)
- ✅ Tratamento de erros
- ✅ Validação de dados
- ✅ Transformação de dados

---

## Estrutura Recomendada

```
projeto/
├── middleware.ts          ← Middleware global (CORS, logging)
└── src/
    └── core/
        └── middlewares/
            ├── withAuth.ts         ← Auth wrapper
            ├── withErrorHandling.ts ← Error handler wrapper
            └── withMerchant.ts     ← Merchant wrapper
```

---

## Exemplo Completo

### 1. Middleware Global (CORS)
```typescript
// middleware.ts (raiz)
export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin');
  
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': origin || '*',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE',
      },
    });
  }
  
  const response = NextResponse.next(request);
  response.headers.set('Access-Control-Allow-Origin', origin || '*');
  return response;
}

export const config = { matcher: '/api/:path*' };
```

### 2. Rota com Middlewares de Rota
```typescript
// src/app/api/profile/route.ts
export const GET = withErrorHandling(
  withAuth(async (request, context) => {
    // context.user está disponível
    return ApiResponse.success({ user: context.user });
  })
);
```

---

## Conclusão

**Para verificar chamadas e adicionar CORS:** Use o **middleware global** (`middleware.ts` na raiz)

**Para autenticação e validação:** Use os **middlewares de rota** (`withAuth`, `withErrorHandling`, etc.)

Ambos são complementares e devem ser usados juntos!

