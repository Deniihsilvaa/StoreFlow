import { withErrorHandling } from "@/core/middlewares/withErrorHandling";
import { withAuth } from "@/core/middlewares/withAuth";
import { logoutController } from "@/modules/auth/controller/logout.controller";

export const POST = withErrorHandling(
  withAuth(async (_request, context) => logoutController(context.user.id)),
);

