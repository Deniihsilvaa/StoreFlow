import { z } from "zod";

// Schema para customização de item
const orderItemCustomizationSchema = z.object({
  customization_id: z.string().uuid("customization_id deve ser um UUID válido"),
  value: z.union([
    z.string(),
    z.number(),
    z.boolean(),
  ]).describe("Valor da customização (string, número ou booleano)"),
});

// Schema para item do pedido
const orderItemSchema = z.object({
  product_id: z.string().uuid("product_id deve ser um UUID válido"),
  quantity: z.number().int().positive("quantity deve ser um número inteiro positivo"),
  unit_price: z.number().nonnegative("unit_price deve ser um número não negativo"),
  observations: z.string().optional(),
  customizations: z.array(orderItemCustomizationSchema).optional(),
});

// Schema para endereço de entrega
const deliveryAddressSchema = z.object({
  street: z.string().min(1, "street é obrigatório"),
  number: z.string().min(1, "number é obrigatório"),
  neighborhood: z.string().min(1, "neighborhood é obrigatório"),
  city: z.string().min(1, "city é obrigatório"),
  state: z.string().length(2, "state deve ter 2 caracteres"),
  zip_code: z.string().min(1, "zip_code é obrigatório"),
  complement: z.string().optional(),
});

// Schema principal para criação de pedido
export const createOrderSchema = z.object({
  store_id: z.string().uuid("store_id deve ser um UUID válido"),
  delivery_option_id: z.string().uuid("delivery_option_id deve ser um UUID válido").optional(),
  fulfillment_method: z.enum(["delivery", "pickup"], {
    errorMap: () => ({ message: "fulfillment_method deve ser 'delivery' ou 'pickup'" }),
  }),
  payment_method: z.enum(["credit_card", "debit_card", "pix", "cash"], {
    errorMap: () => ({ message: "payment_method deve ser 'credit_card', 'debit_card', 'pix' ou 'cash'" }),
  }),
  items: z.array(orderItemSchema).min(1, "items deve conter pelo menos um item"),
  delivery_address: deliveryAddressSchema.optional(),
  pickup_slot: z.string().datetime().optional(),
  observations: z.string().optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

