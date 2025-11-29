import type { NextRequest } from "next/server";

import { ApiResponse } from "@/core/responses/ApiResponse";
import { ApiError } from "@/core/errors/ApiError";
import { storesService } from "../service/stores.service";

export type GetStoreParams = {
  identifier: string;
  type: "id" | "slug";
  request?: NextRequest;
}

export async function getStoreById(
  identifier: string,
  type: "id" | "slug",
  request?: NextRequest,
) {
console.log("identifier", identifier);
  if (!identifier || identifier.trim() === "") {
    throw ApiError.validation(
      { storeId: ["Identificador é obrigatório"] },
      "Parâmetros inválidos",
    );
  }
  let store
  if (type === "id") {
    store = await storesService.getStoreById(identifier);
  } else {
    store = await storesService.getStoreBySlug(identifier);
  }


  if (!store) {
    throw ApiError.notFound("Loja não encontrada");
  }

  return ApiResponse.success(store, { request });
}

