import type { NextRequest } from "next/server";

import { withErrorHandling } from "@/core/middlewares/withErrorHandling";
import { getProductById } from "@/modules/products/controller/products.controller";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> | { productId: string } },
) {
  return withErrorHandling(async (req: NextRequest) => {
    // Resolver params se for Promise (Next.js 15+)
    const resolvedParams = params instanceof Promise ? await params : params;
    return getProductById(resolvedParams.productId, req);
  })(request, {});
}

