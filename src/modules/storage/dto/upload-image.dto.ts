import { z } from "zod";

export const uploadImageSchema = z.object({
  entityType: z.enum(["stores", "products", "orders"], {
    errorMap: () => ({ message: "Tipo de entidade inválido" }),
  }),
  entityId: z.string().uuid("ID da entidade deve ser um UUID válido"),
  category: z.enum(["avatar", "banner", "primary", "gallery", "proof"], {
    errorMap: () => ({ message: "Categoria de imagem inválida" }),
  }),
});

export type UploadImageInput = z.infer<typeof uploadImageSchema>;

