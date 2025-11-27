import type { NextRequest } from "next/server";

import { ApiResponse } from "@/core/responses/ApiResponse";
import { customerLoginSchema } from "@/modules/auth/dto/customer-login.dto";
import { authService } from "@/modules/auth/service/auth.service";

export async function customerLoginController(body: unknown, request?: NextRequest) {
  const payload = customerLoginSchema.parse(body);
  const result = await authService.loginCustomer(payload);
  return ApiResponse.success(result, { request });
}

