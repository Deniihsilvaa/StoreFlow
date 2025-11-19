import { ApiResponse } from "@/core/responses/ApiResponse";
import { updateProfileSchema } from "@/modules/auth/dto/update-profile.dto";
import { authService } from "@/modules/auth/service/auth.service";

export async function getProfileController(userId: string) {
  const profile = await authService.getProfile(userId);
  return ApiResponse.success(profile);
}

export async function updateProfileController(userId: string, body: unknown) {
  const payload = updateProfileSchema.parse(body);
  const profile = await authService.updateProfile(userId, payload);
  return ApiResponse.success(profile);
}

