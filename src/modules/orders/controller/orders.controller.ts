import type { NextRequest } from "next/server";

import { prisma } from "@/infra/prisma/client";
import { ApiResponse } from "@/core/responses/ApiResponse";
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

  return ApiResponse.success({
    items,
    pagination: {
      ...pagination,
      total,
      totalPages,
      hasNext: pagination.page < totalPages,
      hasPrev: pagination.page > 1,
    },
  });
}

