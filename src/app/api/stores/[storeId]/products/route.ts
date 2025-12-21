import type { NextRequest } from "next/server";

import { ApiError } from "@/core/errors/ApiError";
import { withErrorHandling } from "@/core/middlewares/withErrorHandling";
import { listProducts as listProductsController } from "@/modules/products/controller/products.controller";
import { storesService } from "@/modules/stores/service/stores.service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> | { storeId: string } },
) {
  return withErrorHandling(async () => {
    // Resolver params se for Promise (Next.js 15+)
    const resolvedParams = params instanceof Promise ? await params : params;
    const identifier = resolvedParams.storeId;

    if (!identifier) {
      throw ApiError.validation(
        { storeId: ["Parâmetro storeId é obrigatório"] },
        "Parâmetros inválidos",
      );
    }

    // Detectar se é UUID ou slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
    
    let storeId: string;
    
    if (isUUID) {
      // Se for UUID, usar diretamente
      storeId = identifier;
    } else {
      // Se for slug, buscar o UUID da loja
      const store = await storesService.getStoreBySlug(identifier);
      if (!store || !store.id) {
        throw ApiError.notFound("Loja não encontrada");
      }
      storeId = store.id;
    }

    // Adicionar storeId como query parameter na URL do request original
    request.nextUrl.searchParams.set("storeId", storeId);
    
    // O request original já tem nextUrl, então podemos usá-lo diretamente
    return listProductsController(request);
  })(request, {});
}

