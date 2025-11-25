import type { NextRequest } from "next/server";

import { ApiResponse } from "@/core/responses/ApiResponse";
import { refreshTokenSchema } from "@/modules/auth/dto/refresh-token.dto";
import { authService } from "@/modules/auth/service/auth.service";

export async function refreshTokenController(body: unknown, request?: NextRequest) {
  const payload = refreshTokenSchema.parse(body);
  const result = await authService.refreshTokens(payload);
  return ApiResponse.success(result, { request });
}

