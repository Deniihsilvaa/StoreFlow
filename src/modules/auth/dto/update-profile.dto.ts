import { z } from "zod";

const addressSchema = z.object({
  label: z.string().optional(),
  street: z.string().min(1, "Rua é obrigatória"),
  number: z.string().min(1, "Número é obrigatório"),
  neighborhood: z.string().min(1, "Bairro é obrigatório"),
  city: z.string().min(1, "Cidade é obrigatória"),
  state: z.string().min(1, "Estado é obrigatório"),
  zipCode: z.string().min(8, "CEP deve ter no mínimo 8 caracteres").max(12, "CEP deve ter no máximo 12 caracteres"),
  complement: z.string().optional(),
  reference: z.string().optional(),
  isDefault: z.boolean().optional(),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres").max(100, "Nome deve ter no máximo 100 caracteres").optional(),
  phone: z.string().min(10, "Telefone deve ter no mínimo 10 caracteres").max(15, "Telefone deve ter no máximo 15 caracteres").optional(),
  addresses: z
    .array(addressSchema)
    .optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

