import type { NextRequest } from "next/server";

import { ApiError } from "@/core/errors/ApiError";
import { withErrorHandling } from "@/core/middlewares/withErrorHandling";
import { withAuth } from "@/core/middlewares/withAuth";
import { addCustomization } from "@/modules/products/controller/products.controller";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ storeId: string; productId: string }> | { storeId: string; productId: string } },
) {
  return withErrorHandling(
    withAuth(async (req: NextRequest, context) => {
      // Validar se o usuário é merchant
      if (context.user.type !== "merchant") {
        throw ApiError.forbidden("Apenas lojistas podem gerenciar customizações");
      }

      // Resolver params se for Promise (Next.js 15+)
      const resolvedParams = params instanceof Promise ? await params : params;

      // Validar Content-Type antes de fazer parse do body
      const contentType = req.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        throw ApiError.badRequest('Content-Type deve ser application/json');
      }

      const body = await req.json();
      return addCustomization(context.user.id, resolvedParams.storeId, resolvedParams.productId, body, req);
    }),
  )(request, {});
}

