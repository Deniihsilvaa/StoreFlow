# Documentação do Projeto StoreFlow Backend

Bem-vindo à documentação completa do backend StoreFlow!

## 📚 Estrutura da Documentação

### [API](./api/)
Documentação completa de todos os endpoints disponíveis:

- [Autenticação](./api/authentication.md) - Login, signup, refresh tokens
- [Lojas](./api/stores.md) - Gerenciamento de lojas
- [Produtos](./api/products.md) - Gerenciamento de produtos

### [Guias](./guides/)
Guias práticos para desenvolvimento:

- [Início Rápido](./guides/getting-started.md) - Configuração inicial
- [Middlewares](./guides/middlewares.md) - Uso de middlewares

## 🚀 Início Rápido

1. Leia o [Guia de Início Rápido](./guides/getting-started.md)
2. Explore os [Endpoints da API](./api/)
3. Consulte os [Guias de Desenvolvimento](./guides/)

## 📖 Convenções

### Formato de Resposta

Todas as respostas seguem o padrão:

```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2025-11-19T00:00:00.000Z"
}
```

### Tratamento de Erros

Erros seguem o formato:

```json
{
  "success": false,
  "error": {
    "message": "Mensagem de erro",
    "code": "ERROR_CODE",
    "status": 400,
    "details": { ... }
  },
  "timestamp": "2025-11-19T00:00:00.000Z"
}
```

## 🔧 Tecnologias

- **Next.js 14+** - Framework React
- **Prisma** - ORM para PostgreSQL
- **Supabase** - Autenticação e banco de dados
- **TypeScript** - Tipagem estática
- **Zod** - Validação de schemas

## 📝 Contribuindo

Ao adicionar novos endpoints ou funcionalidades:

1. Atualize a documentação correspondente
2. Adicione exemplos de request/response
3. Documente possíveis erros
4. Mantenha o padrão estabelecido

