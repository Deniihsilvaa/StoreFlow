import type { NextRequest } from "next/server";

import { withErrorHandling } from "@/core/middlewares/withErrorHandling";
import { withAuth } from "@/core/middlewares/withAuth";
import { ApiResponse } from "@/core/responses/ApiResponse";
import { ApiError } from "@/core/errors/ApiError";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> | { orderId: string } },
) {
  return withErrorHandling(
    withAuth(async (req: NextRequest, context) => {
      // Resolver params se for Promise (Next.js 15+)
      const resolvedParams = params instanceof Promise ? await params : params;
      
      if (!resolvedParams.orderId) {
        throw ApiError.validation(
          { orderId: ["Parâmetro orderId é obrigatório"] },
          "Parametros inválidos",
        );
      }

      return ApiResponse.success(
        {
          id: resolvedParams.orderId,
          userId: context.user.id,
        },
        { request: req }
      );
    }),
  )(request, {});
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> | { orderId: string } },
) {
  return withErrorHandling(
    withAuth(async (req: NextRequest, context) => {
      // Resolver params se for Promise (Next.js 15+)
      const resolvedParams = params instanceof Promise ? await params : params;
      
      if (!resolvedParams.orderId) {
        throw ApiError.validation(
          { orderId: ["Parâmetro orderId é obrigatório"] },
          "Parametros inválidos",
        );
      }

      const body = await req.json();

      return ApiResponse.success(
        {
          id: resolvedParams.orderId,
          payload: body,
          updatedBy: context.user.id,
        },
        { request: req }
      );
    }),
  )(request, {});
}

