import type { NextRequest } from "next/server";

import { withErrorHandling } from "@/core/middlewares/withErrorHandling";
import { getStoreById } from "@/modules/stores/controller/stores.controller";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> | { storeId: string } },
) {
  return withErrorHandling(async (req: NextRequest) => {
    // Resolver params se for Promise (Next.js 15+)
    const resolvedParams = params instanceof Promise ? await params : params;
    return getStoreById(resolvedParams.storeId, req);
  })(request, {});
}

