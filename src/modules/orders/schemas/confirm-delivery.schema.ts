import { z } from "zod";

export const confirmDeliverySchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  feedback: z.string().optional(),
});

export type ConfirmDeliveryInput = z.infer<typeof confirmDeliverySchema>;

