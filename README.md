# 🍽️ StoreFlow - Sistema de Cardápio Virtual

Bem-vindo ao **StoreFlow Backend** - a API completa para gerenciamento de cardápios virtuais, pedidos e lojas online.

## 📖 Sobre o StoreFlow

O **StoreFlow** é uma plataforma completa de cardápio virtual que permite que estabelecimentos comerciais (restaurantes, lanchonetes, padarias, etc.) criem e gerenciem seus cardápios digitais, recebam pedidos online e controlem suas operações de forma eficiente.

Este repositório contém o **backend** da aplicação, construído com Next.js, Prisma e Supabase, fornecendo uma API REST robusta e escalável.

## 🎯 Funcionalidades Implementadas

### 🔐 Autenticação e Autorização

- ✅ **Autenticação de Clientes**
  - Login com email/senha
  - Cadastro de novos clientes
  - Refresh token automático
  - Validação de acesso a lojas específicas

- ✅ **Autenticação de Merchants (Lojistas)**
  - Login de comerciantes
  - Cadastro de novos merchants
  - Sistema de permissões por loja
  - Suporte a múltiplas lojas por merchant

- ✅ **Gestão de Perfis**
  - Visualização de perfil do usuário autenticado
  - Atualização de dados do perfil
  - Logout seguro

### 🏪 Gerenciamento de Lojas

- ✅ **Visualização de Lojas**
  - Listagem de lojas disponíveis
  - Detalhes completos da loja (aceita UUID ou slug)
  - Informações de endereço, horários e configurações
  - Status em tempo real (aberta/fechada)

- ✅ **Configuração de Lojas (Merchants)**
  - Criação e atualização de informações da loja
  - Upload de avatar e banner
  - Configuração de cores e tema personalizado
  - Definição de horários de funcionamento
  - Configuração de métodos de pagamento aceitos
  - Definição de taxas de entrega e valores mínimos

- ✅ **Controle de Status da Loja**
  - Verificação de status (aberta/fechada) baseado em horários
  - Fechamento temporário da loja (sobrescreve horários)
  - Cálculo automático de próximo horário de abertura
  - Endpoint otimizado para verificação rápida de status

- ✅ **Sistema de Membros**
  - Adição de membros à equipe da loja
  - Controle de permissões por perfil
  - Sistema de roles (owner, manager, etc.)

### 🍕 Gerenciamento de Produtos

- ✅ **Catálogo de Produtos**
  - Listagem de produtos com filtros avançados
  - Busca por categoria, loja, status
  - Paginação e ordenação
  - Detalhes completos do produto

- ✅ **Gestão de Produtos (Merchants)**
  - Criação de produtos com informações completas
  - Atualização de produtos (preço, descrição, etc.)
  - Upload de imagens dos produtos
  - Ativação/desativação de produtos
  - Soft delete de produtos
  - Histórico de alterações (auditoria)

- ✅ **Customizações de Produtos**
  - Adição de opções de customização (tamanhos, sabores, etc.)
  - Configuração de preços por customização
  - Listas extras (adicionais, complementos)
  - Tipos de seleção (boolean, quantity, etc.)

- ✅ **Limites de Preço por Categoria**
  - Definição de preços mínimos e máximos por categoria
  - Validação automática ao criar/atualizar produtos

### 📦 Sistema de Pedidos

- ✅ **Gestão de Pedidos**
  - Criação de pedidos pelos clientes
  - Listagem de pedidos com filtros
  - Detalhes completos do pedido
  - Histórico de status do pedido

- ✅ **Controle de Pedidos (Merchants)**
  - Confirmação de pedidos
  - Rejeição de pedidos
  - Atualização de status (preparando, pronto, saiu para entrega, etc.)
  - Upload de comprovante de entrega
  - Confirmação de entrega pelo cliente

- ✅ **Itens do Pedido**
  - Produtos com customizações
  - Cálculo automático de totais
  - Observações por item

### 📍 Endereços e Entregas

- ✅ **Endereços de Clientes**
  - Cadastro de múltiplos endereços
  - Endereço padrão
  - Endereços de entrega por pedido

- ✅ **Endereços de Lojas**
  - Cadastro de endereço principal
  - Suporte a múltiplos endereços (futuro)

- ✅ **Opções de Entrega**
  - Configuração de opções de entrega por loja
  - Taxas de entrega personalizadas
  - Tempo estimado de entrega

### 💾 Armazenamento de Arquivos

- ✅ **Upload de Imagens**
  - Upload de imagens de produtos
  - Upload de avatar e banner das lojas
  - Armazenamento no Supabase Storage
  - Validação de tipos e tamanhos de arquivo

### 📊 Views e Otimizações

- ✅ **Database Views**
  - `stores_complete`: View otimizada com dados completos da loja
  - `products_enriched`: View com produtos e estatísticas agregadas
  - Queries otimizadas para melhor performance

### 🔒 Segurança

- ✅ **Validação e Autorização**
  - Middleware de autenticação (`withAuth`)
  - Middleware de validação de merchant (`withMerchant`)
  - Validação de propriedade de recursos
  - Tratamento centralizado de erros

- ✅ **Validação de Dados**
  - Schemas Zod para validação de entrada
  - Validação de UUIDs
  - Validação de formatos e tipos

## 🛠️ Tecnologias Utilizadas

- **Next.js 16.1.0** - Framework React para API Routes
- **TypeScript** - Tipagem estática
- **Prisma** - ORM para PostgreSQL com suporte a múltiplos schemas
- **Supabase** - Autenticação e banco de dados PostgreSQL
- **Zod** - Validação de schemas e DTOs
- **Pino** - Sistema de logging estruturado

## 📚 Estrutura da Documentação

### [API](./docs/api/)
Documentação completa de todos os endpoints:

- [Autenticação](./docs/api/authentication.md) - Login, signup, refresh tokens
- [Lojas](./docs/api/stores.md) - Gerenciamento de lojas
- [Produtos](./docs/api/products.md) - Gerenciamento de produtos
- [Pedidos](./docs/api/orders.md) - Sistema de pedidos
- [Storage](./docs/api/storage.md) - Upload de arquivos

### [Guias Técnicos](./docs/)
Documentação técnica e guias:

- [Stores Service](./docs/stores-service.md) - Documentação do serviço de lojas
- [Realtime Sync](./docs/realtime-sync.md) - Referência para implementação de sincronização em tempo real (frontend)

## 🚀 Início Rápido

### Pré-requisitos

- Node.js 18+ 
- PostgreSQL (via Supabase)
- Conta no Supabase

### Instalação

1. Clone o repositório
```bash
git clone <repository-url>
cd BackEnd
```

2. Instale as dependências
```bash
npm install
```

3. Configure as variáveis de ambiente
```bash
cp .env.example .env
# Edite o .env com suas credenciais
```

4. Configure o banco de dados
```bash
npm run prisma:db-push
npm run prisma:generate
```

5. Inicie o servidor de desenvolvimento
```bash
npm run dev
```

O servidor estará disponível em `http://localhost:4000`

## 📋 Convenções da API

### Formato de Resposta

Todas as respostas seguem o padrão:

```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2025-12-21T00:00:00.000Z"
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
  "timestamp": "2025-12-21T00:00:00.000Z"
}
```

### Identificadores Flexíveis

Muitos endpoints aceitam tanto **UUID** quanto **slug** como identificadores:

- `GET /api/stores/[storeId]` - Aceita UUID ou slug
- `GET /api/stores/[storeId]/products` - Aceita UUID ou slug

O sistema detecta automaticamente o tipo de identificador.

## 🔮 Sugestões Futuras

### Funcionalidades Planejadas

#### 📱 Notificações em Tempo Real
- [ ] WebSockets para atualizações de pedidos em tempo real
- [ ] Notificações push para clientes e merchants
- [ ] Alertas de novos pedidos para merchants

#### 💳 Integração de Pagamentos
- [ ] Integração com gateways de pagamento (Stripe, Mercado Pago)
- [ ] Processamento de pagamentos online
- [ ] Histórico de transações
- [ ] Reembolsos e estornos

#### 📊 Analytics e Relatórios
- [ ] Dashboard de métricas para merchants
- [ ] Relatórios de vendas
- [ ] Análise de produtos mais vendidos
- [ ] Gráficos de performance
- [ ] Exportação de relatórios (PDF, Excel)

#### 🎯 Marketing e Promoções
- [ ] Sistema de cupons de desconto
- [ ] Promoções por período
- [ ] Programa de fidelidade
- [ ] Cashback para clientes
- [ ] Campanhas de marketing

#### 📝 Avaliações e Comentários
- [ ] Sistema de avaliações de produtos
- [ ] Comentários e reviews
- [ ] Moderação de avaliações
- [ ] Respostas dos merchants

#### 🚚 Gestão de Entregas
- [ ] Integração com serviços de entrega
- [ ] Rastreamento de entregas em tempo real
- [ ] Cálculo automático de frete por distância
- [ ] Múltiplos entregadores por loja

#### 👥 Gestão de Clientes
- [ ] Histórico completo de pedidos do cliente
- [ ] Lista de favoritos
- [ ] Endereços salvos
- [ ] Cartões de crédito salvos (tokenizados)

#### 🔔 Comunicação
- [ ] Chat entre cliente e loja
- [ ] Notificações de status do pedido
- [ ] Lembretes de pedidos pendentes
- [ ] Mensagens promocionais

#### 📱 App Mobile
- [ ] API preparada para apps nativos
- [ ] Suporte a geolocalização
- [ ] Notificações push nativas
- [ ] Modo offline

#### 🌐 Multi-idioma
- [ ] Suporte a múltiplos idiomas
- [ ] Tradução de categorias e produtos
- [ ] Interface localizada

#### 🔍 Busca Avançada
- [ ] Busca full-text em produtos
- [ ] Filtros avançados
- [ ] Busca por geolocalização
- [ ] Recomendações personalizadas

#### ⚙️ Configurações Avançadas
- [ ] Templates de cardápio
- [ ] Personalização avançada de tema
- [ ] Integração com redes sociais
- [ ] QR Code para cardápio

#### 🔐 Segurança Avançada
- [ ] Rate limiting por IP
- [ ] Proteção contra DDoS
- [ ] Auditoria completa de ações
- [ ] 2FA (autenticação de dois fatores)

#### 📈 Integrações
- [ ] Integração com sistemas de POS
- [ ] Integração com ERPs
- [ ] API pública para parceiros
- [ ] Webhooks para eventos

## 📝 Contribuindo

Ao adicionar novos endpoints ou funcionalidades:

1. ✅ Atualize a documentação correspondente em `docs/api/`
2. ✅ Adicione exemplos de request/response
3. ✅ Documente possíveis erros
4. ✅ Mantenha o padrão estabelecido
5. ✅ Adicione validações com Zod
6. ✅ Implemente tratamento de erros adequado
7. ✅ Teste todas as funcionalidades

## 📄 Licença

[Adicione informações de licença aqui]

## 👥 Equipe

[Adicione informações da equipe aqui]

---

**Última atualização**: 21 de Dezembro de 2025
