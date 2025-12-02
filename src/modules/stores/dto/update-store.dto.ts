import { z } from "zod";

// Schema para endereço da loja
const addressSchema = z.object({
  street: z.string().min(1, "Rua é obrigatória"),
  number: z.string().min(1, "Número é obrigatório"),
  neighborhood: z.string().min(1, "Bairro é obrigatório"),
  city: z.string().min(1, "Cidade é obrigatória"),
  state: z.string().min(1, "Estado é obrigatório"),
  zipCode: z.string().min(8, "CEP deve ter no mínimo 8 caracteres").max(12, "CEP deve ter no máximo 12 caracteres"),
  complement: z.string().optional(),
  reference: z.string().optional(),
});

// Schema para horário de um dia da semana
const dayWorkingHoursSchema = z.object({
  open: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, "Formato inválido. Use HH:mm (ex: 18:00)").optional(),
  close: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, "Formato inválido. Use HH:mm (ex: 23:00)").optional(),
  closed: z.boolean().optional(),
}).refine(
  (data) => {
    // Se closed é true, não precisa de open/close
    if (data.closed === true) return true;
    // Se não forneceu nenhum campo, permite (será ignorado ou tratado pelo serviço)
    if (!data.open && !data.close && data.closed === undefined) return true;
    // Se forneceu open ou close, ambos são obrigatórios
    if (data.open || data.close) {
      return !!data.open && !!data.close;
    }
    return true;
  },
  {
    message: "Campo obrigatório",
    path: ["open"],
  }
).refine(
  (data) => {
    // Se closed é true, não precisa de open/close
    if (data.closed === true) return true;
    // Se não forneceu nenhum campo, permite (será ignorado ou tratado pelo serviço)
    if (!data.open && !data.close && data.closed === undefined) return true;
    // Se forneceu open ou close, ambos são obrigatórios
    if (data.open || data.close) {
      return !!data.open && !!data.close;
    }
    return true;
  },
  {
    message: "Campo obrigatório",
    path: ["close"],
  }
);

// Schema para horários de funcionamento
const workingHoursSchema = z.object({
  monday: dayWorkingHoursSchema.optional(),
  tuesday: dayWorkingHoursSchema.optional(),
  wednesday: dayWorkingHoursSchema.optional(),
  thursday: dayWorkingHoursSchema.optional(),
  friday: dayWorkingHoursSchema.optional(),
  saturday: dayWorkingHoursSchema.optional(),
  sunday: dayWorkingHoursSchema.optional(),
});

// Schema para configurações de pagamento
const acceptsPaymentSchema = z.object({
  creditCard: z.boolean().optional(),
  debitCard: z.boolean().optional(),
  pix: z.boolean().optional(),
  cash: z.boolean().optional(),
});

// Schema para configurações da loja
const settingsSchema = z.object({
  isActive: z.boolean().optional(),
  deliveryTime: z.string().optional(),
  minOrderValue: z.number().int().min(0, "Valor mínimo deve ser positivo").optional(),
  deliveryFee: z.number().int().min(0, "Taxa de entrega deve ser positiva").optional(),
  freeDeliveryAbove: z.number().int().min(0, "Valor para entrega grátis deve ser positivo").optional(),
  acceptsPayment: acceptsPaymentSchema.optional(),
});

// Schema para tema/cores
const themeSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Cor deve estar no formato hexadecimal (ex: #FF5733)").optional(),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Cor deve estar no formato hexadecimal (ex: #33FF57)").optional(),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Cor deve estar no formato hexadecimal (ex: #3357FF)").optional(),
  textColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Cor deve estar no formato hexadecimal (ex: #FFFFFF)").optional(),
});

// Schema principal para atualização de loja
export const updateStoreSchema = z.object({
  // Informações básicas
  name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres").max(100, "Nome deve ter no máximo 100 caracteres").optional(),
  description: z.string().max(500, "Descrição deve ter no máximo 500 caracteres").optional(),
  category: z.enum([
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
  ]).optional(),
  customCategory: z.string().max(50, "Categoria customizada deve ter no máximo 50 caracteres").optional(),

  // Endereço
  address: addressSchema.optional(),

  // Horários de funcionamento opicional ou nulo
  workingHours: workingHoursSchema.nullable().optional(),

  // Configurações
  settings: settingsSchema.optional(),

  // Tema
  theme: themeSchema.optional(),
}).passthrough();

export type UpdateStoreInput = z.infer<typeof updateStoreSchema>;

