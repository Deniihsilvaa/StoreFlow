import { z } from "zod";

export const customerLoginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve possuir pelo menos 6 caracteres"),
  storeId: z.string().optional(),
});

export type CustomerLoginInput = z.infer<typeof customerLoginSchema>;

