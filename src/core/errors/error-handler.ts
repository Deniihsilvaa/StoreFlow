import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ZodError } from "zod";

import { ApiError } from "@/core/errors/ApiError";
import { logger } from "@/config/logger";

type ErrorResponseBody = {
  success: false;
  error: {
    message: string;
    code: string;
    status: number;
    errors?: Record<string, string[]>;
    details?: unknown;
    timestamp: string;
  };
};

const DEFAULT_ERROR = {
  status: 500,
  code: "INTERNAL_SERVER_ERROR",
  message: "Ocorreu um erro inesperado. Tente novamente mais tarde.",
} as const;

function fromZodError(error: ZodError): ApiError {
  const fieldErrors = error.flatten().fieldErrors;
  return ApiError.validation(fieldErrors);
}

export function normalizeError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof ZodError) {
    return fromZodError(error);
  }

  logger.error(
    {
      err: error,
    },
    "Erro não tratado capturado pelo middleware",
  );

  return new ApiError({
    status: DEFAULT_ERROR.status,
    code: DEFAULT_ERROR.code,
    message:
      error instanceof Error ? error.message : DEFAULT_ERROR.message,
    details: error,
  });
}

// Helper para adicionar headers CORS baseado no request
function addCorsHeaders(response: NextResponse, request?: NextRequest): NextResponse {
  if (!request) return response;
  
  const origin = request.headers.get('origin');
  
  if (origin) {
    // Lista de origens permitidas (deve corresponder ao middleware)
    const ALLOWED_ORIGINS = [
      'http://localhost:4000',
      'http://localhost:3000',
      'https://store-flow-one.vercel.app',
      'https://store-flow-git-main-denilson-silvas-projects-63b429e7.vercel.app',
      'https://store-flow-inurnro5e-denilson-silvas-projects-63b429e7.vercel.app',
      ...(process.env.ALLOWED_ORIGINS?.split(',').filter(Boolean) || [])
    ];
    
    // Verifica se a origem é permitida
    const isAllowed = 
      ALLOWED_ORIGINS.includes(origin) ||
      origin.includes('localhost') ||
      origin.match(/^https:\/\/.*\.vercel\.app$/);
    
    if (isAllowed) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }
  }
  
  return response;
}

export function formatErrorResponse(
  error: ApiError,
  request?: NextRequest
): NextResponse<ErrorResponseBody> {
  const response = NextResponse.json(
    {
      success: false,
      error: {
        message: error.message,
        code: error.code,
        status: error.status,
        details: error.details,
        timestamp: new Date().toISOString(),
      },
    },
    { status: error.status },
  );
  
  return addCorsHeaders(response, request);
}

