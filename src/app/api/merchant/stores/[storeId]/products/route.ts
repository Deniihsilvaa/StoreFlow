import type { NextRequest } from "next/server";

import { ApiError } from "@/core/errors/ApiError";
import { withErrorHandling } from "@/core/middlewares/withErrorHandling";
import { withAuth } from "@/core/middlewares/withAuth";
import { createProduct } from "@/modules/products/controller/products.controller";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> | { storeId: string } },
) {
  return withErrorHandling(
    withAuth(async (req: NextRequest, context) => {
      // Validar se o usuário é merchant
      if (context.user.type !== "merchant") {
        throw ApiError.forbidden("Apenas lojistas podem criar produtos");
      }

      // Resolver params se for Promise (Next.js 15+)
      const resolvedParams = params instanceof Promise ? await params : params;

      // Verificar Content-Type
      const contentType = req.headers.get('content-type') || '';

      let body: unknown;

      // Aceitar tanto JSON quanto multipart/form-data
      if (contentType.includes('multipart/form-data')) {
        // Processar FormData
        const formData = await req.formData();
        const file = formData.get('file') as File | null;
        const dataJson = formData.get('data') as string | null;

        if (!dataJson) {
          throw ApiError.validation(
            { data: ["Campo 'data' é obrigatório em FormData"] },
            "Dados do produto não fornecidos"
          );
        }

        // Parse do JSON dos dados do produto
        try {
          body = JSON.parse(dataJson);
        } catch {
          throw ApiError.validation(
            { data: ["Campo 'data' deve ser um JSON válido"] },
            "Dados inválidos"
          );
        }

        // Adicionar arquivo ao body se existir
        if (file) {
          (body as { file?: File; [key: string]: unknown }).file = file;
        }
      } else if (contentType.includes('application/json')) {
        // Processar JSON normalmente
        body = await req.json();
      } else {
        throw ApiError.badRequest(
          'Content-Type deve ser application/json ou multipart/form-data'
        );
      }

      return createProduct(context.user.id, resolvedParams.storeId, body, req);
    }),
  )(request, {});
}

