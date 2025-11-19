import { z } from "zod";

export const merchantLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export type MerchantLoginInput = z.infer<typeof merchantLoginSchema>;

