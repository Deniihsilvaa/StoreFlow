import type { NextRequest } from "next/server";

import { ApiError } from "@/core/errors/ApiError";
import { formatErrorResponse } from "@/core/errors/error-handler";
import { withErrorHandling } from "@/core/middlewares/withErrorHandling";
import { getStoreById } from "@/modules/stores/controller/stores.controller";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Record<string, string> | undefined> | Record<string, string> | undefined },
) {

  return withErrorHandling(async (req: NextRequest) => {
    // Resolver params se for Promise (Next.js 15+)
    const resolvedParams = params instanceof Promise ? await params : params;
    console.log("resolvedParams:",resolvedParams);

    const identifier = resolvedParams?.storeId ?? resolvedParams?.storeSlug;

    if (!identifier) {
      throw new Error("Parâmetro 'storeId' ou 'storeSlug' ausente");
    }

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);

    return getStoreById(identifier, isUUID ? "id" : "slug", req);
  })(request, {});
}

// Handler para métodos não suportados
export async function PUT(request: NextRequest) {
  return formatErrorResponse(
    ApiError.methodNotAllowed("Método PUT não é permitido para este endpoint", ["GET"]),
    request,
  );
}

export async function POST(request: NextRequest) {
  return formatErrorResponse(
    ApiError.methodNotAllowed("Método POST não é permitido para este endpoint", ["GET"]),
    request,
  );
}

export async function DELETE(request: NextRequest) {
  return formatErrorResponse(
    ApiError.methodNotAllowed("Método DELETE não é permitido para este endpoint", ["GET"]),
    request,
  );
}

export async function PATCH(request: NextRequest) {
  return formatErrorResponse(
    ApiError.methodNotAllowed("Método PATCH não é permitido para este endpoint", ["GET"]),
    request,
  );
}

