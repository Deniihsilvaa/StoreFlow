import type { NextRequest } from "next/server";

import { ApiResponse } from "@/core/responses/ApiResponse";
import { ApiError } from "@/core/errors/ApiError";
import { storesService } from "../service/stores.service";

export async function getStoreById(storeId: string, request?: NextRequest) {
  if (!storeId) {
    throw ApiError.validation(
      { storeId: ["Parâmetro storeId é obrigatório"] },
      "Parâmetros inválidos",
    );
  }

  const store = await storesService.getStoreById(storeId);

  if (!store) {
    throw ApiError.notFound("Loja não encontrada");
  }

  return ApiResponse.success(store, { request });
}

