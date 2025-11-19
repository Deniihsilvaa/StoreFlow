import type { NextRequest } from "next/server";

import { formatErrorResponse, normalizeError } from "@/core/errors/error-handler";

export type RouteHandler<T = unknown> = (
  request: NextRequest,
  context: T,
) => Promise<Response> | Response;

export function withErrorHandling<T = unknown>(
  handler: RouteHandler<T>,
): RouteHandler<T> {
  return async (request: NextRequest, context: T) => {
    try {
      return await handler(request, context);
    } catch (error) {
      const normalized = normalizeError(error);
      return formatErrorResponse(normalized);
    }
  };
}

