import type { NextRequest } from "next/server";

import { ApiError } from "@/core/errors/ApiError";
import { withErrorHandling } from "@/core/middlewares/withErrorHandling";
import { withAuth } from "@/core/middlewares/withAuth";
import { getStoreStatus } from "@/modules/stores/controller/stores.controller";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> | { storeId: string } },
) {
  return withErrorHandling(
    withAuth(async (req: NextRequest, context) => {
      // Validar se o usuário é merchant
      if (context.user.type !== "merchant") {
        throw ApiError.forbidden("Apenas lojistas podem visualizar status da loja");
      }

      // Resolver params se for Promise (Next.js 15+)
      const resolvedParams = params instanceof Promise ? await params : params;

      return getStoreStatus(context.user.id, resolvedParams.storeId, req);
    }),
  )(request, {});
}

