import type { NextRequest } from "next/server";

import { ApiResponse } from "@/core/responses/ApiResponse";
import { merchantSignUpSchema } from "@/modules/auth/dto/merchant-signup.dto";
import { authService } from "@/modules/auth/service/auth.service";

export async function merchantSignUpController(body: unknown, request?: NextRequest) {
  const payload = merchantSignUpSchema.parse(body);
  const result = await authService.merchantSignUp(payload);
  return ApiResponse.success(result, { request, status: 201 });
}

