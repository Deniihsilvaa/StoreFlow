# Guia de Início Rápido

## Pré-requisitos

- Node.js 18+ instalado
- PostgreSQL ou acesso ao Supabase
- Conta no Supabase (para autenticação)

## Instalação

1. Clone o repositório:
```bash
git clone <repository-url>
cd BackEnd
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

4. Preencha o arquivo `.env` com suas credenciais:
```env
DATABASE_URL="postgresql://user:password@host:port/database"
DIRECT_URL="postgresql://user:password@host:port/database"
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
JWT_SECRET="your-jwt-secret"
NODE_ENV="development"
```

5. Execute as migrações do Prisma:
```bash
npx prisma migrate dev
```

6. Gere o Prisma Client:
```bash
npx prisma generate
```

7. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

O servidor estará disponível em `http://localhost:3000`

## Estrutura do Projeto

```
src/
├── app/              # Rotas Next.js (App Router)
│   └── api/          # Endpoints da API
├── config/           # Configurações (env, logger, etc)
├── core/             # Core do sistema
│   ├── errors/       # Tratamento de erros
│   ├── middlewares/  # Middlewares (auth, error handling)
│   └── utils/        # Utilitários
├── infra/            # Infraestrutura (Prisma, Supabase)
├── modules/          # Módulos de negócio
│   ├── auth/         # Autenticação
│   ├── products/     # Produtos
│   └── stores/       # Lojas
└── types/            # Tipos TypeScript
```

## Primeiros Passos

### 1. Testar a API

Acesse `http://localhost:3000` para ver a lista de endpoints disponíveis.

### 2. Criar um Cliente

Use o endpoint de signup para criar um novo cliente:

```bash
POST /api/auth/customer/signup
{
  "email": "cliente@exemplo.com",
  "password": "senha123",
  "storeId": "uuid-da-loja",
  "name": "Nome do Cliente",
  "phone": "11999999999"
}
```

### 3. Fazer Login

```bash
POST /api/auth/customer/login
{
  "email": "cliente@exemplo.com",
  "password": "senha123",
  "storeId": "uuid-da-loja"
}
```

### 4. Usar o Token

Adicione o token retornado no header `Authorization`:

```
Authorization: Bearer {token}
```

## Scripts de Teste Disponíveis

O projeto inclui scripts de teste para validar a configuração:

```bash
# Testar variáveis de ambiente
npm run test:env

# Testar se todas as rotas existem
npm run test:routes

# Testar conexão com Prisma
npm run prisma:test-connection

# Executar todos os testes
npm run test:all
```

## Próximos Passos

- Leia a documentação completa das APIs em `/docs/api`
- Explore os middlewares disponíveis em `/docs/guides/middlewares`
- Teste a configuração usando os scripts de teste
- Consulte os exemplos de uso na documentação

