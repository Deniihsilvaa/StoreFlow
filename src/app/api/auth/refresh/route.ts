import type { NextRequest } from "next/server";

import { ApiError } from "@/core/errors/ApiError";
import { withErrorHandling } from "@/core/middlewares/withErrorHandling";
import { refreshTokenController } from "@/modules/auth/controller/refresh-token.controller";

export const POST = withErrorHandling(async (request: NextRequest) => {
  // Validar Content-Type antes de fazer parse do body
  const contentType = request.headers.get('content-type');
  if (!contentType?.includes('application/json')) {
    throw ApiError.badRequest('Content-Type deve ser application/json');
  }

  const body = await request.json();
  return refreshTokenController(body, request);
});

