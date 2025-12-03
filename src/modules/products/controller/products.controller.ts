import type { NextRequest } from "next/server";

import { ApiResponse } from "@/core/responses/ApiResponse";
import { ApiError } from "@/core/errors/ApiError";
import { parsePagination } from "@/core/utils/pagination";
import { productsService } from "../service/products.service";
import { createProductSchema } from "../dto/create-product.dto";
import { updateProductSchema } from "../dto/update-product.dto";

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
  // Validar dados com Zod
  let payload;
  try {
    payload = createProductSchema.parse(body);
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

  const product = await productsService.createProduct(userId, storeId, payload);
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

