# Middlewares

## Visão Geral

O projeto utiliza middlewares para padronizar o tratamento de requisições, autenticação e erros.

## withErrorHandling

Middleware global para capturar e formatar erros.

### Uso

```typescript
import { withErrorHandling } from "@/core/middlewares/withErrorHandling";

export const GET = withErrorHandling(async (request: NextRequest) => {
  // Sua lógica aqui
  return ApiResponse.success({ data: "resultado" });
});
```

### Funcionalidades

- Captura erros não tratados
- Formata respostas de erro de forma consistente
- Loga erros para debugging
- Retorna status HTTP apropriado

### Tipos de Erro

- `ApiError.validation()` - 422 (Validação)
- `ApiError.notFound()` - 404 (Não encontrado)
- `ApiError.unauthorized()` - 401 (Não autorizado)
- `ApiError.forbidden()` - 403 (Proibido)
- `ApiError.serverError()` - 500 (Erro interno)

---

## withAuth

Middleware para proteger rotas que requerem autenticação.

### Uso

```typescript
import { withAuth } from "@/core/middlewares/withAuth";
import { withErrorHandling } from "@/core/middlewares/withErrorHandling";

export const GET = withErrorHandling(
  withAuth(async (request: NextRequest, context) => {
    // context.user contém os dados do usuário autenticado
    const userId = context.user.id;
    
    return ApiResponse.success({ userId });
  })
);
```

### Headers Necessários

```
Authorization: Bearer {token}
```

### Context

O middleware adiciona `context.user` com:

```typescript
{
  id: string;
  email: string;
  // outros campos do token
}
```

### Tratamento de Erros

- **401**: Token ausente ou inválido
- **403**: Token expirado

---

## withMerchant

Middleware para proteger rotas que requerem permissão de merchant.

### Uso

```typescript
import { withMerchant } from "@/core/middlewares/withMerchant";
import { withErrorHandling } from "@/core/middlewares/withErrorHandling";

export const GET = withErrorHandling(
  withMerchant(async (request: NextRequest, context) => {
    // context.user contém dados do merchant
    // context.store contém dados da loja
    return ApiResponse.success({ 
      merchantId: context.user.id,
      storeId: context.store.id 
    });
  })
);
```

### Requisitos

- Usuário deve estar autenticado (`withAuth`)
- Usuário deve ter permissão de merchant
- Loja deve estar ativa

---

## Combinando Middlewares

Você pode combinar múltiplos middlewares:

```typescript
export const GET = withErrorHandling(
  withAuth(
    withMerchant(async (request, context) => {
      // Lógica protegida
    })
  )
);
```

A ordem importa! Sempre coloque `withErrorHandling` no nível mais externo.

