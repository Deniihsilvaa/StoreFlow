import { z } from "zod";

const addressSchema = z.object({
  id: z.string().uuid().optional(), // ID presente = atualizar, ausente = criar
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

// Schema para operações parciais de endereços
const addressesOperationsSchema = z.object({
  add: z.array(addressSchema.omit({ id: true })).optional(), // Adicionar novos endereços (sem ID)
  update: z.array(addressSchema.extend({ id: z.string().uuid() })).optional(), // Atualizar endereços existentes (com ID obrigatório)
  remove: z.array(z.string().uuid()).optional(), // Remover endereços por ID
});

// Schema que aceita addresses em diferentes formatos:
// 1. Array simples (formato antigo - substituição total) - mantido para compatibilidade
// 2. Objeto com operações (formato novo - operações parciais)
// 3. Objeto com chaves (formato legado - converte para array)
const addressesInput = z.preprocess(
  (val) => {
    // Se for undefined ou null, retorna undefined
    if (val === undefined || val === null) {
      return undefined;
    }
    
    // Se for array, mantém formato antigo (substituição total)
    if (Array.isArray(val)) {
      return { _legacyArray: val };
    }
    
    // Se for objeto com operações (add, update, remove), retorna como está
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      // Verifica se tem operações (add, update, remove)
      if ('add' in val || 'update' in val || 'remove' in val) {
        return val;
      }
      // Se for objeto com chaves (formato legado), converte para array
      return { _legacyArray: Object.entries(val).map(([key, address]) => ({
        ...(address as object),
        label: (address as { label?: string })?.label || key,
      })) };
    }
    
    return val;
  },
  z.union([
    // Formato novo: operações parciais
    addressesOperationsSchema,
    // Formato antigo: array simples (substituição total)
    z.object({
      _legacyArray: z.array(addressSchema),
    }),
  ])
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

// Schema específico para PATCH - aceita apenas operações parciais
const addressesPartialInput = z.preprocess(
  (val) => {
    if (val === undefined || val === null) {
      return undefined;
    }
    return val;
  },
  z.any().superRefine((val, ctx) => {
    if (val === undefined || val === null) {
      return; // undefined/null é permitido
    }
    // Rejeitar array simples
    if (Array.isArray(val)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "PATCH não aceita array simples. Use operações parciais: { add: [], update: [], remove: [] }",
        path: ["addresses"],
      });
      return;
    }
    // Aceitar apenas objeto com operações (add, update, remove)
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      if ('add' in val || 'update' in val || 'remove' in val) {
        // Validar estrutura das operações
        const operations = val as { add?: unknown; update?: unknown; remove?: unknown };
        if (operations.add !== undefined && !Array.isArray(operations.add)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Operação 'add' deve ser um array",
            path: ["addresses", "add"],
          });
        }
        if (operations.update !== undefined && !Array.isArray(operations.update)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Operação 'update' deve ser um array",
            path: ["addresses", "update"],
          });
        }
        if (operations.remove !== undefined && !Array.isArray(operations.remove)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Operação 'remove' deve ser um array",
            path: ["addresses", "remove"],
          });
        }
        return;
      }
      // Objeto sem operações não é aceito
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "PATCH requer operações parciais: { add: [], update: [], remove: [] }",
        path: ["addresses"],
      });
      return;
    }
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Formato inválido para addresses em PATCH",
      path: ["addresses"],
    });
  }).pipe(addressesOperationsSchema)
).optional();

export const patchProfileSchema = z.object({
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres").max(100, "Nome deve ter no máximo 100 caracteres").optional(),
  phone: z.string().min(10, "Telefone deve ter no mínimo 10 caracteres").max(15, "Telefone deve ter no máximo 15 caracteres").optional(),
  addresses: addressesPartialInput,
  // Campos que podem vir do frontend mas não são usados na atualização de perfil
  storeId: z.string().optional(),
  role: z.enum(["admin", "manager"]).optional().default("manager"),
  email: z.string().optional(),
  id: z.string().optional(),
  updatedAt: z.string().optional(),
}).passthrough();

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type PatchProfileInput = z.infer<typeof patchProfileSchema>;

