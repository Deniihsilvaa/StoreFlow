export type ApiErrorPayload = {
  status: number;
  code: string;
  message: string;
  details?: unknown;
  cause?: unknown;
};

export class ApiError extends Error {
  readonly status: number;

  readonly code: string;

  readonly details?: unknown;

  constructor(payload: ApiErrorPayload) {
    super(payload.message);
    this.name = "ApiError";
    this.status = payload.status;
    this.code = payload.code;
    this.details = payload.details;
    if (payload.cause) {
      this.cause = payload.cause instanceof Error ? payload.cause : undefined;
    }
  }

  static unauthorized(message = "Não autenticado"): ApiError {
    return new ApiError({
      status: 401,
      code: "UNAUTHORIZED",
      message,
    });
  }

  static forbidden(message = "Acesso negado"): ApiError {
    return new ApiError({
      status: 403,
      code: "FORBIDDEN",
      message,
    });
  }

  static notFound(message = "Recurso não encontrado", code = "NOT_FOUND") {
    return new ApiError({
      status: 404,
      code,
      message,
    });
  }

  static validation(details: unknown, message = "Erro de validação") {
    return new ApiError({
      status: 422,
      code: "VALIDATION_ERROR",
      message,
      details,
    });
  }

  static badRequest(message = "Requisição inválida", code = "BAD_REQUEST") {
    return new ApiError({
      status: 400,
      code,
      message,
    });
  }

  static conflict(message = "Conflito", code = "CONFLICT") {
    return new ApiError({
      status: 409,
      code,
      message,
    });
  }

  static methodNotAllowed(message = "Método não permitido", allowedMethods?: string[]) {
    return new ApiError({
      status: 405,
      code: "METHOD_NOT_ALLOWED",
      message,
      details: allowedMethods ? { allowedMethods } : undefined,
    });
  }
}

