import type { NextRequest } from "next/server";

import { ApiResponse } from "@/core/responses/ApiResponse";
import { updateProfileSchema } from "@/modules/auth/dto/update-profile.dto";
import { authService } from "@/modules/auth/service/auth.service";

export async function getProfileController(userId: string, request?: NextRequest) {
  const profile = await authService.getProfile(userId);
  return ApiResponse.success(profile, { request });
}

export async function updateProfileController(
  userId: string,
  body: unknown,
  request?: NextRequest,
) {
  // Validar dados com Zod - isso vai lançar ApiError se houver erro
  let payload;
  try {
    payload = updateProfileSchema.parse(body);
  } catch (error) {
    // O erro do Zod será capturado pelo withErrorHandling e formatado automaticamente
    throw error;
  }
  
  const profile = await authService.updateProfile(userId, payload);
  return ApiResponse.success(profile, { request });
}

