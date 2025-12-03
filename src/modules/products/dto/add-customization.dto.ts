import { z } from "zod";

// Schema para adicionar customização a um produto existente
export const addCustomizationSchema = z.object({
  name: z.string().min(1, "Nome da customização é obrigatório").max(100, "Nome deve ter no máximo 100 caracteres"),
  customizationType: z.enum(["extra", "sauce", "base", "protein", "topping"], {
    errorMap: () => ({ message: "Tipo de customização inválido" }),
  }),
  price: z.number().min(0, "Preço deve ser positivo").default(0),
  selectionType: z.enum(["quantity", "boolean"], {
    errorMap: () => ({ message: "Tipo de seleção inválido" }),
  }).default("quantity"),
  selectionGroup: z.string().max(50, "Grupo de seleção deve ter no máximo 50 caracteres").optional(),
});

export type AddCustomizationInput = z.infer<typeof addCustomizationSchema>;

