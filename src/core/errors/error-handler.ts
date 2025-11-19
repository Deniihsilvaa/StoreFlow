import { NextResponse } from "next/server";
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

export function formatErrorResponse(error: ApiError): NextResponse<ErrorResponseBody> {
  return NextResponse.json(
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
}

