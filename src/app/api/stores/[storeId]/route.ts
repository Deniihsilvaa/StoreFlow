import type { NextRequest } from "next/server";

import { withErrorHandling } from "@/core/middlewares/withErrorHandling";
import { getStoreById } from "@/modules/stores/controller/stores.controller";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Record<string, string> | undefined> | Record<string, string> | undefined },
) {

  return withErrorHandling(async (req: NextRequest) => {
    // Resolver params se for Promise (Next.js 15+)
    const resolvedParams = params instanceof Promise ? await params : params;

    const identifier = resolvedParams?.storeId ?? resolvedParams?.storeSlug;

    if (!identifier) {
      throw new Error("Parâmetro 'storeId' ou 'storeSlug' ausente");
    }

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);

    return getStoreById(identifier, isUUID ? "id" : "slug", req);
  })(request, {});
}

