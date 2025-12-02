import { z } from "zod";

export const merchantSignUpSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve possuir pelo menos 6 caracteres"),
  storeName: z.string().min(2, "Nome da loja deve possuir pelo menos 2 caracteres"),
  storeDescription: z.string().optional(),
  storeCategory: z.enum([
    "hamburgueria",
    "pizzaria",
    "pastelaria",
    "sorveteria",
    "cafeteria",
    "padaria",
    "comida_brasileira",
    "comida_japonesa",
    "doces",
    "mercado",
    "outros",
  ]).optional().default("outros"),
  customCategory: z.string().optional(),
});

export type MerchantSignUpInput = z.infer<typeof merchantSignUpSchema>;

