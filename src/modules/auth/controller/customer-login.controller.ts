import { ApiResponse } from "@/core/responses/ApiResponse";
import { customerLoginSchema } from "@/modules/auth/dto/customer-login.dto";
import { authService } from "@/modules/auth/service/auth.service";

export async function customerLoginController(body: unknown) {
  const payload = customerLoginSchema.parse(body);
  const result = await authService.loginCustomer(payload);
  console.log("result", result);
  return ApiResponse.success(result);
}

