import type { NextRequest } from "next/server";

import { ApiResponse } from "@/core/responses/ApiResponse";
import { ApiError } from "@/core/errors/ApiError";
import { storesService } from "../service/stores.service";
import { updateStoreSchema } from "../dto/update-store.dto";

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
console.log("identifier", identifier +"-type:"+type);
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

export async function updateStore(
  userId: string,
  storeId: string,
  body: unknown,
  request?: NextRequest,
) {
  // Validar dados com Zod
  let payload;
  try {
    payload = updateStoreSchema.parse(body);
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

  const store = await storesService.updateStore(userId, storeId, payload);
  return ApiResponse.success(store, { request });
}

