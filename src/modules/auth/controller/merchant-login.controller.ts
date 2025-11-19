import { ApiResponse } from "@/core/responses/ApiResponse";
import { merchantLoginSchema } from "@/modules/auth/dto/merchant-login.dto";
import { authService } from "@/modules/auth/service/auth.service";

export async function merchantLoginController(body: unknown) {
  const payload = merchantLoginSchema.parse(body);
  const result = await authService.loginMerchant(payload);
  return ApiResponse.success(result);
}

