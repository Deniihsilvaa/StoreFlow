import type { NextRequest } from "next/server";

import { withErrorHandling } from "@/core/middlewares/withErrorHandling";
import { customerSignUpController } from "@/modules/auth/controller/costumer-singup";

export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json();
  return customerSignUpController(body, request);
});

