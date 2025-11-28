import { z } from "zod";

export const rejectOrderSchema = z.object({
  reason: z.string().min(1, "reason é obrigatório").max(255, "reason deve ter no máximo 255 caracteres"),
  observations: z.string().optional(),
});

export type RejectOrderInput = z.infer<typeof rejectOrderSchema>;

