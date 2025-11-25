import { z } from "zod";

const addressSchema = z.object({
  label: z.string().optional(),
  addressType: z.enum(["home", "work", "other"]).optional().default("other"),
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

// Schema que aceita addresses como objeto (chaves) ou array
// Usa preprocess para normalizar antes da validação
const addressesInput = z.preprocess(
  (val) => {
    // Se for undefined ou null, retorna undefined
    if (val === undefined || val === null) {
      return undefined;
    }
    // Se for array, retorna como está
    if (Array.isArray(val)) {
      return val;
    }
    // Se for objeto, converte para array
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      return Object.entries(val).map(([key, address]) => ({
        ...(address as object),
        label: (address as { label?: string })?.label || key,
      }));
    }
    return val;
  },
  z.array(addressSchema)
).optional();

export const updateProfileSchema = z.object({
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres").max(100, "Nome deve ter no máximo 100 caracteres").optional(),
  phone: z.string().min(10, "Telefone deve ter no mínimo 10 caracteres").max(15, "Telefone deve ter no máximo 15 caracteres").optional(),
  addresses: addressesInput,
  // Campos que podem vir do frontend mas não são usados na atualização de perfil
  // São ignorados silenciosamente (não causam erro de validação)
  storeId: z.string().optional(),
  role: z.enum(["admin", "manager"]).optional().default("manager"),
  email: z.string().optional(),
  id: z.string().optional(),
  updatedAt: z.string().optional(),
}).passthrough(); // Permite campos extras sem erro

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

