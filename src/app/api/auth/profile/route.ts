import type { NextRequest } from "next/server";

import { ApiError } from "@/core/errors/ApiError";
import { withErrorHandling } from "@/core/middlewares/withErrorHandling";
import { withAuth } from "@/core/middlewares/withAuth";
import {
  getProfileController,
  updateProfileController,
  patchProfileController,
} from "@/modules/auth/controller/profile.controller";

export const GET = withErrorHandling(
  withAuth(async (request: NextRequest, context) => 
    getProfileController(context.user.id, request)
  ),
);

// PUT: Substituição completa (aceita array simples ou operações parciais para compatibilidade)
export const PUT = withErrorHandling(
  withAuth(async (request: NextRequest, context) => {
    // Validar Content-Type antes de fazer parse do body
    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      throw ApiError.badRequest('Content-Type deve ser application/json');
    }

    const body = await request.json();
    return updateProfileController(context.user.id, body, request);
  }),
);

// PATCH: Atualização parcial (aceita apenas operações parciais)
export const PATCH = withErrorHandling(
  withAuth(async (request: NextRequest, context) => {
    // Validar Content-Type antes de fazer parse do body
    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      throw ApiError.badRequest('Content-Type deve ser application/json');
    }
    
    const body = await request.json();
    console.log("body:",body);
    return patchProfileController(context.user.id, body, request);
  }),
);

