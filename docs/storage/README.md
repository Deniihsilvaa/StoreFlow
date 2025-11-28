# Sistema de Armazenamento de Imagens - StoreFlow

## 📋 Visão Geral

O StoreFlow utiliza **Supabase Storage** para gerenciar todas as imagens do sistema de forma organizada e escalável. O bucket `store-assets` armazena imagens de lojas, produtos e comprovantes de pedidos.

## 🗂️ Estrutura de Armazenamento

```
store-assets/
├── stores/{store_id}/avatar|banner/
├── products/{store_id}/{product_id}/primary|gallery/
└── orders/{store_id}/{order_id}/proof/
```

### Padrão de Nomenclatura

Os arquivos seguem o padrão:
```
{timestamp}_{nome_original_sanitizado}.{extensao}
```

**Exemplo:**
```
stores/d3c3d99c-e221-4371-861b-d61743ffb09e/avatar/1700000000000_logo.jpg
products/d3c3d99c-e221-4371-861b-d61743ffb09e/92a30084-b2f1-4d97-9955-0830822d8e34/primary/1700000000000_temaki_salmao.jpg
orders/d3c3d99c-e221-4371-861b-d61743ffb09e/ef5293fd-1abd-495d-a866-a165da8cb485/proof/1700000000000_comprovante_pix.jpg
```

## 📦 Entidades e Categorias

### Stores (Lojas)
- **Avatar**: Imagem de perfil da loja
  - Tamanho máximo: 2MB
  - Dimensões máximas: 512x512px
  - Formatos: JPEG, PNG, WebP
  
- **Banner**: Imagem de cabeçalho da loja
  - Tamanho máximo: 5MB
  - Dimensões máximas: 1920x1080px
  - Formatos: JPEG, PNG, WebP

### Products (Produtos)
- **Primary**: Imagem principal do produto
  - Tamanho máximo: 5MB
  - Dimensões máximas: 1920x1920px
  - Formatos: JPEG, PNG, WebP
  
- **Gallery**: Imagens adicionais (futuro)
  - Tamanho máximo: 5MB
  - Dimensões máximas: 1920x1920px
  - Formatos: JPEG, PNG, WebP

### Orders (Pedidos)
- **Proof**: Comprovante de pagamento PIX
  - Tamanho máximo: 10MB
  - Dimensões máximas: 2560x2560px
  - Formatos: JPEG, PNG, PDF

## 🔌 API Endpoints

### Upload de Avatar da Loja

```http
POST /api/stores/{storeId}/upload/avatar
Content-Type: multipart/form-data
Authorization: Bearer {token}
```

**Body (FormData):**
- `file`: Arquivo de imagem

**Resposta:**
```json
{
  "success": true,
  "data": {
    "url": "https://...supabase.co/storage/v1/object/public/store-assets/stores/.../avatar/...jpg",
    "path": "stores/{storeId}/avatar/{timestamp}_{nome}.jpg",
    "category": "avatar",
    "entityType": "stores",
    "entityId": "{storeId}"
  },
  "message": "Imagem enviada com sucesso",
  "timestamp": "2025-11-27T..."
}
```

### Upload de Banner da Loja

```http
POST /api/stores/{storeId}/upload/banner
Content-Type: multipart/form-data
Authorization: Bearer {token}
```

**Body (FormData):**
- `file`: Arquivo de imagem

**Resposta:** Similar ao avatar

### Upload de Imagem de Produto

```http
POST /api/stores/{storeId}/products/{productId}/upload
Content-Type: multipart/form-data
Authorization: Bearer {token}
```

**Body (FormData):**
- `file`: Arquivo de imagem

**Resposta:**
```json
{
  "success": true,
  "data": {
    "url": "https://...supabase.co/storage/v1/object/public/store-assets/products/.../primary/...jpg",
    "path": "products/{storeId}/{productId}/primary/{timestamp}_{nome}.jpg",
    "category": "primary",
    "entityType": "products",
    "entityId": "{productId}"
  },
  "message": "Imagem do produto enviada com sucesso",
  "timestamp": "2025-11-27T..."
}
```

### Upload de Comprovante PIX

```http
POST /api/stores/{storeId}/orders/{orderId}/upload/proof
Content-Type: multipart/form-data
Authorization: Bearer {token}
```

**Body (FormData):**
- `file`: Arquivo (imagem ou PDF)

**Resposta:**
```json
{
  "success": true,
  "data": {
    "url": "https://...supabase.co/storage/v1/object/public/store-assets/orders/.../proof/...jpg",
    "path": "orders/{storeId}/{orderId}/proof/{timestamp}_{nome}.jpg",
    "category": "proof",
    "entityType": "orders",
    "entityId": "{orderId}"
  },
  "message": "Comprovante enviado com sucesso",
  "timestamp": "2025-11-27T..."
}
```

## 🔒 Permissões e Autenticação

### Stores (Avatar/Banner)
- ✅ Requer autenticação
- ✅ Apenas o **merchant dono da loja** pode fazer upload
- ✅ Substitui automaticamente a imagem anterior

### Products (Primary)
- ✅ Requer autenticação
- ✅ Apenas o **merchant dono da loja** pode fazer upload
- ✅ Verifica se o produto pertence à loja
- ✅ Substitui automaticamente a imagem anterior

### Orders (Proof)
- ✅ Requer autenticação
- ✅ **Merchant dono da loja** OU **cliente dono do pedido** pode fazer upload
- ✅ Verifica se o pedido pertence à loja

## ⚠️ Validações

### Validações Automáticas

1. **Tamanho do arquivo**: Verificado antes do upload
2. **Tipo MIME**: Apenas formatos permitidos são aceitos
3. **Dimensões**: Validação opcional (pode ser feita no frontend)
4. **UUID**: IDs de entidades devem ser UUIDs válidos
5. **Permissões**: Verificação de propriedade antes do upload

### Mensagens de Erro

```json
{
  "success": false,
  "error": {
    "message": "Arquivo muito grande. Tamanho máximo: 2MB",
    "code": "VALIDATION_ERROR",
    "status": 422,
    "errors": {
      "fileSize": 2.5,
      "maxSize": 2
    },
    "timestamp": "2025-11-27T..."
  }
}
```

## 🛠️ Uso no Frontend

### Exemplo com Fetch API

```typescript
async function uploadStoreAvatar(storeId: string, file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(
    `https://api.storeflow.com/api/stores/${storeId}/upload/avatar`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    }
  );

  const data = await response.json();
  return data;
}
```

### Exemplo com Axios

```typescript
import axios from 'axios';

async function uploadProductImage(storeId: string, productId: string, file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axios.post(
    `/api/stores/${storeId}/products/${productId}/upload`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  return response.data;
}
```

## 🔄 Substituição de Imagens

Quando uma nova imagem é enviada para uma entidade que já possui uma imagem:

1. ✅ Nova imagem é enviada para o storage
2. ✅ URL é atualizada no banco de dados
3. ✅ Imagem antiga é removida do storage (se existir)
4. ✅ Se a remoção falhar, apenas loga um aviso (não falha o upload)

## 📝 Notas de Implementação

### Validação de Dimensões

A validação de dimensões de imagem é **opcional** no backend. Recomenda-se:

1. **Frontend**: Validar dimensões antes do upload usando `Image` API do browser
2. **Backend**: Implementar validação com biblioteca `sharp` se necessário

### Sanitização de Nomes

Os nomes de arquivo são sanitizados:
- Convertidos para lowercase
- Acentos removidos
- Caracteres especiais substituídos por `_`
- Múltiplos underscores colapsados

### Timestamp

O timestamp usado é `Date.now()` (milissegundos desde epoch), garantindo nomes únicos mesmo para arquivos com mesmo nome.

## 🚀 Melhorias Futuras

- [ ] Suporte a múltiplas imagens (gallery) para produtos
- [ ] Redimensionamento automático de imagens
- [ ] Geração de thumbnails
- [ ] Compressão automática de imagens
- [ ] CDN para distribuição global
- [ ] Validação de dimensões no backend com `sharp`
- [ ] Upload progress tracking
- [ ] Suporte a drag-and-drop no frontend

## 🐛 Troubleshooting

### Erro: "Arquivo muito grande"
- **Causa**: Arquivo excede o tamanho máximo permitido
- **Solução**: Reduza o tamanho do arquivo ou use compressão

### Erro: "Tipo de arquivo não permitido"
- **Causa**: Formato não está na lista de tipos permitidos
- **Solução**: Converta para JPEG, PNG, WebP ou PDF (apenas para proof)

### Erro: "Você não tem permissão"
- **Causa**: Usuário não é o dono da entidade
- **Solução**: Verifique se o token de autenticação está correto e se o usuário tem permissão

### Erro: "Loja não encontrada"
- **Causa**: ID da loja é inválido ou não existe
- **Solução**: Verifique se o `storeId` está correto

### Erro: "Upload concluído mas nenhum dado retornado"
- **Causa**: Problema na comunicação com Supabase Storage
- **Solução**: Verifique configurações do Supabase e conexão de rede

## 📚 Referências

- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Next.js File Upload](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [FormData API](https://developer.mozilla.org/en-US/docs/Web/API/FormData)

