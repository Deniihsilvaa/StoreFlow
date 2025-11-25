import type { NextRequest } from "next/server";

import { withErrorHandling } from "@/core/middlewares/withErrorHandling";
import { withAuth } from "@/core/middlewares/withAuth";
import { listOrders, createOrder } from "@/modules/orders/controller/orders.controller";

export const GET = withErrorHandling(
  withAuth(async (request: NextRequest, context) => {
    return listOrders(request, context.user);
  }),
);

export const POST = withErrorHandling(
  withAuth(async (request: NextRequest, context) => {
    return createOrder(request, context.user);
  }),
);

