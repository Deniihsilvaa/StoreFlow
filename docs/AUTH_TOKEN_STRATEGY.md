# Estratégia de Tokens JWT - Documentação

## Por que usar tokens do Supabase diretamente?

### ✅ Vantagens de usar tokens do Supabase:

1. **Simplicidade**: Não precisa gerar tokens manualmente
2. **Menos código**: Menos complexidade e menos pontos de falha
3. **Gerenciamento automático**: Supabase gerencia expiração, refresh, invalidação
4. **Segurança**: Tokens são assinados e validados pelo Supabase
5. **Consistência**: Mesmo token usado no frontend e backend
6. **Logout automático**: `signOut()` invalida o token automaticamente

### ❌ Desvantagens de gerar tokens manualmente:

1. **Duplicação**: Você está criando um sistema paralelo ao Supabase
2. **Manutenção**: Precisa gerenciar expiração, refresh, invalidação manualmente
3. **Complexidade**: Mais código para manter
4. **Inconsistência**: Tokens diferentes no frontend e backend
5. **Logout**: Precisa invalidar tokens manualmente

---

## Solução Implementada

### Abordagem: Usar tokens do Supabase + Validar com `getUser()`

**Como funciona:**

1. **Login**: Retorna `authData.session.access_token` (token do Supabase)
2. **Validação**: `withAuth` usa `supabaseAuthClient.auth.getUser(token)` para validar
3. **Logout**: `supabaseAuthClient.auth.signOut()` invalida automaticamente

**Vantagens:**
- ✅ Usa tokens nativos do Supabase
- ✅ Validação automática de expiração
- ✅ Logout invalida tokens automaticamente
- ✅ Menos código para manter

---

## Comparação

| Aspecto | Tokens Customizados | Tokens Supabase |
|---------|---------------------|-----------------|
| **Geração** | Manual (`signJwt`) | Automática (Supabase) |
| **Validação** | Manual (`verifyJwt`) | Automática (`getUser()`) |
| **Expiração** | Gerenciada manualmente | Gerenciada pelo Supabase |
| **Refresh** | Implementação manual | Automático |
| **Logout** | Invalidação manual | Automático |
| **Complexidade** | Alta | Baixa |
| **Manutenção** | Mais código | Menos código |

---

## Conclusão

**Recomendação: Usar tokens do Supabase diretamente**

É mais simples, seguro e mantível. O Supabase já faz todo o trabalho pesado de gerenciamento de tokens.

