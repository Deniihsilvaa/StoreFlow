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
  // Formatar erros do Zod de forma mais clara e padronizada
  const formattedErrors: Record<string, string[]> = {};
  
  error.errors.forEach((err) => {
    const path = err.path.join(".");
    const field = path || "root";
    
    // Mensagem de erro mais amigável
    let message = err.message;
    
    // Traduzir mensagens comuns do Zod
    if (err.code === "invalid_type") {
      if (err.received === "undefined") {
        message = "Campo obrigatório";
      } else {
        message = `Esperado ${err.expected}, recebido ${err.received}`;
      }
    } else if (err.code === "too_small") {
      if (err.type === "string") {
        message = `Deve ter no mínimo ${err.minimum} caracteres`;
      } else if (err.type === "number") {
        message = `Deve ser no mínimo ${err.minimum}`;
      } else if (err.type === "array") {
        message = `Deve conter no mínimo ${err.minimum} item(ns)`;
      }
    } else if (err.code === "too_big") {
      if (err.type === "string") {
        message = `Deve ter no máximo ${err.maximum} caracteres`;
      } else if (err.type === "number") {
        message = `Deve ser no máximo ${err.maximum}`;
      } else if (err.type === "array") {
        message = `Deve conter no máximo ${err.maximum} item(ns)`;
      }
    } else if (err.code === "invalid_string") {
      if (err.validation === "email") {
        message = "Email inválido";
      } else if (err.validation === "url") {
        message = "URL inválida";
      } else if (err.validation === "uuid") {
        message = "UUID inválido";
      }
    } else if (err.code === "invalid_enum_value") {
      message = `Valor inválido. Valores aceitos: ${err.options?.join(", ")}`;
    }
    
    if (!formattedErrors[field]) {
      formattedErrors[field] = [];
    }
    
    formattedErrors[field].push(message);
  });
  
  return ApiError.validation(formattedErrors, "Dados inválidos");
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
      'http://localhost:5173',
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
  // Formatar resposta de erro de forma padronizada
  // Não expor informações sensíveis como stack traces em produção
  const isDevelopment = process.env.NODE_ENV === "development";
  
  const errorResponse: ErrorResponseBody["error"] = {
    message: error.message,
    code: error.code,
    status: error.status,
    timestamp: new Date().toISOString(),
  };
  
  // Adicionar detalhes de validação se existirem
  if (error.details) {
    // Se for um objeto com erros de validação, usar como errors
    if (
      typeof error.details === "object" &&
      error.details !== null &&
      !Array.isArray(error.details)
    ) {
      const details = error.details as Record<string, unknown>;
      // Verificar se parece com erros de validação (objeto com arrays de strings)
      const hasValidationErrors = Object.values(details).some(
        (value) => Array.isArray(value) && value.every((v) => typeof v === "string")
      );
      
      if (hasValidationErrors) {
        errorResponse.errors = details as Record<string, string[]>;
      } else {
        // Em desenvolvimento, mostrar detalhes completos
        // Em produção, apenas informações seguras
        errorResponse.details = isDevelopment ? details : undefined;
      }
    } else {
      errorResponse.details = isDevelopment ? error.details : undefined;
    }
  }
  
  const response = NextResponse.json(
    {
      success: false,
      error: errorResponse,
    },
    { status: error.status },
  );
  
  return addCorsHeaders(response, request);
}

