import type { NextRequest } from "next/server";

import type { PaginationQuery } from "@/shared/types/pagination";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export function parsePagination(request: NextRequest): PaginationQuery {
  const searchParams = request.nextUrl?.searchParams ?? new URLSearchParams();
  const page = Number(searchParams.get("page") ?? DEFAULT_PAGE);
  const limit = Number(searchParams.get("limit") ?? DEFAULT_LIMIT);

  return {
    page: Number.isFinite(page) && page > 0 ? Math.floor(page) : DEFAULT_PAGE,
    limit:
      Number.isFinite(limit) && limit > 0
        ? Math.min(Math.floor(limit), MAX_LIMIT)
        : DEFAULT_LIMIT,
  };
}

