import type { NextRequest } from "next/server";

import { withErrorHandling } from "@/core/middlewares/withErrorHandling";
import { withAuth } from "@/core/middlewares/withAuth";
import { ApiError } from "@/core/errors/ApiError";
import { updateOrderStatus } from "@/modules/orders/controller/orders.controller";
import { prisma } from "@/infra/prisma/client";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ storeId: string; orderId: string }> | { storeId: string; orderId: string } },
) {
  return withErrorHandling(
    withAuth(async (req: NextRequest, context) => {
      // Resolver params se for Promise (Next.js 15+)
      const resolvedParams = params instanceof Promise ? await params : params;

      // Validar se o usuário é merchant
      if (context.user.type !== "merchant") {
        throw ApiError.forbidden("Apenas lojistas podem atualizar o status de pedidos");
      }

      // Verificar se a loja existe e pertence ao merchant
      const store = await prisma.stores.findUnique({
        where: { id: resolvedParams.storeId },
        select: { id: true, merchant_id: true },
      });

      if (!store) {
        throw ApiError.notFound("Loja não encontrada");
      }

      // Buscar merchant_id a partir do auth_user_id
      const merchant = await prisma.merchants.findFirst({
        where: {
          auth_user_id: context.user.id,
        },
        select: {
          id: true,
        },
      });

      if (!merchant || store.merchant_id !== merchant.id) {
        throw ApiError.forbidden("Você não tem permissão para acessar esta loja");
      }

      // Validar formato UUID do orderId
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(resolvedParams.orderId)) {
        throw ApiError.validation(
          { orderId: ["Formato de orderId inválido"] },
          "Parâmetros inválidos",
        );
      }

      try {
        return await updateOrderStatus(req, resolvedParams.orderId, context.user.id);
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === "PEDIDO_NAO_ENCONTRADO") {
            throw ApiError.notFound("Pedido não encontrado", "ORDER_NOT_FOUND");
          }
          if (error.message === "SEM_PERMISSAO") {
            throw ApiError.forbidden("Você não tem permissão para acessar este pedido");
          }
          if (error.message === "TRANSICAO_INVALIDA") {
            throw ApiError.badRequest("Transição de status inválida para este pedido");
          }
          if (error.message === "OUT_FOR_DELIVERY_APENAS_DELIVERY") {
            throw ApiError.badRequest("Status 'out_for_delivery' só é permitido para pedidos de entrega");
          }
          if (error.message === "MERCHANT_NAO_ENCONTRADO") {
            throw ApiError.notFound("Merchant não encontrado");
          }
        }
        throw error;
      }
    }),
  )(request, {});
}

