import type { NextRequest } from "next/server";

import { ApiResponse } from "@/core/responses/ApiResponse";
import { ApiError } from "@/core/errors/ApiError";
import { parsePagination } from "@/core/utils/pagination";
import { productsService } from "../service/products.service";
import { createProductSchema } from "../dto/create-product.dto";
import { updateProductSchema } from "../dto/update-product.dto";
import { addCustomizationSchema } from "../dto/add-customization.dto";
import { storageService } from "@/modules/storage/service/storage.service";

export async function listProducts(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const pagination = parsePagination(request);

  const params = {
    storeId: searchParams.get("storeId") ?? undefined,
    category: searchParams.get("category") ?? undefined,
    isActive:
      searchParams.get("isActive") !== null
        ? searchParams.get("isActive") === "true"
        : undefined,
    search: searchParams.get("search") ?? undefined,
  };

  const { items, total } = await productsService.listProducts(params, pagination);

  const totalPages = Math.ceil(total / pagination.limit);

  return ApiResponse.success(
    {
      items,
      pagination: {
        ...pagination,
        total,
        totalPages,
        hasNext: pagination.page < totalPages,
        hasPrev: pagination.page > 1,
      },
    },
    { request }
  );
}

export async function getProductById(productId: string, request?: NextRequest) {
  if (!productId) {
    throw ApiError.validation(
      { productId: ["Parâmetro productId é obrigatório"] },
      "Parâmetros inválidos",
    );
  }

  const product = await productsService.getProductById(productId);

  if (!product) {
    throw ApiError.notFound("Produto não encontrado");
  }

  return ApiResponse.success(product, { request });
}

export async function createProduct(
  userId: string,
  storeId: string,
  body: unknown,
  request?: NextRequest,
) {
  // Extrair arquivo se existir (vem do FormData)
  const bodyWithFile = body as { file?: File; [key: string]: unknown };
  const file = bodyWithFile.file;
  
  // Remover arquivo do body antes de validar com Zod
  const bodyWithoutFile = { ...bodyWithFile };
  delete bodyWithoutFile.file;

  // Validar dados com Zod
  let payload;
  try {
    payload = createProductSchema.parse(bodyWithoutFile);
  } catch (error) {
    throw error;
  }

  // Validar formato UUID do storeId
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(storeId)) {
    throw ApiError.validation(
      { storeId: ["Formato de storeId inválido"] },
      "Parâmetros inválidos",
    );
  }

  // Se houver arquivo, fazer upload antes de criar o produto
  // Mas precisamos criar o produto primeiro para ter o ID
  // Solução: criar produto, fazer upload, atualizar com URL
  // Criar produto (sem imagem se houver arquivo para upload)
  const productInput = file ? { ...payload, imageUrl: undefined } : payload;
  const product = await productsService.createProduct(userId, storeId, productInput);

  // Se houver arquivo, fazer upload e atualizar produto
  if (file) {
    try {
      const uploadResult = await storageService.replaceImage(
        null, // Não há imagem anterior
        {
          entityType: "products",
          entityId: product.id,
          category: "primary",
          file,
        },
      );

      // Atualizar produto com URL da imagem
      const updatedProduct = await productsService.updateProduct(
        userId,
        storeId,
        product.id,
        { imageUrl: uploadResult.url },
      );

      return ApiResponse.success(updatedProduct, { request });
    } catch {
      // Se o upload falhar, o produto já foi criado
      // Retornar produto sem imagem
      // Em produção, poderia deletar o produto ou fazer rollback
      return ApiResponse.success(product, { request });
    }
  }

  return ApiResponse.success(product, { request });
}

export async function updateProduct(
  userId: string,
  storeId: string,
  productId: string,
  body: unknown,
  request?: NextRequest,
) {
  // Validar dados com Zod
  let payload;
  try {
    payload = updateProductSchema.parse(body);
  } catch (error) {
    throw error;
  }

  // Validar formato UUID do storeId e productId
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(storeId)) {
    throw ApiError.validation(
      { storeId: ["Formato de storeId inválido"] },
      "Parâmetros inválidos",
    );
  }
  if (!uuidRegex.test(productId)) {
    throw ApiError.validation(
      { productId: ["Formato de productId inválido"] },
      "Parâmetros inválidos",
    );
  }

  const product = await productsService.updateProduct(userId, storeId, productId, payload);
  return ApiResponse.success(product, { request });
}

export async function deactivateProduct(
  userId: string,
  storeId: string,
  productId: string,
  request?: NextRequest,
) {
  // Validar formato UUID do storeId e productId
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(storeId)) {
    throw ApiError.validation(
      { storeId: ["Formato de storeId inválido"] },
      "Parâmetros inválidos",
    );
  }
  if (!uuidRegex.test(productId)) {
    throw ApiError.validation(
      { productId: ["Formato de productId inválido"] },
      "Parâmetros inválidos",
    );
  }

  const product = await productsService.deactivateProduct(userId, storeId, productId);
  return ApiResponse.success(product, { request });
}

export async function activateProduct(
  userId: string,
  storeId: string,
  productId: string,
  request?: NextRequest,
) {
  // Validar formato UUID do storeId e productId
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(storeId)) {
    throw ApiError.validation(
      { storeId: ["Formato de storeId inválido"] },
      "Parâmetros inválidos",
    );
  }
  if (!uuidRegex.test(productId)) {
    throw ApiError.validation(
      { productId: ["Formato de productId inválido"] },
      "Parâmetros inválidos",
    );
  }

  const product = await productsService.activateProduct(userId, storeId, productId);
  return ApiResponse.success(product, { request });
}

export async function deleteProduct(
  userId: string,
  storeId: string,
  productId: string,
  request?: NextRequest,
) {
  // Validar formato UUID do storeId e productId
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(storeId)) {
    throw ApiError.validation(
      { storeId: ["Formato de storeId inválido"] },
      "Parâmetros inválidos",
    );
  }
  if (!uuidRegex.test(productId)) {
    throw ApiError.validation(
      { productId: ["Formato de productId inválido"] },
      "Parâmetros inválidos",
    );
  }

  const product = await productsService.deleteProduct(userId, storeId, productId);
  return ApiResponse.success(product, { request });
}

export async function addCustomization(
  userId: string,
  storeId: string,
  productId: string,
  body: unknown,
  request?: NextRequest,
) {
  // Validar dados com Zod
  let payload;
  try {
    payload = addCustomizationSchema.parse(body);
  } catch (error) {
    throw error;
  }

  // Validar formato UUID do storeId e productId
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(storeId)) {
    throw ApiError.validation(
      { storeId: ["Formato de storeId inválido"] },
      "Parâmetros inválidos",
    );
  }
  if (!uuidRegex.test(productId)) {
    throw ApiError.validation(
      { productId: ["Formato de productId inválido"] },
      "Parâmetros inválidos",
    );
  }

  const result = await productsService.addCustomization(userId, storeId, productId, payload);
  return ApiResponse.success(result, { request });
}

export async function removeCustomization(
  userId: string,
  storeId: string,
  productId: string,
  customizationId: string,
  request?: NextRequest,
) {
  // Validar formato UUID do storeId, productId e customizationId
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(storeId)) {
    throw ApiError.validation(
      { storeId: ["Formato de storeId inválido"] },
      "Parâmetros inválidos",
    );
  }
  if (!uuidRegex.test(productId)) {
    throw ApiError.validation(
      { productId: ["Formato de productId inválido"] },
      "Parâmetros inválidos",
    );
  }
  if (!uuidRegex.test(customizationId)) {
    throw ApiError.validation(
      { customizationId: ["Formato de customizationId inválido"] },
      "Parâmetros inválidos",
    );
  }

  const product = await productsService.removeCustomization(userId, storeId, productId, customizationId);
  return ApiResponse.success(product, { request });
}

export async function getProductForMerchant(
  userId: string,
  storeId: string,
  productId: string,
  request?: NextRequest,
) {
  // Validar formato UUID do storeId e productId
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(storeId)) {
    throw ApiError.validation(
      { storeId: ["Formato de storeId inválido"] },
      "Parâmetros inválidos",
    );
  }
  if (!uuidRegex.test(productId)) {
    throw ApiError.validation(
      { productId: ["Formato de productId inválido"] },
      "Parâmetros inválidos",
    );
  }

  const productData = await productsService.getProductForMerchant(userId, storeId, productId);
  return ApiResponse.success(productData, { request });
}

