# API de Lojas

## Visão Geral

Endpoints para gerenciar e consultar informações sobre lojas.

**Nota:** Endpoints de merchant (atualização de loja) estão em `/api/merchant/stores`.

### Status de Implementação

- ✅ `GET /api/stores` - Listar lojas (em desenvolvimento)
- ✅ `GET /api/stores/[storeId]` - Detalhes da loja
- ✅ `PATCH /api/merchant/stores/[storeId]` - Atualizar loja (merchant)
- ✅ `GET /api/merchant/stores/[storeId]/status` - Status da loja (aberta/fechada) - otimizado

## Endpoints

### GET /api/stores

Lista todas as lojas disponíveis (em desenvolvimento) usado somente pelo admin.

#### Query Parameters

- `page` (opcional): Número da página (padrão: 1)
- `limit` (opcional): Itens por página (padrão: 20)

#### Exemplo de Request

```
GET /api/stores?page=1&limit=20
```

#### Exemplo de Response (200)

```json
{
  "success": true,
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 0,
      "totalPages": 0,
      "hasNext": false,
      "hasPrev": false
    }
  }
}
```

---

### GET /api/stores/[storeId]

Retorna os detalhes completos de uma loja específica, incluindo produtos ativos.

#### Parâmetros de URL

- `storeId` (obrigatório): UUID da loja **ou** slug da loja

**Nota:** O endpoint aceita tanto UUID quanto slug. O sistema detecta automaticamente o tipo de identificador:
- Se o formato for UUID (ex: `d3c3d99c-e221-4371-861b-d61743ffb09e`), busca por ID
- Se não for UUID (ex: `kampai-sushi`), busca por slug

#### Descrição dos Campos

**Dados da Loja:**
- `merchant_id`: UUID do comerciante proprietário
- `name`: Nome da loja
- `slug`: Identificador único da loja na URL
- `description`: Descrição da loja
- `category`: Categoria da loja (enum: `comida_japonesa`, `pizza`, `hamburguer`, etc.)
- `custom_category`: Categoria personalizada (opcional)
- `avatar_url`: URL da imagem de avatar (Supabase Storage ou `null`)
- `banner_url`: URL da imagem de banner (Supabase Storage ou `null`)
- `rating`: Avaliação média (0-5)
- `review_count`: Número de avaliações
- `primary_color`, `secondary_color`, `accent_color`, `text_color`: Cores do tema da loja
- `is_active`: Status de ativação da loja
- `delivery_time`: Tempo estimado de entrega
- `min_order_value`: Valor mínimo do pedido
- `delivery_fee`: Taxa de entrega
- `free_delivery_above`: Valor acima do qual a entrega é gratuita
- `accepts_payment_*`: Métodos de pagamento aceitos
- `fulfillment_*`: Métodos de atendimento disponíveis
- `legal_responsible_name`: Nome do responsável legal
- `legal_responsible_document`: Documento do responsável legal
- `terms_accepted_at`: Data de aceite dos termos

**Status da Loja:**
- `isOpen`: Indica se a loja está aberta no momento atual (calculado automaticamente baseado nos horários de funcionamento)

**Endereço:**
- `address_*`: Dados completos do endereço da loja

**Estatísticas:**
- `products_count`: Número total de produtos
- `team_members_count`: Número de membros da equipe

**Horários de Funcionamento:**
- `working_hours`: Array com horários por dia da semana
  - `week_day`: Dia da semana (0=Domingo, 1=Segunda, ..., 6=Sábado)
  - `opens_at`: Horário de abertura (formato HH:mm:ss ou `null`)
  - `closes_at`: Horário de fechamento (formato HH:mm:ss ou `null`)
  - `is_closed`: Indica se a loja está fechada neste dia

**Produtos:**
- `products`: Array com produtos ativos da loja
  - Cada produto inclui dados completos da view `products_enriched`
  - `available_customizations`: Array com customizações disponíveis (quando aplicável)

#### Exemplo de Request (por UUID)

```
GET /api/stores/d3c3d99c-e221-4371-861b-d61743ffb09e
```

#### Exemplo de Request (por Slug)

```
GET /api/stores/kampai-sushi
```

#### Exemplo de Response (200)

```json
{
  "success": true,
  "data": {
    "id": "d3c3d99c-e221-4371-861b-d61743ffb09e",
    "merchant_id": "e69c83a8-5e46-46c3-96ec-02c93f23f500",
    "name": "Kampai Sushi",
    "slug": "kampai-sushi",
    "description": "Sushi, temaki e combinados - Frescor e qualidade premium",
    "category": "comida_japonesa",
    "custom_category": null,
    "avatar_url": null,
    "banner_url": null,
    "rating": 0,
    "review_count": 0,
    "primary_color": "#DC2626",
    "secondary_color": "#2563EB",
    "accent_color": "#059669",
    "text_color": "#FFFFFF",
    "is_active": true,
    "delivery_time": "50-70 min",
    "min_order_value": 40,
    "delivery_fee": 10,
    "free_delivery_above": 80,
    "accepts_payment_credit_card": true,
    "accepts_payment_debit_card": true,
    "accepts_payment_pix": true,
    "accepts_payment_cash": true,
    "fulfillment_delivery_enabled": true,
    "fulfillment_pickup_enabled": true,
    "fulfillment_pickup_instructions": null,
    "deleted_at": null,
    "created_at": "2025-11-07T22:52:53.617Z",
    "updated_at": "2025-11-07T22:52:53.617Z",
    "legal_responsible_name": "João Silva",
    "legal_responsible_document": "123.456.789-00",
    "terms_accepted_at": "2025-11-08T05:12:58.714Z",
    "address_street": "Rua Tomás Gonzaga",
    "address_number": "678",
    "address_neighborhood": "Liberdade",
    "address_city": "São Paulo",
    "address_state": "SP",
    "address_zip_code": "01510-001",
    "address_complement": "1º Andar",
    "products_count": 3,
    "team_members_count": null,
    "isOpen": true,
    "working_hours": [
      {
        "opens_at": null,
        "week_day": 1,
        "closes_at": null,
        "is_closed": true
      },
      {
        "opens_at": "11:00:00",
        "week_day": 0,
        "closes_at": "23:00:00",
        "is_closed": false
      }
    ],
    "products": [
      {
        "id": "92a30084-b2f1-4d97-9955-0830822d8e34",
        "store_id": "d3c3d99c-e221-4371-861b-d61743ffb09e",
        "name": "Temaki Salmão",
        "description": "Cone de alga nori com arroz, salmão fresco e cream cheese",
        "price": 22.9,
        "cost_price": 9,
        "family": "finished_product",
        "image_url": null,
        "category": "Temakis",
        "custom_category": null,
        "is_active": true,
        "preparation_time": 18,
        "nutritional_info": null,
        "deleted_at": null,
        "created_at": "2025-11-07T23:20:23.434Z",
        "updated_at": "2025-11-07T23:20:23.434Z",
        "store_name": "Kampai Sushi",
        "store_slug": "kampai-sushi",
        "store_category": "comida_japonesa",
        "customizations_count": null,
        "extra_lists_count": 1,
        "available_customizations": null
      }
    ]
  },
  "timestamp": "2025-11-19T05:15:40.710Z"
}
```

#### Cálculo de Status da Loja

O endpoint calcula automaticamente o status da loja (`isOpen`) considerando:

1. **Loja inativa** (`is_active = false`): Sempre retorna `isOpen = false`
2. **Horários de funcionamento**: Calcula `isOpen` baseado nos horários configurados
3. **Horários normais**: Calcula baseado nos `working_hours` e horário atual
   - Verifica se o dia atual está dentro do horário de funcionamento
   - Considera se o dia está marcado como fechado (`is_closed = true`)


#### Tratamento de Erros

- **404**: Loja não encontrada (quando UUID ou slug não existe)
- **405**: Método HTTP não permitido (apenas GET é suportado)
- **422**: Parâmetro storeId ausente ou vazio

#### Detecção Automática de Tipo

O endpoint detecta automaticamente se o parâmetro é UUID ou slug:

- **UUID**: Formato `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` (ex: `d3c3d99c-e221-4371-861b-d61743ffb09e`)
- **Slug**: Qualquer outro formato (ex: `kampai-sushi`, `pizzaria-do-joao`)

**Exemplos válidos:**
- `GET /api/stores/d3c3d99c-e221-4371-861b-d61743ffb09e` → Busca por UUID
- `GET /api/stores/kampai-sushi` → Busca por slug
- `GET /api/stores/pizzaria-do-joao` → Busca por slug

#### Exemplo de Erro 405

Quando um método HTTP não suportado é usado (ex: PUT, POST, DELETE):

```json
{
  "success": false,
  "error": {
    "message": "Método PUT não é permitido para este endpoint",
    "code": "METHOD_NOT_ALLOWED",
    "status": 405,
    "details": {
      "allowedMethods": ["GET"]
    },
    "timestamp": "2025-12-01T10:00:00Z"
  }
}
```

---

### GET /api/stores/[storeId]/products

Lista produtos de uma loja específica. **Retorna apenas produtos da loja especificada no path parameter.**

#### Parâmetros de URL

- `storeId` (obrigatório): UUID da loja **ou** slug da loja

**Nota:** Aceita tanto UUID quanto slug (mesma lógica do endpoint principal)
- Se for UUID, busca diretamente por `id`
- Se for slug, converte para UUID antes de filtrar

#### Query Parameters

- `page` (opcional): Número da página (padrão: 1)
- `limit` (opcional): Itens por página (padrão: 20)
- `category` (opcional): Filtrar por categoria de produto
- `isActive` (opcional): Filtrar por status (true/false)
- `search` (opcional): Buscar por nome ou descrição do produto

#### Exemplo de Request (por UUID)

```
GET /api/stores/d3c3d99c-e221-4371-861b-d61743ffb09e/products?page=1&limit=20
```

#### Exemplo de Request (por Slug)

```
GET /api/stores/kampai-sushi/products?page=1&limit=20&category=Temakis
```

#### Segurança

- ✅ **Filtro obrigatório por loja**: O endpoint sempre filtra produtos pela loja especificada no path parameter
- ✅ **Validação de loja**: Se o slug não existir, retorna erro 404
- ✅ **Isolamento de dados**: Não é possível acessar produtos de outras lojas através deste endpoint
- ✅ **View otimizada**: Utiliza a view `products_enriched` para melhor performance

#### Detalhes Técnicos

- Utiliza a view `views.products_enriched` para dados enriquecidos
- Filtra automaticamente produtos deletados (`deleted_at IS NULL`)
- Retorna apenas produtos ativos por padrão (pode ser alterado com `isActive=false`)

---

### GET /api/stores/[storeId]/categories

Lista categorias de produtos de uma loja.

#### Parâmetros de URL

- `storeId` (obrigatório): UUID da loja **ou** slug da loja

**Nota:** Aceita tanto UUID quanto slug (mesma lógica do endpoint principal)

---

### GET /api/stores/[storeId]/orders

Lista pedidos de uma loja.

#### Parâmetros de URL

- `storeId` (obrigatório): UUID da loja **ou** slug da loja

**Nota:** Aceita tanto UUID quanto slug (mesma lógica do endpoint principal)

#### Headers

```
Authorization: Bearer {token}
```

## Notas Importantes

- **Identificadores**: Todos os endpoints `/api/stores/[storeId]/*` aceitam tanto **UUID** quanto **slug** da loja
  - O sistema detecta automaticamente o tipo de identificador usando regex
  - **UUID**: Formato `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` (ex: `d3c3d99c-e221-4371-861b-d61743ffb09e`)
  - **Slug**: Qualquer outro formato que não seja UUID (ex: `kampai-sushi`, `pizzaria-do-joao`)
  - Se o formato corresponder a UUID, busca por `id`; caso contrário, busca por `slug` e converte para UUID
- **Segurança**: Todos os endpoints que listam recursos por loja (`/products`, `/orders`, etc.) filtram obrigatoriamente pela loja especificada no path parameter, garantindo isolamento de dados
- **Status da Loja**: O endpoint `GET /api/stores/[storeId]` retorna automaticamente `isOpen`, calculado em tempo real baseado nos horários de funcionamento
- Todos os endpoints de lojas retornam apenas lojas ativas (`is_active = true`)
- Produtos retornados são apenas os não deletados (`deleted_at IS NULL`), podendo filtrar por `is_active` via query parameter
- A view `stores_complete` é utilizada para dados enriquecidos da loja
- A view `products_enriched` é utilizada para dados enriquecidos dos produtos (com contagens de customizações, listas extras, etc.)

## URLs de Imagens

As imagens (`avatar_url` e `banner_url`) são armazenadas no **Supabase Storage** e seguem o padrão:

```
https://[projeto].supabase.co/storage/v1/object/public/[bucket]/[caminho]/[arquivo]
```

### Estrutura de Armazenamento

- **Bucket**: `stores`
- **Caminhos**:
  - `avatar/` - Imagens de avatar das lojas
  - `banner/` - Imagens de banner das lojas
- **Formato**: As imagens podem estar em qualquer formato suportado (jpg, png, webp, etc.)

### Exemplo Real

```json
{
  "avatar_url": "https://abc123.supabase.co/storage/v1/object/public/stores/avatar/d3c3d99c-e221-4371-861b-d61743ffb09e.jpg",
  "banner_url": "https://abc123.supabase.co/storage/v1/object/public/stores/banner/d3c3d99c-e221-4371-861b-d61743ffb09e.jpg"
}
```

### Observações

- As URLs são públicas e podem ser acessadas diretamente no navegador
- Se a imagem não existir, o campo retornará `null`
- Recomenda-se usar formatos otimizados (WebP) para melhor performance

## Estrutura de Dados dos Produtos

Os produtos retornados na resposta de `/api/stores/[storeId]` incluem:

### Campos Principais

- `id`: UUID do produto
- `store_id`: UUID da loja
- `name`: Nome do produto
- `description`: Descrição do produto
- `price`: Preço de venda
- `cost_price`: Preço de custo
- `family`: Tipo de produto (enum: `finished_product`, `raw_material`, etc.)
- `image_url`: URL da imagem do produto (Supabase Storage ou `null`)
- `category`: Categoria do produto
- `custom_category`: Categoria personalizada (opcional)
- `is_active`: Status de ativação
- `preparation_time`: Tempo de preparo em minutos
- `nutritional_info`: Informações nutricionais (JSON ou `null`)
- `store_name`, `store_slug`, `store_category`: Dados da loja (da view enriquecida)
- `customizations_count`: Número de customizações disponíveis
- `extra_lists_count`: Número de listas extras disponíveis

### Customizações Disponíveis

Quando `available_customizations` está presente, contém um array de objetos com:

- `id`: UUID da customização
- `name`: Nome da customização
- `price`: Preço adicional
- `selection_type`: Tipo de seleção (`boolean` ou `quantity`)
- `customization_type`: Tipo da customização (`base`, `protein`, `topping`, `sauce`, etc.)

### Exemplo de Customização

```json
{
  "id": "0a5b7b22-8364-4be8-a329-9e1effab49d0",
  "name": "Molho Teriyaki",
  "price": 1.5,
  "selection_type": "boolean",
  "customization_type": "sauce"
}
```

---

## Endpoints de Merchant

### PATCH /api/merchant/stores/[storeId]

Atualiza as informações da loja do merchant autenticado.

#### Headers

```
Authorization: Bearer {token}
Content-Type: application/json
```

#### Path Parameters

- `storeId` (string, UUID): ID da loja a ser atualizada

#### Body Parameters

```json
{
  // Informações básicas
  "name"?: "string (mínimo 2, máximo 100 caracteres)",
  "description"?: "string (máximo 500 caracteres)",
  "category"?: "hamburgueria | pizzaria | pastelaria | sorveteria | cafeteria | padaria | comida_brasileira | comida_japonesa | doces | mercado | outros",
  "customCategory"?: "string (máximo 50 caracteres)",
  
  // Endereço da loja
  "address"?: {
    "street": "string (obrigatório se address enviado)",
    "number": "string (obrigatório se address enviado)",
    "neighborhood": "string (obrigatório se address enviado)",
    "city": "string (obrigatório se address enviado)",
    "state": "string (obrigatório se address enviado)",
    "zipCode": "string (obrigatório se address enviado, mínimo 8, máximo 12 caracteres)",
    "complement"?: "string",
    "reference"?: "string"
  },
  
  // Horários de funcionamento
  "workingHours"?: {
    "monday"?: { "open": "HH:mm", "close": "HH:mm", "closed"?: boolean },
    "tuesday"?: { "open": "HH:mm", "close": "HH:mm", "closed"?: boolean },
    "wednesday"?: { "open": "HH:mm", "close": "HH:mm", "closed"?: boolean },
    "thursday"?: { "open": "HH:mm", "close": "HH:mm", "closed"?: boolean },
    "friday"?: { "open": "HH:mm", "close": "HH:mm", "closed"?: boolean },
    "saturday"?: { "open": "HH:mm", "close": "HH:mm", "closed"?: boolean },
    "sunday"?: { "open": "HH:mm", "close": "HH:mm", "closed"?: boolean }
  },
  
  // Configurações de entrega
  "settings"?: {
    "isActive"?: "boolean",
    "deliveryTime"?: "string",
    "minOrderValue"?: "number (em reais, mínimo 0)",
    "deliveryFee"?: "number (em reais, mínimo 0)",
    "freeDeliveryAbove"?: "number (em reais, mínimo 0)",
    "acceptsPayment"?: {
      "creditCard"?: "boolean",
      "debitCard"?: "boolean",
      "pix"?: "boolean",
      "cash"?: "boolean"
    }
  },
  
  // Tema e cores
  "theme"?: {
    "primaryColor"?: "string (hex, ex: #FF5733)",
    "secondaryColor"?: "string (hex, ex: #33FF57)",
    "accentColor"?: "string (hex, ex: #3357FF)",
    "textColor"?: "string (hex, ex: #FFFFFF)"
  }
}
```

#### Exemplo de Request

```json
{
  "name": "Pizzaria do João",
  "description": "As melhores pizzas da região",
  "category": "pizzaria",
  "address": {
    "street": "Rua das Flores",
    "number": "123",
    "neighborhood": "Centro",
    "city": "São Paulo",
    "state": "SP",
    "zipCode": "01234567"
  },
  "workingHours": {
    "monday": { "open": "18:00", "close": "23:00" },
    "tuesday": { "open": "18:00", "close": "23:00" },
    "wednesday": { "open": "18:00", "close": "23:00" },
    "thursday": { "open": "18:00", "close": "23:00" },
    "friday": { "open": "18:00", "close": "00:00" },
    "saturday": { "open": "18:00", "close": "00:00" },
    "sunday": { "closed": true }
  },
  "settings": {
    "isActive": true,
    "deliveryTime": "30-45 min",
    "minOrderValue": 20.00,
    "deliveryFee": 5.00,
    "freeDeliveryAbove": 50.00,
    "acceptsPayment": {
      "creditCard": true,
      "debitCard": true,
      "pix": true,
      "cash": true
    }
  },
  "theme": {
    "primaryColor": "#DC2626",
    "secondaryColor": "#2563EB",
    "accentColor": "#059669",
    "textColor": "#FFFFFF"
  }
}
```

#### Exemplo de Response (200)

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Pizzaria do João",
    "slug": "pizzaria-do-joao",
    "description": "As melhores pizzas da região",
    "category": "pizzaria",
    "avatar_url": null,
    "banner_url": null,
    "rating": 4.5,
    "review_count": 120,
    "primary_color": "#DC2626",
    "secondary_color": "#2563EB",
    "accent_color": "#059669",
    "text_color": "#FFFFFF",
    "is_active": true,
    "delivery_time": "30-45 min",
    "min_order_value": 20.00,
    "delivery_fee": 5.00,
    "free_delivery_above": 50.00,
    "accepts_payment_credit_card": true,
    "accepts_payment_debit_card": true,
    "accepts_payment_pix": true,
    "accepts_payment_cash": true,
    "fulfillment_delivery_enabled": true,
    "fulfillment_pickup_enabled": true,
    "address_street": "Rua das Flores",
    "address_number": "123",
    "address_neighborhood": "Centro",
    "address_city": "São Paulo",
    "address_state": "SP",
    "address_zip_code": "01234567",
    "working_hours": {
      "monday": { "open": "18:00", "close": "23:00" },
      "tuesday": { "open": "18:00", "close": "23:00" },
      "wednesday": { "open": "18:00", "close": "23:00" },
      "thursday": { "open": "18:00", "close": "23:00" },
      "friday": { "open": "18:00", "close": "00:00" },
      "saturday": { "open": "18:00", "close": "00:00" },
      "sunday": { "closed": true }
    },
    "created_at": "2024-01-01T10:00:00Z",
    "updated_at": "2024-12-02T10:00:00Z"
  },
  "timestamp": "2024-12-02T10:00:00Z"
}
```

#### Tratamento de Erros

- **400**: Content-Type inválido (deve ser `application/json`)
- **401**: Não autenticado ou token inválido
- **403**: Apenas lojistas podem atualizar lojas
- **403**: Sem permissão para atualizar esta loja (loja não pertence ao merchant)
- **404**: Merchant não encontrado
- **404**: Loja não encontrada
- **422**: Dados inválidos (campos obrigatórios ausentes, formato inválido)
- **422**: Nome já cadastrado para outra loja do merchant

#### Exemplo de Erro 403 (Sem Permissão)

```json
{
  "success": false,
  "error": {
    "message": "Você não tem permissão para atualizar esta loja",
    "code": "STORE_NOT_OWNED",
    "status": 403,
    "timestamp": "2024-12-02T10:00:00Z"
  }
}
```

#### Regras de Negócio

- ✅ Apenas merchants autenticados podem atualizar lojas
- ✅ Merchant deve ser dono da loja ou membro com permissão
- ✅ Validação de nome único por merchant (se nome estiver sendo alterado)
- ✅ Valores monetários devem ser enviados em reais (ex: 20.00 para R$ 20,00)
- ✅ Horários de funcionamento: formato `HH:mm` (ex: `18:00`, `23:00`)
- ✅ Se `closed: true` em um dia, não precisa de `open` e `close`
- ✅ Cores devem estar no formato hexadecimal (ex: `#FF5733`)
- ✅ Todas as operações são atômicas (transação)
- ✅ **Endereço**: Se não existir endereço principal, será criado; se existir, será atualizado
- ✅ **Horários**: Se não existir horário para um dia, será criado; se existir, será atualizado
- ✅ Apenas os campos fornecidos no request serão atualizados (atualização parcial)
- ✅ Endereço principal: Se não existir, será criado; se existir, será atualizado
- ✅ Horários de funcionamento: Se não existir para um dia, será criado; se existir, será atualizado

#### Validações de Segurança

- ✅ `userId` validado pelo middleware `withAuth` (do token JWT)
- ✅ Merchant buscado por `auth_user_id` (nunca aceita do payload)
- ✅ Propriedade da loja validada (verifica se é dono ou membro)
- ✅ `storeId` validado como UUID
- ✅ Todas as operações em transação para garantir consistência

#### Otimizações de Performance

O endpoint foi otimizado para garantir execução rápida e evitar timeouts:

- **Busca única de horários**: Todos os horários de funcionamento são buscados em uma única query antes do processamento, reduzindo o número de queries de N (uma por dia) para 1
- **Transação atômica**: Todas as operações (atualização de loja, endereço e horários) são executadas em uma única transação para garantir consistência
- **Processamento em memória**: Horários existentes são mapeados em memória para acesso rápido durante o loop de atualização

**Nota Técnica**: A transação usa o timeout padrão do Prisma (5 segundos). Com a otimização implementada, mesmo atualizando todos os 7 dias da semana, a operação completa em menos de 2 segundos.

---

### GET /api/merchant/stores/[storeId]/status

Retorna apenas o status atual da loja (aberta/fechada) e informações básicas de horário. Endpoint otimizado para retornar dados mínimos necessários.

#### Headers

```
Authorization: Bearer {token}
```

#### Path Parameters

- `storeId` (string, UUID): ID da loja

#### Exemplo de Request

```
GET /api/merchant/stores/d3c3d99c-e221-4371-861b-d61743ffb09e/status
```

#### Exemplo de Response (200) - Loja Aberta

```json
{
  "success": true,
  "data": {
    "isOpen": true,
    "currentDay": "Segunda-feira",
    "currentDayHours": {
      "open": "08:00",
      "close": "22:00",
      "closed": false
    },
    "nextOpenDay": null,
    "nextOpenHours": null,
    "isInactive": false,
    "lastUpdated": "2025-12-20T10:30:00Z"
  },
  "timestamp": "2025-12-20T10:30:00Z"
}
```

#### Exemplo de Response (200) - Loja Fechada

```json
{
  "success": true,
  "data": {
    "isOpen": false,
    "currentDay": "Domingo",
    "currentDayHours": null,
    "nextOpenDay": "Segunda-feira",
    "nextOpenHours": {
      "open": "08:00",
      "close": "22:00"
    },
    "lastUpdated": "2025-12-20T10:30:00Z"
  },
  "timestamp": "2025-12-20T10:30:00Z"
}
```

#### Exemplo de Response (200) - Dia Fechado

```json
{
  "success": true,
  "data": {
    "isOpen": false,
    "currentDay": "Domingo",
    "currentDayHours": {
      "open": "00:00",
      "close": "00:00",
      "closed": true
    },
    "nextOpenDay": "Segunda-feira",
    "nextOpenHours": {
      "open": "08:00",
      "close": "22:00"
    },
    "isInactive": false,
    "lastUpdated": "2025-12-20T10:30:00Z"
  },
  "timestamp": "2025-12-20T10:30:00Z"
}
```

#### Tratamento de Erros

- **401**: Não autenticado ou token inválido
- **403**: Apenas lojistas podem visualizar status da loja
- **404**: Loja não encontrada
- **422**: Formato de storeId inválido

#### Regras de Negócio

- ✅ Apenas merchants autenticados podem visualizar status da loja
- ✅ Loja inativa (`is_active = false`) sempre retorna `isOpen: false`
- ✅ Status é calculado baseado nos horários de funcionamento e hora atual
- ✅ Se a loja está fechada, retorna informações do próximo dia aberto (se houver)
- ✅ Se o dia atual está fechado (`is_closed = true`), `currentDayHours.closed` será `true`
- ✅ Horários são formatados como `HH:mm` (ex: `08:00`, `22:00`)
- ✅ O campo `isOpen` é calculado automaticamente baseado nos horários de funcionamento e no status `is_active` da loja
- ✅ O campo `isInactive` indica se a loja está inativa permanentemente

#### Validações de Segurança

- ✅ `userId` validado pelo middleware `withAuth` (do token JWT)
- ✅ `storeId` validado como UUID
- ✅ Loja validada como existente e não deletada

#### Otimizações de Performance

Este endpoint foi otimizado para retornar apenas dados essenciais:

- **Query otimizada**: Busca apenas `id`, `is_active`, `deleted_at` e `store_working_hours` (não busca todos os dados da loja)
- **Cálculo no backend**: Status é calculado no servidor, reduzindo processamento no frontend
- **Tamanho reduzido**: Resposta de ~200 bytes vs ~5KB do endpoint completo
- **Cache recomendado**: Pode ser cacheado por 1 minuto (status muda pouco)

**Comparação de Performance:**

| Aspecto | `GET /stores/[id]` (completo) | `GET /stores/[id]/status` (otimizado) |
|---------|-------------------------------|--------------------------------------|
| **Tamanho** | ~5KB | ~200 bytes |
| **Tempo** | ~150ms | ~50ms |
| **Dados** | Tudo da loja | Apenas status |
| **Cache** | Difícil (muitos dados) | Fácil (poucos dados) |
| **Uso** | Quando precisa de tudo | Quando só precisa do status |

---


