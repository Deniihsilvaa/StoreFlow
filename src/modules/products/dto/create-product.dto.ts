import { z } from "zod";

// Schema para customização de produto
const productCustomizationSchema = z.object({
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

// Schema principal para criação de produto
export const createProductSchema = z.object({
  // Campos obrigatórios
  name: z.string().min(1, "Nome do produto é obrigatório").max(200, "Nome deve ter no máximo 200 caracteres"),
  price: z.number().positive("Preço deve ser maior que zero"),
  family: z.enum(["raw_material", "finished_product", "addon"], {
    errorMap: () => ({ message: "Família do produto inválida" }),
  }),
  category: z.string().min(1, "Categoria é obrigatória").max(100, "Categoria deve ter no máximo 100 caracteres"),

  // Campos opcionais
  description: z.string().max(1000, "Descrição deve ter no máximo 1000 caracteres").optional(),
  costPrice: z.number().min(0, "Preço de custo deve ser positivo").default(0).optional(),
  imageUrl: z.union([
    z.string().url("URL da imagem inválida").max(500, "URL deve ter no máximo 500 caracteres"),
    z.literal(""),
  ]).optional(),
  customCategory: z.string().max(100, "Categoria customizada deve ter no máximo 100 caracteres").optional(),
  isActive: z.boolean().default(true).optional(),
  preparationTime: z.number().int().min(0, "Tempo de preparo deve ser positivo").default(0).optional(),
  nutritionalInfo: z.record(z.unknown()).optional(),

  // Customizações do produto
  customizations: z.array(productCustomizationSchema).optional(),

  // Listas extras aplicáveis ao produto
  extraListIds: z.array(z.string().uuid("ID da lista extra deve ser um UUID válido")).optional(),
}).transform((data) => ({
  ...data,
  // Transformar string vazia em undefined para imageUrl
  imageUrl: data.imageUrl === "" ? undefined : data.imageUrl,
}));

export type CreateProductInput = z.infer<typeof createProductSchema>;

