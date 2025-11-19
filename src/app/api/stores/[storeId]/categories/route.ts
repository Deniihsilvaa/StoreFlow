import type { NextRequest } from "next/server";

import { withErrorHandling } from "@/core/middlewares/withErrorHandling";
import { ApiResponse } from "@/core/responses/ApiResponse";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> | { storeId: string } },
) {
  return withErrorHandling(async () => {
    // Resolver params se for Promise (Next.js 15+)
    const resolvedParams = params instanceof Promise ? await params : params;
    return ApiResponse.success({
      storeId: resolvedParams.storeId,
      categories: [],
    });
  })(request, {});
}

