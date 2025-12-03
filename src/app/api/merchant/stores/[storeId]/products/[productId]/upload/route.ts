import type { NextRequest } from "next/server";

import { ApiError } from "@/core/errors/ApiError";
import { withErrorHandling } from "@/core/middlewares/withErrorHandling";
import { withAuth } from "@/core/middlewares/withAuth";
import { uploadProductImage } from "@/modules/storage/controller/storage.controller";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ storeId: string; productId: string }> | { storeId: string; productId: string } },
) {
  return withErrorHandling(
    withAuth(async (req: NextRequest, context) => {
      // Validar se o usuário é merchant
      if (context.user.type !== "merchant") {
        throw ApiError.forbidden("Apenas lojistas podem fazer upload de imagens de produtos");
      }

      // Resolver params se for Promise (Next.js 15+)
      const resolvedParams = params instanceof Promise ? await params : params;

      return uploadProductImage(
        req,
        context.user,
        resolvedParams.storeId,
        resolvedParams.productId,
      );
    }),
  )(request, {});
}

