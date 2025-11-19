import type { NextRequest } from "next/server";

import { withErrorHandling } from "@/core/middlewares/withErrorHandling";
import { listProducts } from "@/modules/products/controller/products.controller";

export const GET = withErrorHandling(async (request: NextRequest) => {
  return listProducts(request);
});

