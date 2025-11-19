import type { NextRequest } from "next/server";

import { withErrorHandling } from "@/core/middlewares/withErrorHandling";
import { listProducts as listProductsController } from "@/modules/products/controller/products.controller";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> | { storeId: string } },
) {
  return withErrorHandling(async () => {
    // Resolver params se for Promise (Next.js 15+)
    const resolvedParams = params instanceof Promise ? await params : params;
    // O storeId já está sendo passado via query param no controller
    return listProductsController(request);
  })(request, {});
}

