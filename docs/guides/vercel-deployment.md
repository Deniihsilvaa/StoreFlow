# Guia de Deploy no Vercel

## Variáveis de Ambiente Necessárias

Configure as seguintes variáveis de ambiente no painel do Vercel:

### 🔐 Variáveis Obrigatórias

#### 1. **DATABASE_URL**
```
postgresql://usuario:senha@host:porta/database?pgbouncer=true&search_path=public
```
- **Descrição**: URL de conexão com o banco de dados PostgreSQL (Supabase)
- **Exemplo**: `postgresql://postgres.mnryjgztratsotaczjev:Dsmoke@29_97@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true&search_path=public`
- **Importante**: 
  - Use a URL do **Pooler** (porta 6543) para produção
  - Se a senha contiver caracteres especiais como `@`, `#`, `%`, etc., você precisa fazer URL encoding:
    - `@` → `%40`
    - `#` → `%23`
    - `%` → `%25`
    - `&` → `%26`
  - Inclua `&search_path=public` no final

#### 2. **DIRECT_URL** (Opcional, mas recomendado)
```
postgresql://usuario:senha@host:porta/database
```
- **Descrição**: URL de conexão direta com o banco (sem pooler) - usado pelo Prisma para migrations
- **Exemplo**: `postgresql://postgres.mnryjgztratsotaczjev:Dsmoke@29_97@aws-1-us-east-2.pooler.supabase.com:5432/postgres`
- **Nota**: Use a porta **5432** (conexão direta) ao invés de 6543

#### 3. **SUPABASE_URL**
```
https://seu-projeto.supabase.co
```
- **Descrição**: URL base do seu projeto Supabase
- **Onde encontrar**: Dashboard do Supabase → Settings → API → Project URL

#### 4. **SUPABASE_ANON_KEY**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
- **Descrição**: Chave pública (anon) do Supabase - usada para autenticação de clientes
- **Onde encontrar**: Dashboard do Supabase → Settings → API → Project API keys → `anon` `public`

#### 5. **SUPABASE_SERVICE_ROLE_KEY**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
- **Descrição**: Chave de serviço (service_role) do Supabase - usada para operações administrativas
- **Onde encontrar**: Dashboard do Supabase → Settings → API → Project API keys → `service_role` `secret`
- **⚠️ ATENÇÃO**: Esta chave tem privilégios administrativos. **NUNCA** exponha no frontend!

#### 6. **JWT_SECRET**
```
uma-string-secreta-com-pelo-menos-32-caracteres-aleatorios
```
- **Descrição**: Chave secreta para assinatura de tokens JWT
- **Requisito**: Mínimo de 32 caracteres
- **Dica**: Use um gerador de strings aleatórias seguras
- **Exemplo de geração**: 
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

### ⚙️ Variáveis Opcionais

#### 7. **NODE_ENV**
```
production
```
- **Descrição**: Ambiente de execução
- **Valores possíveis**: `development`, `test`, `production`
- **Padrão**: Se não definido, será `development`
- **Recomendação**: Defina como `production` no Vercel

#### 8. **LOG_LEVEL**
```
info
```
- **Descrição**: Nível de log do sistema
- **Valores possíveis**: `trace`, `debug`, `info`, `warn`, `error`, `fatal`
- **Padrão**: `info` se não definido
- **Recomendação**: Use `info` ou `warn` em produção, `error` para reduzir logs

#### 9. **ALLOWED_ORIGINS** (opcional)
```
https://seu-dominio.com,https://outro-dominio.com
```
- **Descrição**: Lista de origens permitidas para CORS (separadas por vírgula)
- **Padrão**: Os domínios da Vercel já estão configurados no código
- **Nota**: Use apenas se precisar adicionar domínios customizados além dos já configurados

## 📋 Checklist de Configuração no Vercel

### Passo 1: Acessar Configurações
1. Acesse seu projeto no [Vercel Dashboard](https://vercel.com/dashboard)
2. Vá em **Settings** → **Environment Variables**

### Passo 2: Adicionar Variáveis
Para cada variável acima:

1. Clique em **Add New**
2. Preencha:
   - **Name**: Nome da variável (ex: `DATABASE_URL`)
   - **Value**: Valor da variável
   - **Environment**: Selecione onde aplicar:
     - ✅ **Production** (obrigatório)
     - ✅ **Preview** (recomendado para testar)
     - ✅ **Development** (opcional, se usar Vercel CLI)

3. Clique em **Save**

### Passo 3: Verificar Build Settings

No Vercel, verifique se o **Build Command** está configurado como:
```bash
npm run build
```

Ou se você precisar gerar o Prisma Client antes:
```bash
prisma generate && next build
```

O `package.json` já tem isso configurado no script `build`.

### Passo 4: Framework Preset
- **Framework Preset**: Next.js
- **Root Directory**: `./` (raiz do projeto)
- **Build Command**: `npm run build` (ou deixe vazio para usar o padrão)
- **Output Directory**: `.next` (padrão do Next.js)
- **Install Command**: `npm install`

## 🔍 Como Encontrar os Valores no Supabase

### DATABASE_URL e DIRECT_URL
1. Acesse o [Supabase Dashboard](https://app.supabase.com)
2. Selecione seu projeto
3. Vá em **Settings** → **Database**
4. Role até **Connection string**
5. Selecione **URI** ou **Connection pooling**
6. Copie a string e substitua `[YOUR-PASSWORD]` pela sua senha real
7. Para **DIRECT_URL**: Use a conexão **Session mode** (porta 5432)
8. Para **DATABASE_URL**: Use a conexão **Transaction mode** (porta 6543) com `?pgbouncer=true&search_path=public`

### SUPABASE_URL e Chaves
1. No Supabase Dashboard, vá em **Settings** → **API**
2. **Project URL** = `SUPABASE_URL`
3. **Project API keys**:
   - `anon` `public` = `SUPABASE_ANON_KEY`
   - `service_role` `secret` = `SUPABASE_SERVICE_ROLE_KEY`

## ⚠️ Importante

### Segurança
- ✅ **NUNCA** commite arquivos `.env` no Git
- ✅ Use variáveis de ambiente do Vercel para valores sensíveis
- ✅ O `.gitignore` já está configurado para ignorar `.env*`

### URL Encoding
Se sua senha do banco contém caracteres especiais, faça o encoding:
- `@` → `%40`
- `#` → `%23`
- `%` → `%25`
- `&` → `%26`
- `+` → `%2B`
- `=` → `%3D`

### Exemplo de DATABASE_URL com senha especial
Se sua senha é `Dsmoke@29_97`:
```
postgresql://postgres.mnryjgztratsotaczjev:Dsmoke%4029_97@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true&search_path=public
```

## 🧪 Testar após Deploy

Após configurar todas as variáveis e fazer o deploy:

1. Acesse a URL do seu projeto no Vercel
2. Teste os endpoints:
   - `GET /api/products` (deve retornar produtos)
   - `GET /docs` (deve abrir a documentação)
3. Verifique os logs no Vercel Dashboard → **Deployments** → Seu deploy → **Logs**

## 📝 Exemplo Completo de Configuração

```
DATABASE_URL=postgresql://postgres.xxx:senha@xxx.supabase.co:6543/postgres?pgbouncer=true&search_path=public
DIRECT_URL=postgresql://postgres.xxx:senha@xxx.supabase.co:5432/postgres
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxx
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxx
JWT_SECRET=uma-string-secreta-com-pelo-menos-32-caracteres-aleatorios
NODE_ENV=production
LOG_LEVEL=info
ALLOWED_ORIGINS=https://seu-dominio-customizado.com
```

## 🔒 Configuração de CORS

O middleware já está configurado para aceitar automaticamente:
- ✅ `localhost` (desenvolvimento)
- ✅ Domínios da Vercel (qualquer subdomínio `.vercel.app`)
- ✅ Domínios específicos configurados no código:
  - `https://store-flow-one.vercel.app`
  - `https://store-flow-git-main-denilson-silvas-projects-63b429e7.vercel.app`
  - `https://store-flow-inurnro5e-denilson-silvas-projects-63b429e7.vercel.app`

Se precisar adicionar mais domínios, use a variável `ALLOWED_ORIGINS` separando por vírgula.

## 🆘 Troubleshooting

### Erro: "DATABASE_URL é obrigatório"
- Verifique se a variável foi adicionada corretamente
- Certifique-se de que está marcada para **Production**
- Faça um novo deploy após adicionar variáveis

### Erro: "JWT_SECRET deve possuir pelo menos 32 caracteres"
- Gere uma nova chave com pelo menos 32 caracteres
- Use o comando: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### Erro de conexão com banco
- Verifique se a senha está com URL encoding correto
- Confirme que está usando a porta correta (6543 para pooler, 5432 para direto)
- Verifique se o `search_path=public` está incluído na DATABASE_URL

### Build falha no "prisma generate"
- Certifique-se de que `DATABASE_URL` está configurada
- Verifique se a conexão está acessível (firewall do Supabase)

