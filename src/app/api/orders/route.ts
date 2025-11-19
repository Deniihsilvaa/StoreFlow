import type { NextRequest } from "next/server";

import { withErrorHandling } from "@/core/middlewares/withErrorHandling";
import { withAuth } from "@/core/middlewares/withAuth";
import { ApiResponse } from "@/core/responses/ApiResponse";
import { listOrders } from "@/modules/orders/controller/orders.controller";

export const GET = withErrorHandling(
  withAuth(async (request: NextRequest, context) => {
    return listOrders(request, context.user);
  }),
);

export const POST = withErrorHandling(
  withAuth(async (request: NextRequest, context) => {
    const body = await request.json();

    return ApiResponse.success(
      {
        order: body,
        userId: context.user.id,
      },
      { status: 201 },
    );
  }),
);

