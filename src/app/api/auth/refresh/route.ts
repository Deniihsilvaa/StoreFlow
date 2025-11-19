import type { NextRequest } from "next/server";

import { withErrorHandling } from "@/core/middlewares/withErrorHandling";
import { refreshTokenController } from "@/modules/auth/controller/refresh-token.controller";

export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json();
  return refreshTokenController(body);
});

