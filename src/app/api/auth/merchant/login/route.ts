import type { NextRequest } from "next/server";

import { withErrorHandling } from "@/core/middlewares/withErrorHandling";
import { merchantLoginController } from "@/modules/auth/controller/merchant-login.controller";

export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json();
  return merchantLoginController(body);
});

