import type { NextRequest } from "next/server";

import { ApiError } from "@/core/errors/ApiError";
import { withErrorHandling } from "@/core/middlewares/withErrorHandling";
import { withAuth } from "@/core/middlewares/withAuth";
import { deactivateProduct } from "@/modules/products/controller/products.controller";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ storeId: string; productId: string }> | { storeId: string; productId: string } },
) {
  return withErrorHandling(
    withAuth(async (req: NextRequest, context) => {
      // Validar se o usuário é merchant
      if (context.user.type !== "merchant") {
        throw ApiError.forbidden("Apenas lojistas podem desativar produtos");
      }

      // Resolver params se for Promise (Next.js 15+)
      const resolvedParams = params instanceof Promise ? await params : params;

      return deactivateProduct(context.user.id, resolvedParams.storeId, resolvedParams.productId, req);
    }),
  )(request, {});
}

