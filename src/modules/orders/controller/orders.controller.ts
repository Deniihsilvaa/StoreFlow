import type { NextRequest } from "next/server";

import { prisma } from "@/infra/prisma/client";
import { ApiResponse } from "@/core/responses/ApiResponse";
import { ApiError } from "@/core/errors/ApiError";
import { parsePagination } from "@/core/utils/pagination";
import { ordersService } from "../service/orders.service";
import type { AuthenticatedUser } from "@/core/middlewares/withAuth";

export async function listOrders(
  request: NextRequest,
  user: AuthenticatedUser,
) {
  const searchParams = request.nextUrl.searchParams;
  const pagination = parsePagination(request);

  // Se for cliente, buscar customer_id a partir do auth_user_id
  let customerId: string | undefined;
  if (user.type === "customer") {
    const customer = await prisma.customers.findFirst({
      where: {
        auth_user_id: user.id,
      },
      select: {
        id: true,
      },
    });
    customerId = customer?.id;
  } else {
    // Se for merchant, pode filtrar por customerId via query param
    customerId = searchParams.get("customerId") || undefined;
  }

  const params = {
    customerId,
    storeId: searchParams.get("storeId") || undefined,
    status: searchParams.get("status") || undefined,
    startDate: searchParams.get("startDate") || undefined,
    endDate: searchParams.get("endDate") || undefined,
  };

  const { items, total } = await ordersService.listOrders(params, pagination);

  const totalPages = Math.ceil(total / pagination.limit);

  return ApiResponse.success(
    {
      items,
      pagination: {
        ...pagination,
        total,
        totalPages,
        hasNext: pagination.page < totalPages,
        hasPrev: pagination.page > 1,
      },
    },
    { request }
  );
}

export async function createOrder(
  request: NextRequest,
  user: AuthenticatedUser,
) {
  // Apenas clientes podem criar pedidos
  if (user.type !== "customer") {
    throw ApiError.forbidden("Apenas clientes podem criar pedidos");
  }

  // Buscar customer_id a partir do auth_user_id
  const customer = await prisma.customers.findFirst({
    where: {
      auth_user_id: user.id,
    },
    select: {
      id: true,
    },
  });

  if (!customer) {
    throw ApiError.notFound("Cliente não encontrado");
  }

  const body = await request.json();

  // Validar dados com Zod
  const { createOrderSchema } = await import("../schemas/create-order.schema");
  const validatedData = createOrderSchema.parse(body);

  // Criar pedido
  const order = await ordersService.createOrder({
    storeId: validatedData.store_id,
    customerId: customer.id,
    deliveryOptionId: validatedData.delivery_option_id,
    fulfillmentMethod: validatedData.fulfillment_method,
    paymentMethod: validatedData.payment_method,
    items: validatedData.items.map((item) => ({
      productId: item.product_id,
      quantity: item.quantity,
      unitPrice: item.unit_price,
      observations: item.observations,
      customizations: item.customizations?.map((c) => ({
        customizationId: c.customization_id,
        value: c.value,
      })),
    })),
    deliveryAddress: validatedData.delivery_address
      ? {
          street: validatedData.delivery_address.street,
          number: validatedData.delivery_address.number,
          neighborhood: validatedData.delivery_address.neighborhood,
          city: validatedData.delivery_address.city,
          state: validatedData.delivery_address.state,
          zipCode: validatedData.delivery_address.zip_code,
          complement: validatedData.delivery_address.complement,
        }
      : undefined,
    pickupSlot: validatedData.pickup_slot,
    observations: validatedData.observations,
  });

  return ApiResponse.success(order, { request, status: 201 });
}

