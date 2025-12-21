import type { NextRequest } from "next/server";

import { ApiError } from "@/core/errors/ApiError";
import { withErrorHandling } from "@/core/middlewares/withErrorHandling";
import { withAuth } from "@/core/middlewares/withAuth";
import { toggleStoreStatus } from "@/modules/stores/controller/stores.controller";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> | { storeId: string } },
) {
  return withErrorHandling(
    withAuth(async (req: NextRequest, context) => {
      // Validar se o usuário é merchant
      if (context.user.type !== "merchant") {
        throw ApiError.forbidden("Apenas lojistas podem alterar status da loja");
      }

      // Resolver params se for Promise (Next.js 15+)
      const resolvedParams = params instanceof Promise ? await params : params;

      // Validar Content-Type antes de fazer parse do body
      const contentType = req.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        throw ApiError.badRequest('Content-Type deve ser application/json');
      }

      const body = await req.json();
      return toggleStoreStatus(context.user.id, resolvedParams.storeId, body, req);
    }),
  )(request, {});
}

