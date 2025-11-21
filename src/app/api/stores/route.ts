import type { NextRequest } from "next/server";

import { withErrorHandling } from "@/core/middlewares/withErrorHandling";
import { ApiResponse } from "@/core/responses/ApiResponse";
import { parsePagination } from "@/core/utils/pagination";

export const GET = withErrorHandling(async (request: NextRequest) => {
  const pagination = parsePagination(request);

  return ApiResponse.success(
    {
      items: [],
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
});

