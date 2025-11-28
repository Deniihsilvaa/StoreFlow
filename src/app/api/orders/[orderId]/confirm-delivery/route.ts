import type { NextRequest } from "next/server";

import { withErrorHandling } from "@/core/middlewares/withErrorHandling";
import { withAuth } from "@/core/middlewares/withAuth";
import { ApiError } from "@/core/errors/ApiError";
import { confirmDelivery } from "@/modules/orders/controller/orders.controller";
import { prisma } from "@/infra/prisma/client";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> | { orderId: string } },
) {
  return withErrorHandling(
    withAuth(async (req: NextRequest, context) => {
      // Resolver params se for Promise (Next.js 15+)
      const resolvedParams = params instanceof Promise ? await params : params;

      // Validar se o usuário é customer
      if (context.user.type !== "customer") {
        throw ApiError.forbidden("Apenas clientes podem confirmar entrega");
      }

      // Buscar customer_id a partir do auth_user_id
      const customer = await prisma.customers.findFirst({
        where: {
          auth_user_id: context.user.id,
        },
        select: {
          id: true,
        },
      });

      if (!customer) {
        throw ApiError.notFound("Cliente não encontrado");
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
        return await confirmDelivery(req, resolvedParams.orderId, customer.id);
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === "PEDIDO_NAO_ENCONTRADO") {
            throw ApiError.notFound("Pedido não encontrado", "ORDER_NOT_FOUND");
          }
          if (error.message === "SEM_PERMISSAO") {
            throw ApiError.forbidden("Você não tem permissão para acessar este pedido");
          }
          if (error.message === "STATUS_INVALIDO_PARA_CONFIRMACAO") {
            throw ApiError.badRequest("Este pedido não está em um status válido para confirmação de entrega");
          }
        }
        throw error;
      }
    }),
  )(request, {});
}

