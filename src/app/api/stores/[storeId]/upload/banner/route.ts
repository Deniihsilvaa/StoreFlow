import type { NextRequest } from "next/server";
import { withErrorHandling } from "@/core/middlewares/withErrorHandling";
import { withAuth } from "@/core/middlewares/withAuth";
import { uploadStoreImage } from "@/modules/storage/controller/storage.controller";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ storeId: string }> | { storeId: string } },
) {
  return withErrorHandling(
    withAuth(async (req, context) => {
      const resolvedParams = params instanceof Promise ? await params : params;
      return uploadStoreImage(req, context.user, resolvedParams.storeId, "banner");
    }),
  )(request, {});
}

