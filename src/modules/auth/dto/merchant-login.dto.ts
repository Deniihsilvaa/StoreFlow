import { z } from "zod";

export const merchantLoginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve possuir pelo menos 6 caracteres"),
});

export type MerchantLoginInput = z.infer<typeof merchantLoginSchema>;

