import { z } from "zod";

// Schema para customização de produto (para atualização)
const productCustomizationSchema = z.object({
  id: z.string().uuid("ID da customização deve ser um UUID válido").optional(), // ID presente = atualizar, ausente = criar
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

// Schema principal para atualização de produto (todos os campos opcionais)
export const updateProductSchema = z.object({
  // Campos básicos (opcionais para atualização parcial)
  name: z.string().min(1, "Nome do produto é obrigatório").max(200, "Nome deve ter no máximo 200 caracteres").optional(),
  price: z.number().positive("Preço deve ser maior que zero").optional(),
  family: z.enum(["raw_material", "finished_product", "addon"], {
    errorMap: () => ({ message: "Família do produto inválida" }),
  }).optional(),
  category: z.string().min(1, "Categoria é obrigatória").max(100, "Categoria deve ter no máximo 100 caracteres").optional(),

  // Campos opcionais
  description: z.string().max(1000, "Descrição deve ter no máximo 1000 caracteres").optional().nullable(),
  costPrice: z.number().min(0, "Preço de custo deve ser positivo").optional(),
  imageUrl: z.union([
    z.string().url("URL da imagem inválida").max(500, "URL deve ter no máximo 500 caracteres"),
    z.literal(""),
  ]).optional().nullable(),
  customCategory: z.string().max(100, "Categoria customizada deve ter no máximo 100 caracteres").optional().nullable(),
  isActive: z.boolean().optional(),
  preparationTime: z.number().int().min(0, "Tempo de preparo deve ser positivo").optional(),
  nutritionalInfo: z.record(z.unknown()).optional().nullable(),

  // Customizações do produto (operações: adicionar, atualizar, remover)
  customizations: z.object({
    add: z.array(productCustomizationSchema.omit({ id: true })).optional(), // Adicionar novas customizações (sem ID)
    update: z.array(productCustomizationSchema.extend({ id: z.string().uuid() })).optional(), // Atualizar customizações existentes (com ID obrigatório)
    remove: z.array(z.string().uuid("ID da customização deve ser um UUID válido")).optional(), // Remover customizações por ID
  }).optional(),

  // Listas extras aplicáveis ao produto
  extraListIds: z.array(z.string().uuid("ID da lista extra deve ser um UUID válido")).optional(),
}).transform((data) => ({
  ...data,
  // Transformar string vazia em null para imageUrl (permite limpar a URL)
  imageUrl: data.imageUrl === "" ? null : data.imageUrl,
}));

export type UpdateProductInput = z.infer<typeof updateProductSchema>;

