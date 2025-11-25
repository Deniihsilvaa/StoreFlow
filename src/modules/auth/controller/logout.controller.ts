import type { NextRequest } from "next/server";

import { ApiResponse } from "@/core/responses/ApiResponse";
import { authService } from "@/modules/auth/service/auth.service";

export async function logoutController(userId: string, request?: NextRequest) {
  console.log("userId", userId);
  const result = await authService.logout(userId);
  return ApiResponse.success(result, { request });
}

