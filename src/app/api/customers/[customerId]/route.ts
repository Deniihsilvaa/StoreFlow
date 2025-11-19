import type { NextRequest } from "next/server";

import { withErrorHandling } from "@/core/middlewares/withErrorHandling";
import { withAuth } from "@/core/middlewares/withAuth";
import { ApiResponse } from "@/core/responses/ApiResponse";
import { ApiError } from "@/core/errors/ApiError";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ customerId: string }> | { customerId: string } },
) {
  return withErrorHandling(
    withAuth(async (_request: NextRequest, context) => {
      // Resolver params se for Promise (Next.js 15+)
      const resolvedParams = params instanceof Promise ? await params : params;
      
      if (!resolvedParams.customerId) {
        throw ApiError.validation(
          { customerId: ["Parâmetro customerId é obrigatório"] },
          "Parametros inválidos",
        );
      }

      return ApiResponse.success({
        id: resolvedParams.customerId,
        requestedBy: context.user.id,
      });
    }),
  )(request, {});
}

