import type { NextRequest } from "next/server";

import { withErrorHandling } from "@/core/middlewares/withErrorHandling";
import { withAuth } from "@/core/middlewares/withAuth";
import {
  getProfileController,
  updateProfileController,
} from "@/modules/auth/controller/profile.controller";

export const GET = withErrorHandling(
  withAuth(async (request: NextRequest, context) => 
    getProfileController(context.user.id, request)
  ),
);

export const PUT = withErrorHandling(
  withAuth(async (request: NextRequest, context) => {
    const body = await request.json();
    return updateProfileController(context.user.id, body, request);
  }),
);

