import type { NextRequest } from "next/server";

import { ApiError } from "@/core/errors/ApiError";
import type { RouteHandler } from "@/core/middlewares/withErrorHandling";
import { withAuth } from "@/core/middlewares/withAuth";
import type { AuthenticatedUser } from "@/core/middlewares/withAuth";

type MerchantUser = AuthenticatedUser & {
  type: "merchant";
};

type HandlerWithMerchant<T> = (
  request: NextRequest,
  context: T & { user: MerchantUser },
) => Promise<Response> | Response;

type RequireStoreOwnershipFn<T> = (context: T & { user: MerchantUser }) => Promise<void> | void;

type WithMerchantOptions<T> = {
  requireStoreOwnership?: RequireStoreOwnershipFn<T>;
};

export function withMerchant<T extends Record<string, unknown> = Record<string, unknown>>(
  handler: HandlerWithMerchant<T>,
  options?: WithMerchantOptions<T>,
): RouteHandler<T> {
  return withAuth<T>(async (request, context) => {
    if (context.user.type !== "merchant") {
      throw ApiError.forbidden("Apenas lojistas podem acessar este recurso");
    }

    if (options?.requireStoreOwnership) {
      await options.requireStoreOwnership(context as T & { user: MerchantUser });
    }

    return handler(request, context as T & { user: MerchantUser });
  });
}

