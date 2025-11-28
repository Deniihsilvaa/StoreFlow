import { z } from "zod";

export const confirmOrderSchema = z.object({
  estimated_delivery_time: z.string().datetime().optional(),
  observations: z.string().optional(),
});

export type ConfirmOrderInput = z.infer<typeof confirmOrderSchema>;

