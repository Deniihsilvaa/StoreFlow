import type { NextRequest } from "next/server";

import { ApiResponse } from "@/core/responses/ApiResponse";
import { customerSignUpSchema } from "@/modules/auth/dto/customer-signup.dto";
import { authService } from "@/modules/auth/service/auth.service";

export async function customerSignUpController(body: unknown, request?: NextRequest) {
  const payload = customerSignUpSchema.parse(body);
  const result = await authService.customerSignUp(payload);
  return ApiResponse.success(result, { request });
}

