import { z } from "zod";

export const customerSignUpSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve possuir pelo menos 6 caracteres"),
  storeId: z.string().optional(),
  name: z.string().min(2, "Nome deve possuir pelo menos 2 caracteres"),
  phone: z.string().min(10, "Telefone inválido").max(15, "Telefone inválido"),
});

export type CustomerSignUpInput = z.infer<typeof customerSignUpSchema>;

