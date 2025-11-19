import type { NextRequest } from "next/server";

import { withErrorHandling } from "@/core/middlewares/withErrorHandling";
import { withMerchant } from "@/core/middlewares/withMerchant";
import { ApiResponse } from "@/core/responses/ApiResponse";
import { parsePagination } from "@/core/utils/pagination";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> | { storeId: string } },
) {
  return withErrorHandling(
    withMerchant(async (_request: NextRequest, context) => {
      // Resolver params se for Promise (Next.js 15+)
      const resolvedParams = params instanceof Promise ? await params : params;
      const pagination = parsePagination(request);

      return ApiResponse.success({
        items: [],
        storeId: resolvedParams.storeId,
        pagination: {
          ...pagination,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      });
    }),
  )(request, {});
}

