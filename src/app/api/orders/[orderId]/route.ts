import type { NextRequest } from "next/server";

import { withErrorHandling } from "@/core/middlewares/withErrorHandling";
import { withAuth } from "@/core/middlewares/withAuth";
import { ApiResponse } from "@/core/responses/ApiResponse";
import { ApiError } from "@/core/errors/ApiError";
import { OrdersService } from "@/modules/orders/service/orders.service";

const ordersService = new OrdersService();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> | { orderId: string } },
) {
  return withErrorHandling(
    withAuth(async (req: NextRequest, context) => {
      const resolvedParams = params instanceof Promise ? await params : params;
      
      if (!resolvedParams.orderId) {
        throw ApiError.validation(
          { orderId: ["Parâmetro orderId é obrigatório"] },
          "Parâmetros inválidos",
        );
      }

      // Validar formato UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(resolvedParams.orderId)) {
        throw ApiError.validation(
          { orderId: ["Formato de orderId inválido"] },
          "Parâmetros inválidos",
        );
      }

      try {
        const result = await ordersService.getOrderById(
          resolvedParams.orderId,
          context.user.id,
        );

        return ApiResponse.success(
          {
            order: {
              id: result.order.id,
              storeId: result.order.store_id,
              customerId: result.order.customer_id,
              fulfillmentMethod: result.order.fulfillment_method,
              pickupSlot: result.order.pickup_slot,
              totalAmount: result.order.total_amount,
              deliveryFee: result.order.delivery_fee,
              status: result.order.status,
              paymentMethod: result.order.payment_method,
              paymentStatus: result.order.payment_status,
              estimatedDeliveryTime: result.order.estimated_delivery_time,
              observations: result.order.observations,
              cancellationReason: result.order.cancellation_reason,
              createdAt: result.order.created_at,
              updatedAt: result.order.updated_at,
              store: {
                name: result.order.store_name,
                slug: result.order.store_slug,
              },
              customer: {
                name: result.order.customer_name,
                phone: result.order.customer_phone,
              },
              deliveryAddress: result.order.delivery_street ? {
                street: result.order.delivery_street,
                number: result.order.delivery_number,
                neighborhood: result.order.delivery_neighborhood,
                city: result.order.delivery_city,
                state: result.order.delivery_state,
                zipCode: result.order.delivery_zip_code,
              } : null,
              deliveryOption: result.order.delivery_option_name ? {
                name: result.order.delivery_option_name,
                fee: result.order.delivery_option_fee,
              } : null,
              itemsCount: result.order.items_count,
              totalItems: result.order.total_items,
              statusHistory: result.order.status_history,
            },
            items: result.items.map((item) => ({
              id: item.id,
              productId: item.product_id,
              productName: item.product_name,
              productFamily: item.product_family,
              productImageUrl: item.product_image_url,
              quantity: item.quantity,
              unitPrice: item.unit_price,
              totalPrice: item.total_price,
              observations: item.observations,
              customizations: item.customizations,
              createdAt: item.created_at,
            })),
          },
          { request: req },
        );
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === "PEDIDO_NAO_ENCONTRADO") {
            throw ApiError.notFound("Pedido não encontrado", "ORDER_NOT_FOUND");
          }
          if (error.message === "SEM_PERMISSAO") {
            throw ApiError.forbidden("Você não tem permissão para acessar este pedido");
          }
        }
        throw error;
      }
    }),
  )(request, {});
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> | { orderId: string } },
) {
  return withErrorHandling(
    withAuth(async (req: NextRequest, context) => {
      const resolvedParams = params instanceof Promise ? await params : params;
      
      if (!resolvedParams.orderId) {
        throw ApiError.validation(
          { orderId: ["Parâmetro orderId é obrigatório"] },
          "Parâmetros inválidos",
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
