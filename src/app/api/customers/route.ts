import type { NextRequest } from "next/server";

import { withErrorHandling } from "@/core/middlewares/withErrorHandling";
import { withMerchant } from "@/core/middlewares/withMerchant";
import { ApiResponse } from "@/core/responses/ApiResponse";
import { parsePagination } from "@/core/utils/pagination";

export const GET = withErrorHandling(
  withMerchant(async (request: NextRequest, context) => {
    const pagination = parsePagination(request);

    return ApiResponse.success(
      {
        items: [],
        requestedBy: context.user.id,
        pagination: {
          ...pagination,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      },
      { request }
    );
  }),
);

export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json();

  return ApiResponse.success(
    {
      customer: body,
    },
    { request, status: 201 },
  );
});

