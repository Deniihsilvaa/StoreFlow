import { z } from "zod";

const addressSchema = z.object({
  label: z.string().optional(),
  street: z.string().min(1),
  number: z.string().min(1),
  neighborhood: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  zipCode: z.string().min(8).max(12),
  complement: z.string().optional(),
  reference: z.string().optional(),
  isDefault: z.boolean().optional(),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().min(10).max(15).optional(),
  addresses: z
    .record(addressSchema)
    .optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

