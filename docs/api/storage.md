# API de Storage - Documentação Técnica

## Endpoints

### 1. Upload Avatar da Loja

**Endpoint:** `POST /api/stores/{storeId}/upload/avatar`

**Autenticação:** ✅ Requerida (Merchant)

**Permissões:** Apenas o merchant dono da loja

**Request:**
```http
POST /api/stores/d3c3d99c-e221-4371-861b-d61743ffb09e/upload/avatar
Content-Type: multipart/form-data
Authorization: Bearer {jwt_token}
```

**Body (FormData):**
```
file: [arquivo de imagem]
```

**Resposta 200:**
```json
{
  "success": true,
  "data": {
    "url": "https://abc123.supabase.co/storage/v1/object/public/store-assets/stores/d3c3d99c-e221-4371-861b-d61743ffb09e/avatar/1700000000000_logo.jpg",
    "path": "stores/d3c3d99c-e221-4371-861b-d61743ffb09e/avatar/1700000000000_logo.jpg",
    "category": "avatar",
    "entityType": "stores",
    "entityId": "d3c3d99c-e221-4371-861b-d61743ffb09e"
  },
  "message": "Imagem enviada com sucesso",
  "timestamp": "2025-11-27T12:00:00.000Z"
}
```

**Erros:**
- `401`: Não autenticado
- `403`: Sem permissão (não é dono da loja)
- `404`: Loja não encontrada
- `422`: Erro de validação (arquivo muito grande, tipo inválido, etc.)

---

### 2. Upload Banner da Loja

**Endpoint:** `POST /api/stores/{storeId}/upload/banner`

**Autenticação:** ✅ Requerida (Merchant)

**Permissões:** Apenas o merchant dono da loja

**Request:**
```http
POST /api/stores/d3c3d99c-e221-4371-861b-d61743ffb09e/upload/banner
Content-Type: multipart/form-data
Authorization: Bearer {jwt_token}
```

**Body (FormData):**
```
file: [arquivo de imagem]
```

**Resposta 200:** Similar ao avatar

---

### 3. Upload Imagem de Produto

**Endpoint:** `POST /api/stores/{storeId}/products/{productId}/upload`

**Autenticação:** ✅ Requerida (Merchant)

**Permissões:** Apenas o merchant dono da loja

**Request:**
```http
POST /api/stores/d3c3d99c-e221-4371-861b-d61743ffb09e/products/92a30084-b2f1-4d97-9955-0830822d8e34/upload
Content-Type: multipart/form-data
Authorization: Bearer {jwt_token}
```

**Body (FormData):**
```
file: [arquivo de imagem]
```

**Resposta 200:**
```json
{
  "success": true,
  "data": {
    "url": "https://abc123.supabase.co/storage/v1/object/public/store-assets/products/d3c3d99c-e221-4371-861b-d61743ffb09e/92a30084-b2f1-4d97-9955-0830822d8e34/primary/1700000000000_temaki_salmao.jpg",
    "path": "products/d3c3d99c-e221-4371-861b-d61743ffb09e/92a30084-b2f1-4d97-9955-0830822d8e34/primary/1700000000000_temaki_salmao.jpg",
    "category": "primary",
    "entityType": "products",
    "entityId": "92a30084-b2f1-4d97-9955-0830822d8e34"
  },
  "message": "Imagem do produto enviada com sucesso",
  "timestamp": "2025-11-27T12:00:00.000Z"
}
```

**Erros:**
- `401`: Não autenticado
- `403`: Sem permissão ou produto não pertence à loja
- `404`: Loja ou produto não encontrado
- `422`: Erro de validação

---

### 4. Upload Comprovante PIX

**Endpoint:** `POST /api/stores/{storeId}/orders/{orderId}/upload/proof`

**Autenticação:** ✅ Requerida (Merchant ou Customer)

**Permissões:** Merchant dono da loja OU Customer dono do pedido

**Request:**
```http
POST /api/stores/d3c3d99c-e221-4371-861b-d61743ffb09e/orders/ef5293fd-1abd-495d-a866-a165da8cb485/upload/proof
Content-Type: multipart/form-data
Authorization: Bearer {jwt_token}
```

**Body (FormData):**
```
file: [arquivo de imagem ou PDF]
```

**Resposta 200:**
```json
{
  "success": true,
  "data": {
    "url": "https://abc123.supabase.co/storage/v1/object/public/store-assets/orders/d3c3d99c-e221-4371-861b-d61743ffb09e/ef5293fd-1abd-495d-a866-a165da8cb485/proof/1700000000000_comprovante_pix.jpg",
    "path": "orders/d3c3d99c-e221-4371-861b-d61743ffb09e/ef5293fd-1abd-495d-a866-a165da8cb485/proof/1700000000000_comprovante_pix.jpg",
    "category": "proof",
    "entityType": "orders",
    "entityId": "ef5293fd-1abd-495d-a866-a165da8cb485"
  },
  "message": "Comprovante enviado com sucesso",
  "timestamp": "2025-11-27T12:00:00.000Z"
}
```

**Erros:**
- `401`: Não autenticado
- `403`: Sem permissão (não é dono da loja nem do pedido)
- `404`: Loja ou pedido não encontrado
- `422`: Erro de validação

---

## Limites e Validações

### Tamanhos Máximos

| Categoria | Tamanho Máximo |
|-----------|----------------|
| Avatar    | 2 MB           |
| Banner    | 5 MB           |
| Primary   | 5 MB           |
| Gallery   | 5 MB           |
| Proof     | 10 MB          |

### Formatos Permitidos

| Categoria | Formatos Permitidos |
|-----------|---------------------|
| Avatar    | JPEG, PNG, WebP     |
| Banner    | JPEG, PNG, WebP     |
| Primary   | JPEG, PNG, WebP     |
| Gallery   | JPEG, PNG, WebP     |
| Proof     | JPEG, PNG, PDF      |

### Dimensões Máximas (Recomendadas)

| Categoria | Dimensões Máximas |
|-----------|-------------------|
| Avatar    | 512x512px         |
| Banner    | 1920x1080px       |
| Primary   | 1920x1920px       |
| Gallery   | 1920x1920px       |
| Proof     | 2560x2560px       |

## Exemplos de Uso

### cURL - Upload Avatar

```bash
curl -X POST \
  https://api.storeflow.com/api/stores/d3c3d99c-e221-4371-861b-d61743ffb09e/upload/avatar \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/avatar.jpg"
```

### JavaScript (Fetch)

```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const response = await fetch(
  `/api/stores/${storeId}/upload/avatar`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  }
);

const data = await response.json();
console.log(data.data.url); // URL da imagem
```

### TypeScript (Axios)

```typescript
import axios from 'axios';

const uploadProductImage = async (
  storeId: string,
  productId: string,
  file: File
) => {
  const formData = new FormData();
  formData.append('file', file);

  const { data } = await axios.post(
    `/api/stores/${storeId}/products/${productId}/upload`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  return data.data.url;
};
```

## Códigos de Erro

| Código | Status | Descrição |
|--------|--------|-----------|
| `UNAUTHORIZED` | 401 | Token inválido ou ausente |
| `FORBIDDEN` | 403 | Sem permissão para acessar o recurso |
| `NOT_FOUND` | 404 | Entidade não encontrada |
| `VALIDATION_ERROR` | 422 | Erro de validação (tamanho, tipo, etc.) |
| `INTERNAL_SERVER_ERROR` | 500 | Erro interno do servidor |

## Notas Importantes

1. **Substituição Automática**: Ao fazer upload de uma nova imagem, a imagem anterior é automaticamente removida do storage.

2. **Validação de Dimensões**: A validação de dimensões é opcional no backend. Recomenda-se validar no frontend antes do upload.

3. **Nomes de Arquivo**: Os nomes são automaticamente sanitizados (lowercase, sem acentos, caracteres especiais substituídos por `_`).

4. **Timestamps**: Cada arquivo recebe um timestamp único para evitar conflitos de nomes.

5. **URLs Públicas**: Todas as URLs retornadas são públicas e podem ser acessadas sem autenticação.

