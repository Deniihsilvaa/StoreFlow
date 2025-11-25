import type { NextRequest } from "next/server";

import { withErrorHandling } from "@/core/middlewares/withErrorHandling";
import { customerLoginController } from "@/modules/auth/controller/customer-login.controller";

export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json();
  return customerLoginController(body, request);
});

