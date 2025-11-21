import type { NextRequest } from "next/server";

import { ApiResponse } from "@/core/responses/ApiResponse";
import { ApiError } from "@/core/errors/ApiError";
import { parsePagination } from "@/core/utils/pagination";
import { productsService } from "../service/products.service";

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

