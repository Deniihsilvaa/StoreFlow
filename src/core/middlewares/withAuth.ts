import type { NextRequest } from "next/server";

import { ApiError } from "@/core/errors/ApiError";
import type { RouteHandler } from "@/core/middlewares/withErrorHandling";
import { supabaseAuthClient } from "@/infra/supabase/client";

type JwtPayload = {
  userId: string;
  type: "customer" | "merchant";
  storeId?: string | null;
  role?: string | null;
  exp?: number;
  iat?: number;
  [key: string]: unknown;
};

export type AuthenticatedUser = {
  id: string;
  type: "customer" | "merchant";
  storeId?: string | null;
  role?: string | null;
  token: string;
};

type HandlerWithUser<T> = (
  request: NextRequest,
  context: T & { user: AuthenticatedUser },
) => Promise<Response> | Response;

function extractToken(request: NextRequest): string {
  const header = request.headers.get("authorization");

  if (!header?.toLowerCase().startsWith("bearer ")) {
    throw ApiError.unauthorized("Token de acesso ausente");
  }

  const token = header.slice(7).trim();

  if (!token) {
    throw ApiError.unauthorized("Token de acesso inválido");
  }

  return token;
}

async function decodeToken(token: string): Promise<JwtPayload> {
  // Validar token usando Supabase (que já gerencia a validação)
  const { data: { user }, error } = await supabaseAuthClient.auth.getUser(token);
  
  if (error || !user) {
    throw new ApiError({
      status: 401,
      code: "INVALID_TOKEN",
      message: error?.message || "Token inválido ou expirado",
      cause: error,
    });
  }

  // Extrair informações do token JWT do Supabase
  // O Supabase armazena metadata no user.user_metadata e app_metadata
  const userMetadata = user.user_metadata || {};
  const appMetadata = user.app_metadata || {};

  return {
    userId: user.id,
    type: (userMetadata.type || appMetadata.type || "customer") as "customer" | "merchant",
    storeId: userMetadata.storeId || appMetadata.storeId || null,
    role: userMetadata.role || appMetadata.role || null,
    exp: userMetadata.exp,
    iat: userMetadata.iat,
  };
}

function buildUser(token: string, payload: JwtPayload): AuthenticatedUser {
  if (!payload.userId || !payload.type) {
    throw new ApiError({
      status: 401,
      code: "INVALID_TOKEN_PAYLOAD",
      message: "Token não contém informações suficientes",
    });
  }

  return {
    id: payload.userId,
    type: payload.type,
    storeId: payload.storeId ?? null,
    role: payload.role ?? null,
    token,
  };
}

export function withAuth<T extends Record<string, unknown> = Record<string, unknown>>(
  handler: HandlerWithUser<T>,
): RouteHandler<T> {
  return async (request, context) => {
    const token = extractToken(request);
    const payload = await decodeToken(token);
    const user = buildUser(token, payload);

    const nextContext = {
      ...(context as T),
      user,
    };

    return handler(request, nextContext as T & { user: AuthenticatedUser });
  };
}

