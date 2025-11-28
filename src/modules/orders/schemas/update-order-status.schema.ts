import { z } from "zod";

export const updateOrderStatusSchema = z.object({
  status: z.enum(["preparing", "ready", "out_for_delivery", "delivered"], {
    errorMap: () => ({ message: "status deve ser 'preparing', 'ready', 'out_for_delivery' ou 'delivered'" }),
  }),
  estimated_delivery_time: z.string().datetime().optional(),
  observations: z.string().optional(),
});

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;

