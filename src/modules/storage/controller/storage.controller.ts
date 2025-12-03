import type { NextRequest } from "next/server";
import { ApiResponse } from "@/core/responses/ApiResponse";
import { storageService } from "@/modules/storage/service/storage.service";
import { ApiError } from "@/core/errors/ApiError";
import type { AuthenticatedUser } from "@/core/middlewares/withAuth";
import { prisma } from "@/infra/prisma/client";

/**
 * Upload de imagem para stores (avatar ou banner)
 */
export async function uploadStoreImage(
  request: NextRequest,
  user: AuthenticatedUser,
  storeId: string,
  category: "avatar" | "banner",
) {
  // Verificar se a loja existe e pertence ao merchant
  const store = await prisma.stores.findUnique({
    where: { id: storeId },
    select: { id: true, merchant_id: true, avatar_url: true, banner_url: true },
  });

  if (!store) {
    throw ApiError.notFound("Loja não encontrada");
  }

  // Verificar se o usuário é o dono da loja
  if (user.type !== "merchant" || store.merchant_id !== user.id) {
    throw ApiError.forbidden("Você não tem permissão para atualizar esta loja");
  }

  // Obter arquivo do FormData
  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    throw ApiError.validation({}, "Arquivo não fornecido");
  }

  // Fazer upload
  const oldPath = category === "avatar" ? store.avatar_url : store.banner_url;
  const result = await storageService.replaceImage(
    oldPath,
    {
      entityType: "stores",
      entityId: storeId,
      category,
      file,
    },
  );

  // Atualizar URL no banco de dados
  const updateData = category === "avatar" 
    ? { avatar_url: result.url }
    : { banner_url: result.url };

  await prisma.stores.update({
    where: { id: storeId },
    data: updateData,
  });

  return ApiResponse.success(
    {
      url: result.url,
      path: result.path,
      category,
      entityType: "stores",
      entityId: storeId,
    },
    { request, message: "Imagem enviada com sucesso" },
  );
}

/**
 * Upload de imagem para products (primary)
 */
export async function uploadProductImage(
  request: NextRequest,
  user: AuthenticatedUser,
  storeId: string,
  productId: string,
) {
  // Verificar se a loja existe e se o merchant tem permissão
  const merchant = await prisma.merchants.findFirst({
    where: {
      auth_user_id: user.id,
      deleted_at: null,
    },
    include: {
      stores: {
        where: {
          id: storeId,
          deleted_at: null,
        },
        select: { id: true },
      },
      store_merchant_members: {
        where: {
          store_id: storeId,
          deleted_at: null,
        },
        select: { store_id: true },
      },
    },
  });

  if (!merchant) {
    throw ApiError.notFound("Merchant não encontrado", "MERCHANT_NOT_FOUND");
  }

  // Validar propriedade da loja (dono ou membro)
  const isOwner = merchant.stores.some(s => s.id === storeId);
  const isMember = merchant.store_merchant_members.some(m => m.store_id === storeId);

  if (!isOwner && !isMember) {
    throw ApiError.forbidden("Você não tem permissão para fazer upload de imagens nesta loja");
  }

  // Verificar se o produto existe e pertence à loja
  const product = await prisma.products.findUnique({
    where: { id: productId },
    select: { id: true, store_id: true, image_url: true },
  });

  if (!product) {
    throw ApiError.notFound("Produto não encontrado");
  }

  if (product.store_id !== storeId) {
    throw ApiError.forbidden("Produto não pertence a esta loja");
  }

  // Obter arquivo do FormData
  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    throw ApiError.validation({}, "Arquivo não fornecido");
  }

  // Fazer upload
  const result = await storageService.replaceImage(
    product.image_url,
    {
      entityType: "products",
      entityId: productId,
      category: "primary",
      file,
    },
  );

  // Atualizar URL no banco de dados
  await prisma.products.update({
    where: { id: productId },
    data: { image_url: result.url },
  });

  return ApiResponse.success(
    {
      url: result.url,
      path: result.path,
      category: "primary",
      entityType: "products",
      entityId: productId,
    },
    { request, message: "Imagem do produto enviada com sucesso" },
  );
}

/**
 * Upload de comprovante PIX para orders (proof)
 */
export async function uploadOrderProof(
  request: NextRequest,
  user: AuthenticatedUser,
  storeId: string,
  orderId: string,
) {
  // Verificar se a loja existe e pertence ao merchant
  const store = await prisma.stores.findUnique({
    where: { id: storeId },
    select: { id: true, merchant_id: true },
  });

  if (!store) {
    throw ApiError.notFound("Loja não encontrada");
  }

  // Verificar se o usuário é o dono da loja ou o cliente do pedido
  const orderQuery = `
    SELECT id, store_id, customer_id
    FROM orders.orders
    WHERE id = $1::uuid
  `;

  const orderResult = (await (prisma as unknown as {
    $queryRawUnsafe: (query: string, ...values: unknown[]) => Promise<Array<{
      id: string;
      store_id: string;
      customer_id: string;
    }>>;
  }).$queryRawUnsafe(orderQuery, orderId)) as Array<{
    id: string;
    store_id: string;
    customer_id: string;
  }>;

  if (orderResult.length === 0) {
    throw ApiError.notFound("Pedido não encontrado");
  }

  const order = orderResult[0];

  if (order.store_id !== storeId) {
    throw ApiError.forbidden("Pedido não pertence a esta loja");
  }

  // Verificar permissão: merchant dono da loja OU cliente dono do pedido
  const isMerchantOwner = user.type === "merchant" && store.merchant_id === user.id;
  const isCustomerOwner = user.type === "customer" && order.customer_id === user.id;

  if (!isMerchantOwner && !isCustomerOwner) {
    throw ApiError.forbidden("Você não tem permissão para atualizar este pedido");
  }

  // Obter arquivo do FormData
  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    throw ApiError.validation({}, "Arquivo não fornecido");
  }

  // Fazer upload
  const result = await storageService.uploadImage({
    entityType: "orders",
    entityId: orderId,
    category: "proof",
    file,
  });

  // Nota: A tabela orders pode não ter uma coluna proof_url ainda
  // Por enquanto, retornamos apenas o resultado do upload
  // A implementação completa dependeria de adicionar essa coluna ao schema

  return ApiResponse.success(
    {
      url: result.url,
      path: result.path,
      category: "proof",
      entityType: "orders",
      entityId: orderId,
    },
    { request, message: "Comprovante enviado com sucesso" },
  );
}

